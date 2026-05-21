import { NumberTicker } from "@/components/NumberTicker";

interface Props {
  label: string;
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  note?: string;
}
export function StatTile({
  label,
  value,
  decimals = 0,
  prefix,
  suffix,
  note,
}: Props) {
  return (
    <div className="border-r last:border-r-0 border-border px-6 py-7 flex flex-col gap-2">
      <div className="eyebrow">{label}</div>
      <div className="num text-3xl md:text-4xl tracking-tight">
        <NumberTicker
          value={value}
          decimals={decimals}
          prefix={prefix}
          suffix={suffix}
          duration={1100}
        />
      </div>
      {note && <div className="eyebrow">{note}</div>}
    </div>
  );
}
