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

  const navItems = isSupplier
    ? [
        { label: "Supplier RFQ Inbox", href: "/supplier/rfqs", active: pathname.startsWith("/supplier/rfqs") },
        ...(user.manufacturerId
          ? [{ label: "My Manufacturer Profile", href: `/suppliers/${user.manufacturerId}`, active: pathname.startsWith(`/suppliers/${user.manufacturerId}`) }]
          : []),
      ]
    : [
        { label: "Dashboard", href: "/dashboard", active: pathname === "/dashboard" },
        { label: "Requirements", href: "/requirements", active: pathname.startsWith("/requirements") },
        { label: "Suppliers", href: "/suppliers", active: pathname.startsWith("/suppliers") },
        { label: "RFQs", href: "/rfqs", active: pathname.startsWith("/rfqs") },
        { label: "Orders", href: "/orders", active: pathname.startsWith("/orders") },
        { label: "Messages", href: "/dashboard#messages", active: false, badge: "Soon" },
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
              {item.label}
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
              }}
            >
              DEMO SUPPLIER
            </span>
          )}

          <div className="sinova-user-info">
            <div className="sinova-avatar" style={isSupplier ? { backgroundColor: "#92400e", color: "#ffffff" } : undefined}>
              {initials}
            </div>
            <div className="sinova-user-meta">
              <span className="sinova-user-name">{user.name}</span>
              <span className="sinova-user-email">{user.email}</span>
            </div>
          </div>

          <form action={logoutAction} className="sinova-logout-form">
            <button type="submit" className="sinova-logout-btn">
              Logout
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
                <span>{item.label}</span>
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
