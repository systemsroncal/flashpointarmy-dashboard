/**
 * Server-safe Suspense fallback for dashboard pages (no "use client", no MUI).
 * Avoids Turbopack / RSC "module factory is not available" when client bundles are pulled into the server graph.
 */
export function DataPaneFallback({ label = "Loading" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={label}
      style={{
        position: "relative",
        paddingTop: 8,
        paddingBottom: 8,
        minHeight: 140,
      }}
    >
      <p
        style={{
          margin: "0 0 12px 0",
          color: "rgba(255,255,255,0.4)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          fontSize: "0.65rem",
        }}
      >
        {label}
      </p>
      <div
        style={{
          height: 28,
          maxWidth: 320,
          marginBottom: 12,
          borderRadius: 6,
          background: "rgba(255,215,0,0.08)",
        }}
      />
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            height: 44,
            marginBottom: 8,
            borderRadius: 6,
            background: `rgba(255,255,255,${0.05 * (4 - i)})`,
          }}
        />
      ))}
    </div>
  );
}
