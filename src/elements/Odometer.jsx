// Odometer: each digit sits on its own reel and rolls to the new value, the last digit first.
// Usage: <Odometer value={steps} label="Steps today" />
// Without a value it keeps its own count and shows a button to add to it.
import { useState } from "react";

const css = `
.ui-odo {
  --accent: var(--ui-accent, #1a4be0);
  --ink: var(--ui-ink, #111);
  --bg: var(--ui-bg, #fff);
  --soft: var(--ui-soft, #f4f4f4);
  --muted: var(--ui-muted, #6b6b6b);
  display: inline-grid;
  justify-items: center;
  gap: 6px;
  color: var(--ink);
  font: inherit;
}
.ui-odo-label { color: var(--muted); font-size: 14px; }
.ui-odo-number {
  display: flex;
  font-size: 52px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  letter-spacing: -.03em;
  line-height: 1.15;
}
.ui-odo-digit { display: block; height: 1.15em; overflow: hidden; animation: ui-odo-grow .5s cubic-bezier(.3, 1.3, .5, 1); }
.ui-odo-reel { display: grid; transition: transform .9s cubic-bezier(.2, 1, .2, 1) calc(var(--i) * 45ms); }
.ui-odo-reel span { height: 1.15em; }
.ui-odo button {
  height: 38px;
  margin-top: 10px;
  padding: 0 16px;
  border: 0;
  border-radius: 19px;
  background: var(--soft);
  color: var(--ink);
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background .2s, color .2s, scale .25s cubic-bezier(.34, 1.56, .64, 1);
  -webkit-tap-highlight-color: transparent;
}
.ui-odo button:hover { background: var(--ink); color: var(--bg); }
.ui-odo button:active { scale: .92; }
.ui-odo button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
@keyframes ui-odo-grow { from { max-width: 0; opacity: 0; } to { max-width: 1ch; } }
@media (prefers-reduced-motion: reduce) {
  :is(.ui-odo, .ui-odo *), :is(.ui-odo, .ui-odo *)::before, :is(.ui-odo, .ui-odo *)::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    transition-delay: 0s !important;
  }
}
`;

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export default function Odometer({ value, label = "Steps today", addLabel = "Add a walk" }) {
  const [own, setOwn] = useState(8420);
  const number = value ?? own;
  const chars = Math.round(number).toLocaleString("en-US").split("");

  return (
    <div className="ui-odo">
      <style>{css}</style>
      <span className="ui-odo-label">{label}</span>
      <span className="ui-odo-number" role="img" aria-label={chars.join("")}>
        {chars.map((char, i) => {
          const place = chars.length - i; // keyed from the right, so digits keep their reel as the number grows
          return /\d/.test(char) ? (
            <span key={place} className="ui-odo-digit" aria-hidden="true">
              <span className="ui-odo-reel" style={{ "--i": place - 1, transform: "translateY(" + -char * 10 + "%)" }}>
                {DIGITS.map((d) => <span key={d}>{d}</span>)}
              </span>
            </span>
          ) : (
            <span key={place} aria-hidden="true">{char}</span>
          );
        })}
      </span>
      {value == null && (
        <button type="button" onClick={() => setOwn(own + 400 + Math.floor(Math.random() * 2400))}>{addLabel}</button>
      )}
    </div>
  );
}
