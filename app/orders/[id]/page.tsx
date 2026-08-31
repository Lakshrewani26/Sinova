import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireBuyer } from "@/lib/session";
import { DashboardHeader } from "@/app/dashboard/DashboardHeader";
import { OrderActions } from "./OrderActions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const user = await requireBuyer();
  const { id } = await params;

  // Strict ownership check & user isolation
  const order = await prisma.order.findFirst({
    where: {
      id,
      userId: user.id,
    },
    include: {
      manufacturer: true,
      product: {
        include: { category: true },
      },
      rfq: true,
      quotation: true,
      statusHistory: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!order) {
    notFound();
  }

  const createdDate = new Date(order.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const isCancelled = order.status === "CANCELLED";
  const isCompleted = order.status === "COMPLETED";

  const stageList = [
    { key: "ORDER_CREATED", label: "Order Created", explanation: "Procurement order created from accepted supplier quotation." },
    { key: "SUPPLIER_CONFIRMED", label: "Supplier Confirmation", explanation: "Supplier confirmation recorded." },
    { key: "IN_PRODUCTION", label: "In Production", explanation: "Production is currently in progress." },
    { key: "READY_TO_SHIP", label: "Ready to Ship", explanation: "Supplier indicated goods are ready for dispatch." },
    { key: "COMPLETED", label: "Completed", explanation: "Procurement process confirmed completed." },
  ];

  const currentIdx = stageList.findIndex((s) => s.key === order.status);

  // Map history records by status
  const historyMap = new Map<string, { id: string; note: string | null; createdAt: Date }>();
  order.statusHistory.forEach((h) => {
    historyMap.set(h.status, { id: h.id, note: h.note, createdAt: h.createdAt });
  });

  const cancelledHistory = historyMap.get("CANCELLED");

  return (
    <div className="sinova-dashboard-layout">
      <DashboardHeader user={{ name: user.name, email: user.email }} />

      <main className="sinova-dashboard-main">
        <div className="sinova-container">
          {/* Breadcrumbs */}
          <div className="sinova-breadcrumbs">
            <Link href="/dashboard">Dashboard</Link>
            <span className="sinova-breadcrumb-sep">/</span>
            <Link href="/orders">Orders</Link>
            <span className="sinova-breadcrumb-sep">/</span>
            <span className="sinova-breadcrumb-current">{order.orderNumber}</span>
          </div>

          {/* Hero Banner */}
          <section className="sinova-welcome-hero" style={{ marginBottom: "28px" }}>
            <div className="sinova-hero-content">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                <span className="sinova-eyebrow" style={{ margin: 0 }}>
                  INTERNAL PROCUREMENT ORDER
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    backgroundColor: isCompleted ? "#082e29" : isCancelled ? "#fcf2f2" : "#eef5f2",
                    color: isCompleted ? "#c7ee72" : isCancelled ? "#c92a2a" : "#0d5c4c",
                    padding: "3px 10px",
                    borderRadius: "12px",
                  }}
                >
                  STATUS: {order.status}
                </span>
              </div>

              <h1 className="sinova-hero-title">{order.orderNumber}</h1>
              <p className="sinova-hero-subtext">
                Product: <strong>{order.product.name}</strong> • Supplier: <strong>{order.manufacturer.name}</strong>
              </p>

              <div className="sinova-meta-row">
                <span>
                  <strong>Quantity:</strong> {order.quantity.toLocaleString()} units
                </span>
                <span className="dot">•</span>
                <span>
                  <strong>Total Value:</strong> ₹{order.totalAmount.toLocaleString()}
                </span>
                <span className="dot">•</span>
                <span>
                  <strong>Created:</strong> {createdDate}
                </span>
              </div>
            </div>

            <div className="sinova-hero-actions">
              <OrderActions orderId={order.id} orderNumber={order.orderNumber} status={order.status} />
            </div>
          </section>

          {/* Data Honesty Informational Banner */}
          <div
            style={{
              background: "#eef5f2",
              border: "1.5px solid #a4d3c3",
              borderRadius: "10px",
              padding: "16px 20px",
              marginBottom: "28px",
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
            }}
          >
            <span style={{ color: "#0d5c4c", fontWeight: 800, fontSize: "16px" }}>ℹ</span>
            <div>
              <strong style={{ fontSize: "13.5px", color: "#082e29", display: "block", marginBottom: "2px" }}>
                Internal Procurement Audit Log
              </strong>
              <span style={{ fontSize: "12.5px", color: "#4f635d", lineHeight: 1.5 }}>
                Procurement status is manually updated inside SINOVA. No external supplier, shipping, logistics, or payment system is connected yet.
              </span>
            </div>
          </div>

          {/* Upgraded B2B Vertical Procurement Timeline */}
          <div className="sinova-panel-card" style={{ marginBottom: "28px", padding: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: 800, margin: 0, color: "#122321" }}>
                  Procurement Timeline & Activity Log
                </h2>
                <span style={{ fontSize: "12.5px", color: "#60706c" }}>
                  Chronological record of status changes and internal buyer notes.
                </span>
              </div>
              <span className="sinova-badge-neutral">
                {order.statusHistory.length} Event{order.statusHistory.length === 1 ? "" : "s"} Logged
              </span>
            </div>

            {/* Timeline Vertical Stack */}
            <div style={{ display: "flex", flexDirection: "column", position: "relative", paddingLeft: "8px" }}>
              {stageList.map((stage, idx) => {
                const historyEntry = historyMap.get(stage.key);
                const isDone = historyEntry !== undefined || (!isCancelled && currentIdx >= idx);
                const isCurrent = !isCancelled && currentIdx === idx;

                const formattedTime = historyEntry
                  ? new Date(historyEntry.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : null;

                return (
                  <div
                    key={stage.key}
                    style={{
                      display: "flex",
                      gap: "20px",
                      position: "relative",
                      paddingBottom: idx === stageList.length - 1 && !isCancelled ? "0" : "28px",
                    }}
                  >
                    {/* Connecting Vertical Line */}
                    {idx < stageList.length - 1 && (
                      <div
                        style={{
                          position: "absolute",
                          left: "17px",
                          top: "36px",
                          bottom: "0",
                          width: "2px",
                          backgroundColor: isDone && !isCurrent ? "#0d5c4c" : "#eef2f0",
                        }}
                      />
                    )}

                    {/* Timeline Node Icon */}
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        backgroundColor: isCurrent ? "#082e29" : isDone ? "#0d5c4c" : "#ffffff",
                        color: isCurrent ? "#c7ee72" : isDone ? "#ffffff" : "#8a9e97",
                        border: isCurrent ? "3px solid #c7ee72" : isDone ? "none" : "2px solid #dce4df",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: "14px",
                        zIndex: 2,
                        flexShrink: 0,
                      }}
                    >
                      {isDone ? "✓" : idx + 1}
                    </div>

                    {/* Stage Details */}
                    <div
                      style={{
                        flex: 1,
                        background: isCurrent ? "#f6f8f7" : "#ffffff",
                        border: isCurrent ? "1.5px solid #a4d3c3" : "1px solid #eef2f0",
                        borderRadius: "10px",
                        padding: "14px 18px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <strong style={{ fontSize: "15px", fontWeight: 800, color: isDone ? "#122321" : "#8a9e97" }}>
                              {stage.label}
                            </strong>
                            {isCurrent && (
                              <span
                                style={{
                                  fontSize: "10.5px",
                                  fontWeight: 800,
                                  backgroundColor: "#082e29",
                                  color: "#c7ee72",
                                  padding: "2px 8px",
                                  borderRadius: "10px",
                                }}
                              >
                                ● Current Stage
                              </span>
                            )}
                          </div>
                          <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: isDone ? "#4f635d" : "#8a9e97", lineHeight: 1.4 }}>
                            {stage.explanation}
                          </p>
                        </div>

                        {formattedTime && (
                          <span style={{ fontSize: "11.5px", fontFamily: "DM Mono, monospace", color: "#60706c", background: "#ffffff", padding: "3px 8px", borderRadius: "6px", border: "1px solid #eef2f0" }}>
                            {formattedTime}
                          </span>
                        )}
                      </div>

                      {/* Internal Buyer Note */}
                      {historyEntry?.note && (
                        <div
                          style={{
                            marginTop: "10px",
                            background: "#ffffff",
                            borderLeft: "3.5px solid #0d5c4c",
                            borderTop: "1px solid #eef2f0",
                            borderRight: "1px solid #eef2f0",
                            borderBottom: "1px solid #eef2f0",
                            borderRadius: "0 6px 6px 0",
                            padding: "10px 14px",
                          }}
                        >
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "#0d5c4c", display: "block", marginBottom: "2px" }}>
                            Internal Buyer Note:
                          </span>
                          <p style={{ margin: 0, fontSize: "12.5px", color: "#122321" }}>
                            {historyEntry.note}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Cancelled Stage Render if Order was Cancelled */}
              {isCancelled && cancelledHistory && (
                <div style={{ display: "flex", gap: "20px", position: "relative", marginTop: "12px" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      backgroundColor: "#c92a2a",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: "14px",
                      zIndex: 2,
                      flexShrink: 0,
                    }}
                  >
                    ✕
                  </div>

                  <div
                    style={{
                      flex: 1,
                      background: "#fcf2f2",
                      border: "1.5px solid #f8d7da",
                      borderRadius: "10px",
                      padding: "14px 18px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                      <div>
                        <strong style={{ fontSize: "15px", fontWeight: 800, color: "#991b1b" }}>
                          Order Cancelled
                        </strong>
                        <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#7f1d1d" }}>
                          Procurement order cancelled by buyer.
                        </p>
                      </div>

                      <span style={{ fontSize: "11.5px", fontFamily: "DM Mono, monospace", color: "#991b1b" }}>
                        {new Date(cancelledHistory.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {cancelledHistory.note && (
                      <div
                        style={{
                          marginTop: "10px",
                          background: "#ffffff",
                          borderLeft: "3.5px solid #c92a2a",
                          padding: "10px 14px",
                          borderRadius: "0 6px 6px 0",
                          border: "1px solid #f8d7da",
                        }}
                      >
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#c92a2a", display: "block", marginBottom: "2px" }}>
                          Cancellation Reason Note:
                        </span>
                        <p style={{ margin: 0, fontSize: "12.5px", color: "#7f1d1d" }}>
                          {cancelledHistory.note}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Details & Pricing Matrix Grid */}
          <div className="sinova-content-grid" style={{ gridTemplateColumns: "1.8fr 1fr", gap: "28px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Order Information & Pricing */}
              <div className="sinova-panel-card">
                <div className="sinova-panel-header">
                  <h2>Order Pricing & Financial Summary</h2>
                </div>
                <div className="sinova-panel-body">
                  <div className="sinova-metrics-grid-4" style={{ marginBottom: "20px" }}>
                    <div className="sinova-metric-cell">
                      <span className="lbl">Agreed Unit Price</span>
                      <strong className="val">₹{order.unitPrice.toLocaleString()}</strong>
                    </div>
                    <div className="sinova-metric-cell">
                      <span className="lbl">Order Quantity</span>
                      <strong className="val">{order.quantity.toLocaleString()} units</strong>
                    </div>
                    <div className="sinova-metric-cell">
                      <span className="lbl">Shipping / Freight</span>
                      <strong className="val muted">₹{(order.shippingCost || 0).toLocaleString()}</strong>
                    </div>
                    <div className="sinova-metric-cell highlight">
                      <span className="lbl">Total Order Amount</span>
                      <strong className="val green">₹{order.totalAmount.toLocaleString()}</strong>
                    </div>
                  </div>

                  {order.supplierNotes && (
                    <div>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "#122321", display: "block", marginBottom: "6px" }}>
                        Supplier Terms & Notes:
                      </span>
                      <p style={{ fontSize: "13px", color: "#60706c", background: "#f6f8f7", padding: "14px", borderRadius: "8px", margin: 0, lineHeight: 1.5 }}>
                        {order.supplierNotes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: References & Supplier Profile */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div className="sinova-panel-card">
                <div className="sinova-panel-header">
                  <h2>Procurement References</h2>
                </div>
                <div className="sinova-panel-body">
                  <div className="sinova-user-summary" style={{ marginBottom: "16px" }}>
                    <div className="sinova-summary-row">
                      <span className="sinova-summary-key">Order Number:</span>
                      <span className="sinova-summary-val">{order.orderNumber}</span>
                    </div>
                    <div className="sinova-summary-row">
                      <span className="sinova-summary-key">Supplier:</span>
                      <span className="sinova-summary-val">{order.manufacturer.name}</span>
                    </div>
                    <div className="sinova-summary-row">
                      <span className="sinova-summary-key">Product:</span>
                      <span className="sinova-summary-val">{order.product.name}</span>
                    </div>
                    <div className="sinova-summary-row">
                      <span className="sinova-summary-key">Category:</span>
                      <span className="sinova-summary-val">{order.product.category.name}</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {order.rfqId && (
                      <Link href={`/rfqs/${order.rfqId}`} className="sinova-secondary-cta" style={{ fontSize: "12.5px", textAlign: "center" }}>
                        View Original RFQ &rarr;
                      </Link>
                    )}
                    <Link href={`/suppliers/${order.manufacturerId}`} className="sinova-outline-btn" style={{ fontSize: "12.5px", textDecoration: "none", textAlign: "center" }}>
                      View Supplier Profile
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
