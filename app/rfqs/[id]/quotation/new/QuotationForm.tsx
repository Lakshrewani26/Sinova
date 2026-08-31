"use client";

import { useState } from "react";
import Link from "next/link";
import { submitSupplierQuotationAction } from "../../../actions";

interface QuotationFormProps {
  rfq: {
    id: string;
    quantity: number;
    targetUnitPrice: number;
    manufacturer: {
      name: string;
      country: string;
    };
    product: {
      name: string;
      unitPriceINR: number;
    };
  };
}

export function QuotationForm({ rfq }: QuotationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Live calculation state
  const [quotedUnitPrice, setQuotedUnitPrice] = useState<number>(rfq.targetUnitPrice);
  const [quantity, setQuantity] = useState<number>(rfq.quantity);
  const [shippingCost, setShippingCost] = useState<number>(0);

  // Computed Supplier Quotation Economics
  const productCost = (quotedUnitPrice || 0) * (quantity || 0);
  const totalCost = productCost + (shippingCost || 0);
  const effectiveUnitCost = quantity > 0 ? totalCost / quantity : 0;
  const targetDiff = effectiveUnitCost - rfq.targetUnitPrice;
  const targetDiffPct = rfq.targetUnitPrice > 0 ? (targetDiff / rfq.targetUnitPrice) * 100 : 0;

  const isWithinTarget = effectiveUnitCost <= rfq.targetUnitPrice;

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await submitSupplierQuotationAction(formData);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "digest" in err && typeof (err as { digest: string }).digest === "string" && (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")) {
        throw err;
      }
      setErrorMsg(err instanceof Error ? err.message : "Failed to record quotation. Please try again.");
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

      {/* Hidden RFQ ID */}
      <input type="hidden" name="rfqId" value={rfq.id} />

      {/* Explanatory Data Honesty Note */}
      <div
        style={{
          background: "#eef5f2",
          border: "1.5px solid #a4d3c3",
          borderRadius: "8px",
          padding: "14px 18px",
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
        }}
      >
        <span style={{ color: "#0d5c4c", fontWeight: 800, fontSize: "16px" }}>ℹ</span>
        <div>
          <strong style={{ fontSize: "13.5px", color: "#082e29", display: "block", marginBottom: "2px" }}>
            Manual Supplier Quotation Recording
          </strong>
          <span style={{ fontSize: "12.5px", color: "#4f635d" }}>
            External supplier messaging is not connected yet. Use this form to record a quotation received outside SINOVA.
          </span>
        </div>
      </div>

      {/* RFQ Context Header */}
      <div
        style={{
          background: "#f6f8f7",
          border: "1px solid #dce4df",
          borderRadius: "8px",
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <span className="sinova-eyebrow" style={{ margin: 0 }}>
            RFQ CONTEXT #{rfq.id.substring(rfq.id.length - 8)}
          </span>
          <h3 style={{ fontSize: "17px", fontWeight: 800, margin: "2px 0", color: "#122321" }}>
            {rfq.product.name}
          </h3>
          <span style={{ fontSize: "13px", color: "#60706c" }}>
            Supplier: <strong>{rfq.manufacturer.name}</strong> ({rfq.manufacturer.country})
          </span>
        </div>

        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: "11px", fontFamily: "DM Mono, monospace", color: "#60706c", display: "block" }}>
            BUYER TARGET PRICE
          </span>
          <strong style={{ fontSize: "18px", fontWeight: 800, color: "#082e29" }}>
            ₹{rfq.targetUnitPrice.toLocaleString()} / unit
          </strong>
          <span style={{ fontSize: "11.5px", color: "#60706c", display: "block" }}>
            Requested: {rfq.quantity.toLocaleString()} units
          </span>
        </div>
      </div>

      {/* Quotation Form Inputs Grid */}
      <div className="sinova-form-grid-2">
        {/* Quoted Unit Price */}
        <div className="sinova-form-group">
          <label htmlFor="quotedUnitPrice" className="sinova-label">
            Quoted Unit Price (₹ INR) <span className="sinova-required">*</span>
          </label>
          <div className="sinova-input-prefix-wrapper">
            <span className="sinova-input-prefix">₹</span>
            <input
              type="number"
              id="quotedUnitPrice"
              name="quotedUnitPrice"
              required
              step="0.01"
              min="0.01"
              className="sinova-input prefixed"
              value={quotedUnitPrice || ""}
              onChange={(e) => setQuotedUnitPrice(parseFloat(e.target.value) || 0)}
              placeholder="e.g. 240"
              disabled={isSubmitting}
            />
          </div>
          <span className="sinova-helper-text">Supplier-quoted price per unit.</span>
        </div>

        {/* Quoted Quantity */}
        <div className="sinova-form-group">
          <label htmlFor="quantity" className="sinova-label">
            Quoted Quantity (Units) <span className="sinova-required">*</span>
          </label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            required
            min="1"
            className="sinova-input"
            value={quantity || ""}
            onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
            placeholder="e.g. 1000"
            disabled={isSubmitting}
          />
          <span className="sinova-helper-text">Number of units included in quote.</span>
        </div>

        {/* Minimum Order Quantity (MOQ) */}
        <div className="sinova-form-group">
          <label htmlFor="moq" className="sinova-label">
            Supplier MOQ (Optional)
          </label>
          <input
            type="number"
            id="moq"
            name="moq"
            min="0"
            className="sinova-input"
            placeholder="e.g. 500"
            disabled={isSubmitting}
          />
          <span className="sinova-helper-text">Supplier-provided minimum order quantity.</span>
        </div>

        {/* Lead Time (Days) */}
        <div className="sinova-form-group">
          <label htmlFor="leadTimeDays" className="sinova-label">
            Lead Time (Days) (Optional)
          </label>
          <input
            type="number"
            id="leadTimeDays"
            name="leadTimeDays"
            min="0"
            className="sinova-input"
            placeholder="e.g. 25"
            disabled={isSubmitting}
          />
          <span className="sinova-helper-text">Production & processing lead time.</span>
        </div>

        {/* Shipping / Freight Cost */}
        <div className="sinova-form-group">
          <label htmlFor="shippingCost" className="sinova-label">
            Shipping / Freight Cost (₹ INR) (Optional)
          </label>
          <div className="sinova-input-prefix-wrapper">
            <span className="sinova-input-prefix">₹</span>
            <input
              type="number"
              id="shippingCost"
              name="shippingCost"
              step="0.01"
              min="0"
              className="sinova-input prefixed"
              value={shippingCost || ""}
              onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
              placeholder="e.g. 5000"
              disabled={isSubmitting}
            />
          </div>
          <span className="sinova-helper-text">Estimated shipping or freight charge.</span>
        </div>

        {/* Quotation Validity Date */}
        <div className="sinova-form-group">
          <label htmlFor="validUntil" className="sinova-label">
            Valid Until Date (Optional)
          </label>
          <input
            type="date"
            id="validUntil"
            name="validUntil"
            className="sinova-input"
            disabled={isSubmitting}
          />
          <span className="sinova-helper-text">Expiration date of supplier quotation.</span>
        </div>
      </div>

      {/* Supplier Notes */}
      <div className="sinova-form-group">
        <label htmlFor="supplierNotes" className="sinova-label">
          Supplier Notes & Payment Terms (Optional)
        </label>
        <textarea
          id="supplierNotes"
          name="supplierNotes"
          rows={3}
          className="sinova-textarea"
          placeholder="e.g. 30% advance deposit required, FOB Shanghai terms, custom embossing included."
          disabled={isSubmitting}
        />
      </div>

      {/* Supplier Quotation Economics Live Calculator Preview */}
      <div
        style={{
          background: "#f6f8f7",
          border: "1.5px solid #cbd7d2",
          borderRadius: "10px",
          padding: "20px 24px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <span className="sinova-eyebrow" style={{ margin: 0 }}>
            SUPPLIER QUOTATION ECONOMICS (LIVE CALCULATOR)
          </span>

          <span
            style={{
              fontSize: "11px",
              fontWeight: 800,
              padding: "4px 10px",
              borderRadius: "12px",
              backgroundColor: isWithinTarget ? "#eef5f2" : "#fef3c7",
              color: isWithinTarget ? "#0d5c4c" : "#92400e",
              border: isWithinTarget ? "1px solid #a4d3c3" : "1px solid #fcd34d",
            }}
          >
            {isWithinTarget ? "✓ Within Target" : "▲ Above Target"}
          </span>
        </div>

        <div className="sinova-metrics-grid-4">
          <div className="sinova-metric-cell">
            <span className="lbl">Base Product Cost</span>
            <strong className="val">₹{productCost.toLocaleString()}</strong>
          </div>
          <div className="sinova-metric-cell">
            <span className="lbl">Total Supplier Cost</span>
            <strong className="val">₹{totalCost.toLocaleString()}</strong>
          </div>
          <div className="sinova-metric-cell highlight">
            <span className="lbl">Effective Unit Cost</span>
            <strong className="val green">₹{effectiveUnitCost.toFixed(2)}</strong>
          </div>
          <div className="sinova-metric-cell">
            <span className="lbl">Target Difference</span>
            <strong className="val" style={{ color: isWithinTarget ? "#0d5c4c" : "#c92a2a" }}>
              {targetDiff > 0 ? `+₹${targetDiff.toFixed(2)}` : `-₹${Math.abs(targetDiff).toFixed(2)}`}{" "}
              <small style={{ fontSize: "11px", fontWeight: 600 }}>({targetDiffPct > 0 ? `+${targetDiffPct.toFixed(1)}%` : `${targetDiffPct.toFixed(1)}%`})</small>
            </strong>
          </div>
        </div>
      </div>

      {/* Form Action Buttons */}
      <div className="sinova-form-actions">
        <Link href={`/rfqs/${rfq.id}`} className="sinova-cancel-btn">
          Cancel
        </Link>
        <button type="submit" className="sinova-submit-btn" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <svg className="sinova-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="10" />
              </svg>
              <span>Saving Quotation...</span>
            </>
          ) : (
            <>
              <span>Save Supplier Quotation</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
