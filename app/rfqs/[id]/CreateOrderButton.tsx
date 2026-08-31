"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createOrderFromQuotationAction } from "@/app/orders/actions";

interface CreateOrderButtonProps {
  quotationId: string;
  existingOrderId?: string | null;
}

export function CreateOrderButton({ quotationId, existingOrderId }: CreateOrderButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (existingOrderId) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span
          style={{
            padding: "6px 10px",
            fontSize: "11px",
            fontWeight: 800,
            backgroundColor: "#082e29",
            color: "#c7ee72",
            borderRadius: "6px",
          }}
        >
          ORDER CREATED
        </span>
        <Link
          href={`/orders/${existingOrderId}`}
          className="sinova-primary-cta"
          style={{ padding: "8px 14px", fontSize: "12.5px" }}
        >
          View Order &rarr;
        </Link>
      </div>
    );
  }

  function handleCreateOrder() {
    if (isPending) return;
    setErrorMsg(null);

    startTransition(async () => {
      try {
        await createOrderFromQuotationAction(quotationId);
      } catch (err: unknown) {
        if (err && typeof err === "object" && "digest" in err && typeof (err as { digest: string }).digest === "string" && (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")) {
          throw err;
        }
        setErrorMsg(err instanceof Error ? err.message : "Failed to create order.");
      }
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <button
        type="button"
        onClick={handleCreateOrder}
        disabled={isPending}
        className="sinova-primary-cta"
        style={{ padding: "8px 14px", fontSize: "12.5px" }}
      >
        {isPending ? (
          <>
            <svg className="sinova-spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="10" />
            </svg>
            <span>Creating Order...</span>
          </>
        ) : (
          <>
            <span>+ Create Procurement Order</span>
            <span>&rarr;</span>
          </>
        )}
      </button>

      {errorMsg && (
        <span style={{ fontSize: "11px", color: "#c92a2a", marginTop: "2px" }}>
          {errorMsg}
        </span>
      )}
    </div>
  );
}
