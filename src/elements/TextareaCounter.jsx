// TextareaCounter: grows with its text, and a ring fills toward the limit,
// turning amber near the end and red once you go over.
// Usage: <TextareaCounter max={140} onChange={(text) => setComment(text)} />
import { useRef, useState } from "react";

const css = `
.ui-area {
  --accent: var(--ui-accent, #1a4be0);
  --ink: var(--ui-ink, #111);
  --bg: var(--ui-bg, #fff);
  --soft: var(--ui-soft, #f4f4f4);
  --line: var(--ui-line, #e3e3e3);
  --muted: var(--ui-muted, #6b6b6b);
  --tone: var(--accent);
  display: block;
  width: 300px;
  max-width: 100%;
  padding: 14px 14px 10px;
  border: 1.5px solid var(--line);
  border-radius: 16px;
  background: var(--bg);
  font: inherit;
  text-align: left;
  box-sizing: border-box;
  transition: border-color .2s, box-shadow .2s;
}
.ui-area:focus-within { border-color: var(--accent); box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 16%, transparent); }
.ui-area[data-level="near"] { --tone: #e08a00; }
.ui-area[data-level="over"] { --tone: var(--ui-danger, #d93025); }
.ui-area textarea {
  display: block;
  width: 100%;
  min-height: 48px;
  max-height: 160px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--ink);
  font: inherit;
  font-size: 16px;
  line-height: 24px;
  outline: 0;
  resize: none;
}
.ui-area textarea::placeholder { color: var(--muted); }
.ui-area-foot { display: flex; align-items: center; justify-content: flex-end; gap: 8px; height: 28px; margin-top: 6px; }
.ui-area-left {
  color: var(--tone);
  font-size: 13px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  opacity: 0;
  translate: 8px 0;
  transition: opacity .2s, translate .3s cubic-bezier(.34, 1.56, .64, 1), color .2s;
}
.ui-area:not([data-level="calm"]) .ui-area-left { opacity: 1; translate: 0 0; }
.ui-area svg { rotate: -90deg; transition: scale .3s cubic-bezier(.34, 1.56, .64, 1); }
.ui-area:not([data-level="calm"]) svg { scale: 1.15; }
.ui-area[data-level="over"] svg { animation: ui-area-pulse .4s; }
.ui-area circle { fill: none; stroke-width: 2.5; }
.ui-area circle:first-child { stroke: var(--soft); }
.ui-area circle:last-child { stroke: var(--tone); stroke-linecap: round; transition: stroke-dashoffset .2s, stroke .2s; }
@keyframes ui-area-pulse { 50% { scale: 1.4; } }
@media (prefers-reduced-motion: reduce) {
  :is(.ui-area, .ui-area *), :is(.ui-area, .ui-area *)::before, :is(.ui-area, .ui-area *)::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    transition-delay: 0s !important;
  }
}
`;

const LENGTH = 2 * Math.PI * 9;

export default function TextareaCounter({ max = 140, placeholder = "Write a comment", onChange }) {
  const [text, setText] = useState("");
  const area = useRef(null);
  const left = max - text.length;
  const level = left < 0 ? "over" : left <= 20 ? "near" : "calm";

  const change = (e) => {
    setText(e.target.value);
    onChange?.(e.target.value);
    area.current.style.height = "auto";
    area.current.style.height = area.current.scrollHeight + "px";
  };

  return (
    <label className="ui-area" data-level={level}>
      <style>{css}</style>
      <textarea ref={area} rows={2} value={text} placeholder={placeholder} aria-label={placeholder} aria-invalid={left < 0} onChange={change} />
      <span className="ui-area-foot">
        <span className="ui-area-left" aria-live="polite">{level === "calm" ? "" : left}</span>
        <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="9" strokeDasharray={LENGTH} strokeDashoffset={LENGTH * (1 - Math.min(1, text.length / max))} />
        </svg>
      </span>
    </label>
  );
}
