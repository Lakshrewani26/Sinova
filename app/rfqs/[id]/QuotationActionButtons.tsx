"use client";

import { useState, useTransition } from "react";
import { acceptQuotationAction, rejectQuotationAction } from "../actions";

interface QuotationActionButtonsProps {
  quotationId: string;
  status: string;
}

export function QuotationActionButtons({ quotationId, status }: QuotationActionButtonsProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function handleAccept() {
    if (isPending) return;
    setErrorMsg(null);

    startTransition(async () => {
      try {
        await acceptQuotationAction(quotationId);
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : "Failed to accept quotation.");
      }
    });
  }

  function handleReject() {
    if (isPending) return;
    setErrorMsg(null);

    startTransition(async () => {
      try {
        await rejectQuotationAction(quotationId);
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : "Failed to reject quotation.");
      }
    });
  }

  if (status === "ACCEPTED") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          padding: "6px 12px",
          fontSize: "12px",
          fontWeight: 800,
          backgroundColor: "#082e29",
          color: "#c7ee72",
          borderRadius: "8px",
        }}
      >
        ✓ ACCEPTED QUOTE
      </span>
    );
  }

  if (status === "REJECTED") {
    return (
      <span
        style={{
          display: "inline-block",
          padding: "6px 12px",
          fontSize: "12px",
          fontWeight: 700,
          color: "#8a9e97",
          backgroundColor: "#f6f8f7",
          border: "1px solid #dce4df",
          borderRadius: "8px",
        }}
      >
        ✗ REJECTED
      </span>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <button
          type="button"
          onClick={handleAccept}
          disabled={isPending}
          className="sinova-primary-cta"
          style={{ padding: "8px 14px", fontSize: "12.5px" }}
        >
          {isPending ? "Updating..." : "Accept Quote"}
        </button>

        <button
          type="button"
          onClick={handleReject}
          disabled={isPending}
          className="sinova-cancel-btn"
          style={{ padding: "8px 14px", fontSize: "12.5px" }}
        >
          {isPending ? "Updating..." : "Reject Quote"}
        </button>
      </div>

      {errorMsg && (
        <span style={{ fontSize: "11px", color: "#c92a2a", marginTop: "2px" }}>
          {errorMsg}
        </span>
      )}
    </div>
  );
}
