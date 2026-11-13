// Dock: icons swell as the cursor gets close, their neighbours a little less, like a wave following the pointer.
// Usage: <Dock items={[{ id: "home", label: "Home", icon: <HomeIcon /> }]} onSelect={(id) => open(id)} />
// On touch screens the icons stay at rest size and simply bounce when tapped.
import { useRef, useState } from "react";

const css = `
.ui-dock {
  --accent: var(--ui-accent, #1a4be0);
  --ink: var(--ui-ink, #111);
  --bg: var(--ui-bg, #fff);
  --soft: var(--ui-soft, #f4f4f4);
  --line: var(--ui-line, #e3e3e3);
  display: inline-flex;
  align-items: flex-end;
  gap: 8px;
  max-width: 100%;
  height: 62px;
  padding: 8px;
  border: 1px solid var(--line);
  border-radius: 20px;
  background: var(--soft);
  font: inherit;
  box-sizing: border-box;
}
.ui-dock-item {
  position: relative;
  display: grid;
  place-items: center;
  flex: 0 1 auto;
  width: calc(44px * var(--s, 1));
  min-width: 0;
  aspect-ratio: 1;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: 28%;
  background: var(--bg);
  color: var(--ink);
  cursor: pointer;
  transition: width .16s ease-out, color .2s;
  -webkit-tap-highlight-color: transparent;
}
.ui-dock-item:hover { color: var(--accent); }
.ui-dock-item:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.ui-dock-item svg { width: 50%; height: 50%; }
.ui-dock-item[data-bounce="true"] { animation: ui-dock-bounce .5s cubic-bezier(.3, 0, .5, 1); }
.ui-dock-item::before {
  content: attr(aria-label);
  position: absolute;
  left: 50%;
  bottom: calc(100% + 8px);
  padding: 4px 9px;
  border-radius: 7px;
  background: var(--ink);
  color: var(--bg);
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  opacity: 0;
  translate: -50% 4px;
  pointer-events: none;
  transition: opacity .15s, translate .25s cubic-bezier(.34, 1.56, .64, 1);
}
.ui-dock-item:hover::before,
.ui-dock-item:focus-visible::before { opacity: 1; translate: -50% 0; }
.ui-dock-item::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: -6px;
  width: 4px;
  height: 4px;
  margin-left: -2px;
  border-radius: 50%;
  background: var(--ink);
  scale: 0;
  transition: scale .3s cubic-bezier(.34, 1.56, .64, 1);
}
.ui-dock-item[aria-pressed="true"]::after { scale: 1; }
@keyframes ui-dock-bounce { 30% { translate: 0 -14px; } 60% { translate: 0 0; } 78% { translate: 0 -5px; } }
@media (prefers-reduced-motion: reduce) {
  :is(.ui-dock, .ui-dock *), :is(.ui-dock, .ui-dock *)::before, :is(.ui-dock, .ui-dock *)::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    transition-delay: 0s !important;
  }
}
`;

const glyph = (d) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

const ITEMS = [
  { id: "home", label: "Home", icon: glyph("M4 11l8-6.5 8 6.5M6.5 9.5V19h11V9.5") },
  { id: "search", label: "Search", icon: glyph("M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4") },
  { id: "mail", label: "Mail", icon: glyph("M4 6.5h16v11H4zM4.5 7l7.5 6 7.5-6") },
  { id: "calendar", label: "Calendar", icon: glyph("M5 6.5h14V19H5zM5 10.5h14M8.5 4v4M15.5 4v4") },
  { id: "music", label: "Music", icon: glyph("M9 17.5V6l10-2v11.5M9 17.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM19 15.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z") },
  { id: "settings", label: "Settings", icon: glyph("M5 8h8M17 8h2M5 16h2M11 16h8M15 6v4M9 14v4") },
];

export default function Dock({ items = ITEMS, reach = 120, grow = 0.55, onSelect }) {
  const dock = useRef(null);
  const [open, setOpen] = useState([items[0]?.id]);
  const [bounce, setBounce] = useState(null);

  const swell = (e) => {
    if (e.pointerType !== "mouse") return;
    for (const el of dock.current.querySelectorAll(".ui-dock-item")) {
      const r = el.getBoundingClientRect();
      const distance = Math.abs(e.clientX - (r.left + r.width / 2));
      const near = Math.cos((Math.min(1, distance / reach) * Math.PI) / 2);
      el.style.setProperty("--s", 1 + grow * near);
    }
  };
  const rest = () => {
    for (const el of dock.current.querySelectorAll(".ui-dock-item")) el.style.removeProperty("--s");
  };
  const press = (id) => {
    setBounce(id);
    setOpen((all) => (all.includes(id) ? all.filter((x) => x !== id) : [...all, id]));
    onSelect?.(id);
  };

  return (
    <div ref={dock} className="ui-dock" role="toolbar" aria-label="Dock" onPointerMove={swell} onPointerLeave={rest}>
      <style>{css}</style>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className="ui-dock-item"
          aria-label={item.label}
          aria-pressed={open.includes(item.id)}
          data-bounce={bounce === item.id}
          onClick={() => press(item.id)}
          onAnimationEnd={() => setBounce(null)}
        >
          {item.icon}
        </button>
      ))}
    </div>
  );
}
