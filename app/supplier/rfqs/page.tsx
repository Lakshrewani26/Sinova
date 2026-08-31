import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSupplier } from "@/lib/session";
import { DashboardHeader } from "@/app/dashboard/DashboardHeader";

interface PageProps {
  searchParams: Promise<{
    status?: string;
  }>;
}

export default async function SupplierRfqInboxPage({ searchParams }: PageProps) {
  const supplier = await requireSupplier();
  const params = await searchParams;

  const statusFilter = params.status || "ALL";

  // Role isolation filter: Only show RFQs sent to this supplier's associated manufacturer
  const whereClause: Prisma.RfqWhereInput = {
    manufacturerId: supplier.manufacturerId || "non-existent-id",
  };

  if (statusFilter !== "ALL") {
    whereClause.status = statusFilter;
  }

  // Query incoming RFQs for supplier's manufacturer
  const [rfqs, totalRfqsCount] = await Promise.all([
    prisma.rfq.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
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
    }),
    prisma.rfq.count({
      where: { manufacturerId: supplier.manufacturerId || "non-existent-id" },
    }),
  ]);

  const statusTabs = [
    { label: "All", value: "ALL" },
    { label: "Sent (Awaiting Quote)", value: "SENT" },
    { label: "Quotation Submitted", value: "QUOTATION_RECEIVED" },
    { label: "Accepted", value: "ACCEPTED" },
    { label: "Rejected", value: "REJECTED" },
  ];

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
        <div className="sinova-container">
          {/* Supplier Welcome Banner */}
          <section className="sinova-welcome-hero" style={{ marginBottom: "24px" }}>
            <div className="sinova-hero-content">
              <span className="sinova-eyebrow">SUPPLIER PORTAL • INBOX</span>
              <h1 className="sinova-hero-title">Incoming Buyer RFQs</h1>
              <p className="sinova-hero-subtext">
                Requests for Quotation sent directly to <strong>{supplier.manufacturer?.name || "your factory"}</strong>.
              </p>
            </div>
          </section>

          {/* Status Filter Tabs */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "24px", overflowX: "auto", paddingBottom: "4px" }}>
            {statusTabs.map((tab) => {
              const isActive = statusFilter === tab.value;
              return (
                <Link
                  key={tab.value}
                  href={tab.value === "ALL" ? "/supplier/rfqs" : `/supplier/rfqs?status=${tab.value}`}
                  className={isActive ? "sinova-secondary-cta" : "sinova-cancel-btn"}
                  style={
                    isActive
                      ? {
                          backgroundColor: "#082e29",
                          color: "#c7ee72",
                          borderColor: "#082e29",
                          fontWeight: 800,
                        }
                      : { fontWeight: 600 }
                  }
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>

          {/* RFQ List */}
          {rfqs.length === 0 ? (
            <div className="sinova-panel-card sinova-empty-state">
              <div className="sinova-empty-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <h3>No incoming RFQs found</h3>
              <p>
                {totalRfqsCount === 0
                  ? "There are currently no Requests for Quotation assigned to your factory."
                  : "No incoming RFQs match the selected status filter."}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {rfqs.map((rfq) => {
                const dateStr = new Date(rfq.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });

                const totalTarget = rfq.quantity * rfq.targetUnitPrice;
                const submittedQuote = rfq.quotations[0];
                const hasSubmitted = !!submittedQuote;

                return (
                  <div
                    key={rfq.id}
                    className="sinova-panel-card"
                    style={{
                      padding: "20px 24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "20px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                        <span className="sinova-nav-badge">{rfq.product.category.name}</span>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 800,
                            backgroundColor: rfq.status === "ACCEPTED" ? "#082e29" : hasSubmitted ? "#eef5f2" : "#fef3c7",
                            color: rfq.status === "ACCEPTED" ? "#c7ee72" : hasSubmitted ? "#0d5c4c" : "#92400e",
                            padding: "2px 8px",
                            borderRadius: "10px",
                          }}
                        >
                          {rfq.status === "SENT" ? "ACTION REQUIRED: NEW RFQ" : rfq.status}
                        </span>
                        <span style={{ fontSize: "11.5px", color: "#60706c" }}>Received on {dateStr}</span>
                      </div>

                      <h3 style={{ fontSize: "17px", fontWeight: 800, margin: "2px 0", color: "#122321" }}>
                        {rfq.product.name} <small style={{ fontWeight: 400, color: "#60706c" }}>(RFQ #{rfq.id.substring(rfq.id.length - 8)})</small>
                      </h3>

                      <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#60706c" }}>
                        Buyer: <strong>{rfq.user.name}</strong> • Quantity: {rfq.quantity.toLocaleString()} units • Target Price: ₹{rfq.targetUnitPrice}/unit (Total Target: ₹{totalTarget.toLocaleString()})
                      </p>

                      {rfq.sourcingRequest?.maxLeadTimeDays && (
                        <p style={{ margin: "2px 0 0 0", fontSize: "12.5px", color: "#4f635d" }}>
                          Buyer Requested Lead Time: <strong>{rfq.sourcingRequest.maxLeadTimeDays} Days max</strong>
                        </p>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <Link
                        href={`/supplier/rfqs/${rfq.id}`}
                        className={hasSubmitted ? "sinova-secondary-cta" : "sinova-primary-cta"}
                        style={{ padding: "9px 16px", fontSize: "13px" }}
                      >
                        {hasSubmitted ? "View Quotation Details &rarr;" : "Review & Submit Quote &rarr;"}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
