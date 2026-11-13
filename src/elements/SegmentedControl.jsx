// SegmentedControl: a single pill slides and resizes to sit under whichever option you pick.
// Usage: <SegmentedControl options={["Day", "Week", "Month"]} value={range} onChange={(option) => setRange(option)} />
// Works controlled (value) or on its own (defaultValue). Arrow keys move the selection.
import { useLayoutEffect, useRef, useState } from "react";

const css = `
.ui-segments {
  --accent: var(--ui-accent, #1a4be0);
  --ink: var(--ui-ink, #111);
  --bg: var(--ui-bg, #fff);
  --soft: var(--ui-soft, #f4f4f4);
  --muted: var(--ui-muted, #6b6b6b);
  position: relative;
  display: inline-flex;
  padding: 4px;
  border-radius: 14px;
  background: var(--soft);
  font: inherit;
  font-size: 15px;
}
.ui-segments-pill {
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: 0;
  border-radius: 10px;
  background: var(--bg);
  box-shadow: 0 1px 2px rgb(0 0 0 / .12), 0 4px 10px -4px rgb(0 0 0 / .18);
}
.ui-segments[data-ready="true"] .ui-segments-pill {
  transition: translate .45s cubic-bezier(.3, 1.35, .5, 1), width .45s cubic-bezier(.3, 1.35, .5, 1);
}
.ui-segments button {
  position: relative;
  height: 36px;
  padding: 0 16px;
  border: 0;
  border-radius: 10px;
  background: none;
  color: var(--muted);
  font: inherit;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: color .25s, scale .2s;
  -webkit-tap-highlight-color: transparent;
}
.ui-segments button:hover { color: var(--ink); }
.ui-segments button:active { scale: .94; }
.ui-segments button[aria-checked="true"] { color: var(--ink); }
.ui-segments button:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
@media (prefers-reduced-motion: reduce) {
  :is(.ui-segments, .ui-segments *), :is(.ui-segments, .ui-segments *)::before, :is(.ui-segments, .ui-segments *)::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    transition-delay: 0s !important;
  }
}
`;

export default function SegmentedControl({ options = ["Day", "Week", "Month", "Year"], value, defaultValue = options[1] ?? options[0], onChange, label = "View" }) {
  const [inner, setInner] = useState(defaultValue);
  const [pill, setPill] = useState(null);
  const [ready, setReady] = useState(false);
  const root = useRef(null);
  const current = value ?? inner;
  const at = Math.max(0, options.indexOf(current));

  // Measure the chosen button, and again whenever the control resizes (fonts loading, layout changes).
  useLayoutEffect(() => {
    const measure = () => {
      const button = root.current?.querySelectorAll("button")[at];
      if (button) setPill({ left: button.offsetLeft, width: button.offsetWidth });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root.current);
    const frame = requestAnimationFrame(() => setReady(true));
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [at, options.length]);

  const choose = (i) => {
    setInner(options[i]);
    onChange?.(options[i]);
  };
  const key = (e) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const next = (at + step + options.length) % options.length;
    choose(next);
    root.current.querySelectorAll("button")[next].focus();
  };

  return (
    <div ref={root} className="ui-segments" role="radiogroup" aria-label={label} data-ready={ready} onKeyDown={key}>
      <style>{css}</style>
      {pill && <span className="ui-segments-pill" style={{ width: pill.width, translate: pill.left + "px 0" }} />}
      {options.map((option, i) => (
        <button key={option} type="button" role="radio" aria-checked={i === at} tabIndex={i === at ? 0 : -1} onClick={() => choose(i)}>
          {option}
        </button>
      ))}
    </div>
  );
}
