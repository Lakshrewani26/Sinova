import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSupplier } from "@/lib/session";
import { DashboardHeader } from "@/app/dashboard/DashboardHeader";
import { SupplierQuotationForm } from "../SupplierQuotationForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SupplierRfqDetailPage({ params }: PageProps) {
  const supplier = await requireSupplier();
  const { id } = await params;

  // Strict role isolation: Supplier can only view RFQs assigned to their manufacturer
  const rfq = await prisma.rfq.findFirst({
    where: {
      id,
      manufacturerId: supplier.manufacturerId || "non-existent-id",
    },
    include: {
      manufacturer: true,
      product: {
        include: { category: true },
      },
      sourcingRequest: true,
      quotations: {
        where: { manufacturerId: supplier.manufacturerId || "" },
        orderBy: { createdAt: "desc" },
      },
      user: {
        select: {
          name: true,
          email: true,
        },
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

  const existingQuotation = rfq.quotations[0] || null;

  return (
    <div className="sinova-dashboard-layout">
      <DashboardHeader
        user={{
          name: supplier.name,
          email: supplier.email,
          role: supplier.role,
          manufacturerId: supplier.manufacturerId,
          manufacturerName: supplier.manufacturer?.name,
        }}
      />

      <main className="sinova-dashboard-main">
        <div className="sinova-container" style={{ maxWidth: "900px" }}>
          {/* Breadcrumbs */}
          <div className="sinova-breadcrumbs">
            <Link href="/supplier/rfqs">Supplier RFQ Inbox</Link>
            <span className="sinova-breadcrumb-sep">/</span>
            <span className="sinova-breadcrumb-current">RFQ #{rfq.id.substring(rfq.id.length - 8)}</span>
          </div>

          {/* Hero Banner */}
          <section className="sinova-welcome-hero" style={{ marginBottom: "24px" }}>
            <div className="sinova-hero-content">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                <span className="sinova-eyebrow" style={{ margin: 0 }}>
                  INCOMING BUYER RFQ #{rfq.id.substring(rfq.id.length - 8)}
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    backgroundColor: rfq.status === "ACCEPTED" ? "#082e29" : existingQuotation ? "#eef5f2" : "#fef3c7",
                    color: rfq.status === "ACCEPTED" ? "#c7ee72" : existingQuotation ? "#0d5c4c" : "#92400e",
                    padding: "3px 10px",
                    borderRadius: "12px",
                  }}
                >
                  {existingQuotation ? "Quotation Sent to Buyer / Awaiting Buyer Decision" : "ACTION REQUIRED: SUBMIT QUOTATION"}
                </span>
              </div>

              <h1 className="sinova-hero-title">RFQ for {rfq.product.name}</h1>
              <p className="sinova-hero-subtext">
                Assigned Factory: <strong>{rfq.manufacturer.name}</strong> • Buyer: <strong>{rfq.user.name}</strong> • Received: {createdDate}
              </p>
            </div>
          </section>

          {/* Buyer Request Details Panel */}
          <div className="sinova-panel-card" style={{ marginBottom: "28px" }}>
            <div className="sinova-panel-header">
              <h2>Buyer Target Requirements</h2>
              <span className="sinova-nav-badge">{rfq.product.category.name}</span>
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
                  <span className="lbl">Total Buyer Budget</span>
                  <strong className="val">₹{(rfq.quantity * rfq.targetUnitPrice).toLocaleString()}</strong>
                </div>
                <div className="sinova-metric-cell">
                  <span className="lbl">Requested Lead Time</span>
                  <strong className="val muted">
                    {rfq.sourcingRequest?.maxLeadTimeDays
                      ? `${rfq.sourcingRequest.maxLeadTimeDays} Days max`
                      : "Standard delivery"}
                  </strong>
                </div>
              </div>

              {rfq.message && (
                <div style={{ marginBottom: "16px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#122321", display: "block", marginBottom: "4px" }}>
                    Buyer Specific Requirements & Message:
                  </span>
                  <p style={{ fontSize: "13px", color: "#4f635d", background: "#f6f8f7", padding: "12px 16px", borderRadius: "8px", margin: 0, lineHeight: 1.5 }}>
                    {rfq.message}
                  </p>
                </div>
              )}

              {rfq.sourcingRequest?.specifications && (
                <div>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#122321", display: "block", marginBottom: "4px" }}>
                    Sourcing Brief Specifications:
                  </span>
                  <p style={{ fontSize: "13px", color: "#4f635d", background: "#f6f8f7", padding: "12px 16px", borderRadius: "8px", margin: 0, lineHeight: 1.5 }}>
                    {rfq.sourcingRequest.specifications}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Supplier Quotation Form Panel */}
          <div className="sinova-panel-card">
            <div className="sinova-panel-header">
              <div>
                <h2>{existingQuotation ? "Submitted Supplier Quotation" : "Submit Supplier Quotation"}</h2>
                <span style={{ fontSize: "12.5px", color: "#60706c" }}>
                  {existingQuotation
                    ? "You have submitted a quotation for this RFQ. You can review or update pricing below."
                    : "Fill in your factory unit price, MOQ, lead time, and terms to submit your quotation to the buyer."}
                </span>
              </div>
            </div>

            <div className="sinova-panel-body">
              <SupplierQuotationForm rfq={rfq} existingQuotation={existingQuotation} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
