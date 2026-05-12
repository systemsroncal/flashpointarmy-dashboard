"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Alert, Snackbar } from "@mui/material";

type ToastState = { open: boolean; message: string; severity: "success" | "error" | "info" };

const MobilizeToastContext = createContext<(msg: string, severity?: ToastState["severity"]) => void>(() => {});

export function MobilizeToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: "",
    severity: "info",
  });

  const showToast = useCallback((message: string, severity: ToastState["severity"] = "info") => {
    setToast({ open: true, message, severity });
  }, []);

  const value = useMemo(() => showToast, [showToast]);

  return (
    <MobilizeToastContext.Provider value={value}>
      {children}
      <Snackbar
        open={toast.open}
        autoHideDuration={5000}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setToast((t) => ({ ...t, open: false }))}
          severity={toast.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </MobilizeToastContext.Provider>
  );
}

export function useMobilizeToast() {
  return useContext(MobilizeToastContext);
}
