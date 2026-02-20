import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

/**
 * Dynamic OG image generator.
 *
 * Usage:
 *   /api/og                          → default homepage OG image
 *   /api/og?score=47&after=84        → personalized before/after score
 *   /api/og?title=Your+Match+Score   → custom title
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title = searchParams.get("title") || "Tailor your CV to any job description";
  const scoreBefore = searchParams.get("score") || "47";
  const scoreAfter = searchParams.get("after") || "84";
  const showScores = searchParams.has("score") || !searchParams.has("title");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #f0f9ff 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative blobs */}
        <div
          style={{
            position: "absolute",
            top: -60,
            left: -60,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "rgba(77, 112, 235, 0.06)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -40,
            right: -40,
            width: 250,
            height: 250,
            borderRadius: "50%",
            background: "rgba(77, 112, 235, 0.04)",
            display: "flex",
          }}
        />

        {/* Brand badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "linear-gradient(135deg, #4d70eb, #3a5cd4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 22,
              fontWeight: 800,
            }}
          >
            R
          </div>
          <span
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#1e3a5f",
              letterSpacing: "-0.02em",
            }}
          >
            ResumeMate AI
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 52,
            fontWeight: 800,
            color: "#111827",
            textAlign: "center",
            lineHeight: 1.15,
            maxWidth: 900,
            letterSpacing: "-0.03em",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {title}
        </div>

        {/* Score visualization */}
        {showScores && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 40,
              marginTop: 40,
            }}
          >
            {/* Before */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "20px 32px",
                borderRadius: 16,
                border: "3px solid #fca5a5",
                background: "white",
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Before
              </span>
              <span style={{ fontSize: 64, fontWeight: 800, color: "#ef4444", lineHeight: 1.1, marginTop: 4 }}>
                {scoreBefore}
              </span>
              <span style={{ fontSize: 14, color: "#9ca3af", marginTop: 2 }}>
                Match Score
              </span>
            </div>

            {/* Arrow */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="#4d70eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#4d70eb",
                  background: "#eff6ff",
                  padding: "4px 12px",
                  borderRadius: 20,
                }}
              >
                ResumeMate AI
              </span>
            </div>

            {/* After */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "20px 32px",
                borderRadius: 16,
                border: "3px solid #86efac",
                background: "white",
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600, color: "#22c55e", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                After
              </span>
              <span style={{ fontSize: 64, fontWeight: 800, color: "#22c55e", lineHeight: 1.1, marginTop: 4 }}>
                {scoreAfter}
              </span>
              <span style={{ fontSize: 14, color: "#9ca3af", marginTop: 2 }}>
                Match Score
              </span>
            </div>
          </div>
        )}

        {/* Tagline */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 32,
            fontSize: 18,
            color: "#6b7280",
          }}
        >
          <span>Free instant analysis</span>
          <span style={{ color: "#d1d5db" }}>·</span>
          <span>No signup required</span>
          <span style={{ color: "#d1d5db" }}>·</span>
          <span>Privacy-first</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
