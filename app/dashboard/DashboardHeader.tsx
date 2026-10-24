"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/auth/actions";

interface DashboardHeaderProps {
  user: {
    name: string;
    email: string;
    role?: string;
    manufacturerId?: string | null;
    manufacturerName?: string | null;
  };
}

interface NavItem {
  label: string;
  href: string;
  active: boolean;
  icon: React.ReactNode;
  badge?: string;
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isSupplier = user.role === "SUPPLIER";

  const initials = user.name
    ? user.name
        .trim()
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "U";

  const navItems: NavItem[] = isSupplier
    ? [
        {
          label: "Supplier RFQ Inbox",
          href: "/supplier/rfqs",
          active: pathname.startsWith("/supplier/rfqs"),
          icon: (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          ),
        },
        ...(user.manufacturerId
          ? [
              {
                label: "Factory Profile",
                href: `/suppliers/${user.manufacturerId}`,
                active: pathname.startsWith(`/suppliers/${user.manufacturerId}`),
                icon: (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                ),
              },
            ]
          : []),
      ]
    : [
        {
          label: "Dashboard",
          href: "/dashboard",
          active: pathname === "/dashboard",
          icon: (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="9" />
              <rect x="14" y="3" width="7" height="5" />
              <rect x="14" y="12" width="7" height="9" />
              <rect x="3" y="16" width="7" height="5" />
            </svg>
          ),
        },
        {
          label: "Requirements",
          href: "/requirements",
          active: pathname.startsWith("/requirements"),
          icon: (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          ),
        },
        {
          label: "Suppliers",
          href: "/suppliers",
          active: pathname.startsWith("/suppliers"),
          icon: (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          ),
        },
        {
          label: "RFQs",
          href: "/rfqs",
          active: pathname.startsWith("/rfqs"),
          icon: (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          ),
        },
        {
          label: "Orders",
          href: "/orders",
          active: pathname.startsWith("/orders"),
          icon: (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
          ),
        },
      ];

  return (
    <header className="sinova-header">
      <div className="sinova-header-container">
        {/* Brand */}
        <Link href={isSupplier ? "/supplier/rfqs" : "/dashboard"} className="sinova-brand">
          <span className="sinova-mark">
            <i />
            <i />
            <i />
          </span>
          <span className="sinova-brand-text">
            SINOVA <em>AI</em>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="sinova-desktop-nav" aria-label="Main Navigation">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`sinova-nav-item ${item.active ? "active" : "inactive"}`}
            >
              <span style={{ display: "inline-flex", opacity: item.active ? 1 : 0.8 }}>{item.icon}</span>
              <span>{item.label}</span>
              {item.badge && <span className="sinova-nav-badge">{item.badge}</span>}
            </Link>
          ))}
        </nav>

        {/* User profile & Logout */}
        <div className="sinova-header-actions">
          {isSupplier && (
            <span
              style={{
                fontSize: "11px",
                fontWeight: 800,
                backgroundColor: "#fef3c7",
                color: "#92400e",
                border: "1px solid #fcd34d",
                padding: "4px 10px",
                borderRadius: "12px",
                marginRight: "4px",
                fontFamily: "DM Mono, monospace",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#d97706" }} />
              SUPPLIER
            </span>
          )}

          <div className="sinova-user-info" title={user.email}>
            <div
              className="sinova-avatar"
              style={
                isSupplier
                  ? { background: "linear-gradient(135deg, #b45309, #78350f)", color: "#ffffff", borderColor: "#f59e0b" }
                  : undefined
              }
            >
              {initials}
              <span
                style={{
                  position: "absolute",
                  bottom: "-1px",
                  right: "-1px",
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "var(--sinova-lime)",
                  border: "1.5px solid var(--sinova-deep)",
                }}
              />
            </div>
            <div className="sinova-user-meta">
              <span className="sinova-user-name">{user.name}</span>
              <span className="sinova-user-email">{user.email}</span>
            </div>
          </div>

          <form action={logoutAction} className="sinova-logout-form">
            <button
              type="submit"
              className="sinova-logout-btn"
              title="Sign out of SINOVA"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Logout</span>
            </button>
          </form>

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="sinova-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileMenuOpen}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {mobileMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile navigation panel */}
      {mobileMenuOpen && (
        <div className="sinova-mobile-menu">
          <nav className="sinova-mobile-nav">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`sinova-mobile-nav-item ${item.active ? "active" : ""}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
                  {item.icon}
                  <span>{item.label}</span>
                </span>
                {item.badge && <span className="sinova-nav-badge">{item.badge}</span>}
              </Link>
            ))}
          </nav>

          <div className="sinova-mobile-user">
            <div className="sinova-user-info">
              <div className="sinova-avatar">{initials}</div>
              <div className="sinova-user-meta">
                <span className="sinova-user-name">{user.name}</span>
                <span className="sinova-user-email">{user.email}</span>
              </div>
            </div>
            <form action={logoutAction}>
              <button type="submit" className="sinova-logout-btn block">
                Logout
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
