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

export default async function OrdersListPage({ searchParams }: PageProps) {
  const user = await requireBuyer();
  const params = await searchParams;

  const statusFilter = params.status || "ALL";

  // Strict user isolation filter
  const whereClause: Prisma.OrderWhereInput = {
    userId: user.id,
  };

  if (statusFilter === "ACTIVE") {
    whereClause.status = {
      in: ["ORDER_CREATED", "SUPPLIER_CONFIRMED", "IN_PRODUCTION", "READY_TO_SHIP"],
    };
  } else if (statusFilter === "COMPLETED") {
    whereClause.status = "COMPLETED";
  } else if (statusFilter === "CANCELLED") {
    whereClause.status = "CANCELLED";
  }

  // Query user orders and total count
  const [orders, totalUserOrders] = await Promise.all([
    prisma.order.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        manufacturer: true,
        product: {
          include: { category: true },
        },
        statusHistory: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
    prisma.order.count({
      where: { userId: user.id },
    }),
  ]);

  const filterTabs = [
    { label: "All", value: "ALL" },
    { label: "Active", value: "ACTIVE" },
    { label: "Completed", value: "COMPLETED" },
    { label: "Cancelled", value: "CANCELLED" },
  ];

  return (
    <div className="sinova-dashboard-layout">
      <DashboardHeader user={{ name: user.name, email: user.email }} />

      <main className="sinova-dashboard-main">
        <div className="sinova-container">
          {/* Hero Banner */}
          <section className="sinova-welcome-hero" style={{ marginBottom: "24px" }}>
            <div className="sinova-hero-content">
              <span className="sinova-eyebrow">ORDER MANAGEMENT WORKSPACE</span>
              <h1 className="sinova-hero-title">Procurement Orders ({orders.length})</h1>
              <p className="sinova-hero-subtext">
                Manage your internal procurement orders and track production milestones.
              </p>
            </div>

            <div className="sinova-hero-actions">
              <Link href="/rfqs" className="sinova-primary-cta">
                View RFQs
              </Link>
            </div>
          </section>

          {/* Status Filter Tabs */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "24px", overflowX: "auto", paddingBottom: "4px" }}>
            {filterTabs.map((tab) => {
              const isActive = statusFilter === tab.value;
              return (
                <Link
                  key={tab.value}
                  href={tab.value === "ALL" ? "/orders" : `/orders?status=${tab.value}`}
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

          {/* Orders List Grid */}
          {orders.length === 0 ? (
            <div className="sinova-panel-card sinova-empty-state">
              <div className="sinova-empty-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                </svg>
              </div>
              <h3>No procurement orders yet</h3>
              <p>
                {totalUserOrders === 0
                  ? "Accept a supplier quotation from an RFQ to create your first internal procurement order."
                  : "No orders match the selected status filter."}
              </p>
              <Link href="/rfqs" className="sinova-primary-cta">
                View RFQs
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {orders.map((order) => {
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

                const isCompleted = order.status === "COMPLETED";
                const isCancelled = order.status === "CANCELLED";

                return (
                  <div
                    key={order.id}
                    className="sinova-panel-card sinova-stat-card"
                    style={{
                      padding: "20px 24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "20px",
                      flexWrap: "wrap",
                      borderLeft: isCompleted
                        ? "4px solid var(--sinova-lime)"
                        : isCancelled
                        ? "4px solid #c92a2a"
                        : "4px solid var(--sinova-green)",
                      transition: "all 0.2s var(--sinova-ease)",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                        <span className="sinova-nav-badge" style={{ backgroundColor: "var(--sinova-mint)", color: "var(--sinova-green)", border: "1px solid #b7dcce" }}>
                          {order.product.category.name}
                        </span>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 800,
                            backgroundColor: isCompleted ? "var(--sinova-deep)" : isCancelled ? "#fcf2f2" : "var(--sinova-mint)",
                            color: isCompleted ? "var(--sinova-lime)" : isCancelled ? "#c92a2a" : "var(--sinova-green)",
                            padding: "3px 10px",
                            borderRadius: "12px",
                            border: isCompleted ? "none" : isCancelled ? "1px solid #f5c2c2" : "1px solid #b7dcce",
                          }}
                        >
                          {order.status}
                        </span>
                        <span style={{ fontSize: "11.5px", color: "#60706c" }}>Last Activity: {lastActivityDate}</span>
                      </div>

                      <h3 style={{ fontSize: "17px", fontWeight: 800, margin: "2px 0", color: "var(--sinova-ink)" }}>
                        {order.orderNumber} • {order.product.name}
                      </h3>
                      <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#60706c" }}>
                        Supplier: <strong style={{ color: "var(--sinova-ink)" }}>{order.manufacturer.name}</strong> • {order.quantity.toLocaleString()} units • Total: <strong style={{ color: "var(--sinova-deep)" }}>₹{order.totalAmount.toLocaleString()}</strong>
                      </p>
                    </div>

                    <div>
                      <Link
                        href={`/orders/${order.id}`}
                        className="sinova-secondary-cta"
                        style={{ padding: "10px 18px", fontSize: "13px" }}
                      >
                        View Order &rarr;
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
