import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: "#000000",
          borderRadius: 7,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            color: "#ffffff",
            fontSize: 15,
            fontWeight: 700,
            fontStyle: "italic",
            letterSpacing: -0.8,
          }}
        >
          RM
        </span>
      </div>
    ),
    { ...size },
  );
}
