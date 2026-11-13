// ChipFilter: multi-select chips. A chosen chip fills and widens to make room for its tick.
// Usage: <ChipFilter options={["Vegan", "Spicy"]} onChange={(selected) => setFilters(selected)} />
import { useState } from "react";

const css = `
.ui-chips {
  --accent: var(--ui-accent, #1a4be0);
  --ink: var(--ui-ink, #111);
  --bg: var(--ui-bg, #fff);
  --line: var(--ui-line, #e3e3e3);
  --muted: var(--ui-muted, #6b6b6b);
  display: grid;
  gap: 12px;
  width: 300px;
  max-width: 100%;
  font: inherit;
  font-size: 14px;
}
.ui-chips-row { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
.ui-chip {
  display: inline-flex;
  align-items: center;
  height: 36px;
  padding: 0 14px;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: var(--bg);
  color: var(--ink);
  font: inherit;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: background .25s, color .25s, border-color .25s, scale .25s cubic-bezier(.34, 1.56, .64, 1);
  -webkit-tap-highlight-color: transparent;
}
.ui-chip:hover { border-color: var(--ink); }
.ui-chip:active { scale: .92; }
.ui-chip:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.ui-chip[aria-pressed="true"] { border-color: var(--ink); background: var(--ink); color: var(--bg); }
.ui-chip-tick {
  display: grid;
  place-items: center;
  width: 0;
  overflow: hidden;
  transition: width .35s cubic-bezier(.3, 1.4, .5, 1), margin .35s cubic-bezier(.3, 1.4, .5, 1);
}
.ui-chip[aria-pressed="true"] .ui-chip-tick { width: 14px; margin-right: 6px; }
.ui-chip-tick path { stroke-dasharray: 16; stroke-dashoffset: 16; transition: stroke-dashoffset .15s; }
.ui-chip[aria-pressed="true"] .ui-chip-tick path { stroke-dashoffset: 0; transition: stroke-dashoffset .3s .12s; }
.ui-chips-foot { display: flex; justify-content: center; gap: 12px; height: 20px; color: var(--muted); line-height: 20px; }
.ui-chips-foot button {
  padding: 0;
  border: 0;
  background: none;
  color: var(--accent);
  font: inherit;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}
@media (prefers-reduced-motion: reduce) {
  :is(.ui-chips, .ui-chips *), :is(.ui-chips, .ui-chips *)::before, :is(.ui-chips, .ui-chips *)::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    transition-delay: 0s !important;
  }
}
`;

const OPTIONS = ["Vegetarian", "Vegan", "Gluten-free", "Spicy", "Under 30 min", "Dessert"];

export default function ChipFilter({ options = OPTIONS, defaultSelected = ["Vegan"], onChange }) {
  const [selected, setSelected] = useState(defaultSelected);

  const commit = (next) => {
    setSelected(next);
    onChange?.(next);
  };
  const toggle = (option) => commit(selected.includes(option) ? selected.filter((s) => s !== option) : [...selected, option]);

  return (
    <div className="ui-chips">
      <style>{css}</style>
      <div className="ui-chips-row" role="group" aria-label="Filters">
        {options.map((option) => (
          <button key={option} type="button" className="ui-chip" aria-pressed={selected.includes(option)} onClick={() => toggle(option)}>
            <span className="ui-chip-tick" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 9.5l3.2 3.2L14 5.8" />
              </svg>
            </span>
            {option}
          </button>
        ))}
      </div>
      <div className="ui-chips-foot" aria-live="polite">
        <span>{selected.length ? selected.length + " selected" : "No filters"}</span>
        {selected.length > 0 && <button type="button" onClick={() => commit([])}>Clear</button>}
      </div>
    </div>
  );
}
