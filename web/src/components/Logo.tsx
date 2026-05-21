import { type SVGProps } from "react";

/**
 * LitGive asterisk mark.
 *
 * Final geometry, after several iteration rounds:
 *   - 8 arms at uniform 22.5° steps (precision / engraved feel)
 *   - Each arm is a hairline triangle: thick at center → 0 at tip
 *   - 4 cardinal arms (N/E/S/W) slightly longer than 4 diagonals
 *     (ratio ~1.0 / 0.86) — controlled asymmetry that breaks snowflake reading
 *   - Pinned center: small filled circle at intersection (compass pivot)
 *   - Optional gold accent on the TOP arm only — single concession to color,
 *     like a brass slug dropped into a wood-type composition
 *
 * Pure SVG, no fonts, no images. Inherits `currentColor` for the strokes so
 * it pairs cleanly with both light and dark themes.
 */
export function Logo({
  size = 24,
  accent = false,
  ...rest
}: SVGProps<SVGSVGElement> & { size?: number; accent?: boolean }) {
  // viewBox is 64×64 → bigger working space than 24×24, less rounding at small
  // sizes. Centered at (32,32). Arms go from a wide base near center out to a
  // hair tip.

  const cx = 32;
  const cy = 32;

  // Cardinal arm — long
  const cardLen = 30;
  const cardBase = 2.6; // half-width of base (so total = 5.2)

  // Diagonal arm — slightly shorter, slightly thinner
  const diagLen = 25.5;
  const diagBase = 2.1;

  // 8 arms in clock order, starting at top (12 o'clock), going clockwise.
  // angle is measured from the +y "up" direction in degrees.
  const arms = [
    { angleDeg: 0, len: cardLen, base: cardBase, name: "top" }, // ↑
    { angleDeg: 45, len: diagLen, base: diagBase, name: "ne" },
    { angleDeg: 90, len: cardLen, base: cardBase, name: "right" }, // →
    { angleDeg: 135, len: diagLen, base: diagBase, name: "se" },
    { angleDeg: 180, len: cardLen, base: cardBase, name: "bottom" }, // ↓
    { angleDeg: 225, len: diagLen, base: diagBase, name: "sw" },
    { angleDeg: 270, len: cardLen, base: cardBase, name: "left" }, // ←
    { angleDeg: 315, len: diagLen, base: diagBase, name: "nw" },
  ];

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      role="img"
      aria-label="LitGive"
      {...rest}
    >
      {arms.map((arm, i) => {
        // Direction vector (unit)
        const rad = (arm.angleDeg * Math.PI) / 180;
        const ux = Math.sin(rad);
        const uy = -Math.cos(rad);
        // Perpendicular unit vector for the base width
        const px = -uy;
        const py = ux;

        // Tip of the arm
        const tx = cx + ux * arm.len;
        const ty = cy + uy * arm.len;

        // The base of the arm sits a small offset from center so the eight
        // bases form a tiny octagon around the pin, instead of a single mess.
        const baseOffset = 1.3;
        const bx = cx + ux * baseOffset;
        const by = cy + uy * baseOffset;

        // Two base corners
        const b1x = bx + px * arm.base;
        const b1y = by + py * arm.base;
        const b2x = bx - px * arm.base;
        const b2y = by - py * arm.base;

        const isAccent = accent && arm.name === "top";
        const fill = isAccent ? "var(--gold, #cdb380)" : "currentColor";

        return (
          <path
            key={i}
            d={`M ${b1x.toFixed(2)} ${b1y.toFixed(2)} L ${tx.toFixed(2)} ${ty.toFixed(2)} L ${b2x.toFixed(2)} ${b2y.toFixed(2)} Z`}
            fill={fill}
          />
        );
      })}

      {/* Pinned center — small filled circle at intersection */}
      <circle cx={cx} cy={cy} r="1.6" fill="currentColor" />
    </svg>
  );
}

/**
 * Lockup: mark + wordmark in one component.
 * Use this in nav, footer, marketing pages.
 */
export function LogoLockup({
  size = 28,
  showTagline = false,
  className,
}: {
  size?: number;
  showTagline?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-baseline gap-2.5 ${className ?? ""}`}>
      <Logo
        size={size}
        accent
        className="shrink-0 -translate-y-[2px]"
      />
      <span className="leading-none">
        <span
          className="font-display tracking-tight"
          style={{ fontSize: size * 0.92, lineHeight: 1 }}
        >
          LitGive
        </span>
        {showTagline && (
          <span
            className="block font-mono uppercase tracking-[0.2em] text-muted-foreground mt-1"
            style={{ fontSize: size * 0.32 }}
          >
            Onchain donations on LitVM
          </span>
        )}
      </span>
    </span>
  );
}
