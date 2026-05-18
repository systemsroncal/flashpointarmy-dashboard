"use client";

import { MAINTENANCE_ETA_ET } from "@/lib/maintenance";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1a191a",
          color: "#d1d5db",
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          padding: 24,
        }}
      >
        <main
          style={{
            maxWidth: 520,
            border: "1px solid #f5c518",
            borderRadius: 8,
            padding: "28px 32px",
            background: "rgba(0,0,0,0.35)",
          }}
        >
          <h1
            style={{
              color: "#f5c518",
              fontSize: "1.35rem",
              margin: "0 0 16px",
              letterSpacing: "0.04em",
            }}
          >
            Under Maintenance
          </h1>
          <p style={{ lineHeight: 1.65, margin: "0 0 16px" }}>
            We are performing scheduled maintenance to improve your experience on
            the FlashPoint Army Command Center. We sincerely apologize for the
            inconvenience — our team is working to restore access as quickly as
            possible.
          </p>
          <p
            style={{
              color: "#fff",
              fontWeight: 600,
              lineHeight: 1.6,
              borderLeft: "3px solid #f5c518",
              paddingLeft: 16,
              margin: "0 0 16px",
            }}
          >
            We expect to finish maintenance by {MAINTENANCE_ETA_ET}.
          </p>
          <p style={{ margin: "0 0 20px", fontSize: "0.95rem" }}>
            Thank you for your patience and understanding.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              background: "transparent",
              border: "1px solid #f5c518",
              color: "#f5c518",
              padding: "10px 18px",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: "0.95rem",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
