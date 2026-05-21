"use client";

export type SortKey = "newest" | "oldest" | "most-raised" | "ending-soon";
export type StatusFilter = "all" | "active" | "successful" | "failed" | "cancelled";

export const CATEGORIES = [
  { value: "all", label: "All categories" },
  { value: "charity", label: "💚 Charity" },
  { value: "creator", label: "🎨 Creator" },
  { value: "public-good", label: "🛠️ Public good" },
  { value: "personal", label: "🙏 Personal" },
  { value: "religious", label: "🕌 Religious" },
  { value: "emergency", label: "🚨 Emergency" },
  { value: "other", label: "✨ Other" },
];

export type FilterState = {
  search: string;
  category: string;
  status: StatusFilter;
  sort: SortKey;
};

export const DEFAULT_FILTERS: FilterState = {
  search: "",
  category: "all",
  status: "all",
  sort: "newest",
};

export function Filters({
  state,
  onChange,
  resultsCount,
}: {
  state: FilterState;
  onChange: (s: FilterState) => void;
  resultsCount: number;
}) {
  function patch<K extends keyof FilterState>(k: K, v: FilterState[K]) {
    onChange({ ...state, [k]: v });
  }

  return (
    <div className="card space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-5">
          <input
            className="input"
            placeholder="Search by title, description, or category…"
            value={state.search}
            onChange={(e) => patch("search", e.target.value)}
          />
        </div>
        <div className="md:col-span-3">
          <select
            className="input"
            value={state.category}
            onChange={(e) => patch("category", e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <select
            className="input"
            value={state.status}
            onChange={(e) => patch("status", e.target.value as StatusFilter)}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="successful">Successful</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <select
            className="input"
            value={state.sort}
            onChange={(e) => patch("sort", e.target.value as SortKey)}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="most-raised">Most raised</option>
            <option value="ending-soon">Ending soon</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted">
        <span>
          {resultsCount} {resultsCount === 1 ? "campaign" : "campaigns"} found
        </span>
        {(state.search ||
          state.category !== "all" ||
          state.status !== "all" ||
          state.sort !== "newest") && (
          <button
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="hover:text-white"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
