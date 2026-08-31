import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireBuyer } from "@/lib/session";
import { DashboardHeader } from "@/app/dashboard/DashboardHeader";

export default async function RequirementsListPage() {
  const user = await requireBuyer();

  const requests = await prisma.sourcingRequest.findMany({
    where: { userId: user.id },
    include: {
      category: true,
      matches: {
        orderBy: { sinovaScore: "desc" },
        take: 1,
        include: { manufacturer: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="sinova-dashboard-layout">
      <DashboardHeader user={{ name: user.name, email: user.email }} />

      <main className="sinova-dashboard-main">
        <div className="sinova-container">
          <div className="sinova-welcome-hero" style={{ marginBottom: "28px" }}>
            <div className="sinova-hero-content">
              <span className="sinova-eyebrow">SOURCING REQUIREMENTS</span>
              <h1 className="sinova-hero-title">Your Sourcing Requests</h1>
              <p className="sinova-hero-subtext">
                Manage your active briefs, evaluate AI matched manufacturers, and compare quotes.
              </p>
            </div>

            <div className="sinova-hero-actions">
              <Link href="/requirements/new" className="sinova-primary-cta">
                + New Sourcing Request
              </Link>
            </div>
          </div>

          <div className="sinova-panel-card">
            <div className="sinova-panel-header">
              <h2>All Requests ({requests.length})</h2>
            </div>
            <div className="sinova-panel-body">
              {requests.length === 0 ? (
                <div className="sinova-empty-state">
                  <div className="sinova-empty-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <h3>No sourcing requests yet.</h3>
                  <p>Create your first sourcing brief to start getting matched with verified manufacturers.</p>
                  <Link href="/requirements/new" className="sinova-secondary-cta">
                    + New Sourcing Request
                  </Link>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {requests.map((req) => {
                    const topMatch = req.matches[0];
                    return (
                      <Link
                        key={req.id}
                        href={`/requirements/${req.id}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "20px",
                          border: "1px solid #dce4df",
                          borderRadius: "10px",
                          background: "#ffffff",
                          textDecoration: "none",
                          color: "inherit",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                            <span className="sinova-nav-badge">{req.category.name}</span>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                color: "#0d5c4c",
                                background: "#eef5f2",
                                padding: "2px 8px",
                                borderRadius: "10px",
                              }}
                            >
                              {req.status}
                            </span>
                          </div>
                          <h3 style={{ fontSize: "17px", fontWeight: 800, margin: "4px 0", color: "#122321" }}>
                            {req.title}
                          </h3>
                          <p style={{ margin: 0, fontSize: "13px", color: "#60706c" }}>
                            Quantity: {req.quantity.toLocaleString()} units • Budget: ₹{req.targetBudgetINR}/unit • Created{" "}
                            {new Date(req.createdAt).toLocaleDateString()}
                          </p>
                        </div>

                        {topMatch && (
                          <div style={{ textAlign: "right", display: "flex", alignItems: "center", gap: "16px" }}>
                            <div>
                              <span style={{ fontSize: "11px", color: "#60706c", display: "block" }}>Top Match</span>
                              <strong style={{ fontSize: "14px", color: "#122321" }}>{topMatch.manufacturer.name.split(" ")[0]}</strong>
                            </div>
                            <div
                              style={{
                                padding: "8px 12px",
                                background: "#082e29",
                                color: "#c7ee72",
                                borderRadius: "8px",
                                fontWeight: 800,
                                fontSize: "16px",
                              }}
                            >
                              {topMatch.sinovaScore}
                            </div>
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
