// SubmitButton: collapses into a spinner while it works, then opens again with a drawn tick.
// Usage: <SubmitButton onSubmit={() => fetch("/api/send", { method: "POST" })}>Send message</SubmitButton>
// onSubmit may return a promise. Without one the button runs a short demo.
import { useEffect, useRef, useState } from "react";

const css = `
.ui-submit {
  --accent: var(--ui-accent, #1a4be0);
  --on-accent: var(--ui-accent-ink, #fff);
  --ok: var(--ui-success, #1a9a52);
  display: inline-grid;
  grid-template-columns: minmax(0, 1fr);
  place-items: center;
  width: var(--w, 172px);
  height: 48px;
  padding: 0;
  border: 0;
  border-radius: 24px;
  background: var(--accent);
  color: var(--on-accent);
  font: inherit;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  overflow: hidden;
  transition: width .5s cubic-bezier(.3, 1.3, .5, 1), background .3s, scale .2s;
  -webkit-tap-highlight-color: transparent;
}
.ui-submit:hover { scale: 1.03; }
.ui-submit:active { scale: .96; }
.ui-submit:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.ui-submit[data-state="loading"] { width: 48px; pointer-events: none; scale: 1; }
.ui-submit[data-state="done"] { background: var(--ok); color: #fff; pointer-events: none; scale: 1; }
.ui-submit > * {
  grid-area: 1 / 1;
  transition: opacity .2s, translate .35s cubic-bezier(.2, .8, .2, 1), scale .3s;
}
.ui-submit-label { white-space: nowrap; }
.ui-submit:not([data-state="idle"]) .ui-submit-label { opacity: 0; translate: 0 -16px; }
.ui-submit-spin {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2.5px solid color-mix(in srgb, currentColor 30%, transparent);
  border-top-color: currentColor;
  opacity: 0;
  scale: .4;
}
.ui-submit[data-state="loading"] .ui-submit-spin { opacity: 1; scale: 1; animation: ui-submit-spin .7s linear infinite; }
.ui-submit-done { display: flex; align-items: center; gap: 8px; opacity: 0; translate: 0 16px; white-space: nowrap; }
.ui-submit[data-state="done"] .ui-submit-done { opacity: 1; translate: 0 0; }
.ui-submit-done path { stroke-dasharray: 16; stroke-dashoffset: 16; }
.ui-submit[data-state="done"] .ui-submit-done path { stroke-dashoffset: 0; transition: stroke-dashoffset .35s .2s; }
@keyframes ui-submit-spin { to { rotate: 360deg; } }
@media (prefers-reduced-motion: reduce) {
  :is(.ui-submit, .ui-submit *), :is(.ui-submit, .ui-submit *)::before, :is(.ui-submit, .ui-submit *)::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    transition-delay: 0s !important;
  }
  .ui-submit[data-state="loading"] .ui-submit-spin { animation-duration: .7s !important; animation-iteration-count: infinite !important; }
}
`;

export default function SubmitButton({ children = "Send message", doneLabel = "Sent", width = 172, onSubmit }) {
  const [state, setState] = useState("idle"); // idle | loading | done
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);

  const run = async () => {
    if (state !== "idle") return;
    setState("loading");
    try {
      await (onSubmit ? onSubmit() : new Promise((r) => setTimeout(r, 1400)));
    } catch {
      if (alive.current) setState("idle");
      return;
    }
    if (!alive.current) return;
    setState("done");
    setTimeout(() => alive.current && setState("idle"), 1800);
  };

  return (
    <button type="button" className="ui-submit" data-state={state} style={{ "--w": width + "px" }} onClick={run} aria-busy={state === "loading"}>
      <style>{css}</style>
      <span className="ui-submit-label">{children}</span>
      <span className="ui-submit-spin" aria-hidden="true" />
      <span className="ui-submit-done" aria-hidden={state !== "done"}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 9.5l3.2 3.2L14 5.8" />
        </svg>
        {doneLabel}
      </span>
    </button>
  );
}
