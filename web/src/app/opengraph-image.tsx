import { ImageResponse } from "next/og";
import { Mark } from "./icon";

export const alt = "LitGive — Donations, transparent by default";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#0b0b10",
          color: "#f5f5ee",
          padding: "72px 84px",
          position: "relative",
          fontFamily: "serif",
        }}
      >
        {/* Top masthead */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 18,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#9a9a8e",
            fontFamily: "monospace",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ color: "#cdb380" }}>*</span>
            <span>Vol. I &middot; No. 042</span>
          </div>
          <div>LitVM LiteForge &middot; Chain 4441</div>
        </div>

        {/* Center: huge asterisk + wordmark */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 56,
            marginTop: 30,
          }}
        >
          <Mark px={300} accent thicknessBoost={1.0} bg="#0b0b10" />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 192,
                lineHeight: 0.85,
                letterSpacing: "-0.04em",
                fontWeight: 300,
              }}
            >
              LitGive
            </div>
            <div
              style={{
                fontSize: 36,
                fontStyle: "italic",
                color: "#bdbdb0",
                marginTop: 24,
                maxWidth: 640,
                lineHeight: 1.2,
              }}
            >
              Donations, transparent by default.
            </div>
          </div>
        </div>

        {/* Bottom rule */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 18,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#9a9a8e",
            fontFamily: "monospace",
            borderTop: "1px solid #2a2a25",
            paddingTop: 22,
          }}
        >
          <span>Onchain donation marketplace</span>
          <span>litgive.app</span>
        </div>
      </div>
    ),
    size,
  );
}
