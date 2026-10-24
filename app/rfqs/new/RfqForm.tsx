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

  const [quantity, setQuantity] = useState<number>(defaultQuantity);
  const [targetUnitPrice, setTargetUnitPrice] = useState<number>(defaultTargetPrice);

  const totalCalculatedValue = Math.max(0, quantity) * Math.max(0, targetUnitPrice);

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
          background: "linear-gradient(135deg, #f6f8f7 0%, #edf5f1 100%)",
          border: "1.5px solid #cbd7d2",
          borderRadius: "12px",
          padding: "20px 24px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          boxShadow: "0 2px 10px rgba(13, 92, 76, 0.05)",
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
              <span className="sinova-nav-badge" style={{ marginTop: "8px", display: "inline-block", backgroundColor: "var(--sinova-mint)", color: "var(--sinova-green)", border: "1px solid #b7dcce" }}>
                Linked Brief: {sourcingRequest.title}
              </span>
            )}
          </div>

          <div style={{ textAlign: "right", background: "#ffffff", padding: "12px 18px", borderRadius: "10px", border: "1.5px solid #dce4df" }}>
            <span style={{ fontSize: "10.5px", fontFamily: "DM Mono, monospace", color: "#60706c", display: "block", textTransform: "uppercase" }}>
              Indicative Price
            </span>
            <strong style={{ fontSize: "20px", fontWeight: 800, color: "var(--sinova-deep)" }}>
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
            value={quantity || ""}
            onChange={(e) => setQuantity(Number(e.target.value))}
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
              value={targetUnitPrice || ""}
              onChange={(e) => setTargetUnitPrice(Number(e.target.value))}
              placeholder="e.g. 250"
              disabled={isSubmitting}
            />
          </div>
          <span className="sinova-helper-text">
            Target unit price per unit in India.
          </span>
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
              Total Estimated RFQ Value
            </span>
            <span style={{ fontSize: "13px", color: "#37524a" }}>
              {quantity.toLocaleString()} units &times; ₹{targetUnitPrice.toLocaleString()}
            </span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: "11px", color: "#60706c", display: "block", textTransform: "uppercase" }}>
            Total Est. Spend
          </span>
          <strong style={{ fontSize: "20px", fontWeight: 800, color: "var(--sinova-deep)" }}>
            ₹{totalCalculatedValue.toLocaleString("en-IN")}
          </strong>
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
