"use client";

import { useState, useTransition } from "react";
import { updateOrderStatusAction } from "../actions";

interface StatusUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
  targetStatus: string;
}

export function StatusUpdateModal({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  targetStatus,
}: StatusUpdateModalProps) {
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const statusLabels: Record<string, string> = {
    SUPPLIER_CONFIRMED: "Supplier Confirmed",
    IN_PRODUCTION: "In Production",
    READY_TO_SHIP: "Ready to Ship",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  };

  const isCancel = targetStatus === "CANCELLED";
  const displayTargetLabel = statusLabels[targetStatus] || targetStatus;

  function handleConfirm() {
    if (isPending) return;
    setErrorMsg(null);

    startTransition(async () => {
      try {
        await updateOrderStatusAction(orderId, targetStatus, note);
        setNote("");
        onClose();
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : "Failed to update order status.");
      }
    });
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(10, 24, 21, 0.6)",
        backdropFilter: "blur(4px)",
        zIndex: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onClose();
      }}
    >
      <div
        style={{
          background: "#ffffff",
          border: "1.5px solid #dce4df",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "480px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          overflow: "hidden",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid #eef2f0",
            backgroundColor: isCancel ? "#fcf2f2" : "#f6f8f7",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <span
              style={{
                fontSize: "11px",
                fontFamily: "DM Mono, monospace",
                color: isCancel ? "#991b1b" : "#60706c",
                fontWeight: 700,
                display: "block",
                marginBottom: "2px",
                textTransform: "uppercase",
              }}
            >
              {isCancel ? "CONFIRM CANCELLATION" : "CONFIRM STATUS CHANGE"}
            </span>
            <h3 style={{ fontSize: "17px", fontWeight: 800, margin: 0, color: isCancel ? "#991b1b" : "#122321" }}>
              {isCancel ? `Cancel Order ${orderNumber}?` : `Move order to ${displayTargetLabel}?`}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "18px",
              color: "#8a9e97",
              padding: "4px",
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "20px 24px" }}>
          {errorMsg && (
            <div
              style={{
                background: "#fcf2f2",
                border: "1px solid #f8d7da",
                color: "#c92a2a",
                padding: "10px 14px",
                borderRadius: "6px",
                fontSize: "12.5px",
                marginBottom: "16px",
              }}
            >
              {errorMsg}
            </div>
          )}

          <p style={{ fontSize: "13px", color: "#60706c", marginTop: 0, marginBottom: "16px", lineHeight: 1.5 }}>
            {isCancel
              ? `Are you sure you want to cancel internal procurement order ${orderNumber}? This action cannot be undone.`
              : `This will update the internal procurement status for order ${orderNumber} to ${displayTargetLabel}.`}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label htmlFor="modalNote" style={{ fontSize: "12.5px", fontWeight: 700, color: "#122321" }}>
              Add an internal note (Optional)
            </label>
            <textarea
              id="modalNote"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={isPending}
              className="sinova-textarea"
              placeholder={
                isCancel
                  ? "e.g. Buyer requested cancellation due to revised production requirements."
                  : "e.g. Verified 30% advance deposit paid via bank transfer to supplier."
              }
              style={{ fontSize: "13px" }}
            />
            <span style={{ fontSize: "11.5px", color: "#8a9e97" }}>
              This note will be recorded permanently in the order timeline history.
            </span>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #eef2f0",
            backgroundColor: "#f6f8f7",
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="sinova-cancel-btn"
            style={{ padding: "8px 16px", fontSize: "13px" }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className={isCancel ? "sinova-cancel-btn" : "sinova-primary-cta"}
            style={
              isCancel
                ? { backgroundColor: "#c92a2a", color: "#ffffff", borderColor: "#c92a2a", padding: "8px 16px", fontSize: "13px" }
                : { padding: "8px 16px", fontSize: "13px" }
            }
          >
            {isPending ? "Updating..." : isCancel ? "Confirm Cancellation" : "Confirm Update"}
          </button>
        </div>
      </div>
    </div>
  );
}
