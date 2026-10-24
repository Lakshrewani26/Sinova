"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { loginAction, signupAction } from "@/app/auth/actions";
import type { AuthResult } from "@/lib/validation";

const initialState: AuthResult = {};

type AuthFormProps =
  | {
      mode: "login";
    }
  | {
      mode: "signup";
      manufacturers?: { id: string; name: string }[];
    };

export function AuthForm(props: AuthFormProps) {
  const { mode } = props;
  const isSignup = mode === "signup";
  const manufacturers = isSignup ? props.manufacturers : undefined;

  const action = isSignup ? signupAction : loginAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  // Interactive Form State
  const [role, setRole] = useState<"BUYER" | "SUPPLIER">("BUYER");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState<string | null>(null);

  // Quick fill demo helper
  function handleSelectDemo(demoEmail: string, demoLabel: string) {
    setEmail(demoEmail);
    setPassword("Password123!");
    setSelectedDemo(demoLabel);
  }

  return (
    <form className="auth-form" action={formAction} noValidate>
      {state.error ? (
        <div className="auth-alert" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{state.error}</span>
        </div>
      ) : null}

      {isSignup ? (
        <>
          {/* Creative Segmented Role Selector */}
          <div>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--sinova-ink)", display: "block", marginBottom: "8px" }}>
              Select Account Type
            </span>
            <input type="hidden" name="role" value={role} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
              <button
                type="button"
                onClick={() => setRole("BUYER")}
                style={{
                  padding: "12px 14px",
                  borderRadius: "10px",
                  border: role === "BUYER" ? "2px solid var(--sinova-green)" : "1.5px solid #cad7d1",
                  background: role === "BUYER" ? "#eef5f2" : "#ffffff",
                  color: role === "BUYER" ? "var(--sinova-deep)" : "var(--sinova-muted)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s ease",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 800, fontSize: "13.5px" }}>🛍️ Buyer</span>
                  {role === "BUYER" && (
                    <span style={{ fontSize: "10px", fontWeight: 800, background: "var(--sinova-green)", color: "#ffffff", padding: "1px 6px", borderRadius: "10px" }}>
                      Selected
                    </span>
                  )}
                </div>
                <span style={{ fontSize: "11px", color: "var(--sinova-muted)", lineHeight: 1.3 }}>
                  Source products, match factories & issue RFQs
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRole("SUPPLIER")}
                style={{
                  padding: "12px 14px",
                  borderRadius: "10px",
                  border: role === "SUPPLIER" ? "2px solid var(--sinova-green)" : "1.5px solid #cad7d1",
                  background: role === "SUPPLIER" ? "#eef5f2" : "#ffffff",
                  color: role === "SUPPLIER" ? "var(--sinova-deep)" : "var(--sinova-muted)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s ease",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 800, fontSize: "13.5px" }}>🏭 Supplier</span>
                  {role === "SUPPLIER" && (
                    <span style={{ fontSize: "10px", fontWeight: 800, background: "var(--sinova-green)", color: "#ffffff", padding: "1px 6px", borderRadius: "10px" }}>
                      Selected
                    </span>
                  )}
                </div>
                <span style={{ fontSize: "11px", color: "var(--sinova-muted)", lineHeight: 1.3 }}>
                  Receive buyer RFQs & submit quotations
                </span>
              </button>
            </div>
          </div>

          {role === "SUPPLIER" ? (
            <label>
              <span className="auth-label-text">
                Associated Manufacturer / Factory <span className="sinova-required">*</span>
              </span>
              <div className="sinova-select-wrapper">
                <select
                  name="manufacturerId"
                  required
                  defaultValue=""
                  style={{
                    fontFamily: "inherit",
                    fontSize: "14px",
                    padding: "11px 14px",
                    border: "1.5px solid #cbd7d2",
                    borderRadius: "8px",
                    backgroundColor: "#ffffff",
                    color: "var(--sinova-ink)",
                    width: "100%",
                  }}
                >
                  <option value="" disabled>
                    Select your factory...
                  </option>
                  {manufacturers?.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <div className="sinova-select-arrow">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>
              {state.fieldErrors?.manufacturerId ? (
                <span className="auth-error-msg">{state.fieldErrors.manufacturerId}</span>
              ) : null}
            </label>
          ) : null}

          <label>
            <span className="auth-label-text">
              Full Name <span className="sinova-required">*</span>
            </span>
            <input
              autoComplete="name"
              name="name"
              placeholder="e.g. Rahul Sharma"
              required
              type="text"
            />
            {state.fieldErrors?.name ? (
              <span className="auth-error-msg">{state.fieldErrors.name}</span>
            ) : null}
          </label>
        </>
      ) : null}

      <label>
        <span className="auth-label-text">
          Work Email <span className="sinova-required">*</span>
        </span>
        <input
          autoComplete="email"
          name="email"
          placeholder="you@company.com"
          required
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setSelectedDemo(null);
          }}
        />
        {state.fieldErrors?.email ? <span className="auth-error-msg">{state.fieldErrors.email}</span> : null}
      </label>

      <label>
        <span className="auth-label-text">
          Password <span className="sinova-required">*</span>
        </span>
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <input
            autoComplete={isSignup ? "new-password" : "current-password"}
            name="password"
            placeholder="At least 8 characters"
            required
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setSelectedDemo(null);
            }}
            style={{ paddingRight: "42px" }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: "absolute",
              right: "12px",
              background: "transparent",
              border: 0,
              color: "var(--sinova-muted)",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
        {state.fieldErrors?.password ? (
          <span className="auth-error-msg">{state.fieldErrors.password}</span>
        ) : null}
      </label>

      {isSignup ? (
        <label>
          <span className="auth-label-text">
            Confirm Password <span className="sinova-required">*</span>
          </span>
          <input
            autoComplete="new-password"
            name="confirmPassword"
            placeholder="Repeat your password"
            required
            type={showPassword ? "text" : "password"}
          />
          {state.fieldErrors?.confirmPassword ? (
            <span className="auth-error-msg">{state.fieldErrors.confirmPassword}</span>
          ) : null}
        </label>
      ) : null}

      <button className="auth-button" disabled={pending} type="submit">
        {pending ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
            <svg className="sinova-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="10" />
            </svg>
            <span>Please wait...</span>
          </span>
        ) : isSignup ? (
          role === "SUPPLIER" ? "Sign up as Supplier →" : "Create Buyer Account →"
        ) : (
          "Sign In to SINOVA →"
        )}
      </button>

      <p className="auth-switch">
        {isSignup ? "Already have an account?" : "New to SINOVA?"}{" "}
        <Link href={isSignup ? "/login" : "/signup"}>
          {isSignup ? "Sign in" : "Create an account"}
        </Link>
      </p>

      {!isSignup ? (
        <>
          <p className="auth-switch small-link">
            <Link href="/forgot-password">Forgot password?</Link>
          </p>

          {/* Interactive One-Click Demo Credentials Switcher */}
          <div className="sinova-demo-chips-container">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{ fontSize: "11.5px", fontFamily: "DM Mono, monospace", fontWeight: 700, color: "var(--sinova-green)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                1-Click Demo Login
              </span>
              {selectedDemo && (
                <span style={{ fontSize: "10.5px", background: "var(--sinova-green)", color: "var(--sinova-lime)", padding: "2px 7px", borderRadius: "10px", fontWeight: 700 }}>
                  ✓ Filled {selectedDemo}
                </span>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <button
                type="button"
                className={`sinova-demo-chip-btn ${selectedDemo === "Buyer" ? "active" : ""}`}
                onClick={() => handleSelectDemo("buyer@sinova.demo", "Buyer")}
              >
                <span><strong>👤 Demo Buyer</strong> (buyer@sinova.demo)</span>
                <span style={{ color: "var(--sinova-green)", fontWeight: 700 }}>Use &rarr;</span>
              </button>

              <button
                type="button"
                className={`sinova-demo-chip-btn ${selectedDemo === "Zhejiang" ? "active" : ""}`}
                onClick={() => handleSelectDemo("supplier.zhejiang@sinova.demo", "Zhejiang")}
              >
                <span><strong>🏭 Zhejiang Kitchen Supplier</strong> (supplier.zhejiang@...)</span>
                <span style={{ color: "var(--sinova-green)", fontWeight: 700 }}>Use &rarr;</span>
              </button>

              <button
                type="button"
                className={`sinova-demo-chip-btn ${selectedDemo === "Chengdu" ? "active" : ""}`}
                onClick={() => handleSelectDemo("supplier.chengdu@sinova.demo", "Chengdu")}
              >
                <span><strong>🏭 Chengdu Haizhuobote</strong> (supplier.chengdu@...)</span>
                <span style={{ color: "var(--sinova-green)", fontWeight: 700 }}>Use &rarr;</span>
              </button>
            </div>

            <div style={{ marginTop: "8px", fontSize: "11px", color: "var(--sinova-muted)", textAlign: "center" }}>
              Password for all accounts: <code>Password123!</code>
            </div>
          </div>
        </>
      ) : null}
    </form>
  );
}
