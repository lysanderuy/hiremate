"use client";

// Catches errors in the root layout itself: must render its own <html>/<body>,
// and app CSS isn't available (hence inline styles with the brand token values).
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          margin: 0,
          padding: "1rem",
          background: "#f7f8fa",
          color: "#475467",
          fontFamily: "system-ui, sans-serif",
          fontSize: "14px",
          lineHeight: 1.5,
          textAlign: "center",
        }}
      >
        <h1 style={{ margin: 0, color: "#101828", fontSize: "26px", fontWeight: 600 }}>
          Something went wrong
        </h1>
        <p style={{ margin: "12px 0 0", maxWidth: "24rem", color: "#667085" }}>
          This page could not be loaded. Try again. If it keeps happening, come back later.
        </p>
        {error.digest && (
          <p style={{ margin: "12px 0 0", fontSize: "12px", color: "#667085" }}>
            Error ID: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          style={{
            marginTop: "24px",
            height: "44px",
            padding: "0 24px",
            border: 0,
            borderRadius: "10px",
            background: "#4f39f6",
            color: "#ffffff",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
