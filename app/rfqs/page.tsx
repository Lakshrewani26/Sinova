import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireBuyer } from "@/lib/session";
import { DashboardHeader } from "@/app/dashboard/DashboardHeader";

interface PageProps {
  searchParams: Promise<{
    status?: string;
  }>;
}

export default async function RfqListPage({ searchParams }: PageProps) {
  const user = await requireBuyer();
  const params = await searchParams;

  const statusFilter = params.status || "ALL";

  // Strict user isolation: Buyers only view their own RFQs
  const whereClause: Prisma.RfqWhereInput = { userId: user.id };

  if (statusFilter !== "ALL") {
    whereClause.status = statusFilter;
  }

  // Query RFQs and count by status
  const [rfqs, totalRfqs] = await Promise.all([
    prisma.rfq.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        manufacturer: true,
        product: {
          include: { category: true },
        },
        sourcingRequest: true,
        quotations: true,
      },
    }),
    prisma.rfq.count({
      where: { userId: user.id },
    }),
  ]);

  const statusTabs = [
    { label: "All", value: "ALL" },
    { label: "Sent", value: "SENT" },
    { label: "Quotation Received", value: "QUOTATION_RECEIVED" },
    { label: "Accepted", value: "ACCEPTED" },
    { label: "Rejected", value: "REJECTED" },
    { label: "Cancelled", value: "CANCELLED" },
  ];

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
          {/* Hero Banner */}
          <section className="sinova-welcome-hero" style={{ marginBottom: "24px" }}>
            <div className="sinova-hero-content">
              <span className="sinova-eyebrow">PROCUREMENT WORKSPACE</span>
              <h1 className="sinova-hero-title">Requests for Quotation (RFQs)</h1>
              <p className="sinova-hero-subtext">
                Manage your formal RFQs sent to catalog suppliers and track quotation progress.
              </p>
            </div>

            <div className="sinova-hero-actions">
              <Link href="/suppliers" className="sinova-primary-cta">
                Find Suppliers
              </Link>
            </div>
          </section>

          {/* Status Filter Tabs */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "24px", overflowX: "auto", paddingBottom: "4px" }}>
            {statusTabs.map((tab) => {
              const isActive = statusFilter === tab.value;
              return (
                <Link
                  key={tab.value}
                  href={tab.value === "ALL" ? "/rfqs" : `/rfqs?status=${tab.value}`}
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

          {/* RFQ List Cards */}
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
              <h3>No RFQs found</h3>
              <p>
                {totalRfqs === 0
                  ? "You have not sent any Requests for Quotation yet."
                  : "No RFQs match the selected status filter."}
              </p>
              <Link href="/suppliers" className="sinova-primary-cta">
                Find Suppliers
              </Link>
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
                const quoteCount = rfq.quotations.length;
                const quoteLabel = quoteCount === 0 ? "Awaiting Quote" : quoteCount === 1 ? "1 Quote Received" : `${quoteCount} Quotes Received`;

                return (
                  <div
                    key={rfq.id}
                    className="sinova-panel-card sinova-stat-card"
                    style={{
                      padding: "20px 24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "20px",
                      flexWrap: "wrap",
                      borderLeft: rfq.status === "ACCEPTED"
                        ? "4px solid var(--sinova-lime)"
                        : quoteCount > 0
                        ? "4px solid var(--sinova-green)"
                        : "4px solid #a4d3c3",
                      transition: "all 0.2s var(--sinova-ease)",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                        <span className="sinova-nav-badge" style={{ backgroundColor: "var(--sinova-mint)", color: "var(--sinova-green)", border: "1px solid #b7dcce" }}>
                          {rfq.product.category.name}
                        </span>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 800,
                            backgroundColor: rfq.status === "ACCEPTED" ? "var(--sinova-deep)" : "var(--sinova-mint)",
                            color: rfq.status === "ACCEPTED" ? "var(--sinova-lime)" : "var(--sinova-green)",
                            padding: "3px 10px",
                            borderRadius: "12px",
                            border: rfq.status === "ACCEPTED" ? "none" : "1px solid #b7dcce",
                          }}
                        >
                          {rfq.status}
                        </span>
                        <span className="sinova-nav-badge" style={{ backgroundColor: quoteCount > 0 ? "var(--sinova-mint)" : "#f6f8f7", color: quoteCount > 0 ? "var(--sinova-green)" : "#60706c", border: "1px solid #dce4df" }}>
                          {quoteLabel}
                        </span>
                        <span style={{ fontSize: "11.5px", color: "#60706c" }}>Sent on {dateStr}</span>
                      </div>

                      <h3 style={{ fontSize: "17px", fontWeight: 800, margin: "2px 0", color: "var(--sinova-ink)" }}>
                        {rfq.product.name}
                      </h3>
                      <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#60706c" }}>
                        Supplier: <strong style={{ color: "var(--sinova-ink)" }}>{rfq.manufacturer.name}</strong> • Quantity: {rfq.quantity.toLocaleString()} units • Target ₹{rfq.targetUnitPrice}/unit (Total <strong style={{ color: "var(--sinova-deep)" }}>₹{totalTarget.toLocaleString()}</strong>)
                      </p>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <Link
                        href={`/rfqs/${rfq.id}`}
                        className="sinova-secondary-cta"
                        style={{ padding: "10px 18px", fontSize: "13px" }}
                      >
                        View RFQ Details &rarr;
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
