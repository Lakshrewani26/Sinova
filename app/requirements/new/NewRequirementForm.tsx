"use client";

import { useState } from "react";
import Link from "next/link";
import { createSourcingRequestAction } from "../actions";

interface CategoryOption {
  id: string;
  name: string;
}

interface NewRequirementFormProps {
  categories: CategoryOption[];
}

export function NewRequirementForm({ categories }: NewRequirementFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(5000);
  const [targetBudget, setTargetBudget] = useState<number>(250);
  const [leadTime, setLeadTime] = useState<number>(30);

  const totalEstBudget = Math.max(0, quantity) * Math.max(0, targetBudget);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await createSourcingRequestAction(formData);
    } catch (err: unknown) {
      // In Next.js Server Actions, redirect throws a NEXT_REDIRECT digest error which should be rethrown
      if (err && typeof err === "object" && "digest" in err && typeof (err as { digest: string }).digest === "string" && (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")) {
        throw err;
      }
      setErrorMsg(err instanceof Error ? err.message : "Failed to create sourcing request. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <form action={handleSubmit} className="sinova-request-form">
      {errorMsg && (
        <div className="sinova-form-alert" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Request Title */}
      <div className="sinova-form-group">
        <label htmlFor="title" className="sinova-label">
          Request Title <span className="sinova-required">*</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          required
          className="sinova-input"
          placeholder="e.g. 5,000 Stainless Steel Water Bottles with Custom Logo"
          defaultValue="5,000 Stainless Steel Water Bottles with Custom Logo"
          disabled={isSubmitting}
        />
        <span className="sinova-helper-text">
          Descriptive title for your product brief or manufacturing requirement.
        </span>
      </div>

      {/* 2-Column Grid Row 1 */}
      <div className="sinova-form-grid-2">
        <div className="sinova-form-group">
          <label htmlFor="categoryId" className="sinova-label">
            Manufacturing Category <span className="sinova-required">*</span>
          </label>
          <div className="sinova-select-wrapper">
            <select
              id="categoryId"
              name="categoryId"
              required
              className="sinova-select"
              defaultValue={categories.find((c) => c.name.includes("Kitchen"))?.id || categories[0]?.id}
              disabled={isSubmitting}
            >
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

        <div className="sinova-form-group">
          <label htmlFor="quantity" className="sinova-label">
            Order Quantity (Units) <span className="sinova-required">*</span>
          </label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            required
            min="1"
            className="sinova-input"
            value={quantity || ""}
            onChange={(e) => setQuantity(Number(e.target.value))}
            placeholder="e.g. 5000"
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* 2-Column Grid Row 2 */}
      <div className="sinova-form-grid-2">
        <div className="sinova-form-group">
          <label htmlFor="targetBudgetINR" className="sinova-label">
            Target Unit Budget (₹ INR) <span className="sinova-required">*</span>
          </label>
          <div className="sinova-input-prefix-wrapper">
            <span className="sinova-input-prefix">₹</span>
            <input
              type="number"
              id="targetBudgetINR"
              name="targetBudgetINR"
              required
              step="0.01"
              className="sinova-input prefixed"
              value={targetBudget || ""}
              onChange={(e) => setTargetBudget(Number(e.target.value))}
              placeholder="e.g. 250"
              disabled={isSubmitting}
            />
          </div>
          <span className="sinova-helper-text">
            Target landed cost per unit delivered in India.
          </span>
        </div>

        <div className="sinova-form-group">
          <label htmlFor="maxLeadTimeDays" className="sinova-label">
            Max Lead Time (Days)
          </label>
          <input
            type="number"
            id="maxLeadTimeDays"
            name="maxLeadTimeDays"
            className="sinova-input"
            value={leadTime || ""}
            onChange={(e) => setLeadTime(Number(e.target.value))}
            placeholder="e.g. 30"
            disabled={isSubmitting}
          />
          {/* Quick Preset Chips for Lead Time */}
          <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
            {[15, 30, 45, 60].map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setLeadTime(days)}
                style={{
                  background: leadTime === days ? "var(--sinova-green)" : "var(--sinova-mint)",
                  color: leadTime === days ? "var(--sinova-lime)" : "var(--sinova-green)",
                  border: `1px solid ${leadTime === days ? "var(--sinova-green)" : "#b7dcce"}`,
                  borderRadius: "20px",
                  padding: "4px 12px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s var(--sinova-ease)",
                }}
              >
                {days} Days
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Live Budget Calculator Widget */}
      <div
        style={{
          background: "linear-gradient(135deg, #eef5f2 0%, #e2efe9 100%)",
          border: "1.5px solid #a4d3c3",
          borderRadius: "12px",
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          boxShadow: "0 2px 8px rgba(13, 92, 76, 0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "var(--sinova-green)",
              color: "var(--sinova-lime)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              fontWeight: 800,
            }}
          >
            ₹
          </div>
          <div>
            <span style={{ fontSize: "11px", fontFamily: "DM Mono, monospace", color: "var(--sinova-green)", fontWeight: 700, textTransform: "uppercase", display: "block" }}>
              Live Calculated Budget
            </span>
            <span style={{ fontSize: "13px", color: "#37524a" }}>
              {quantity.toLocaleString()} units &times; ₹{targetBudget.toLocaleString()} / unit
            </span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: "11px", color: "#60706c", display: "block", textTransform: "uppercase" }}>
            Total Est. Commitment
          </span>
          <strong style={{ fontSize: "20px", fontWeight: 800, color: "var(--sinova-deep)" }}>
            ₹{totalEstBudget.toLocaleString("en-IN")}
          </strong>
        </div>
      </div>

      {/* Technical Specifications Textarea */}
      <div className="sinova-form-group">
        <label htmlFor="specifications" className="sinova-label">
          Technical Specifications & Requirements
        </label>
        <textarea
          id="specifications"
          name="specifications"
          rows={4}
          className="sinova-textarea"
          placeholder="Describe material grades, lid style, custom logo printing, packaging requirements, target delivery location, etc."
          defaultValue="Need 5,000 stainless steel water bottles (500ml) with custom laser-engraved logo, food-grade 304 steel, double-wall vacuum insulation, delivered to Mumbai."
          disabled={isSubmitting}
        />
      </div>

      {/* Form Action Buttons */}
      <div className="sinova-form-actions">
        <Link href="/dashboard" className="sinova-cancel-btn">
          Cancel
        </Link>
        <button
          type="submit"
          className="sinova-submit-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <svg className="sinova-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="10" />
              </svg>
              <span>Running AI Matching Engine...</span>
            </>
          ) : (
            <>
              <span>Run AI Matching & Calculate Scores</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
