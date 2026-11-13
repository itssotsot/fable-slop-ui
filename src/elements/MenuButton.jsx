// MenuButton: three lines fold into a cross, and the menu items drop in one after another.
// Usage: <MenuButton items={[{ label: "Settings", hint: "⌘," }, { label: "Sign out", danger: true }]} onSelect={(label) => run(label)} />
// Closes on Escape, on an outside click, or after a choice. Arrow keys move between items.
import { useEffect, useRef, useState } from "react";

const css = `
.ui-menu {
  --accent: var(--ui-accent, #1a4be0);
  --ink: var(--ui-ink, #111);
  --bg: var(--ui-bg, #fff);
  --soft: var(--ui-soft, #f4f4f4);
  --line: var(--ui-line, #e3e3e3);
  --muted: var(--ui-muted, #6b6b6b);
  position: relative;
  display: inline-block;
  color: var(--ink);
  font: inherit;
  font-size: 15px;
  text-align: left;
}
.ui-menu-toggle {
  position: relative;
  display: block;
  width: 48px;
  height: 48px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--soft);
  color: inherit;
  cursor: pointer;
  transition: background .2s, color .2s, scale .25s cubic-bezier(.34, 1.56, .64, 1);
  -webkit-tap-highlight-color: transparent;
}
.ui-menu-toggle:hover { scale: 1.06; }
.ui-menu-toggle:active { scale: .92; }
.ui-menu-toggle:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.ui-menu[data-open="true"] .ui-menu-toggle { background: var(--ink); color: var(--bg); }
.ui-menu-toggle i {
  position: absolute;
  left: 15px;
  top: 23px;
  width: 18px;
  height: 2px;
  border-radius: 1px;
  background: currentColor;
  transition: translate .4s cubic-bezier(.3, 1.4, .5, 1), rotate .4s cubic-bezier(.3, 1.4, .5, 1), scale .2s;
}
.ui-menu-toggle i:nth-child(1) { translate: 0 -6px; }
.ui-menu-toggle i:nth-child(3) { translate: 0 6px; }
.ui-menu-toggle:hover i:nth-child(2) { scale: .7 1; }
.ui-menu[data-open="true"] .ui-menu-toggle i:nth-child(1) { translate: 0 0; rotate: 45deg; }
.ui-menu[data-open="true"] .ui-menu-toggle i:nth-child(2) { scale: 0 1; }
.ui-menu[data-open="true"] .ui-menu-toggle i:nth-child(3) { translate: 0 0; rotate: -45deg; }
.ui-menu-panel {
  position: absolute;
  z-index: 10;
  left: 50%;
  top: 58px;
  display: grid;
  width: 220px;
  padding: 6px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--bg);
  box-shadow: 0 12px 32px -8px rgb(0 0 0 / .2);
  box-sizing: border-box;
  opacity: 0;
  scale: .92;
  translate: -50% -8px;
  transform-origin: 50% 0;
  visibility: hidden;
  transition: opacity .15s, scale .35s cubic-bezier(.3, 1.4, .5, 1), translate .35s cubic-bezier(.3, 1.4, .5, 1), visibility .35s;
}
.ui-menu[data-open="true"] .ui-menu-panel { opacity: 1; scale: 1; translate: -50% 0; visibility: visible; }
.ui-menu-panel button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
  padding: 0 12px;
  border: 0;
  border-radius: 10px;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  opacity: 0;
  translate: 0 -8px;
  transition: opacity .2s, translate .35s cubic-bezier(.2, .8, .2, 1), background .15s;
}
.ui-menu[data-open="true"] .ui-menu-panel button { opacity: 1; translate: 0 0; transition-delay: calc(var(--i) * 40ms + 40ms), calc(var(--i) * 40ms + 40ms), 0s; }
.ui-menu-panel button:hover,
.ui-menu-panel button:focus-visible { background: var(--soft); outline: 0; }
.ui-menu-panel button[data-danger="true"] { color: var(--ui-danger, #d93025); }
.ui-menu-panel kbd { color: var(--muted); font: inherit; font-size: 13px; }
@media (prefers-reduced-motion: reduce) {
  :is(.ui-menu, .ui-menu *), :is(.ui-menu, .ui-menu *)::before, :is(.ui-menu, .ui-menu *)::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    transition-delay: 0s !important;
  }
}
`;

const ITEMS = [
  { label: "Profile" },
  { label: "Settings", hint: "⌘," },
  { label: "Keyboard shortcuts", hint: "?" },
  { label: "Sign out", danger: true },
];

export default function MenuButton({ items = ITEMS, label = "Menu", onSelect }) {
  const [open, setOpen] = useState(false);
  const root = useRef(null);

  useEffect(() => {
    if (!open) return;
    const outside = (e) => !root.current.contains(e.target) && setOpen(false);
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  const key = (e) => {
    const rows = [...root.current.querySelectorAll(".ui-menu-panel button")];
    const at = rows.indexOf(document.activeElement);
    if (e.key === "Escape") {
      setOpen(false);
      root.current.querySelector(".ui-menu-toggle").focus();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      const step = e.key === "ArrowDown" ? 1 : -1;
      rows[(at + step + rows.length) % rows.length].focus();
    }
  };

  return (
    <div ref={root} className="ui-menu" data-open={open} onKeyDown={key}>
      <style>{css}</style>
      <button type="button" className="ui-menu-toggle" aria-label={label} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>
        <i /><i /><i />
      </button>
      <div className="ui-menu-panel" role="menu" aria-label={label}>
        {items.map((item, i) => (
          <button
            key={item.label}
            type="button"
            role="menuitem"
            tabIndex={open ? 0 : -1}
            style={{ "--i": i }}
            data-danger={item.danger}
            onClick={() => {
              setOpen(false);
              onSelect?.(item.label);
            }}
          >
            {item.label}
            {item.hint && <kbd>{item.hint}</kbd>}
          </button>
        ))}
      </div>
    </div>
  );
}
