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
            defaultValue="5000"
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
              defaultValue="250"
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
            defaultValue="30"
            placeholder="e.g. 30"
            disabled={isSubmitting}
          />
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
