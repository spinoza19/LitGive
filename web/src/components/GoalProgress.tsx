import { formatLTC } from "@/lib/format";

// Segmented stack progress — 40 ticks. Pure CSS.
export function GoalProgress({
  raised,
  goal,
  showLabels = true,
}: {
  raised: number;
  goal: number;
  showLabels?: boolean;
}) {
  const pct = goal > 0 ? Math.min(100, (raised / goal) * 100) : 0;
  const filled = Math.round((pct / 100) * 40);

  return (
    <div className="space-y-3">
      {showLabels && (
        <div className="flex items-baseline justify-between">
          <div className="num text-3xl tracking-tight">
            <span className="text-foreground">{formatLTC(raised)}</span>
            <span className="text-muted-foreground">
              {" / "}
              {formatLTC(goal)}
            </span>
            <span className="ml-2 text-xs text-muted-foreground">zkLTC</span>
          </div>
          <div className="num text-xs eyebrow">{pct.toFixed(1)}%</div>
        </div>
      )}
      <div
        className="flex gap-[3px]"
        aria-label={`${pct.toFixed(1)} percent of goal`}
      >
        {Array.from({ length: 40 }).map((_, i) => {
          const active = i < filled;
          const isMile = i === 9 || i === 19 || i === 29;
          return (
            <div
              key={i}
              className={[
                "h-7 flex-1 transition-colors duration-300",
                active ? "bg-gold" : "bg-muted",
                isMile ? "border-l border-rule" : "",
              ].join(" ")}
              style={{ transitionDelay: `${i * 8}ms` }}
            />
          );
        })}
      </div>
      <div className="flex justify-between eyebrow num">
        <span>0</span>
        <span>25</span>
        <span>50</span>
        <span>75</span>
        <span>100%</span>
      </div>
    </div>
  );
}
