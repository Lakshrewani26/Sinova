import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireBuyer } from "@/lib/session";
import { DashboardHeader } from "@/app/dashboard/DashboardHeader";
import { QuotationActionButtons } from "./QuotationActionButtons";
import { CreateOrderButton } from "./CreateOrderButton";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RfqDetailPage({ params }: PageProps) {
  const user = await requireBuyer();
  const { id } = await params;

  // Strict user isolation: Buyer can only view their own RFQ
  const rfq = await prisma.rfq.findFirst({
    where: {
      id,
      userId: user.id,
    },
    include: {
      manufacturer: true,
      product: {
        include: { category: true },
      },
      sourcingRequest: true,
      quotations: {
        orderBy: { createdAt: "desc" },
        include: { order: true },
      },
    },
  });

  if (!rfq) {
    notFound();
  }

  const createdDate = new Date(rfq.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const totalTargetAmount = rfq.quantity * rfq.targetUnitPrice;

  // Dynamic Timeline reflecting real database state
  const hasQuotations = rfq.quotations.length > 0;
  const isAccepted = rfq.status === "ACCEPTED" || rfq.quotations.some((q) => q.status === "ACCEPTED");

  const stages = [
    { label: "Created", done: true, active: false },
    { label: "Sent", done: true, active: rfq.status === "SENT" && !hasQuotations },
    { label: "Quotation Received", done: hasQuotations, active: hasQuotations && !isAccepted },
    { label: "Accepted", done: isAccepted, active: isAccepted },
  ];

  // Sort quotations for comparison matrix by Effective Unit Cost, Lead Time, MOQ
  const sortedQuotations = [...rfq.quotations].sort((a, b) => {
    const effA = (a.quotedUnitPrice * a.quantity + (a.shippingCost || 0)) / a.quantity;
    const effB = (b.quotedUnitPrice * b.quantity + (b.shippingCost || 0)) / b.quantity;
    if (effA !== effB) return effA - effB;
    const ltA = a.leadTimeDays ?? 9999;
    const ltB = b.leadTimeDays ?? 9999;
    if (ltA !== ltB) return ltA - ltB;
    const moqA = a.moq ?? 999999;
    const moqB = b.moq ?? 999999;
    return moqA - moqB;
  });

  return (
    <div className="sinova-dashboard-layout">
      <DashboardHeader
        user={{
          name: user.name,
          email: user.email,
          role: user.role,
          manufacturerId: user.manufacturerId,
          manufacturerName: user.manufacturer?.name,
        }}
      />

      <main className="sinova-dashboard-main">
        <div className="sinova-container">
          {/* Breadcrumbs */}
          <div className="sinova-breadcrumbs">
            <Link href="/dashboard">Dashboard</Link>
            <span className="sinova-breadcrumb-sep">/</span>
            <Link href="/rfqs">RFQs</Link>
            <span className="sinova-breadcrumb-sep">/</span>
            <span className="sinova-breadcrumb-current">RFQ #{rfq.id.substring(rfq.id.length - 8)}</span>
          </div>

          {/* Hero Banner */}
          <section className="sinova-welcome-hero" style={{ marginBottom: "28px" }}>
            <div className="sinova-hero-content">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                <span className="sinova-eyebrow" style={{ margin: 0 }}>
                  REQUEST FOR QUOTATION
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    backgroundColor: rfq.status === "ACCEPTED" ? "#082e29" : "#eef5f2",
                    color: rfq.status === "ACCEPTED" ? "#c7ee72" : "#0d5c4c",
                    padding: "3px 10px",
                    borderRadius: "12px",
                  }}
                >
                  STATUS: {rfq.status}
                </span>
              </div>

              <h1 className="sinova-hero-title">RFQ for {rfq.product.name}</h1>
              <p className="sinova-hero-subtext">
                Assigned Factory: <strong>{rfq.manufacturer.name}</strong> ({rfq.manufacturer.country})
              </p>

              <div className="sinova-meta-row">
                <span>
                  <strong>Quantity:</strong> {rfq.quantity.toLocaleString()} units
                </span>
                <span className="dot">•</span>
                <span>
                  <strong>Target Price:</strong> ₹{rfq.targetUnitPrice}/unit
                </span>
                <span className="dot">•</span>
                <span>
                  <strong>Quotes Received:</strong> {rfq.quotations.length}
                </span>
                <span className="dot">•</span>
                <span>
                  <strong>Sent On:</strong> {createdDate}
                </span>
              </div>
            </div>
          </section>

          {/* Dynamic Status Timeline */}
          <div className="sinova-panel-card" style={{ marginBottom: "28px", padding: "20px 28px" }}>
            <span style={{ fontSize: "11px", fontFamily: "DM Mono, monospace", color: "#60706c", display: "block", marginBottom: "16px", textTransform: "uppercase" }}>
              RFQ Workflow Status Timeline
            </span>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", gap: "12px", flexWrap: "wrap" }}>
              {stages.map((stage, idx) => (
                <div key={stage.label} style={{ display: "flex", alignItems: "center", gap: "10px", flex: "1 1 auto" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      backgroundColor: stage.active ? "#082e29" : stage.done ? "#0d5c4c" : "#eef2f0",
                      color: stage.active ? "#c7ee72" : stage.done ? "#ffffff" : "#8a9e97",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: "13px",
                    }}
                  >
                    {stage.done ? "✓" : idx + 1}
                  </div>
                  <div>
                    <strong style={{ fontSize: "13px", color: stage.active || stage.done ? "#122321" : "#8a9e97", display: "block" }}>
                      {stage.label}
                    </strong>
                    <span style={{ fontSize: "11px", color: "#60706c" }}>
                      {stage.active ? "Current Stage" : stage.done ? "Completed" : "Pending"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Supplier Quotations Section */}
          <section style={{ marginBottom: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: 800, margin: 0, color: "#122321" }}>
                  Received Supplier Quotations ({rfq.quotations.length})
                </h2>
                <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "#60706c" }}>
                  Review and evaluate formal supplier quotes submitted by the assigned factory.
                </p>
              </div>
            </div>

            {rfq.quotations.length === 0 ? (
              <div className="sinova-panel-card sinova-empty-state" style={{ padding: "48px 24px" }}>
                <div className="sinova-empty-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                  </svg>
                </div>
                <h3>Awaiting Supplier Quotation</h3>
                <p style={{ maxWidth: "560px", margin: "0 auto", textAlign: "center", lineHeight: "1.65" }}>
                  RFQ has been sent to <strong style={{ color: "var(--sinova-green)", fontWeight: 800 }}>{rfq.manufacturer.name}</strong>. Log into the demo supplier account for <strong style={{ color: "var(--sinova-green)", fontWeight: 800 }}>{rfq.manufacturer.name}</strong> to submit a formal quotation.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {rfq.quotations.map((quote) => {
                  const productCost = quote.quotedUnitPrice * quote.quantity;
                  const totalCost = productCost + (quote.shippingCost || 0);
                  const effectiveUnitCost = quote.quantity > 0 ? totalCost / quote.quantity : 0;
                  const diffUnit = effectiveUnitCost - rfq.targetUnitPrice;
                  const diffPct = (diffUnit / rfq.targetUnitPrice) * 100;
                  const isWithinTarget = effectiveUnitCost <= rfq.targetUnitPrice;

                  const quoteDate = new Date(quote.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  const validUntilStr = quote.validUntil
                    ? new Date(quote.validUntil).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : null;

                  return (
                    <div key={quote.id} className="sinova-panel-card" style={{ padding: "24px" }}>
                      {/* Header Row */}
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap", marginBottom: "16px" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                            <span className="sinova-nav-badge" style={{ backgroundColor: "#eef5f2", color: "#0d5c4c" }}>
                              Supplier Quotation
                            </span>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 800,
                                padding: "3px 10px",
                                borderRadius: "12px",
                                backgroundColor: isWithinTarget ? "#eef5f2" : "#fef3c7",
                                color: isWithinTarget ? "#0d5c4c" : "#92400e",
                                border: isWithinTarget ? "1px solid #a4d3c3" : "1px solid #fcd34d",
                              }}
                            >
                              {isWithinTarget ? "✓ Within Target" : "▲ Above Target"}
                            </span>
                            <span style={{ fontSize: "11.5px", color: "#60706c" }}>Recorded on {quoteDate}</span>
                          </div>

                          <h3 style={{ fontSize: "18px", fontWeight: 800, margin: "2px 0", color: "#122321" }}>
                            {rfq.manufacturer.name}
                          </h3>
                        </div>

                        {/* Accept / Reject or Order Creation Actions */}
                        {quote.status === "ACCEPTED" ? (
                          <CreateOrderButton quotationId={quote.id} existingOrderId={quote.order?.id} />
                        ) : (
                          <QuotationActionButtons quotationId={quote.id} status={quote.status} />
                        )}
                      </div>

                      {/* Financial Metrics & Economics Breakdown */}
                      <div style={{ background: "#f6f8f7", border: "1px solid #dce4df", borderRadius: "8px", padding: "16px", marginBottom: "16px" }}>
                        <span style={{ fontSize: "10.5px", fontFamily: "DM Mono, monospace", color: "#60706c", display: "block", marginBottom: "12px", textTransform: "uppercase" }}>
                          Supplier Quotation Economics
                        </span>

                        <div className="sinova-metrics-grid-4">
                          <div className="sinova-metric-cell">
                            <span className="lbl">Quoted Unit Price</span>
                            <strong className="val">₹{quote.quotedUnitPrice.toLocaleString()}</strong>
                          </div>
                          <div className="sinova-metric-cell">
                            <span className="lbl">Quoted Quantity</span>
                            <strong className="val">{quote.quantity.toLocaleString()} units</strong>
                          </div>
                          <div className="sinova-metric-cell highlight">
                            <span className="lbl">Effective Unit Cost</span>
                            <strong className="val green">₹{effectiveUnitCost.toFixed(2)}</strong>
                          </div>
                          <div className="sinova-metric-cell">
                            <span className="lbl">Target Difference</span>
                            <strong className="val" style={{ color: isWithinTarget ? "#0d5c4c" : "#c92a2a" }}>
                              {diffUnit > 0 ? `+₹${diffUnit.toFixed(2)}` : `-₹${Math.abs(diffUnit).toFixed(2)}`}{" "}
                              <small style={{ fontSize: "11px", fontWeight: 600 }}>({diffPct > 0 ? `+${diffPct.toFixed(1)}%` : `${diffPct.toFixed(1)}%`})</small>
                            </strong>
                          </div>
                        </div>
                      </div>

                      {/* Production & Shipping Parameters */}
                      <div className="sinova-factor-scores" style={{ borderTop: "0", paddingTop: 0, marginBottom: "12px" }}>
                        <div className="sinova-factor-row">
                          <span className="lbl">Supplier MOQ:</span>
                          <span className="val-badge green">
                            {quote.moq ? `${quote.moq.toLocaleString()} units (Supplier-provided)` : "Not specified"}
                          </span>
                        </div>
                        <div className="sinova-factor-row">
                          <span className="lbl">Production Lead Time:</span>
                          <span className="val-badge green">
                            {quote.leadTimeDays ? `${quote.leadTimeDays} Days (Supplier-provided)` : "Not specified"}
                          </span>
                        </div>
                        <div className="sinova-factor-row">
                          <span className="lbl">Shipping / Freight Cost:</span>
                          <span className="val-badge neutral">
                            ₹{(quote.shippingCost || 0).toLocaleString()} Total
                          </span>
                        </div>
                        {validUntilStr && (
                          <div className="sinova-factor-row">
                            <span className="lbl">Quote Valid Until:</span>
                            <span className="val-badge neutral">{validUntilStr}</span>
                          </div>
                        )}
                      </div>

                      {quote.supplierNotes && (
                        <div style={{ marginTop: "12px" }}>
                          <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#122321", display: "block", marginBottom: "4px" }}>
                            Supplier Notes:
                          </span>
                          <p style={{ fontSize: "12.5px", color: "#60706c", background: "#ffffff", border: "1px solid #eef2f0", padding: "10px 14px", borderRadius: "6px", margin: 0 }}>
                            {quote.supplierNotes}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Multi-Quotation Comparison Matrix */}
          {sortedQuotations.length > 1 && (
            <section style={{ marginBottom: "32px" }}>
              <div className="sinova-panel-card">
                <div className="sinova-panel-header">
                  <div>
                    <h2>Compare Quotations ({sortedQuotations.length})</h2>
                    <span style={{ fontSize: "12px", color: "#60706c" }}>
                      Sorted by Effective Unit Cost (Low to High), Lead Time, and MOQ.
                    </span>
                  </div>
                </div>

                <div className="sinova-panel-body" style={{ padding: 0 }}>
                  <div style={{ overflowX: "auto" }}>
                    <table className="sinova-table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                      <thead>
                        <tr style={{ background: "#f6f8f7", borderBottom: "1.5px solid #dce4df" }}>
                          <th style={{ padding: "12px 16px" }}>Rank & Supplier</th>
                          <th style={{ padding: "12px 16px" }}>Quoted Price</th>
                          <th style={{ padding: "12px 16px" }}>Effective Unit Cost</th>
                          <th style={{ padding: "12px 16px" }}>MOQ</th>
                          <th style={{ padding: "12px 16px" }}>Lead Time</th>
                          <th style={{ padding: "12px 16px" }}>Target Diff</th>
                          <th style={{ padding: "12px 16px" }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedQuotations.map((q, index) => {
                          const productCost = q.quotedUnitPrice * q.quantity;
                          const totalCost = productCost + (q.shippingCost || 0);
                          const effUnit = q.quantity > 0 ? totalCost / q.quantity : 0;
                          const diffUnit = effUnit - rfq.targetUnitPrice;
                          const isWithin = effUnit <= rfq.targetUnitPrice;

                          return (
                            <tr key={q.id} style={{ borderBottom: "1px solid #eef2f0" }}>
                              <td style={{ padding: "14px 16px", fontWeight: 700, color: "#122321" }}>
                                #{index + 1} {rfq.manufacturer.name}
                              </td>
                              <td style={{ padding: "14px 16px", fontWeight: 700 }}>
                                ₹{q.quotedUnitPrice.toLocaleString()}
                              </td>
                              <td style={{ padding: "14px 16px", fontWeight: 800, color: "#0d5c4c" }}>
                                ₹{effUnit.toFixed(2)}
                              </td>
                              <td style={{ padding: "14px 16px", color: "#60706c" }}>
                                {q.moq ? `${q.moq.toLocaleString()} units` : "N/A"}
                              </td>
                              <td style={{ padding: "14px 16px", color: "#60706c" }}>
                                {q.leadTimeDays ? `${q.leadTimeDays} Days` : "N/A"}
                              </td>
                              <td style={{ padding: "14px 16px", fontWeight: 700, color: isWithin ? "#0d5c4c" : "#c92a2a" }}>
                                {diffUnit > 0 ? `+₹${diffUnit.toFixed(2)}` : `-₹${Math.abs(diffUnit).toFixed(2)}`}
                              </td>
                              <td style={{ padding: "14px 16px" }}>
                                <span
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: 800,
                                    padding: "2px 8px",
                                    borderRadius: "10px",
                                    backgroundColor: q.status === "ACCEPTED" ? "#082e29" : "#eef5f2",
                                    color: q.status === "ACCEPTED" ? "#c7ee72" : "#0d5c4c",
                                  }}
                                >
                                  {q.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Left / Right Specs Column Grid */}
          <div className="sinova-content-grid" style={{ gridTemplateColumns: "1.8fr 1fr", gap: "28px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div className="sinova-panel-card">
                <div className="sinova-panel-header">
                  <h2>Original RFQ Target Specifications</h2>
                </div>
                <div className="sinova-panel-body">
                  <div className="sinova-metrics-grid-4" style={{ marginBottom: "20px" }}>
                    <div className="sinova-metric-cell">
                      <span className="lbl">Buyer Requested Quantity</span>
                      <strong className="val">{rfq.quantity.toLocaleString()} units</strong>
                    </div>
                    <div className="sinova-metric-cell">
                      <span className="lbl">Buyer Target Unit Price</span>
                      <strong className="val green">₹{rfq.targetUnitPrice.toLocaleString()}</strong>
                    </div>
                    <div className="sinova-metric-cell">
                      <span className="lbl">Total Target Budget</span>
                      <strong className="val">₹{totalTargetAmount.toLocaleString()}</strong>
                    </div>
                    <div className="sinova-metric-cell">
                      <span className="lbl">Catalog Indicative Price</span>
                      <strong className="val muted">₹{rfq.product.unitPriceINR.toLocaleString()}</strong>
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#122321", display: "block", marginBottom: "6px" }}>
                      Message & Requirements:
                    </span>
                    <p style={{ fontSize: "13px", color: "#60706c", background: "#f6f8f7", padding: "14px", borderRadius: "8px", margin: 0, lineHeight: 1.5 }}>
                      {rfq.message || "No custom message provided."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div className="sinova-panel-card">
                <div className="sinova-panel-header">
                  <h2>Supplier Directory Profile</h2>
                </div>
                <div className="sinova-panel-body">
                  <div className="sinova-user-summary" style={{ marginBottom: "16px" }}>
                    <div className="sinova-summary-row">
                      <span className="sinova-summary-key">Manufacturer:</span>
                      <span className="sinova-summary-val">{rfq.manufacturer.name}</span>
                    </div>
                    <div className="sinova-summary-row">
                      <span className="sinova-summary-key">Country:</span>
                      <span className="sinova-summary-val">{rfq.manufacturer.country}</span>
                    </div>
                    <div className="sinova-summary-row">
                      <span className="sinova-summary-key">Product:</span>
                      <span className="sinova-summary-val">{rfq.product.name}</span>
                    </div>
                    <div className="sinova-summary-row">
                      <span className="sinova-summary-key">Category:</span>
                      <span className="sinova-summary-val">{rfq.product.category.name}</span>
                    </div>
                  </div>

                  <Link href={`/suppliers/${rfq.manufacturer.id}`} className="sinova-outline-btn" style={{ textDecoration: "none", textAlign: "center" }}>
                    View Supplier Profile
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
