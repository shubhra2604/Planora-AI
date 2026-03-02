import { useEffect, useRef, useState, useCallback } from "react";
import "./Toast.css";

/**
 * Toast – non-blocking notification list.
 *
 * Props:
 *   toasts  – array of { id, type, message, detail?, onRetry? }
 *   onClose – (id) => void
 */
export default function Toast({ toasts = [], onClose }) {
  return (
    <div className="toast-container" aria-live="polite" aria-atomic="false">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onClose={onClose} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }) {
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => onClose(toast.id), 5500);
    return () => clearTimeout(timerRef.current);
  }, [toast.id, onClose]);

  const icons = { error: "✕", success: "✓", info: "ℹ", warning: "⚠" };

  return (
    <div className={`toast toast--${toast.type || "error"}`} role="alert">
      <span className="toast-icon">{icons[toast.type] || "✕"}</span>
      <div className="toast-body">
        <span className="toast-message">{toast.message}</span>
        {toast.detail && <span className="toast-detail">{toast.detail}</span>}
        {toast.onRetry && (
          <button
            className="toast-retry"
            onClick={() => {
              onClose(toast.id);
              toast.onRetry();
            }}
          >
            Try Again
          </button>
        )}
      </div>
      <button
        className="toast-close"
        onClick={() => onClose(toast.id)}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

/* ─── hook ──────────────────────────────────────────────────────── */
let _uid = 0;

/**
 * useToast()
 * Returns { toasts, showToast, closeToast }
 *
 * showToast({ type, message, detail?, onRetry? })
 *   type: "error" | "success" | "info" | "warning"  (default "error")
 */
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback(
    ({ type = "error", message, detail, onRetry } = {}) => {
      const id = ++_uid;
      setToasts((prev) => [...prev, { id, type, message, detail, onRetry }]);
    },
    [],
  );

  const closeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, showToast, closeToast };
}
