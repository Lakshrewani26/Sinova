import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireBuyer } from "@/lib/session";
import { DashboardHeader } from "@/app/dashboard/DashboardHeader";
import { runMatchingEngineForRequest } from "@/lib/matchingEngine";
import { LandedCostInfoModal } from "./LandedCostInfoModal";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RequirementDetailsPage({ params }: PageProps) {
  const user = await requireBuyer();
  const { id } = await params;

  let request = await prisma.sourcingRequest.findFirst({
    where: { id, userId: user.id },
    include: {
      category: true,
      matches: {
        include: {
          manufacturer: true,
          product: true,
        },
        orderBy: { sinovaScore: "desc" },
      },
    },
  });

  if (!request) {
    notFound();
  }

  // If no matches populated yet, trigger matching engine dynamically
  if (request.matches.length === 0) {
    await runMatchingEngineForRequest(request.id);
    request = (await prisma.sourcingRequest.findFirst({
      where: { id, userId: user.id },
      include: {
        category: true,
        matches: {
          include: {
            manufacturer: true,
            product: true,
          },
          orderBy: { sinovaScore: "desc" },
        },
      },
    }))!;
  }

  const topMatch = request.matches[0];

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
          {/* Breadcrumb Navigation */}
          <div className="sinova-breadcrumbs">
            <Link href="/dashboard">Dashboard</Link>
            <span className="sinova-breadcrumb-sep">/</span>
            <Link href="/requirements">Sourcing Requests</Link>
            <span className="sinova-breadcrumb-sep">/</span>
            <span className="sinova-breadcrumb-current">{request.title}</span>
          </div>

          {/* Request Header Banner */}
          <section className="sinova-welcome-hero" style={{ marginBottom: "28px" }}>
            <div className="sinova-hero-content">
              <span className="sinova-eyebrow">
                ● {request.category.name} — MATCH COMPLETE
              </span>
              <h1 className="sinova-hero-title">{request.title}</h1>
              <div className="sinova-meta-row">
                <span>
                  <strong>Quantity:</strong> {request.quantity.toLocaleString()} units
                </span>
                <span className="dot">•</span>
                <span>
                  <strong>Target Budget:</strong> ₹{request.targetBudgetINR}/unit
                </span>
                <span className="dot">•</span>
                <span>
                  <strong>Max Lead Time:</strong> {request.maxLeadTimeDays} days
                </span>
              </div>
            </div>

            <div className="sinova-hero-actions">
              <Link href="/requirements/new" className="sinova-secondary-cta">
                + New Sourcing Request
              </Link>
            </div>
          </section>

          {/* AI Match Overview Banner */}
          {topMatch && (
            <div className="sinova-top-recommendation-card">
              <div className="sinova-recommendation-info">
                <div className="sinova-recommendation-tag">
                  ★ BEST CATALOG PRICE FIT
                </div>
                <h3 className="sinova-recommendation-title">
                  {topMatch.manufacturer.name}
                </h3>
                <p className="sinova-recommendation-sub">
                  {topMatch.product.name} • {topMatch.manufacturer.country}
                </p>

                <div className="sinova-recommendation-disclaimer">
                  ℹ Score based on catalog price & target budget. Quality, lead time, and MOQ are not specified in the catalog.
                </div>
              </div>

              <div className="sinova-recommendation-stats">
                <div className="sinova-recommendation-landed">
                  <span className="label">ESTIMATED LANDED COST</span>
                  <strong className="amount">
                    ₹{topMatch.estimatedLandedCost.toLocaleString()}
                  </strong>
                  <span className="unit">/unit in India</span>
                </div>

                <div className="sinova-score-badge-circle">
                  <span className="score-num">{topMatch.sinovaScore}</span>
                  <span className="score-lbl">SCORE</span>
                </div>
              </div>
            </div>
          )}

          {/* Supplier Comparison Grid */}
          <div className="sinova-content-grid" style={{ gridTemplateColumns: "1.8fr 1fr", gap: "28px" }}>
            {/* Left Column: Matched Suppliers List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h2 style={{ fontSize: "20px", fontWeight: 800, margin: 0, color: "#122321" }}>
                  Matched Manufacturers ({request.matches.length})
                </h2>
                <span className="sinova-badge-neutral" style={{ fontSize: "11px" }}>
                  Catalog Search Results
                </span>
              </div>

              {request.matches.length === 0 ? (
                <div className="sinova-panel-card sinova-empty-state">
                  <div className="sinova-empty-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </div>
                  <h3>No catalog matches found.</h3>
                  <p>No manufacturers currently match the selected specifications or category in the imported catalog.</p>
                  <Link href="/requirements/new" className="sinova-secondary-cta">
                    + Create Another Sourcing Request
                  </Link>
                </div>
              ) : (
                request.matches.map((match, idx) => {
                  const isRankOne = idx === 0;

                  return (
                    <div
                      key={match.id}
                      className={`sinova-panel-card sinova-supplier-card ${isRankOne ? "rank-one" : ""}`}
                    >
                      {/* Header Row */}
                      <div className="sinova-supplier-card-header">
                        <div>
                          <div className="sinova-supplier-badges">
                            <span className={`sinova-rank-badge ${isRankOne ? "gold" : ""}`}>
                              RANK #{idx + 1}
                            </span>
                          </div>

                          <h3 className="sinova-supplier-name">
                            {match.manufacturer.name}
                          </h3>
                          <p className="sinova-supplier-product">
                            {match.product.name}
                          </p>
                        </div>

                        {/* SINOVA Score Container */}
                        <div className="sinova-score-box">
                          <span className="lbl">SINOVA SCORE</span>
                          <strong className="val">{match.sinovaScore}</strong>
                          <span className="sub">/100</span>
                        </div>
                      </div>

                      {/* Financial & Production Metrics */}
                      <div className="sinova-metrics-grid-4">
                        <div className="sinova-metric-cell">
                          <span className="lbl">Catalog / Indicative Price</span>
                          <strong className="val">₹{match.product.unitPriceINR.toLocaleString()}</strong>
                        </div>
                        <div className="sinova-metric-cell highlight">
                          <span className="lbl">Estimated Landed Cost</span>
                          <strong className="val green">₹{match.estimatedLandedCost.toLocaleString()}</strong>
                        </div>
                        <div className="sinova-metric-cell">
                          <span className="lbl">Factory MOQ</span>
                          <strong className="val muted">
                            {match.product.moq ? match.product.moq.toLocaleString() : "Not specified"}
                          </strong>
                        </div>
                        <div className="sinova-metric-cell">
                          <span className="lbl">Lead Time</span>
                          <strong className="val muted">
                            {match.product.leadTimeDays ? `${match.product.leadTimeDays} Days` : "Not specified"}
                          </strong>
                        </div>
                      </div>

                      {/* Landed Cost Breakdown Expander */}
                      <div style={{ marginBottom: "16px" }}>
                        <LandedCostInfoModal
                          unitPriceINR={match.product.unitPriceINR}
                          quantity={request.quantity}
                          estimatedLandedCost={match.estimatedLandedCost}
                        />
                      </div>

                      {/* Honest Factor Scores Breakdown */}
                      <div className="sinova-factor-scores">
                        <div className="sinova-factor-row">
                          <span className="lbl">Price Fit (vs ₹{request.targetBudgetINR} target):</span>
                          <span className="val-badge green">{match.priceFitScore}/100</span>
                        </div>
                        <div className="sinova-factor-row muted">
                          <span className="lbl">Quality Signal:</span>
                          <span className="val-badge neutral">Not specified in catalog</span>
                        </div>
                        <div className="sinova-factor-row muted">
                          <span className="lbl">MOQ Fit:</span>
                          <span className="val-badge neutral">Not specified in catalog</span>
                        </div>
                        <div className="sinova-factor-row muted">
                          <span className="lbl">Lead Time:</span>
                          <span className="val-badge neutral">Not specified in catalog</span>
                        </div>
                      </div>

                      {/* Action Links & RFQ CTA */}
                      <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid #eef2f0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                        <Link
                          href={`/rfqs/new?manufacturerId=${match.manufacturerId}&productId=${match.productId}&sourcingRequestId=${request.id}`}
                          className={isRankOne ? "sinova-primary-cta" : "sinova-secondary-cta"}
                          style={{ padding: "9px 18px", fontSize: "13px" }}
                        >
                          Request Quote &rarr;
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right Column: Brief Details & Side-by-Side Comparison Matrix */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div className="sinova-panel-card">
                <div className="sinova-panel-header">
                  <h2>Sourcing Brief Details</h2>
                </div>
                <div className="sinova-panel-body">
                  <div className="sinova-user-summary" style={{ marginBottom: "16px" }}>
                    <div className="sinova-summary-row">
                      <span className="sinova-summary-key">Category:</span>
                      <span className="sinova-summary-val">{request.category.name}</span>
                    </div>
                    <div className="sinova-summary-row">
                      <span className="sinova-summary-key">Requested Units:</span>
                      <span className="sinova-summary-val">{request.quantity.toLocaleString()}</span>
                    </div>
                    <div className="sinova-summary-row">
                      <span className="sinova-summary-key">Target Budget:</span>
                      <span className="sinova-summary-val">₹{request.targetBudgetINR} / unit</span>
                    </div>
                    <div className="sinova-summary-row">
                      <span className="sinova-summary-key">Max Lead Time:</span>
                      <span className="sinova-summary-val">{request.maxLeadTimeDays} Days</span>
                    </div>
                  </div>

                  {request.specifications && (
                    <div>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "#122321", display: "block", marginBottom: "6px" }}>
                        Specified Requirements:
                      </span>
                      <p style={{ fontSize: "12.5px", color: "#60706c", background: "#f6f8f7", padding: "12px", borderRadius: "6px", margin: 0 }}>
                        {request.specifications}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Side-by-Side Comparison Table Card */}
              <div className="sinova-panel-card">
                <div className="sinova-panel-header">
                  <h2>Supplier Comparison Matrix</h2>
                </div>
                <div className="sinova-panel-body" style={{ padding: "0" }}>
                  <div className="sinova-table-wrapper">
                    <table className="sinova-comparison-table">
                      <thead>
                        <tr>
                          <th>Supplier</th>
                          <th>Catalog Price</th>
                          <th>Est. Landed</th>
                          <th>Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {request.matches.map((m) => (
                          <tr key={m.id}>
                            <td className="supplier-name-cell">
                              <strong>{m.manufacturer.name}</strong>
                              <small>{m.product.name}</small>
                            </td>
                            <td>₹{m.product.unitPriceINR.toLocaleString()}</td>
                            <td className="green-cost">₹{m.estimatedLandedCost.toLocaleString()}</td>
                            <td className="score-cell">
                              <span className="score-pill">{m.sinovaScore}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
