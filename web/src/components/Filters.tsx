"use client";

import { Search } from "lucide-react";

export type SortKey = "newest" | "oldest" | "most-raised" | "ending-soon";

export const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "charity", label: "Humanitarian" },
  { value: "personal", label: "Medical" },
  { value: "public-good", label: "Public Good" },
  { value: "education", label: "Education" },
  { value: "creator", label: "Creators" },
  { value: "emergency", label: "Emergency" },
];

const SORTS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Most recent" },
  { value: "most-raised", label: "Most funded" },
  { value: "ending-soon", label: "Ending soon" },
  { value: "oldest", label: "Oldest" },
];

export type FilterState = {
  search: string;
  category: string;
  sort: SortKey;
};

export const DEFAULT_FILTERS: FilterState = {
  search: "",
  category: "all",
  sort: "newest",
};

export function Filters({
  state,
  onChange,
  totalCount,
}: {
  state: FilterState;
  onChange: (s: FilterState) => void;
  totalCount: number;
}) {
  function patch<K extends keyof FilterState>(k: K, v: FilterState[K]) {
    onChange({ ...state, [k]: v });
  }

  return (
    <div className="border-y border-rule">
      <div className="flex flex-wrap items-stretch gap-0 divide-x divide-border">
        <div className="flex items-center gap-2 px-4 py-3 flex-1 min-w-[260px]">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={state.search}
            onChange={(e) => patch("search", e.target.value)}
            placeholder={`Search ${totalCount} campaigns by name, address, or cause`}
            className="w-full bg-transparent outline-none font-mono text-xs uppercase tracking-[0.16em] placeholder:text-muted-foreground"
          />
          <kbd className="hidden md:inline font-mono text-[0.6rem] px-1.5 py-0.5 border border-border text-muted-foreground">
            ⌘K
          </kbd>
        </div>
        <div className="flex items-center gap-1 px-3 py-2 overflow-x-auto">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => patch("category", c.value)}
              className={[
                "px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.18em] whitespace-nowrap border transition-colors",
                state.category === c.value
                  ? "bg-foreground text-background border-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="px-4 py-3 flex items-center gap-3">
          <span className="eyebrow">Sort</span>
          <select
            value={state.sort}
            onChange={(e) => patch("sort", e.target.value as SortKey)}
            className="bg-transparent font-mono text-xs uppercase tracking-[0.16em] outline-none cursor-pointer"
          >
            {SORTS.map((s) => (
              <option
                key={s.value}
                value={s.value}
                className="bg-background text-foreground"
              >
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
