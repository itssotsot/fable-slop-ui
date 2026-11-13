// ShareButton: one button that opens into a row of share actions, each popping in after the last.
// Usage: <ShareButton onShare={(id) => console.log(id)} />   // id: "link" | "email" | "message" | "save"
import { useEffect, useRef, useState } from "react";

const css = `
.ui-share {
  --accent: var(--ui-accent, #1a4be0);
  --ink: var(--ui-ink, #111);
  --bg: var(--ui-bg, #fff);
  --soft: var(--ui-soft, #f4f4f4);
  display: inline-flex;
  align-items: center;
  padding: 4px;
  border-radius: 28px;
  background: var(--soft);
  color: var(--ink);
  font: inherit;
}
.ui-share button {
  display: grid;
  place-items: center;
  border: 0;
  font: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.ui-share button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.ui-share-main {
  grid-auto-flow: column;
  height: 44px;
  padding: 0 13px;
  border-radius: 22px;
  background: var(--ink);
  color: var(--bg);
  font-size: 15px;
  font-weight: 500;
  transition: scale .2s;
}
.ui-share-main:active { scale: .94; }
.ui-share-main svg { transition: rotate .45s cubic-bezier(.34, 1.56, .64, 1); }
.ui-share-main path { transition: opacity .2s; }
.ui-share-main .ui-share-x { opacity: 0; }
.ui-share[data-open="true"] .ui-share-main svg { rotate: 90deg; }
.ui-share[data-open="true"] .ui-share-main .ui-share-up { opacity: 0; }
.ui-share[data-open="true"] .ui-share-main .ui-share-x { opacity: 1; }
.ui-share-word {
  max-width: 60px;
  padding-left: 8px;
  overflow: hidden;
  white-space: nowrap;
  transition: max-width .4s cubic-bezier(.2, .8, .2, 1), padding .4s, opacity .2s;
}
.ui-share[data-open="true"] .ui-share-word { max-width: 0; padding-left: 0; opacity: 0; }
.ui-share-items {
  display: flex;
  gap: 4px;
  max-width: 0;
  overflow: hidden;
  transition: max-width .45s cubic-bezier(.2, .8, .2, 1), padding .45s;
}
.ui-share[data-open="true"] .ui-share-items { max-width: 200px; padding: 0 4px 0 8px; }
.ui-share-items button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: transparent;
  color: var(--ink);
  scale: 0;
  transition: scale .4s cubic-bezier(.34, 1.56, .64, 1), background .2s, color .2s;
}
.ui-share[data-open="true"] .ui-share-items button { scale: 1; transition-delay: calc(var(--i) * 45ms + 80ms), 0s, 0s; }
.ui-share-items button:hover { background: var(--bg); }
.ui-share-items button[data-picked="true"] { background: var(--accent); color: var(--ui-accent-ink, #fff); }
@media (prefers-reduced-motion: reduce) {
  :is(.ui-share, .ui-share *), :is(.ui-share, .ui-share *)::before, :is(.ui-share, .ui-share *)::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    transition-delay: 0s !important;
  }
}
`;

const icon = (d) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

const ACTIONS = [
  { id: "link", label: "Copy link", d: "M7.6 10.4a3 3 0 0 0 4.2 0l2.1-2.1a3 3 0 0 0-4.2-4.2l-.6.6M10.4 7.6a3 3 0 0 0-4.2 0L4.1 9.7a3 3 0 0 0 4.2 4.2l.6-.6" },
  { id: "email", label: "Send by email", d: "M3 4.8h12v8.4H3zM3.3 5.2L9 9.7l5.7-4.5" },
  { id: "message", label: "Send as message", d: "M3.5 4.2h11v7.3H8.8l-3.1 2.5v-2.5H3.5z" },
  { id: "save", label: "Save for later", d: "M5.2 3.2h7.6v11.6L9 12l-3.8 2.8z" },
];

export default function ShareButton({ label = "Share", onShare }) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState(null);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const pick = (id) => {
    setPicked(id);
    onShare?.(id);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setOpen(false);
      setPicked(null);
    }, 700);
  };

  return (
    <div className="ui-share" data-open={open} onKeyDown={(e) => e.key === "Escape" && setOpen(false)}>
      <style>{css}</style>
      <button type="button" className="ui-share-main" aria-expanded={open} aria-label={open ? "Close share options" : label} onClick={() => setOpen(!open)}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path className="ui-share-up" d="M9 11V2.8M6 5.5l3-3 3 3M4 9.5v5h10v-5" />
          <path className="ui-share-x" d="M4.5 4.5l9 9M13.5 4.5l-9 9" />
        </svg>
        <span className="ui-share-word">{label}</span>
      </button>
      <div className="ui-share-items" role="group" aria-label="Share options">
        {ACTIONS.map((a, i) => (
          <button key={a.id} type="button" style={{ "--i": i }} aria-label={a.label} title={a.label} tabIndex={open ? 0 : -1} data-picked={picked === a.id} onClick={() => pick(a.id)}>
            {icon(picked === a.id ? "M4 9.5l3.2 3.2L14 5.8" : a.d)}
          </button>
        ))}
      </div>
    </div>
  );
}
