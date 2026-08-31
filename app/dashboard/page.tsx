import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireBuyer } from "@/lib/session";
import { DashboardHeader } from "./DashboardHeader";

export default async function DashboardPage() {
  const user = await requireBuyer();

  const firstName = user.name?.trim()
    ? user.name.trim().split(" ")[0]
    : "there";

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : "";

  // Execute optimized Promise.all query for real user-scoped data
  const [
    activeRequestsCount,
    matchedSuppliersCount,
    savedSuppliersCount,
    activeRfqsCount,
    quotesReceivedCount,
    activeOrdersCount,
    completedOrdersCount,
    financialOrders,
    pipelineRequestsCount,
    pipelineMatchesCount,
    pipelineRfqsCount,
    pipelineQuotesCount,
    pipelineOrdersCount,
    activeOrdersList,
    recentActivityList,
    topManufacturersRaw,
  ] = await Promise.all([
    // 1. Active Sourcing Requests
    prisma.sourcingRequest.count({
      where: { userId: user.id, status: { notIn: ["COMPLETED", "CANCELLED"] } },
    }),

    // 2. Matched Suppliers (persisted matches associated with user's sourcing requests)
    prisma.supplierMatch.count({
      where: { sourcingRequest: { userId: user.id } },
    }),

    // 3. Saved Suppliers
    prisma.savedSupplier.count({
      where: { userId: user.id },
    }),

    // 4. Active RFQs (SENT or QUOTATION_RECEIVED)
    prisma.rfq.count({
      where: { userId: user.id, status: { in: ["SENT", "QUOTATION_RECEIVED"] } },
    }),

    // 5. Quotes Received (status RECEIVED on user's RFQs)
    prisma.quotation.count({
      where: { rfq: { userId: user.id }, status: "RECEIVED" },
    }),

    // 6. Active Orders (not COMPLETED or CANCELLED)
    prisma.order.count({
      where: { userId: user.id, status: { notIn: ["COMPLETED", "CANCELLED"] } },
    }),

    // 7. Completed Orders
    prisma.order.count({
      where: { userId: user.id, status: "COMPLETED" },
    }),

    // 8. Financial aggregates across user's orders
    prisma.order.findMany({
      where: { userId: user.id },
      select: { status: true, totalAmount: true },
    }),

    // Pipeline Stage Counts
    prisma.sourcingRequest.count({ where: { userId: user.id } }),
    prisma.supplierMatch.count({ where: { sourcingRequest: { userId: user.id } } }),
    prisma.rfq.count({ where: { userId: user.id } }),
    prisma.quotation.count({ where: { rfq: { userId: user.id } } }),
    prisma.order.count({ where: { userId: user.id } }),

    // Active Procurement Orders List (latest 5 active non-terminal orders)
    prisma.order.findMany({
      where: { userId: user.id, status: { notIn: ["COMPLETED", "CANCELLED"] } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        manufacturer: true,
        product: true,
        statusHistory: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),

    // Recent Procurement Activity (latest 5 OrderStatusHistory records)
    prisma.orderStatusHistory.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        order: {
          include: {
            manufacturer: true,
            product: true,
          },
        },
      },
    }),

    // Top Manufacturers engaged by user
    prisma.manufacturer.findMany({
      where: {
        OR: [
          { savedBy: { some: { userId: user.id } } },
          { rfqs: { some: { userId: user.id } } },
          { orders: { some: { userId: user.id } } },
        ],
      },
      take: 5,
      include: {
        _count: {
          select: {
            rfqs: { where: { userId: user.id } },
            orders: { where: { userId: user.id } },
            savedBy: { where: { userId: user.id } },
          },
        },
      },
    }),
  ]);

  // Compute Real Procurement Value Summaries
  const totalProcurementValue = financialOrders
    .filter((o) => o.status !== "CANCELLED")
    .reduce((acc, o) => acc + o.totalAmount, 0);

  const activeOrderValue = financialOrders
    .filter((o) => o.status !== "COMPLETED" && o.status !== "CANCELLED")
    .reduce((acc, o) => acc + o.totalAmount, 0);

  const completedOrderValue = financialOrders
    .filter((o) => o.status === "COMPLETED")
    .reduce((acc, o) => acc + o.totalAmount, 0);

  const totalRfqsSent = pipelineRfqsCount;
  const isBrandNewUser = pipelineRequestsCount === 0 && pipelineOrdersCount === 0;

  return (
    <div className="sinova-dashboard-layout">
      <DashboardHeader user={{ name: user.name, email: user.email }} />

      <main className="sinova-dashboard-main">
        <div className="sinova-container">
          {/* Welcome Hero Banner */}
          <section className="sinova-welcome-hero" style={{ marginBottom: "24px" }}>
            <div className="sinova-hero-content">
              <span className="sinova-eyebrow">PROCUREMENT INTELLIGENCE COMMAND CENTER</span>
              <h1 className="sinova-hero-title">Welcome back, {firstName}</h1>
              <p className="sinova-hero-subtext">
                Real-time operational metrics and sourcing workflow pipeline. {memberSince ? `Member since ${memberSince}.` : ""}
              </p>
            </div>

            <div className="sinova-hero-actions">
              <Link href="/requirements/new" className="sinova-primary-cta">
                + New Sourcing Request
              </Link>
            </div>
          </section>

          {/* Data Honesty Disclaimer Notice */}
          <div
            style={{
              background: "#eef5f2",
              border: "1.5px solid #a4d3c3",
              borderRadius: "10px",
              padding: "14px 20px",
              marginBottom: "28px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <span style={{ color: "#0d5c4c", fontWeight: 800, fontSize: "16px" }}>ℹ</span>
            <span style={{ fontSize: "12.5px", color: "#4f635d", lineHeight: 1.4 }}>
              <strong>Internal Procurement Command Center:</strong> All statistics are calculated directly from your database records. Procurement status changes are recorded internally by the buyer.
            </span>
          </div>

          {/* SECTION 1: LIVE KPI CARDS (8 Live Metrics Grid) */}
          <section style={{ marginBottom: "32px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 800, margin: 0, color: "#122321" }}>
                Live KPI Overview
              </h2>
              <span className="sinova-badge-neutral">Real-Time Database Metrics</span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "16px",
              }}
            >
              {/* KPI 1: Active Sourcing Requests */}
              <Link href="/requirements" className="sinova-stat-card" style={{ textDecoration: "none", color: "inherit" }}>
                <div className="sinova-stat-header">
                  <span className="sinova-stat-label">Active Requests</span>
                  <div className="sinova-stat-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                </div>
                <div className="sinova-stat-value">{activeRequestsCount}</div>
                <div className="sinova-stat-footer">
                  <span>{activeRequestsCount === 0 ? "No active requests" : `${activeRequestsCount} request(s) active`}</span>
                </div>
              </Link>

              {/* KPI 2: Matched Suppliers */}
              <Link href="/requirements" className="sinova-stat-card" style={{ textDecoration: "none", color: "inherit" }}>
                <div className="sinova-stat-header">
                  <span className="sinova-stat-label">Matched Suppliers</span>
                  <div className="sinova-stat-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                  </div>
                </div>
                <div className="sinova-stat-value">{matchedSuppliersCount}</div>
                <div className="sinova-stat-footer">
                  <span>{matchedSuppliersCount === 0 ? "No matches yet" : `${matchedSuppliersCount} factory matches`}</span>
                </div>
              </Link>

              {/* KPI 3: Saved Suppliers */}
              <Link href="/suppliers/saved" className="sinova-stat-card" style={{ textDecoration: "none", color: "inherit" }}>
                <div className="sinova-stat-header">
                  <span className="sinova-stat-label">Saved Suppliers</span>
                  <div className="sinova-stat-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="sinova-stat-value">{savedSuppliersCount}</div>
                <div className="sinova-stat-footer">
                  <span>{savedSuppliersCount === 0 ? "No saved suppliers" : `${savedSuppliersCount} saved in directory`}</span>
                </div>
              </Link>

              {/* KPI 4: Active RFQs */}
              <Link href="/rfqs" className="sinova-stat-card" style={{ textDecoration: "none", color: "inherit" }}>
                <div className="sinova-stat-header">
                  <span className="sinova-stat-label">Active RFQs</span>
                  <div className="sinova-stat-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </div>
                </div>
                <div className="sinova-stat-value">{activeRfqsCount}</div>
                <div className="sinova-stat-footer">
                  <span>{activeRfqsCount === 0 ? "No active RFQs" : `${activeRfqsCount} RFQ(s) in progress`}</span>
                </div>
              </Link>

              {/* KPI 5: Quotes Received */}
              <Link href="/rfqs" className="sinova-stat-card" style={{ textDecoration: "none", color: "inherit" }}>
                <div className="sinova-stat-header">
                  <span className="sinova-stat-label">Quotes Received</span>
                  <div className="sinova-stat-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                    </svg>
                  </div>
                </div>
                <div className="sinova-stat-value">{quotesReceivedCount}</div>
                <div className="sinova-stat-footer">
                  <span>{quotesReceivedCount === 0 ? "No quotes received" : `${quotesReceivedCount} quote(s) to review`}</span>
                </div>
              </Link>

              {/* KPI 6: Active Orders */}
              <Link href="/orders" className="sinova-stat-card" style={{ textDecoration: "none", color: "inherit" }}>
                <div className="sinova-stat-header">
                  <span className="sinova-stat-label">Active Orders</span>
                  <div className="sinova-stat-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    </svg>
                  </div>
                </div>
                <div className="sinova-stat-value">{activeOrdersCount}</div>
                <div className="sinova-stat-footer">
                  <span>{activeOrdersCount === 0 ? "No active orders" : `${activeOrdersCount} order(s) in progress`}</span>
                </div>
              </Link>

              {/* KPI 7: Total Procurement Value */}
              <Link href="/orders" className="sinova-stat-card" style={{ textDecoration: "none", color: "inherit" }}>
                <div className="sinova-stat-header">
                  <span className="sinova-stat-label">Total Order Value</span>
                  <div className="sinova-stat-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="1" x2="12" y2="23" />
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </div>
                </div>
                <div className="sinova-stat-value" style={{ fontSize: "20px" }}>
                  ₹{totalProcurementValue.toLocaleString()}
                </div>
                <div className="sinova-stat-footer">
                  <span>Sum of order values</span>
                </div>
              </Link>

              {/* KPI 8: Completed Orders */}
              <Link href="/orders?status=COMPLETED" className="sinova-stat-card" style={{ textDecoration: "none", color: "inherit" }}>
                <div className="sinova-stat-header">
                  <span className="sinova-stat-label">Completed Orders</span>
                  <div className="sinova-stat-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                </div>
                <div className="sinova-stat-value">{completedOrdersCount}</div>
                <div className="sinova-stat-footer">
                  <span>{completedOrdersCount === 0 ? "No completed orders" : `${completedOrdersCount} order(s) completed`}</span>
                </div>
              </Link>
            </div>
          </section>

          {/* SECTION 2: PROCUREMENT CONVERSION PIPELINE */}
          <section style={{ marginBottom: "32px" }}>
            <div className="sinova-panel-card" style={{ padding: "24px 28px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                  <h2 style={{ fontSize: "18px", fontWeight: 800, margin: 0, color: "#122321" }}>
                    Procurement Conversion Pipeline
                  </h2>
                  <span style={{ fontSize: "12.5px", color: "#60706c" }}>
                    End-to-end sourcing lifecycle from requirement definition to completion.
                  </span>
                </div>
                <span className="sinova-badge-neutral">Live Database Pipeline</span>
              </div>

              {/* Horizontal Conversion Flow Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: "12px",
                  alignItems: "center",
                }}
              >
                {/* Stage 1: Requests */}
                <Link
                  href="/requirements"
                  style={{
                    background: "#f6f8f7",
                    border: "1.5px solid #dce4df",
                    borderRadius: "10px",
                    padding: "16px",
                    textDecoration: "none",
                    textAlign: "center",
                  }}
                >
                  <span style={{ fontSize: "11px", fontFamily: "DM Mono, monospace", color: "#60706c", display: "block", marginBottom: "4px" }}>
                    STAGE 1
                  </span>
                  <strong style={{ fontSize: "22px", fontWeight: 800, color: "#122321", display: "block" }}>
                    {pipelineRequestsCount}
                  </strong>
                  <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#0d5c4c" }}>Requests</span>
                </Link>

                {/* Stage 2: Matches */}
                <Link
                  href="/requirements"
                  style={{
                    background: "#f6f8f7",
                    border: "1.5px solid #dce4df",
                    borderRadius: "10px",
                    padding: "16px",
                    textDecoration: "none",
                    textAlign: "center",
                  }}
                >
                  <span style={{ fontSize: "11px", fontFamily: "DM Mono, monospace", color: "#60706c", display: "block", marginBottom: "4px" }}>
                    STAGE 2
                  </span>
                  <strong style={{ fontSize: "22px", fontWeight: 800, color: "#122321", display: "block" }}>
                    {pipelineMatchesCount}
                  </strong>
                  <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#0d5c4c" }}>Matches</span>
                </Link>

                {/* Stage 3: RFQs */}
                <Link
                  href="/rfqs"
                  style={{
                    background: "#f6f8f7",
                    border: "1.5px solid #dce4df",
                    borderRadius: "10px",
                    padding: "16px",
                    textDecoration: "none",
                    textAlign: "center",
                  }}
                >
                  <span style={{ fontSize: "11px", fontFamily: "DM Mono, monospace", color: "#60706c", display: "block", marginBottom: "4px" }}>
                    STAGE 3
                  </span>
                  <strong style={{ fontSize: "22px", fontWeight: 800, color: "#122321", display: "block" }}>
                    {pipelineRfqsCount}
                  </strong>
                  <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#0d5c4c" }}>RFQs Sent</span>
                </Link>

                {/* Stage 4: Quotes */}
                <Link
                  href="/rfqs"
                  style={{
                    background: "#f6f8f7",
                    border: "1.5px solid #dce4df",
                    borderRadius: "10px",
                    padding: "16px",
                    textDecoration: "none",
                    textAlign: "center",
                  }}
                >
                  <span style={{ fontSize: "11px", fontFamily: "DM Mono, monospace", color: "#60706c", display: "block", marginBottom: "4px" }}>
                    STAGE 4
                  </span>
                  <strong style={{ fontSize: "22px", fontWeight: 800, color: "#122321", display: "block" }}>
                    {pipelineQuotesCount}
                  </strong>
                  <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#0d5c4c" }}>Quotes</span>
                </Link>

                {/* Stage 5: Orders */}
                <Link
                  href="/orders"
                  style={{
                    background: "#f6f8f7",
                    border: "1.5px solid #dce4df",
                    borderRadius: "10px",
                    padding: "16px",
                    textDecoration: "none",
                    textAlign: "center",
                  }}
                >
                  <span style={{ fontSize: "11px", fontFamily: "DM Mono, monospace", color: "#60706c", display: "block", marginBottom: "4px" }}>
                    STAGE 5
                  </span>
                  <strong style={{ fontSize: "22px", fontWeight: 800, color: "#122321", display: "block" }}>
                    {pipelineOrdersCount}
                  </strong>
                  <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#0d5c4c" }}>Orders Created</span>
                </Link>

                {/* Stage 6: Completed */}
                <Link
                  href="/orders?status=COMPLETED"
                  style={{
                    background: "#082e29",
                    border: "1.5px solid #082e29",
                    borderRadius: "10px",
                    padding: "16px",
                    textDecoration: "none",
                    textAlign: "center",
                    color: "#ffffff",
                  }}
                >
                  <span style={{ fontSize: "11px", fontFamily: "DM Mono, monospace", color: "#8a9e97", display: "block", marginBottom: "4px" }}>
                    STAGE 6
                  </span>
                  <strong style={{ fontSize: "22px", fontWeight: 800, color: "#c7ee72", display: "block" }}>
                    {completedOrdersCount}
                  </strong>
                  <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#ffffff" }}>Completed</span>
                </Link>
              </div>
            </div>
          </section>

          {/* Brand New Account Polished Empty State Onboarding Banner */}
          {isBrandNewUser && (
            <section style={{ marginBottom: "32px" }}>
              <div className="sinova-panel-card sinova-empty-state" style={{ padding: "40px 24px" }}>
                <div className="sinova-empty-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <h2>No procurement activity yet</h2>
                <p style={{ maxWidth: "540px" }}>
                  Create your first sourcing request to start discovering manufacturers, requesting quotes, and managing procurement orders.
                </p>
                <Link href="/requirements/new" className="sinova-primary-cta">
                  + Create Sourcing Request
                </Link>
              </div>
            </section>
          )}

          {/* SECTION 3: ACTIVE ORDERS & FINANCIAL SUMMARY (2-Column Grid) */}
          <div className="sinova-content-grid" style={{ gridTemplateColumns: "1.8fr 1fr", gap: "28px", marginBottom: "32px" }}>
            {/* Left Column: Active Procurement Orders */}
            <div className="sinova-panel-card">
              <div className="sinova-panel-header">
                <div>
                  <h2>Active Procurement Orders</h2>
                  <span style={{ fontSize: "12px", color: "#60706c" }}>Latest active orders in progress</span>
                </div>
                <Link href="/orders" className="sinova-header-action-link">
                  View All ({activeOrdersCount}) &rarr;
                </Link>
              </div>

              <div className="sinova-panel-body" style={{ padding: "16px 24px" }}>
                {activeOrdersList.length === 0 ? (
                  <div className="sinova-empty-state" style={{ padding: "28px 16px" }}>
                    <h3 style={{ fontSize: "15px", fontWeight: 700 }}>No active procurement orders</h3>
                    <p style={{ fontSize: "13px", color: "#60706c", marginBottom: "16px" }}>
                      You currently have no active orders in progress.
                    </p>
                    <Link href="/rfqs" className="sinova-secondary-cta" style={{ padding: "8px 14px", fontSize: "12.5px" }}>
                      Explore RFQs
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {activeOrdersList.map((order) => {
                      const latestHistory = order.statusHistory[0];
                      const lastActivityDate = latestHistory
                        ? new Date(latestHistory.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : new Date(order.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          });

                      return (
                        <Link
                          key={order.id}
                          href={`/orders/${order.id}`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "14px 18px",
                            background: "#f6f8f7",
                            border: "1px solid #dce4df",
                            borderRadius: "8px",
                            textDecoration: "none",
                            gap: "16px",
                            flexWrap: "wrap",
                          }}
                        >
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                              <strong style={{ fontSize: "14.5px", color: "#122321" }}>
                                {order.orderNumber}
                              </strong>
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 800,
                                  backgroundColor: "#eef5f2",
                                  color: "#0d5c4c",
                                  padding: "2px 8px",
                                  borderRadius: "10px",
                                }}
                              >
                                {order.status}
                              </span>
                            </div>
                            <span style={{ fontSize: "12.5px", color: "#60706c", display: "block" }}>
                              {order.product.name} • {order.manufacturer.name} • {order.quantity.toLocaleString()} units
                            </span>
                          </div>

                          <div style={{ textAlign: "right" }}>
                            <strong style={{ fontSize: "15px", color: "#082e29", display: "block" }}>
                              ₹{order.totalAmount.toLocaleString()}
                            </strong>
                            <span style={{ fontSize: "11px", color: "#8a9e97" }}>
                              Activity: {lastActivityDate}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Procurement Value Financial Summary */}
            <div className="sinova-panel-card">
              <div className="sinova-panel-header">
                <h2>Procurement Value Summary</h2>
              </div>
              <div className="sinova-panel-body">
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ background: "#f6f8f7", border: "1px solid #dce4df", borderRadius: "8px", padding: "16px" }}>
                    <span style={{ fontSize: "11px", fontFamily: "DM Mono, monospace", color: "#60706c", display: "block", textTransform: "uppercase", marginBottom: "4px" }}>
                      TOTAL PROCUREMENT VALUE
                    </span>
                    <strong style={{ fontSize: "24px", fontWeight: 800, color: "#082e29", display: "block" }}>
                      ₹{totalProcurementValue.toLocaleString()}
                    </strong>
                    <span style={{ fontSize: "11.5px", color: "#60706c" }}>Sum of all non-cancelled order values</span>
                  </div>

                  <div style={{ background: "#f6f8f7", border: "1px solid #dce4df", borderRadius: "8px", padding: "16px" }}>
                    <span style={{ fontSize: "11px", fontFamily: "DM Mono, monospace", color: "#60706c", display: "block", textTransform: "uppercase", marginBottom: "4px" }}>
                      ACTIVE / ACCEPTED ORDER VALUE
                    </span>
                    <strong style={{ fontSize: "20px", fontWeight: 800, color: "#0d5c4c", display: "block" }}>
                      ₹{activeOrderValue.toLocaleString()}
                    </strong>
                    <span style={{ fontSize: "11.5px", color: "#60706c" }}>Value currently in production/fulfillment</span>
                  </div>

                  <div style={{ background: "#f6f8f7", border: "1px solid #dce4df", borderRadius: "8px", padding: "16px" }}>
                    <span style={{ fontSize: "11px", fontFamily: "DM Mono, monospace", color: "#60706c", display: "block", textTransform: "uppercase", marginBottom: "4px" }}>
                      COMPLETED PROCUREMENT VALUE
                    </span>
                    <strong style={{ fontSize: "20px", fontWeight: 800, color: "#122321", display: "block" }}>
                      ₹{completedOrderValue.toLocaleString()}
                    </strong>
                    <span style={{ fontSize: "11.5px", color: "#60706c" }}>Value of fully completed orders</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: RECENT ACTIVITY & SUPPLIER ENGAGEMENT (2-Column Grid) */}
          <div className="sinova-content-grid" style={{ gridTemplateColumns: "1.8fr 1fr", gap: "28px" }}>
            {/* Left Column: Recent Procurement Activity Feed */}
            <div className="sinova-panel-card">
              <div className="sinova-panel-header">
                <div>
                  <h2>Recent Procurement Activity</h2>
                  <span style={{ fontSize: "12px", color: "#60706c" }}>Latest 5 audit trail events</span>
                </div>
                <span className="sinova-badge-neutral">Audit Log Feed</span>
              </div>

              <div className="sinova-panel-body" style={{ padding: "16px 24px" }}>
                {recentActivityList.length === 0 ? (
                  <div className="sinova-empty-state" style={{ padding: "24px 16px" }}>
                    <h3 style={{ fontSize: "15px", fontWeight: 700 }}>No activity events recorded</h3>
                    <p style={{ fontSize: "13px", color: "#60706c" }}>
                      Status changes will be logged here as you progress procurement orders.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {recentActivityList.map((act) => {
                      const eventDate = new Date(act.createdAt);
                      const now = new Date();
                      const diffMs = now.getTime() - eventDate.getTime();
                      const diffMins = Math.floor(diffMs / (1000 * 60));
                      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

                      let timeAgo = "";
                      if (diffMins < 2) timeAgo = "Just now";
                      else if (diffMins < 60) timeAgo = `${diffMins} mins ago`;
                      else if (diffHours < 24) timeAgo = `${diffHours} hours ago`;
                      else if (diffDays === 1) timeAgo = "Yesterday";
                      else timeAgo = `${diffDays} days ago`;

                      const statusLabels: Record<string, string> = {
                        ORDER_CREATED: "Created Order",
                        SUPPLIER_CONFIRMED: "Moved to Supplier Confirmed",
                        IN_PRODUCTION: "Moved to In Production",
                        READY_TO_SHIP: "Moved to Ready to Ship",
                        COMPLETED: "Moved to Completed",
                        CANCELLED: "Cancelled Order",
                      };

                      const actionTitle = statusLabels[act.status] || act.status;

                      return (
                        <Link
                          key={act.id}
                          href={`/orders/${act.orderId}`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "12px 16px",
                            background: "#f6f8f7",
                            border: "1px solid #dce4df",
                            borderRadius: "8px",
                            textDecoration: "none",
                            gap: "12px",
                            flexWrap: "wrap",
                          }}
                        >
                          <div>
                            <strong style={{ fontSize: "14px", color: "#122321", display: "block" }}>
                              Order {act.order.orderNumber}
                            </strong>
                            <span style={{ fontSize: "12.5px", color: "#0d5c4c", fontWeight: 700 }}>
                              {actionTitle}
                            </span>
                            {act.note && (
                              <span style={{ fontSize: "12px", color: "#60706c", display: "block", marginTop: "2px" }}>
                                &quot;{act.note}&quot;
                              </span>
                            )}
                          </div>

                          <span
                            style={{
                              fontSize: "11px",
                              fontFamily: "DM Mono, monospace",
                              color: "#60706c",
                              background: "#ffffff",
                              padding: "3px 8px",
                              borderRadius: "6px",
                              border: "1px solid #eef2f0",
                            }}
                          >
                            {timeAgo}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Supplier Activity & Top Manufacturers */}
            <div className="sinova-panel-card">
              <div className="sinova-panel-header">
                <h2>Supplier Activity</h2>
              </div>
              <div className="sinova-panel-body">
                <div className="sinova-user-summary" style={{ marginBottom: "20px" }}>
                  <div className="sinova-summary-row">
                    <span className="sinova-summary-key">Suppliers Saved:</span>
                    <span className="sinova-summary-val">{savedSuppliersCount}</span>
                  </div>
                  <div className="sinova-summary-row">
                    <span className="sinova-summary-key">RFQs Sent:</span>
                    <span className="sinova-summary-val">{totalRfqsSent}</span>
                  </div>
                  <div className="sinova-summary-row">
                    <span className="sinova-summary-key">Quotes Received:</span>
                    <span className="sinova-summary-val">{quotesReceivedCount}</span>
                  </div>
                  <div className="sinova-summary-row">
                    <span className="sinova-summary-key">Orders Placed:</span>
                    <span className="sinova-summary-val">{pipelineOrdersCount}</span>
                  </div>
                </div>

                {topManufacturersRaw.length > 0 && (
                  <div>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#122321", display: "block", marginBottom: "10px" }}>
                      Top Engaged Manufacturers:
                    </span>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {topManufacturersRaw.map((m) => (
                        <Link
                          key={m.id}
                          href={`/suppliers/${m.id}`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "8px 12px",
                            background: "#f6f8f7",
                            borderRadius: "6px",
                            textDecoration: "none",
                            fontSize: "12.5px",
                          }}
                        >
                          <span style={{ fontWeight: 700, color: "#122321" }}>{m.name}</span>
                          <span style={{ color: "#60706c", fontSize: "11px" }}>
                            {m._count.orders > 0
                              ? `${m._count.orders} Order(s)`
                              : m._count.rfqs > 0
                              ? `${m._count.rfqs} RFQ(s)`
                              : "Saved"}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
