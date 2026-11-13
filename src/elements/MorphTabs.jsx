// MorphTabs: the underline travels and resizes to the chosen tab, and the panel slides in
// from the side you moved toward.
// Usage: <MorphTabs tabs={[{ id: "overview", label: "Overview", body: <Overview /> }]} onChange={(id) => setTab(id)} />
// Keyboard: left and right arrows, Home and End.
import { useId, useLayoutEffect, useRef, useState } from "react";

const css = `
.ui-tabs {
  --accent: var(--ui-accent, #1a4be0);
  --ink: var(--ui-ink, #111);
  --line: var(--ui-line, #e3e3e3);
  --muted: var(--ui-muted, #6b6b6b);
  width: 300px;
  max-width: 100%;
  color: var(--ink);
  font: inherit;
  font-size: 15px;
  text-align: left;
}
.ui-tabs-list { position: relative; display: flex; gap: 4px; border-bottom: 1px solid var(--line); }
.ui-tabs-list button {
  height: 44px;
  padding: 0 12px;
  border: 0;
  border-radius: 8px 8px 0 0;
  background: none;
  color: var(--muted);
  font: inherit;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: color .2s;
  -webkit-tap-highlight-color: transparent;
}
.ui-tabs-list button:hover,
.ui-tabs-list button[aria-selected="true"] { color: var(--ink); }
.ui-tabs-list button:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
.ui-tabs-line { position: absolute; left: 0; bottom: -1px; height: 2px; border-radius: 1px; background: var(--accent); }
.ui-tabs[data-ready="true"] .ui-tabs-line { transition: translate .45s cubic-bezier(.3, 1.35, .5, 1), width .45s cubic-bezier(.3, 1.35, .5, 1); }
.ui-tabs-view { overflow: hidden; }
.ui-tabs-panel { min-height: 72px; padding: 16px 12px 0; color: var(--muted); line-height: 1.5; outline: 0; animation: ui-tabs-in .4s cubic-bezier(.2, .8, .2, 1); }
.ui-tabs-panel[data-dir="-1"] { --from: -28px; }
@keyframes ui-tabs-in { from { opacity: 0; translate: var(--from, 28px) 0; } }
@media (prefers-reduced-motion: reduce) {
  :is(.ui-tabs, .ui-tabs *), :is(.ui-tabs, .ui-tabs *)::before, :is(.ui-tabs, .ui-tabs *)::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    transition-delay: 0s !important;
  }
}
`;

const TABS = [
  { id: "overview", label: "Overview", body: "A summary of the project and where it stands today." },
  { id: "activity", label: "Activity", body: "Everything that changed over the last seven days." },
  { id: "members", label: "Members", body: "The people who can view and edit this project." },
];

export default function MorphTabs({ tabs = TABS, defaultTab = tabs[0].id, onChange }) {
  const id = useId();
  const list = useRef(null);
  const [current, setCurrent] = useState(defaultTab);
  const [dir, setDir] = useState(1);
  const [line, setLine] = useState(null);
  const [ready, setReady] = useState(false);
  const at = Math.max(0, tabs.findIndex((t) => t.id === current));

  useLayoutEffect(() => {
    const measure = () => {
      const tab = list.current?.querySelectorAll("button")[at];
      if (tab) setLine({ left: tab.offsetLeft + 12, width: tab.offsetWidth - 24 });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list.current);
    const frame = requestAnimationFrame(() => setReady(true));
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [at, tabs.length]);

  const go = (i) => {
    if (i === at) return;
    setDir(i > at ? 1 : -1);
    setCurrent(tabs[i].id);
    onChange?.(tabs[i].id);
  };
  const key = (e) => {
    const last = tabs.length - 1;
    const moves = { ArrowRight: at === last ? 0 : at + 1, ArrowLeft: at === 0 ? last : at - 1, Home: 0, End: last };
    if (!(e.key in moves)) return;
    e.preventDefault();
    go(moves[e.key]);
    list.current.querySelectorAll("button")[moves[e.key]].focus();
  };

  return (
    <div className="ui-tabs" data-ready={ready}>
      <style>{css}</style>
      <div ref={list} className="ui-tabs-list" role="tablist" onKeyDown={key}>
        {tabs.map((t, i) => (
          <button key={t.id} type="button" role="tab" id={id + t.id} aria-selected={i === at} aria-controls={id + "panel"} tabIndex={i === at ? 0 : -1} onClick={() => go(i)}>
            {t.label}
          </button>
        ))}
        {line && <span className="ui-tabs-line" style={{ width: line.width, translate: line.left + "px 0" }} />}
      </div>
      <div className="ui-tabs-view">
        <div key={current} className="ui-tabs-panel" role="tabpanel" id={id + "panel"} aria-labelledby={id + current} data-dir={dir}>
          {tabs[at].body}
        </div>
      </div>
    </div>
  );
}
