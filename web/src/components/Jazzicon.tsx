// Tiny deterministic jazzicon-ish identity tile (no external dep).
function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const PALETTES = [
  ["#cdb380", "#2c4070", "#0b0b10", "#e8dcc4"],
  ["#2c4070", "#7e8aa6", "#cdb380", "#0b0b10"],
  ["#a7855a", "#1a2540", "#e8dcc4", "#3a4a6e"],
  ["#cdb380", "#5b3a1f", "#0b0b10", "#d9c79b"],
  ["#2c4070", "#cdb380", "#8a9bbb", "#1a1a22"],
];

export function Jazzicon({ seed, size = 36 }: { seed: string; size?: number }) {
  const h = hash(seed);
  const palette = PALETTES[h % PALETTES.length];
  const rot = h % 360;
  const c1 = palette[h % 4];
  const c2 = palette[(h >> 3) % 4];
  const c3 = palette[(h >> 6) % 4];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      aria-hidden
      className="shrink-0"
    >
      <rect width="40" height="40" fill={c1} />
      <g transform={`rotate(${rot} 20 20)`}>
        <rect x="-10" y="14" width="60" height="12" fill={c2} />
        <circle cx="14" cy="26" r="9" fill={c3} />
        <polygon
          points="20,4 32,12 32,28 20,36 8,28 8,12"
          fill="none"
          stroke={c1}
          strokeOpacity="0.35"
        />
      </g>
    </svg>
  );
}
