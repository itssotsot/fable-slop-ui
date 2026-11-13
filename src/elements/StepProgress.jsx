// StepProgress: the line between steps fills, finished steps draw a tick, and the current step pulses once.
// Usage: <StepProgress steps={["Cart", "Shipping", "Payment", "Review"]} onChange={(index) => setStep(index)} />
import { useState } from "react";

const css = `
.ui-steps {
  --accent: var(--ui-accent, #1a4be0);
  --on-accent: var(--ui-accent-ink, #fff);
  --ink: var(--ui-ink, #111);
  --bg: var(--ui-bg, #fff);
  --soft: var(--ui-soft, #f4f4f4);
  --line: var(--ui-line, #e3e3e3);
  --muted: var(--ui-muted, #6b6b6b);
  display: grid;
  gap: 20px;
  width: 300px;
  max-width: 100%;
  color: var(--ink);
  font: inherit;
  font-size: 13px;
}
.ui-steps ol { display: flex; align-items: center; margin: 0; padding: 0 16px 26px; list-style: none; }
.ui-steps li { position: relative; display: flex; align-items: center; }
.ui-steps li + li { flex: 1; }
.ui-steps-line { flex: 1; height: 2px; margin: 0 6px; border-radius: 1px; background: var(--line); overflow: hidden; }
.ui-steps-line::after {
  content: "";
  display: block;
  height: 100%;
  background: var(--accent);
  scale: 0 1;
  transform-origin: 0 50%;
  transition: scale .4s cubic-bezier(.4, 0, .2, 1);
}
.ui-steps li:not([data-state="todo"]) .ui-steps-line::after { scale: 1 1; }
.ui-steps-dot {
  position: relative;
  display: grid;
  place-items: center;
  flex: none;
  width: 30px;
  height: 30px;
  border: 1.5px solid var(--line);
  border-radius: 50%;
  background: var(--bg);
  color: var(--muted);
  font-weight: 600;
  box-sizing: border-box;
  transition: background .3s .2s, border-color .3s .2s, color .3s .2s;
}
.ui-steps-dot > * { grid-area: 1 / 1; transition: opacity .2s, scale .3s; }
.ui-steps [data-state="current"] .ui-steps-dot { border-color: var(--accent); color: var(--accent); }
.ui-steps [data-state="current"] .ui-steps-dot::after {
  content: "";
  position: absolute;
  inset: -1.5px;
  border-radius: 50%;
  box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent) 45%, transparent);
  animation: ui-steps-pulse .9s .3s ease-out;
}
.ui-steps [data-state="done"] .ui-steps-dot { border-color: var(--accent); background: var(--accent); color: var(--on-accent); transition-delay: 0s; }
.ui-steps [data-state="done"] .ui-steps-dot span { opacity: 0; scale: .4; }
.ui-steps-dot path { stroke-dasharray: 16; stroke-dashoffset: 16; }
.ui-steps [data-state="done"] .ui-steps-dot path { stroke-dashoffset: 0; transition: stroke-dashoffset .3s .1s; }
.ui-steps-name { position: absolute; right: 15px; top: 38px; color: var(--muted); white-space: nowrap; translate: 50% 0; transition: color .3s; }
.ui-steps li:not([data-state="todo"]) .ui-steps-name { color: var(--ink); }
.ui-steps-actions { display: flex; justify-content: center; gap: 8px; }
.ui-steps-actions button {
  height: 38px;
  padding: 0 16px;
  border: 0;
  border-radius: 19px;
  background: var(--soft);
  color: var(--ink);
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: scale .2s cubic-bezier(.34, 1.56, .64, 1), opacity .2s;
}
.ui-steps-actions button:last-child { min-width: 104px; background: var(--ink); color: var(--bg); }
.ui-steps-actions button:active { scale: .94; }
.ui-steps-actions button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.ui-steps-actions button:disabled { opacity: .4; cursor: default; }
@keyframes ui-steps-pulse { to { box-shadow: 0 0 0 10px transparent; } }
@media (prefers-reduced-motion: reduce) {
  :is(.ui-steps, .ui-steps *), :is(.ui-steps, .ui-steps *)::before, :is(.ui-steps, .ui-steps *)::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    transition-delay: 0s !important;
  }
}
`;

export default function StepProgress({ steps = ["Cart", "Shipping", "Payment", "Review"], defaultStep = 1, onChange }) {
  const [step, setStep] = useState(defaultStep); // steps.length means every step is finished
  const finished = step >= steps.length;

  const go = (next) => {
    setStep(next);
    onChange?.(next);
  };

  return (
    <div className="ui-steps">
      <style>{css}</style>
      <ol>
        {steps.map((name, i) => (
          <li key={name} data-state={i < step ? "done" : i === step ? "current" : "todo"} aria-current={i === step ? "step" : undefined}>
            {i > 0 && <i className="ui-steps-line" />}
            <span className="ui-steps-dot">
              <span>{i + 1}</span>
              <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 9.5l3.2 3.2L14 5.8" />
              </svg>
            </span>
            <span className="ui-steps-name">{name}</span>
          </li>
        ))}
      </ol>
      <div className="ui-steps-actions">
        <button type="button" disabled={step === 0 || finished} onClick={() => go(step - 1)}>Back</button>
        <button type="button" onClick={() => go(finished ? 0 : step + 1)}>
          {finished ? "Start over" : step === steps.length - 1 ? "Finish" : "Continue"}
        </button>
      </div>
    </div>
  );
}
