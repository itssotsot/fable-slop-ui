// SelectMenu: a custom select. The options unfold in sequence, a single highlight follows
// the pointer or the arrow keys, and the chosen row keeps a drawn tick.
// Usage: <SelectMenu options={[{ value: "done", label: "Done", color: "#1a9a52" }]} onChange={(value) => setStatus(value)} />
// Keyboard: arrows, Home, End, Enter, Escape, or type the first letter.
import { useEffect, useId, useRef, useState } from "react";

const css = `
.ui-select {
  --accent: var(--ui-accent, #1a4be0);
  --ink: var(--ui-ink, #111);
  --bg: var(--ui-bg, #fff);
  --soft: var(--ui-soft, #f4f4f4);
  --line: var(--ui-line, #e3e3e3);
  --muted: var(--ui-muted, #6b6b6b);
  position: relative;
  width: 220px;
  max-width: 100%;
  color: var(--ink);
  font: inherit;
  font-size: 15px;
  text-align: left;
}
.ui-select-button {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: 48px;
  padding: 0 14px;
  border: 1.5px solid var(--line);
  border-radius: 12px;
  background: var(--bg);
  color: inherit;
  font: inherit;
  cursor: pointer;
  transition: border-color .2s, box-shadow .2s;
}
.ui-select-button:hover { border-color: var(--muted); }
.ui-select-button:focus-visible,
.ui-select[data-open="true"] .ui-select-button { border-color: var(--accent); box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 16%, transparent); outline: 0; }
.ui-select-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--dot, var(--muted)); transition: background .3s; }
.ui-select-value { flex: 1; text-align: left; }
.ui-select-value span { display: block; animation: ui-select-swap .3s cubic-bezier(.2, .8, .2, 1); }
.ui-select-chevron { color: var(--muted); transition: rotate .35s cubic-bezier(.34, 1.56, .64, 1); }
.ui-select[data-open="true"] .ui-select-chevron { rotate: 180deg; }
.ui-select-list {
  position: absolute;
  z-index: 10;
  left: 0;
  right: 0;
  top: 56px;
  margin: 0;
  padding: 6px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--bg);
  box-shadow: 0 12px 32px -8px rgb(0 0 0 / .18);
  list-style: none;
  opacity: 0;
  scale: .96;
  translate: 0 -8px;
  transform-origin: 50% 0;
  visibility: hidden;
  transition: opacity .15s, scale .3s cubic-bezier(.3, 1.3, .5, 1), translate .3s cubic-bezier(.3, 1.3, .5, 1), visibility .3s;
}
.ui-select[data-open="true"] .ui-select-list { opacity: 1; scale: 1; translate: 0 0; visibility: visible; }
.ui-select-glide {
  position: absolute;
  left: 6px;
  right: 6px;
  top: 6px;
  height: 40px;
  border-radius: 9px;
  background: var(--soft);
  translate: 0 calc(var(--at) * 40px);
  transition: translate .25s cubic-bezier(.3, 1.3, .5, 1);
}
.ui-select-list li {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  height: 40px;
  padding: 0 10px;
  cursor: pointer;
  opacity: 0;
  translate: 0 -6px;
  transition: opacity .2s, translate .3s cubic-bezier(.2, .8, .2, 1);
}
.ui-select[data-open="true"] .ui-select-list li { opacity: 1; translate: 0 0; transition-delay: calc(var(--i) * 35ms); }
.ui-select-list li span { flex: 1; }
.ui-select-list path { stroke-dasharray: 16; stroke-dashoffset: 16; transition: stroke-dashoffset .3s; }
.ui-select-list li[aria-selected="true"] path { stroke-dashoffset: 0; }
@keyframes ui-select-swap { from { opacity: 0; translate: 0 6px; } }
@media (prefers-reduced-motion: reduce) {
  :is(.ui-select, .ui-select *), :is(.ui-select, .ui-select *)::before, :is(.ui-select, .ui-select *)::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    transition-delay: 0s !important;
  }
}
`;

const OPTIONS = [
  { value: "backlog", label: "Backlog", color: "#9a9a9a" },
  { value: "progress", label: "In progress", color: "#e08a00" },
  { value: "review", label: "In review", color: "#1a4be0" },
  { value: "done", label: "Done", color: "#1a9a52" },
];

export default function SelectMenu({ label = "Status", options = OPTIONS, defaultValue = options[1]?.value, onChange }) {
  const id = useId();
  const root = useRef(null);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const [active, setActive] = useState(Math.max(0, options.findIndex((o) => o.value === defaultValue)));
  const current = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const outside = (e) => !root.current.contains(e.target) && setOpen(false);
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  const choose = (i) => {
    setValue(options[i].value);
    setActive(i);
    setOpen(false);
    onChange?.(options[i].value);
  };

  const key = (e) => {
    const last = options.length - 1;
    if (e.key === "Escape" || e.key === "Tab") return setOpen(false);
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      return open ? choose(active) : setOpen(true);
    }
    const moves = { ArrowDown: Math.min(last, active + 1), ArrowUp: Math.max(0, active - 1), Home: 0, End: last };
    if (e.key in moves) {
      e.preventDefault();
      setOpen(true);
      return setActive(moves[e.key]);
    }
    const typed = options.findIndex((o) => o.label.toLowerCase().startsWith(e.key.toLowerCase()));
    if (e.key.length === 1 && typed >= 0) {
      setOpen(true);
      setActive(typed);
    }
  };

  return (
    <div ref={root} className="ui-select" data-open={open}>
      <style>{css}</style>
      <button
        type="button"
        className="ui-select-button"
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={id}
        aria-activedescendant={open ? id + "-" + active : undefined}
        onClick={() => setOpen(!open)}
        onKeyDown={key}
      >
        <i className="ui-select-dot" style={{ "--dot": current.color }} />
        <span className="ui-select-value"><span key={current.value}>{current.label}</span></span>
        <svg className="ui-select-chevron" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>
      <ul className="ui-select-list" id={id} role="listbox" aria-label={label} style={{ "--at": active }}>
        <span className="ui-select-glide" aria-hidden="true" />
        {options.map((o, i) => (
          <li key={o.value} id={id + "-" + i} role="option" aria-selected={o.value === value} style={{ "--i": i }} onPointerMove={() => setActive(i)} onClick={() => choose(i)}>
            <i className="ui-select-dot" style={{ "--dot": o.color }} />
            <span>{o.label}</span>
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 9.5l3.2 3.2L14 5.8" />
            </svg>
          </li>
        ))}
      </ul>
    </div>
  );
}
