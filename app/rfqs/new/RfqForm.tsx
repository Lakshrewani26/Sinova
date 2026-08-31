"use client";

import { useState } from "react";
import Link from "next/link";
import { createRfqAction } from "../actions";

interface RfqFormProps {
  manufacturer: {
    id: string;
    name: string;
    country: string;
  };
  product: {
    id: string;
    name: string;
    unitPriceINR: number;
    moq: number | null;
  };
  sourcingRequest?: {
    id: string;
    title: string;
    quantity: number;
    targetBudgetINR: number;
    specifications: string | null;
  } | null;
}

export function RfqForm({ manufacturer, product, sourcingRequest }: RfqFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const defaultQuantity = sourcingRequest?.quantity || product.moq || 1000;
  const defaultTargetPrice = sourcingRequest?.targetBudgetINR || product.unitPriceINR;
  const defaultMessage =
    sourcingRequest?.specifications ||
    `Interested in procuring ${defaultQuantity.toLocaleString()} units of ${product.name}. Please provide your formal quotation and lead time.`;

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await createRfqAction(formData);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "digest" in err && typeof (err as { digest: string }).digest === "string" && (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")) {
        throw err;
      }
      setErrorMsg(err instanceof Error ? err.message : "Failed to send RFQ. Please try again.");
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

      {/* Hidden Fields */}
      <input type="hidden" name="manufacturerId" value={manufacturer.id} />
      <input type="hidden" name="productId" value={product.id} />
      {sourcingRequest && <input type="hidden" name="sourcingRequestId" value={sourcingRequest.id} />}

      {/* Top Summary Card */}
      <div
        style={{
          background: "#f6f8f7",
          border: "1.5px solid #cbd7d2",
          borderRadius: "10px",
          padding: "20px 24px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <span className="sinova-eyebrow" style={{ margin: 0 }}>
          PREFILLED CATALOG SUPPLIER SUMMARY
        </span>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h3 style={{ fontSize: "19px", fontWeight: 800, margin: "2px 0 4px 0", color: "#122321" }}>
              {manufacturer.name}
            </h3>
            <p style={{ margin: 0, fontSize: "13.5px", color: "#60706c", fontWeight: 600 }}>
              Product: {product.name} ({manufacturer.country})
            </p>
            {sourcingRequest && (
              <span className="sinova-nav-badge" style={{ marginTop: "8px", display: "inline-block", backgroundColor: "#eef5f2", color: "#0d5c4c" }}>
                Linked Brief: {sourcingRequest.title}
              </span>
            )}
          </div>

          <div style={{ textAlign: "right", background: "#ffffff", padding: "10px 16px", borderRadius: "8px", border: "1px solid #dce4df" }}>
            <span style={{ fontSize: "10px", fontFamily: "DM Mono, monospace", color: "#60706c", display: "block" }}>
              CATALOG / INDICATIVE PRICE
            </span>
            <strong style={{ fontSize: "20px", fontWeight: 800, color: "#082e29" }}>
              ₹{product.unitPriceINR.toLocaleString()}
            </strong>
          </div>
        </div>
      </div>

      {/* Form Fields Grid */}
      <div className="sinova-form-grid-2">
        <div className="sinova-form-group">
          <label htmlFor="quantity" className="sinova-label">
            RFQ Quantity (Units) <span className="sinova-required">*</span>
          </label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            required
            min="1"
            className="sinova-input"
            defaultValue={defaultQuantity}
            placeholder="e.g. 1000"
            disabled={isSubmitting}
          />
          <span className="sinova-helper-text">
            Requested order quantity for formal quotation.
          </span>
        </div>

        <div className="sinova-form-group">
          <label htmlFor="targetUnitPrice" className="sinova-label">
            Target Unit Price (₹ INR) <span className="sinova-required">*</span>
          </label>
          <div className="sinova-input-prefix-wrapper">
            <span className="sinova-input-prefix">₹</span>
            <input
              type="number"
              id="targetUnitPrice"
              name="targetUnitPrice"
              required
              step="0.01"
              min="0.01"
              className="sinova-input prefixed"
              defaultValue={defaultTargetPrice}
              placeholder="e.g. 250"
              disabled={isSubmitting}
            />
          </div>
          <span className="sinova-helper-text">
            Target unit price per unit in India.
          </span>
        </div>
      </div>

      {/* Message / Technical Requirements */}
      <div className="sinova-form-group">
        <label htmlFor="message" className="sinova-label">
          Message & Technical Requirements
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          className="sinova-textarea"
          defaultValue={defaultMessage}
          placeholder="Specify packaging, custom logo printing, target delivery location, lid/finish style, etc."
          disabled={isSubmitting}
        />
        <span className="sinova-helper-text">
          Include custom specifications, packaging, logo printing, or delivery terms.
        </span>
      </div>

      {/* Form Actions */}
      <div className="sinova-form-actions">
        <Link
          href={sourcingRequest ? `/requirements/${sourcingRequest.id}` : `/suppliers/${manufacturer.id}`}
          className="sinova-cancel-btn"
        >
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
              <span>Sending RFQ...</span>
            </>
          ) : (
            <>
              <span>Send RFQ</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
