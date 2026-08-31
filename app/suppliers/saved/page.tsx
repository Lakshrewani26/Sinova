import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireBuyer } from "@/lib/session";
import { DashboardHeader } from "@/app/dashboard/DashboardHeader";
import { SaveSupplierButton } from "../SaveSupplierButton";

export default async function SavedSuppliersPage() {
  const user = await requireBuyer();

  // Query only suppliers saved by the authenticated user
  const savedSuppliers = await prisma.savedSupplier.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      manufacturer: {
        include: {
          products: {
            include: {
              category: true,
            },
          },
        },
      },
    },
  });

  return (
    <div className="sinova-dashboard-layout">
      <DashboardHeader user={{ name: user.name, email: user.email }} />

      <main className="sinova-dashboard-main">
        <div className="sinova-container">
          {/* Breadcrumbs */}
          <div className="sinova-breadcrumbs">
            <Link href="/dashboard">Dashboard</Link>
            <span className="sinova-breadcrumb-sep">/</span>
            <Link href="/suppliers">Supplier Directory</Link>
            <span className="sinova-breadcrumb-sep">/</span>
            <span className="sinova-breadcrumb-current">Saved Suppliers</span>
          </div>

          {/* Hero Banner */}
          <section className="sinova-welcome-hero" style={{ marginBottom: "24px" }}>
            <div className="sinova-hero-content">
              <span className="sinova-eyebrow">SAVED SUPPLIER WORKSPACE</span>
              <h1 className="sinova-hero-title">Bookmarked Manufacturers ({savedSuppliers.length})</h1>
              <p className="sinova-hero-subtext">
                Manage your bookmarked catalog suppliers, evaluate product lineups, and quickly jump into sourcing briefs.
              </p>
            </div>

            <div className="sinova-hero-actions">
              <Link href="/suppliers" className="sinova-secondary-cta">
                Explore Full Directory
              </Link>
            </div>
          </section>

          {/* Sub-Navigation Tabs */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "28px" }}>
            <Link href="/suppliers" className="sinova-cancel-btn" style={{ fontWeight: 700 }}>
              All Suppliers
            </Link>
            <Link
              href="/suppliers/saved"
              className="sinova-secondary-cta"
              style={{
                backgroundColor: "#082e29",
                color: "#c7ee72",
                borderColor: "#082e29",
                fontWeight: 800,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>✓ Saved Suppliers</span>
              <span className="sinova-nav-badge" style={{ backgroundColor: "rgba(199, 238, 114, 0.2)", color: "#c7ee72" }}>
                {savedSuppliers.length}
              </span>
            </Link>
          </div>

          {/* Content Body */}
          {savedSuppliers.length === 0 ? (
            <div className="sinova-panel-card sinova-empty-state">
              <div className="sinova-empty-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h3>No saved suppliers yet</h3>
              <p>Save manufacturers you want to revisit while sourcing.</p>
              <Link href="/suppliers" className="sinova-primary-cta">
                Explore Suppliers
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {savedSuppliers.map((item) => {
                const m = item.manufacturer;
                // Extract unique category names
                const categories = Array.from(new Set(m.products.map((p) => p.category.name)));
                const saveDate = new Date(item.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });

                return (
                  <div key={item.id} className="sinova-panel-card" style={{ padding: "24px" }}>
                    {/* Header Row */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap", marginBottom: "16px" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                          <span className="sinova-rank-badge gold">SAVED</span>
                          <span style={{ fontSize: "12px", color: "#60706c" }}>Saved on {saveDate}</span>
                        </div>
                        <h2 style={{ fontSize: "20px", fontWeight: 800, margin: "2px 0 4px 0", color: "#122321" }}>
                          {m.name}
                        </h2>
                        <span style={{ fontSize: "13px", color: "#60706c" }}>
                          Location: {m.location || m.country || "China"} • {m.products.length} Catalog Listing{m.products.length === 1 ? "" : "s"}
                        </span>
                      </div>

                      {/* Remove / Unsave Action */}
                      <SaveSupplierButton manufacturerId={m.id} initialIsSaved={true} />
                    </div>

                    {/* Categories Represented */}
                    {categories.length > 0 && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: "#122321" }}>Categories:</span>
                        {categories.map((catName) => (
                          <span key={catName} className="sinova-nav-badge" style={{ backgroundColor: "#eef5f2", color: "#0d5c4c" }}>
                            {catName}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Product Preview Items */}
                    <div style={{ background: "#f6f8f7", border: "1px solid #dce4df", borderRadius: "8px", padding: "14px 18px", marginBottom: "16px" }}>
                      <span style={{ fontSize: "11px", fontFamily: "DM Mono, monospace", color: "#60706c", display: "block", marginBottom: "8px", textTransform: "uppercase" }}>
                        Registered Catalog Products ({m.products.length})
                      </span>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {m.products.map((p) => (
                          <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                            <span style={{ fontWeight: 600, color: "#122321" }}>{p.name}</span>
                            <span style={{ fontWeight: 700, color: "#0d5c4c" }}>
                              ₹{p.unitPriceINR.toLocaleString()} <small style={{ color: "#60706c", fontWeight: 400 }}>(Catalog Price)</small>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div style={{ borderTop: "1px solid #ebf2ef", paddingTop: "14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        {m.products.length > 0 && (
                          <Link
                            href={`/rfqs/new?manufacturerId=${m.id}&productId=${m.products[0].id}`}
                            className="sinova-primary-cta"
                            style={{ fontSize: "12.5px", padding: "8px 14px" }}
                          >
                            Request Quote &rarr;
                          </Link>
                        )}
                        <Link href={`/suppliers/${m.id}`} className="sinova-secondary-cta" style={{ fontSize: "12.5px", padding: "8px 14px" }}>
                          View Profile &rarr;
                        </Link>
                      </div>

                      <Link href="/requirements/new" style={{ fontSize: "12.5px", fontWeight: 700, color: "#0d5c4c", textDecoration: "none" }}>
                        + Create Sourcing Request
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
