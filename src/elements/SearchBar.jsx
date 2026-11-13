// SearchBar: results open under the field, the matching letters are marked,
// and one highlight glides between rows as you arrow or hover.
// Usage: <SearchBar items={["Billing", "Team members"]} onSelect={(item) => go(item)} />
import { useId, useState } from "react";

const css = `
.ui-search {
  --accent: var(--ui-accent, #1a4be0);
  --ink: var(--ui-ink, #111);
  --bg: var(--ui-bg, #fff);
  --soft: var(--ui-soft, #f4f4f4);
  --line: var(--ui-line, #e3e3e3);
  --muted: var(--ui-muted, #6b6b6b);
  position: relative;
  width: 300px;
  max-width: 100%;
  font: inherit;
  text-align: left;
}
.ui-search-box { position: relative; display: block; color: var(--muted); }
.ui-search-box > svg { position: absolute; left: 16px; top: 15px; transition: color .2s, scale .3s cubic-bezier(.34, 1.56, .64, 1); pointer-events: none; }
.ui-search input {
  width: 100%;
  height: 48px;
  padding: 0 44px 0 44px;
  border: 1.5px solid transparent;
  border-radius: 24px;
  background: var(--soft);
  color: var(--ink);
  font: inherit;
  font-size: 16px;
  outline: 0;
  box-sizing: border-box;
  transition: border-color .2s, background .2s, box-shadow .2s;
}
.ui-search input::placeholder { color: var(--muted); }
.ui-search input:focus { border-color: var(--accent); background: var(--bg); box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 16%, transparent); }
.ui-search input:focus ~ svg { color: var(--accent); scale: 1.1; }
.ui-search-clear {
  position: absolute;
  right: 8px;
  top: 8px;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: none;
  color: var(--muted);
  cursor: pointer;
  scale: 0;
  rotate: -90deg;
  transition: scale .3s cubic-bezier(.34, 1.56, .64, 1), rotate .3s, background .2s;
}
.ui-search-clear[data-on="true"] { scale: 1; rotate: 0deg; }
.ui-search-clear:hover { background: var(--soft); color: var(--ink); }
.ui-search-panel {
  position: absolute;
  z-index: 10;
  left: 0;
  right: 0;
  top: 56px;
  margin: 0;
  padding: 6px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--bg);
  box-shadow: 0 12px 32px -8px rgb(0 0 0 / .18);
  list-style: none;
  opacity: 0;
  scale: .97;
  translate: 0 -6px;
  transform-origin: 50% 0;
  visibility: hidden;
  transition: opacity .15s, scale .25s cubic-bezier(.2, .8, .2, 1), translate .25s cubic-bezier(.2, .8, .2, 1), visibility .25s;
}
.ui-search[data-open="true"] .ui-search-panel { opacity: 1; scale: 1; translate: 0 0; visibility: visible; }
.ui-search-glide {
  position: absolute;
  left: 6px;
  right: 6px;
  top: 6px;
  height: 40px;
  border-radius: 10px;
  background: var(--soft);
  translate: 0 calc(var(--at) * 40px);
  transition: translate .25s cubic-bezier(.3, 1.3, .5, 1);
}
.ui-search-panel li {
  position: relative;
  height: 40px;
  padding: 0 12px;
  border-radius: 10px;
  color: var(--ink);
  font-size: 15px;
  line-height: 40px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}
.ui-search-panel mark { background: none; color: var(--accent); font-weight: 600; }
.ui-search-panel li[data-empty] { color: var(--muted); cursor: default; }
@media (prefers-reduced-motion: reduce) {
  :is(.ui-search, .ui-search *), :is(.ui-search, .ui-search *)::before, :is(.ui-search, .ui-search *)::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    transition-delay: 0s !important;
  }
}
`;

const ITEMS = ["Account settings", "Appearance", "Billing and invoices", "Keyboard shortcuts", "Notifications", "Team members"];

export default function SearchBar({ items = ITEMS, placeholder = "Search settings", onSelect }) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const needle = query.trim().toLowerCase();
  const results = items.filter((item) => item.toLowerCase().includes(needle)).slice(0, 5);

  const choose = (item) => {
    setQuery(item);
    setOpen(false);
    onSelect?.(item);
  };

  const key = (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((a) => (a + step + results.length) % Math.max(1, results.length));
    } else if (e.key === "Enter" && open && results[active]) {
      choose(results[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const marked = (item) => {
    const at = needle ? item.toLowerCase().indexOf(needle) : -1;
    if (at < 0) return item;
    return <>{item.slice(0, at)}<mark>{item.slice(at, at + needle.length)}</mark>{item.slice(at + needle.length)}</>;
  };

  return (
    <div className="ui-search" data-open={open}>
      <style>{css}</style>
      <label className="ui-search-box">
        <input
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-label={placeholder}
          autoComplete="off"
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={key}
        />
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <circle cx="8" cy="8" r="5.2" />
          <path d="M12 12l3.5 3.5" />
        </svg>
        <button
          type="button"
          className="ui-search-clear"
          data-on={query !== ""}
          tabIndex={query ? 0 : -1}
          aria-label="Clear search"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setQuery("");
            setActive(0);
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M3 3l8 8M11 3l-8 8" />
          </svg>
        </button>
      </label>
      <ul className="ui-search-panel" id={listId} role="listbox" aria-label={placeholder} style={{ "--at": active }} onMouseDown={(e) => e.preventDefault()}>
        {results.length > 0 && <span className="ui-search-glide" aria-hidden="true" />}
        {results.map((item, i) => (
          <li key={item} role="option" aria-selected={i === active} onPointerMove={() => setActive(i)} onClick={() => choose(item)}>
            {marked(item)}
          </li>
        ))}
        {results.length === 0 && <li data-empty>Nothing matches "{query.trim()}"</li>}
      </ul>
    </div>
  );
}
