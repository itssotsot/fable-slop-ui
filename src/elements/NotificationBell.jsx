// NotificationBell: the bell swings on hover, the badge pops, and marking everything read
// clears the dots one by one.
// Usage: <NotificationBell items={[{ id: 1, title: "Build finished", time: "1 h" }]} onRead={() => markAllRead()} />
import { useEffect, useRef, useState } from "react";

const css = `
.ui-bell {
  --accent: var(--ui-accent, #1a4be0);
  --on-accent: var(--ui-accent-ink, #fff);
  --ink: var(--ui-ink, #111);
  --bg: var(--ui-bg, #fff);
  --soft: var(--ui-soft, #f4f4f4);
  --line: var(--ui-line, #e3e3e3);
  --muted: var(--ui-muted, #6b6b6b);
  position: relative;
  display: inline-block;
  color: var(--ink);
  font: inherit;
  font-size: 14px;
  text-align: left;
}
.ui-bell-button {
  position: relative;
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--soft);
  color: inherit;
  cursor: pointer;
  transition: scale .25s cubic-bezier(.34, 1.56, .64, 1);
  -webkit-tap-highlight-color: transparent;
}
.ui-bell-button:active { scale: .92; }
.ui-bell-button:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.ui-bell-button svg { transform-origin: 50% 12%; }
.ui-bell-button:hover svg { animation: ui-bell-swing .8s ease-in-out; }
.ui-bell-button:hover .ui-bell-clapper { animation: ui-bell-clap .8s ease-in-out; }
.ui-bell-badge {
  position: absolute;
  right: 4px;
  top: 4px;
  display: grid;
  place-items: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: var(--accent);
  color: var(--on-accent);
  font-size: 11px;
  font-weight: 600;
  box-shadow: 0 0 0 2px var(--bg);
  box-sizing: border-box;
  transition: scale .35s cubic-bezier(.34, 1.56, .64, 1);
}
.ui-bell-badge[data-on="false"] { scale: 0; }
.ui-bell-panel {
  position: absolute;
  z-index: 10;
  left: 50%;
  top: 58px;
  width: 264px;
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
.ui-bell[data-open="true"] .ui-bell-panel { opacity: 1; scale: 1; translate: -50% 0; visibility: visible; }
.ui-bell-head { display: flex; align-items: center; justify-content: space-between; padding: 6px 10px 8px; font-weight: 500; }
.ui-bell-head button {
  padding: 0;
  border: 0;
  background: none;
  color: var(--accent);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
  transition: opacity .2s;
}
.ui-bell-head button:disabled { opacity: 0; }
.ui-bell-panel ul { margin: 0; padding: 0; list-style: none; }
.ui-bell-panel li {
  display: grid;
  grid-template-columns: 8px 1fr auto;
  align-items: center;
  gap: 10px;
  height: 40px;
  padding: 0 10px;
  border-radius: 10px;
  opacity: 0;
  translate: 0 -6px;
  transition: opacity .2s, translate .35s cubic-bezier(.2, .8, .2, 1), background .15s;
}
.ui-bell[data-open="true"] .ui-bell-panel li { opacity: 1; translate: 0 0; transition-delay: calc(var(--i) * 45ms + 60ms), calc(var(--i) * 45ms + 60ms), 0s; }
.ui-bell-panel li:hover { background: var(--soft); }
.ui-bell-panel li i { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); transition: scale .3s calc(var(--i) * 70ms) cubic-bezier(.5, -0.6, .7, 1); }
.ui-bell[data-read="true"] .ui-bell-panel li i { scale: 0; }
.ui-bell-panel li span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-bell-panel time { color: var(--muted); font-size: 12px; }
@keyframes ui-bell-swing { 20% { rotate: 14deg; } 40% { rotate: -11deg; } 60% { rotate: 7deg; } 80% { rotate: -3deg; } }
@keyframes ui-bell-clap { 20% { translate: -2px 0; } 40% { translate: 2px 0; } 60% { translate: -1px 0; } 80% { translate: 1px 0; } }
@media (prefers-reduced-motion: reduce) {
  :is(.ui-bell, .ui-bell *), :is(.ui-bell, .ui-bell *)::before, :is(.ui-bell, .ui-bell *)::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    transition-delay: 0s !important;
  }
}
`;

const ITEMS = [
  { id: 1, title: "New comment on Homepage", time: "2 min" },
  { id: 2, title: "Build finished", time: "1 h" },
  { id: 3, title: "Invoice paid", time: "Yesterday" },
];

export default function NotificationBell({ items = ITEMS, onRead }) {
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState(false);
  const root = useRef(null);

  useEffect(() => {
    if (!open) return;
    const outside = (e) => !root.current.contains(e.target) && setOpen(false);
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  const unread = read ? 0 : items.length;

  return (
    <div ref={root} className="ui-bell" data-open={open} data-read={read} onKeyDown={(e) => e.key === "Escape" && setOpen(false)}>
      <style>{css}</style>
      <button type="button" className="ui-bell-button" aria-expanded={open} aria-label={"Notifications, " + unread + " unread"} onClick={() => setOpen(!open)}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5.5 17h13l-1.5-2.4V10a5 5 0 0 0-10 0v4.6z" />
          <path className="ui-bell-clapper" d="M10.2 19.8a1.9 1.9 0 0 0 3.6 0" />
        </svg>
        <span className="ui-bell-badge" data-on={unread > 0} aria-hidden="true">{items.length}</span>
      </button>
      <div className="ui-bell-panel" role="dialog" aria-label="Notifications">
        <div className="ui-bell-head">
          Notifications
          <button
            type="button"
            disabled={read}
            tabIndex={open && !read ? 0 : -1}
            onClick={() => {
              setRead(true);
              onRead?.();
            }}
          >
            Mark all read
          </button>
        </div>
        <ul>
          {items.map((item, i) => (
            <li key={item.id} style={{ "--i": i }}>
              <i aria-hidden="true" />
              <span>{item.title}</span>
              <time>{item.time}</time>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
