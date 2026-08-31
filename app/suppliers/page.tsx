import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireBuyer } from "@/lib/session";
import { DashboardHeader } from "@/app/dashboard/DashboardHeader";
import { SaveSupplierButton } from "./SaveSupplierButton";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    sort?: string;
    page?: string;
  }>;
}

const PAGE_SIZE = 12;

export default async function SuppliersPage({ searchParams }: PageProps) {
  const user = await requireBuyer();
  const params = await searchParams;

  const searchQuery = params.search?.trim() || "";
  const categoryId = params.category || "";
  const sortBy = params.sort || "name_asc";
  const currentPage = Math.max(1, parseInt(params.page || "1", 10) || 1);

  // Build Prisma query filters
  const whereClause: Prisma.ProductWhereInput = {};

  if (searchQuery) {
    whereClause.OR = [
      { name: { contains: searchQuery } },
      { manufacturer: { name: { contains: searchQuery } } },
    ];
  }

  if (categoryId) {
    whereClause.categoryId = categoryId;
  }

  // Build Prisma orderBy
  let orderByClause: Prisma.ProductOrderByWithRelationInput = { name: "asc" };
  if (sortBy === "price_asc") {
    orderByClause = { unitPriceINR: "asc" };
  } else if (sortBy === "price_desc") {
    orderByClause = { unitPriceINR: "desc" };
  } else if (sortBy === "name_desc") {
    orderByClause = { name: "desc" };
  } else if (sortBy === "manufacturer_asc") {
    orderByClause = { manufacturer: { name: "asc" } };
  }

  const skip = (currentPage - 1) * PAGE_SIZE;

  // Execute database queries in parallel
  const [categories, totalCount, products, savedRecords] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.product.count({ where: whereClause }),
    prisma.product.findMany({
      where: whereClause,
      orderBy: orderByClause,
      skip,
      take: PAGE_SIZE,
      include: {
        manufacturer: true,
        category: true,
      },
    }),
    prisma.savedSupplier.findMany({
      where: { userId: user.id },
      select: { manufacturerId: true },
    }),
  ]);

  const savedManufacturerIds = new Set(savedRecords.map((s) => s.manufacturerId));
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

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
          {/* Workspace Header Banner & Tabs */}
          <section className="sinova-welcome-hero" style={{ marginBottom: "24px" }}>
            <div className="sinova-hero-content">
              <span className="sinova-eyebrow">CATALOG DISCOVERY WORKSPACE</span>
              <h1 className="sinova-hero-title">Supplier & Product Directory</h1>
              <p className="sinova-hero-subtext">
                Browse, search, and evaluate 100 catalog manufacturers and product listings imported from the official sourcing catalog.
              </p>
            </div>

            <div className="sinova-hero-actions">
              <Link href="/requirements/new" className="sinova-primary-cta">
                + Create Sourcing Request
              </Link>
            </div>
          </section>

          {/* Sub-Navigation Tabs */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
            <Link
              href="/suppliers"
              className="sinova-secondary-cta"
              style={{
                backgroundColor: "#082e29",
                color: "#c7ee72",
                borderColor: "#082e29",
                fontWeight: 800,
              }}
            >
              All Suppliers ({totalCount})
            </Link>
            <Link
              href="/suppliers/saved"
              className="sinova-cancel-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontWeight: 700,
              }}
            >
              <span>✓ Saved Suppliers</span>
              <span className="sinova-nav-badge" style={{ backgroundColor: "#eef5f2", color: "#0d5c4c" }}>
                {savedRecords.length}
              </span>
            </Link>
          </div>

          {/* Search & Filter Bar */}
          <div className="sinova-panel-card" style={{ marginBottom: "28px" }}>
            <div className="sinova-panel-body" style={{ padding: "20px 24px" }}>
              <form method="GET" action="/suppliers" style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "flex-end" }}>
                {/* Search Input */}
                <div style={{ flex: "1 1 240px", minWidth: "220px" }}>
                  <label htmlFor="search" className="sinova-label" style={{ marginBottom: "6px", display: "block" }}>
                    Search Catalog
                  </label>
                  <input
                    type="text"
                    id="search"
                    name="search"
                    defaultValue={searchQuery}
                    placeholder="Search product or manufacturer..."
                    className="sinova-input"
                  />
                </div>

                {/* Category Filter */}
                <div style={{ flex: "0 1 200px", minWidth: "160px" }}>
                  <label htmlFor="category" className="sinova-label" style={{ marginBottom: "6px", display: "block" }}>
                    Category
                  </label>
                  <div className="sinova-select-wrapper">
                    <select id="category" name="category" defaultValue={categoryId} className="sinova-select">
                      <option value="">All Categories</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <div className="sinova-select-arrow">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Sort Option */}
                <div style={{ flex: "0 1 180px", minWidth: "150px" }}>
                  <label htmlFor="sort" className="sinova-label" style={{ marginBottom: "6px", display: "block" }}>
                    Sort By
                  </label>
                  <div className="sinova-select-wrapper">
                    <select id="sort" name="sort" defaultValue={sortBy} className="sinova-select">
                      <option value="name_asc">Product Name (A-Z)</option>
                      <option value="name_desc">Product Name (Z-A)</option>
                      <option value="price_asc">Price: Low to High</option>
                      <option value="price_desc">Price: High to Low</option>
                      <option value="manufacturer_asc">Manufacturer Name</option>
                    </select>
                    <div className="sinova-select-arrow">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Filter Action Buttons */}
                <div style={{ display: "flex", gap: "10px", flex: "0 0 auto" }}>
                  <button type="submit" className="sinova-primary-cta" style={{ padding: "10px 18px", fontSize: "13px" }}>
                    Apply Filters
                  </button>

                  {(searchQuery || categoryId || sortBy !== "name_asc") && (
                    <Link
                      href="/suppliers"
                      className="sinova-cancel-btn"
                      style={{ padding: "10px 14px", fontSize: "13px", display: "inline-flex", alignItems: "center" }}
                    >
                      Clear
                    </Link>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Results Summary Bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#122321" }}>
              Showing {products.length} of {totalCount} Catalog Product{totalCount === 1 ? "" : "s"}
            </span>
            <span className="sinova-badge-neutral" style={{ fontSize: "11.5px" }}>
              Source Catalog Data
            </span>
          </div>

          {/* Products Grid */}
          {products.length === 0 ? (
            <div className="sinova-panel-card sinova-empty-state">
              <div className="sinova-empty-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <h3>No matching suppliers or products found.</h3>
              <p>Try adjusting your search keywords or clearing category filters.</p>
              <Link href="/suppliers" className="sinova-secondary-cta">
                Clear Filters
              </Link>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                gap: "24px",
                marginBottom: "36px",
              }}
            >
              {products.map((product) => (
                <div
                  key={product.id}
                  className="sinova-panel-card"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    padding: "24px",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div>
                    {/* Header Badges & Save Button */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginBottom: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span className="sinova-nav-badge">{product.category.name}</span>
                      </div>

                      {/* Persistent Save / Unsave Supplier Action */}
                      <SaveSupplierButton
                        manufacturerId={product.manufacturerId}
                        initialIsSaved={savedManufacturerIds.has(product.manufacturerId)}
                      />
                    </div>

                    {/* Product & Manufacturer Titles */}
                    <h3 style={{ fontSize: "17px", fontWeight: 800, margin: "6px 0 4px 0", color: "#122321" }}>
                      {product.name}
                    </h3>
                    <Link
                      href={`/suppliers/${product.manufacturerId}`}
                      style={{ fontSize: "13px", fontWeight: 700, color: "#0d5c4c", textDecoration: "none" }}
                    >
                      {product.manufacturer.name} &rarr;
                    </Link>

                    {/* Catalog Price Block */}
                    <div
                      style={{
                        margin: "16px 0",
                        padding: "12px 14px",
                        background: "#f6f8f7",
                        border: "1px solid #dce4df",
                        borderRadius: "8px",
                      }}
                    >
                      <span style={{ fontSize: "10.5px", fontFamily: "DM Mono, monospace", color: "#60706c", display: "block", textTransform: "uppercase" }}>
                        Catalog / Indicative Price
                      </span>
                      <strong style={{ fontSize: "22px", fontWeight: 800, color: "#082e29" }}>
                        ₹{product.unitPriceINR.toLocaleString()}
                      </strong>
                    </div>

                    {/* Production Specifications & Unprovided Signals */}
                    <div className="sinova-factor-scores" style={{ borderTop: "0", paddingTop: "0", marginBottom: "16px" }}>
                      <div className="sinova-factor-row">
                        <span className="lbl">Factory MOQ:</span>
                        <span className="val-badge neutral">
                          {product.moq ? `${product.moq.toLocaleString()} units` : "Not specified in catalog"}
                        </span>
                      </div>
                      <div className="sinova-factor-row">
                        <span className="lbl">Lead Time:</span>
                        <span className="val-badge neutral">
                          {product.leadTimeDays ? `${product.leadTimeDays} Days` : "Not specified in catalog"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div
                    style={{
                      borderTop: "1px solid #eef2f0",
                      paddingTop: "14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "10px",
                    }}
                  >
                    <Link
                      href={`/suppliers/${product.manufacturerId}`}
                      className="sinova-secondary-cta"
                      style={{ padding: "8px 14px", fontSize: "12.5px" }}
                    >
                      View Supplier Profile
                    </Link>

                    {product.sourceUrl && (
                      <a
                        href={product.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: "12px", fontWeight: 700, color: "#0d5c4c", textDecoration: "none" }}
                      >
                        Catalog Reference &rarr;
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "24px", justifyContent: "center" }}>
              {currentPage > 1 && (
                <Link
                  href={buildPaginationUrl(params, currentPage - 1)}
                  className="sinova-cancel-btn"
                  style={{ padding: "8px 16px", fontSize: "13px" }}
                >
                  &larr; Previous
                </Link>
              )}

              <span style={{ fontSize: "13px", fontWeight: 700, color: "#60706c", padding: "0 12px" }}>
                Page {currentPage} of {totalPages}
              </span>

              {currentPage < totalPages && (
                <Link
                  href={buildPaginationUrl(params, currentPage + 1)}
                  className="sinova-secondary-cta"
                  style={{ padding: "8px 16px", fontSize: "13px" }}
                >
                  Next &rarr;
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function buildPaginationUrl(
  params: { search?: string; category?: string; sort?: string },
  page: number
) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.category) query.set("category", params.category);
  if (params.sort) query.set("sort", params.sort);
  query.set("page", page.toString());
  return `/suppliers?${query.toString()}`;
}
