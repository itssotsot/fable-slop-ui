// ProgressBar: the percentage rides on the leading edge of the bar and turns into a tick at the end.
// Usage: <ProgressBar value={percent} label="Uploading photos" />   // value: 0 to 100
// Without a value it runs a demo you can replay.
import { useEffect, useState } from "react";

const css = `
.ui-progress {
  --accent: var(--ui-accent, #1a4be0);
  --on-accent: var(--ui-accent-ink, #fff);
  --ink: var(--ui-ink, #111);
  --soft: var(--ui-soft, #f4f4f4);
  --muted: var(--ui-muted, #6b6b6b);
  --tone: var(--accent);
  --tone-ink: var(--on-accent);
  width: 280px;
  max-width: 100%;
  color: var(--ink);
  font: inherit;
  font-size: 14px;
  text-align: left;
}
.ui-progress[data-done="true"] { --tone: var(--ui-success, #1a9a52); --tone-ink: #fff; }
.ui-progress-rail { position: relative; padding-top: 38px; }
.ui-progress-bubble {
  position: absolute;
  top: 0;
  left: clamp(20px, calc(var(--p) * 1%), calc(100% - 20px));
  display: grid;
  place-items: center;
  min-width: 40px;
  height: 26px;
  padding: 0 7px;
  border-radius: 9px;
  background: var(--tone);
  color: var(--tone-ink);
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  box-sizing: border-box;
  translate: -50% 0;
  transition: left .35s cubic-bezier(.2, .8, .2, 1), background .3s;
}
.ui-progress-bubble::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 100%;
  width: 8px;
  height: 8px;
  margin: -5px 0 0 -4px;
  border-radius: 2px;
  background: inherit;
  rotate: 45deg;
}
.ui-progress[data-done="true"] .ui-progress-bubble { animation: ui-progress-pop .5s cubic-bezier(.3, 1.8, .5, 1); }
.ui-progress-bubble path { stroke-dasharray: 16; animation: ui-progress-draw .35s .1s backwards; }
.ui-progress-track { height: 10px; border-radius: 5px; background: var(--soft); overflow: hidden; }
.ui-progress-fill {
  position: relative;
  width: calc(var(--p) * 1%);
  height: 100%;
  border-radius: 5px;
  background: var(--tone);
  overflow: hidden;
  transition: width .35s cubic-bezier(.2, .8, .2, 1), background .3s;
}
.ui-progress-fill::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(100deg, transparent 30%, rgb(255 255 255 / .45) 50%, transparent 70%);
  animation: ui-progress-sheen 1.2s linear infinite;
}
.ui-progress[data-done="true"] .ui-progress-fill::after { animation: none; opacity: 0; }
.ui-progress-foot { display: flex; align-items: center; justify-content: space-between; height: 24px; margin-top: 10px; color: var(--muted); }
.ui-progress-foot span { animation: ui-progress-note .3s; }
.ui-progress-foot button {
  padding: 0;
  border: 0;
  background: none;
  color: var(--accent);
  font: inherit;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
  animation: ui-progress-note .3s;
}
@keyframes ui-progress-sheen { from { translate: -100% 0; } to { translate: 100% 0; } }
@keyframes ui-progress-pop { 0% { scale: .6; } }
@keyframes ui-progress-draw { from { stroke-dashoffset: 16; } }
@keyframes ui-progress-note { from { opacity: 0; translate: 0 4px; } }
@media (prefers-reduced-motion: reduce) {
  :is(.ui-progress, .ui-progress *), :is(.ui-progress, .ui-progress *)::before, :is(.ui-progress, .ui-progress *)::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    transition-delay: 0s !important;
  }
}
`;

export default function ProgressBar({ value, label = "Uploading photos", doneLabel = "Upload complete" }) {
  const [demo, setDemo] = useState(0);
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (value != null) return;
    let v = 0;
    const timer = setInterval(() => {
      v = Math.min(100, v + 4 + Math.random() * 16);
      setDemo(Math.round(v));
      if (v >= 100) clearInterval(timer);
    }, 320);
    return () => clearInterval(timer);
  }, [run, value]);

  const percent = Math.max(0, Math.min(100, value ?? demo));
  const done = percent >= 100;

  return (
    <div className="ui-progress" data-done={done} style={{ "--p": percent }}>
      <style>{css}</style>
      <div className="ui-progress-rail">
        <span className="ui-progress-bubble" aria-hidden="true">
          {done ? (
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 9.5l3.2 3.2L14 5.8" />
            </svg>
          ) : (
            percent + "%"
          )}
        </span>
        <div className="ui-progress-track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
          <div className="ui-progress-fill" />
        </div>
      </div>
      <div className="ui-progress-foot">
        <span key={String(done)}>{done ? doneLabel : label}</span>
        {done && value == null && <button type="button" onClick={() => { setDemo(0); setRun(run + 1); }}>Run again</button>}
      </div>
    </div>
  );
}
