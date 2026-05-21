import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * 32×32 favicon — asterisk on warm off-black, gold accent top arm.
 * Uses absolute-positioned rotated triangles to match the SVG mark.
 */
export default function Icon() {
  return new ImageResponse(<Mark px={32} accent />, size);
}

export function Mark({
  px,
  accent = false,
  bg = "#0b0b10",
  ink = "#f5f5ee",
  gold = "#cdb380",
  // For the favicon (small sizes), bump arm thickness so it survives.
  // 1 = same as full mark; 1.4 = 40% thicker arms.
  thicknessBoost = 1.4,
}: {
  px: number;
  accent?: boolean;
  bg?: string;
  ink?: string;
  gold?: string;
  thicknessBoost?: number;
}) {
  const cardLen = px * 0.45;
  const cardBase = px * 0.075 * thicknessBoost;
  const diagLen = px * 0.382;
  const diagBase = px * 0.062 * thicknessBoost;
  const baseOffset = px * 0.025;
  const pinR = px * 0.045;

  const arms = [
    { rot: 0, len: cardLen, base: cardBase, isTop: true },
    { rot: 45, len: diagLen, base: diagBase, isTop: false },
    { rot: 90, len: cardLen, base: cardBase, isTop: false },
    { rot: 135, len: diagLen, base: diagBase, isTop: false },
    { rot: 180, len: cardLen, base: cardBase, isTop: false },
    { rot: 225, len: diagLen, base: diagBase, isTop: false },
    { rot: 270, len: cardLen, base: cardBase, isTop: false },
    { rot: 315, len: diagLen, base: diagBase, isTop: false },
  ];

  return (
    <div
      style={{
        width: px,
        height: px,
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "relative",
          width: px,
          height: px,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {arms.map((arm, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: arm.base * 2,
              height: arm.len,
              background: accent && arm.isTop ? gold : ink,
              transform: `translate(-50%, -100%) translate(0, ${baseOffset}px) rotate(${arm.rot}deg)`,
              transformOrigin: "50% 100%",
              clipPath: "polygon(0% 100%, 100% 100%, 50% 0%)",
              display: "flex",
            }}
          />
        ))}
        {/* Pinned center */}
        <div
          style={{
            position: "absolute",
            width: pinR * 2,
            height: pinR * 2,
            borderRadius: "50%",
            background: ink,
            display: "flex",
          }}
        />
      </div>
    </div>
  );
}
