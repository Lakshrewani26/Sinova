"use client";

import { useState } from "react";
import { StatusUpdateModal } from "./StatusUpdateModal";

interface OrderActionsProps {
  orderId: string;
  orderNumber: string;
  status: string;
}

export function OrderActions({ orderId, orderNumber, status }: OrderActionsProps) {
  const [targetStatus, setTargetStatus] = useState<string | null>(null);

  if (status === "COMPLETED") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "8px 14px",
          fontSize: "13px",
          fontWeight: 800,
          backgroundColor: "#082e29",
          color: "#c7ee72",
          borderRadius: "8px",
        }}
      >
        ✓ PROCUREMENT COMPLETED
      </span>
    );
  }

  if (status === "CANCELLED") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "8px 14px",
          fontSize: "13px",
          fontWeight: 800,
          backgroundColor: "#fcf2f2",
          color: "#c92a2a",
          border: "1px solid #f8d7da",
          borderRadius: "8px",
        }}
      >
        ✕ ORDER CANCELLED
      </span>
    );
  }

  // Determine next sequential step
  let nextStepLabel = "";
  let nextStepStatus = "";

  if (status === "ORDER_CREATED") {
    nextStepLabel = "Confirm Supplier";
    nextStepStatus = "SUPPLIER_CONFIRMED";
  } else if (status === "SUPPLIER_CONFIRMED") {
    nextStepLabel = "Mark In Production";
    nextStepStatus = "IN_PRODUCTION";
  } else if (status === "IN_PRODUCTION") {
    nextStepLabel = "Mark Ready to Ship";
    nextStepStatus = "READY_TO_SHIP";
  } else if (status === "READY_TO_SHIP") {
    nextStepLabel = "Mark Completed";
    nextStepStatus = "COMPLETED";
  }

  return (
    <>
      <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
        {nextStepStatus && (
          <button
            type="button"
            onClick={() => setTargetStatus(nextStepStatus)}
            className="sinova-primary-cta"
            style={{ padding: "10px 18px", fontSize: "13.5px" }}
          >
            <span>{nextStepLabel}</span>
            <span>&rarr;</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setTargetStatus("CANCELLED")}
          className="sinova-cancel-btn"
          style={{ padding: "10px 16px", fontSize: "13px" }}
        >
          Cancel Order
        </button>
      </div>

      {targetStatus && (
        <StatusUpdateModal
          isOpen={!!targetStatus}
          onClose={() => setTargetStatus(null)}
          orderId={orderId}
          orderNumber={orderNumber}
          targetStatus={targetStatus}
        />
      )}
    </>
  );
}
