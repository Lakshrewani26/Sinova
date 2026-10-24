import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireBuyer } from "@/lib/session";
import { DashboardHeader } from "@/app/dashboard/DashboardHeader";
import { SaveSupplierButton } from "../SaveSupplierButton";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SupplierDetailPage({ params }: PageProps) {
  const user = await requireBuyer();
  const { id } = await params;

  // Resolve manufacturer either by Manufacturer ID or Product ID
  let manufacturer = await prisma.manufacturer.findUnique({
    where: { id },
    include: {
      products: {
        include: { category: true },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!manufacturer) {
    const product = await prisma.product.findUnique({
      where: { id },
      select: { manufacturerId: true },
    });

    if (product) {
      manufacturer = await prisma.manufacturer.findUnique({
        where: { id: product.manufacturerId },
        include: {
          products: {
            include: { category: true },
            orderBy: { name: "asc" },
          },
        },
      });
    }
  }

  if (!manufacturer) {
    notFound();
  }

  // Check if manufacturer is saved by current user
  const savedRecord = await prisma.savedSupplier.findUnique({
    where: {
      userId_manufacturerId: {
        userId: user.id,
        manufacturerId: manufacturer.id,
      },
    },
  });

  const isSaved = !!savedRecord;

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
            <Link href="/suppliers">Supplier Directory</Link>
            <span className="sinova-breadcrumb-sep">/</span>
            <span className="sinova-breadcrumb-current">{manufacturer.name}</span>
          </div>

          {/* Supplier Header Banner */}
          <section className="sinova-welcome-hero" style={{ marginBottom: "28px" }}>
            <div className="sinova-hero-content">
              <span className="sinova-eyebrow">
                MANUFACTURER PROFILE • {manufacturer.country || "China"}
              </span>
              <h1 className="sinova-hero-title">{manufacturer.name}</h1>
              <p className="sinova-hero-subtext">
                Catalog manufacturer with {manufacturer.products.length} registered product listing{manufacturer.products.length === 1 ? "" : "s"}.
              </p>
              <div className="sinova-meta-row">
                <span>
                  <strong>Location:</strong> {manufacturer.location || manufacturer.country || "China"}
                </span>
                <span className="dot">•</span>
                <span>
                  <strong>Catalog Products:</strong> {manufacturer.products.length}
                </span>
              </div>
            </div>

            <div className="sinova-hero-actions" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <SaveSupplierButton manufacturerId={manufacturer.id} initialIsSaved={isSaved} />

              <Link href="/requirements/new" className="sinova-primary-cta">
                + Create Sourcing Request
              </Link>
            </div>
          </section>

          {/* Catalog Products Grid */}
          <div className="sinova-panel-card" style={{ marginBottom: "32px" }}>
            <div className="sinova-panel-header">
              <h2>Catalog Products ({manufacturer.products.length})</h2>
              <span className="sinova-badge-neutral" style={{ fontSize: "11px" }}>
                Manufacturer Catalog Listings
              </span>
            </div>

            <div className="sinova-panel-body">
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {manufacturer.products.map((product) => (
                  <div
                    key={product.id}
                    style={{
                      border: "1px solid #dce4df",
                      borderRadius: "10px",
                      padding: "20px 24px",
                      background: "#ffffff",
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                    }}
                  >
                    {/* Header Row */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                          <span className="sinova-nav-badge">{product.category.name}</span>
                        </div>
                        <h3 style={{ fontSize: "18px", fontWeight: 800, margin: "2px 0 4px 0", color: "#122321" }}>
                          {product.name}
                        </h3>
                        <span style={{ fontSize: "12px", color: "#60706c" }}>
                          Catalog ID: {product.catalogId}
                        </span>
                      </div>

                      {/* Catalog Price Display */}
                      <div
                        style={{
                          padding: "10px 18px",
                          background: "#f6f8f7",
                          border: "1px solid #cbd7d2",
                          borderRadius: "8px",
                          textAlign: "right",
                        }}
                      >
                        <span style={{ fontSize: "10px", fontFamily: "DM Mono, monospace", color: "#60706c", display: "block", textTransform: "uppercase" }}>
                          Catalog / Indicative Price
                        </span>
                        <strong style={{ fontSize: "22px", fontWeight: 800, color: "#0d5c4c" }}>
                          ₹{product.unitPriceINR.toLocaleString()}
                        </strong>
                      </div>
                    </div>

                    {/* Unprovided Signals & Production Metadata */}
                    <div className="sinova-factor-scores">
                      <div className="sinova-factor-row">
                        <span className="lbl">Factory MOQ:</span>
                        <span className="val-badge neutral">
                          {product.moq ? `${product.moq.toLocaleString()} units` : "Not specified in catalog"}
                        </span>
                      </div>
                      <div className="sinova-factor-row">
                        <span className="lbl">Production Lead Time:</span>
                        <span className="val-badge neutral">
                          {product.leadTimeDays ? `${product.leadTimeDays} Days` : "Not specified in catalog"}
                        </span>
                      </div>
                      <div className="sinova-factor-row muted">
                        <span className="lbl">Quality / Reliability Score:</span>
                        <span className="val-badge neutral">Not specified in catalog</span>
                      </div>
                      <div className="sinova-factor-row muted">
                        <span className="lbl">Supplier Verification:</span>
                        <span className="val-badge neutral">Not specified in catalog</span>
                      </div>
                    </div>

                    {/* Footer Links & Actions */}
                    <div
                      style={{
                        borderTop: "1px solid #ebf2ef",
                        paddingTop: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <Link
                          href={`/rfqs/new?manufacturerId=${manufacturer.id}&productId=${product.id}`}
                          className="sinova-primary-cta"
                          style={{ fontSize: "12.5px", padding: "8px 14px" }}
                        >
                          Request Quote &rarr;
                        </Link>
                        <Link
                          href={`/requirements/new`}
                          className="sinova-secondary-cta"
                          style={{ fontSize: "12.5px", padding: "8px 14px" }}
                        >
                          New Brief &rarr;
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Back Button */}
          <div>
            <Link href="/suppliers" className="sinova-cancel-btn">
              &larr; Back to Supplier Directory
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
