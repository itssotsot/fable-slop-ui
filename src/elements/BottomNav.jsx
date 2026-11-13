// BottomNav: a tab bar where the active tab opens to show its label and the others close up.
// Usage: <BottomNav items={[{ id: "home", label: "Home", icon: <HomeIcon /> }]} onChange={(id) => go(id)} />
import { useState } from "react";

const css = `
.ui-nav {
  --accent: var(--ui-accent, #1a4be0);
  --ink: var(--ui-ink, #111);
  --bg: var(--ui-bg, #fff);
  --line: var(--ui-line, #e3e3e3);
  --muted: var(--ui-muted, #6b6b6b);
  display: inline-flex;
  gap: 4px;
  padding: 6px;
  border: 1px solid var(--line);
  border-radius: 26px;
  background: var(--bg);
  box-shadow: 0 10px 28px -12px rgb(0 0 0 / .25);
  font: inherit;
  font-size: 14px;
}
.ui-nav button {
  display: flex;
  align-items: center;
  height: 44px;
  padding: 0 14px;
  border: 0;
  border-radius: 22px;
  background: none;
  color: var(--muted);
  font: inherit;
  font-weight: 500;
  cursor: pointer;
  transition: background .3s, color .3s;
  -webkit-tap-highlight-color: transparent;
}
.ui-nav button:hover { color: var(--ink); }
.ui-nav button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.ui-nav button[aria-current="page"] { background: color-mix(in srgb, var(--accent) 12%, var(--bg)); color: var(--accent); }
.ui-nav svg { flex: none; transition: scale .25s cubic-bezier(.34, 1.56, .64, 1); }
.ui-nav button:active svg { scale: .8; }
.ui-nav button[aria-current="page"] svg { animation: ui-nav-hop .5s cubic-bezier(.3, 1.6, .5, 1); }
.ui-nav-label {
  max-width: 0;
  overflow: hidden;
  white-space: nowrap;
  opacity: 0;
  transition: max-width .45s cubic-bezier(.3, 1.2, .5, 1), padding .45s cubic-bezier(.3, 1.2, .5, 1), opacity .25s;
}
.ui-nav button[aria-current="page"] .ui-nav-label { max-width: 80px; padding-left: 8px; opacity: 1; }
@keyframes ui-nav-hop { 0% { translate: 0 0; } 40% { translate: 0 -5px; } 100% { translate: 0 0; } }
@media (prefers-reduced-motion: reduce) {
  :is(.ui-nav, .ui-nav *), :is(.ui-nav, .ui-nav *)::before, :is(.ui-nav, .ui-nav *)::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    transition-delay: 0s !important;
  }
}
`;

const glyph = (d) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

const ITEMS = [
  { id: "home", label: "Home", icon: glyph("M4 11l8-6.5 8 6.5M6.5 9.5V19h11V9.5") },
  { id: "search", label: "Search", icon: glyph("M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4") },
  { id: "saved", label: "Saved", icon: glyph("M7 4.5h10V20l-5-3.8L7 20z") },
  { id: "profile", label: "Profile", icon: glyph("M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20c1.2-3.4 4-5 7.5-5s6.3 1.6 7.5 5") },
];

export default function BottomNav({ items = ITEMS, defaultValue = items[0].id, onChange }) {
  const [current, setCurrent] = useState(defaultValue);

  return (
    <nav className="ui-nav" aria-label="Main">
      <style>{css}</style>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          aria-label={item.label}
          aria-current={item.id === current ? "page" : undefined}
          onClick={() => {
            setCurrent(item.id);
            onChange?.(item.id);
          }}
        >
          {item.icon}
          <span className="ui-nav-label" aria-hidden="true">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
