"use client";

import { useState } from "react";

interface LandedCostInfoModalProps {
  unitPriceINR: number;
  quantity: number;
  estimatedLandedCost: number;
}

export function LandedCostInfoModal({
  unitPriceINR,
  quantity,
  estimatedLandedCost,
}: LandedCostInfoModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const volumeDiscount = quantity >= 5000 ? 0.07 : quantity >= 2000 ? 0.08 : 0.1;
  const freight = Math.round(unitPriceINR * volumeDiscount);
  const customsDuty = Math.round(unitPriceINR * 0.15);
  const insurance = Math.round(unitPriceINR * 0.02);

  return (
    <div className="sinova-landed-info-container">
      <button
        type="button"
        className="sinova-landed-info-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <span>How is Landed Cost calculated?</span>
      </button>

      {isOpen && (
        <div className="sinova-landed-popover">
          <div className="sinova-popover-header">
            <h4>Landed Cost Estimation Breakdown</h4>
            <button
              type="button"
              className="sinova-popover-close"
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>
          </div>

          <p className="sinova-popover-subtext">
            Standard calculation formula estimating the total unit cost delivered to an Indian port.
          </p>

          <div className="sinova-breakdown-list">
            <div className="sinova-breakdown-row">
              <span>Catalog / Indicative Price</span>
              <strong>₹{unitPriceINR.toLocaleString()}</strong>
            </div>
            <div className="sinova-breakdown-row">
              <span>+ Estimated Freight & Shipping (~{Math.round(volumeDiscount * 100)}%)</span>
              <span>+ ₹{freight.toLocaleString()}</span>
            </div>
            <div className="sinova-breakdown-row">
              <span>+ Customs Duty & Tariff (~15%)</span>
              <span>+ ₹{customsDuty.toLocaleString()}</span>
            </div>
            <div className="sinova-breakdown-row">
              <span>+ Insurance & Port Handling (~2%)</span>
              <span>+ ₹{insurance.toLocaleString()}</span>
            </div>
            <div className="sinova-breakdown-row total">
              <span>Total Estimated Landed Cost</span>
              <strong>₹{estimatedLandedCost.toLocaleString()} / unit</strong>
            </div>
          </div>

          <div className="sinova-popover-note">
            ℹ Note: Catalog prices are indicative search quotes from manufacturer listings. Actual landed costs may vary based on specific HS codes, shipping mode (sea/air), and finalized supplier terms.
          </div>
        </div>
      )}
    </div>
  );
}
