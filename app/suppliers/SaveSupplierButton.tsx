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
          gap: "6px",
          padding: "8px 14px",
          fontSize: "12.5px",
          fontWeight: 700,
          borderRadius: "8px",
          cursor: isPending ? "not-allowed" : "pointer",
          transition: "all 0.15s ease",
          ...(isSaved
            ? {
                backgroundColor: "#eef5f2",
                color: "#0d5c4c",
                border: "1.5px solid #a4d3c3",
              }
            : {
                backgroundColor: "#ffffff",
                color: "#60706c",
                border: "1.5px solid #dce4df",
              }),
          ...style,
        }}
      >
        {isPending ? (
          <>
            <svg
              className="sinova-spinner"
              width="14"
              height="14"
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
            <span style={{ color: "#0d5c4c", fontWeight: 800 }}>✓</span>
            {showText && <span>Saved</span>}
          </>
        ) : (
          <>
            <span style={{ color: "#8a9e97" }}>☆</span>
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
