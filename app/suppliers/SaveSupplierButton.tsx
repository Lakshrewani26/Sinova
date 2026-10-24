"use client";

import { useState, useTransition } from "react";
import { toggleSaveSupplierAction } from "./actions";

interface SaveSupplierButtonProps {
  manufacturerId: string;
  initialIsSaved: boolean;
  className?: string;
  style?: React.CSSProperties;
  showText?: boolean;
}

export function SaveSupplierButton({
  manufacturerId,
  initialIsSaved,
  className = "",
  style = {},
  showText = true,
}: SaveSupplierButtonProps) {
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (isPending) return;
    setError(null);

    // Optimistic toggle
    const nextSavedState = !isSaved;
    setIsSaved(nextSavedState);

    startTransition(async () => {
      try {
        const result = await toggleSaveSupplierAction(manufacturerId);
        setIsSaved(result.isSaved);
      } catch (err: unknown) {
        // Revert optimistic update on error
        setIsSaved(!nextSavedState);
        setError(err instanceof Error ? err.message : "Failed to update saved supplier");
      }
    });
  }

  return (
    <div style={{ display: "inline-block" }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        title={isSaved ? "Remove from Saved Suppliers" : "Save Manufacturer"}
        className={className}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 16px",
          fontSize: "13px",
          fontWeight: 700,
          borderRadius: "8px",
          cursor: isPending ? "not-allowed" : "pointer",
          transition: "all 0.2s var(--sinova-ease)",
          boxShadow: isSaved ? "0 2px 8px rgba(13, 92, 76, 0.12)" : "none",
          ...(isSaved
            ? {
                backgroundColor: "var(--sinova-mint)",
                color: "var(--sinova-green)",
                border: "1.5px solid #a4d3c3",
              }
            : {
                backgroundColor: "#ffffff",
                color: "var(--sinova-muted)",
                border: "1.5px solid #dce4df",
              }),
          ...style,
        }}
      >
        {isPending ? (
          <>
            <svg
              className="sinova-spinner"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="10" />
            </svg>
            <span>{isSaved ? "Removing..." : "Saving..."}</span>
          </>
        ) : isSaved ? (
          <>
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="1"
              style={{ color: "var(--sinova-green)", transform: "scale(1.1)", transition: "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            {showText && <span>Saved Supplier</span>}
          </>
        ) : (
          <>
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: "#8a9e97" }}
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            {showText && <span>Save Supplier</span>}
          </>
        )}
      </button>

      {error && (
        <span style={{ display: "block", fontSize: "11px", color: "#c92a2a", marginTop: "4px" }}>
          {error}
        </span>
      )}
    </div>
  );
}
