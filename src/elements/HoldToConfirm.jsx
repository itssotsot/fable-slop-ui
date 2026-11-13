// HoldToConfirm: a destructive action that only fires after a deliberate press and hold.
// Usage: <HoldToConfirm label="Hold to delete" onConfirm={removeItem} />
// Works with mouse, touch and keyboard (hold Space or Enter).
import { useEffect, useRef, useState } from "react";

const css = `
.ui-hold {
  --soft: var(--ui-soft, #f4f4f4);
  --danger: var(--ui-danger, #d93025);
  position: relative;
  display: inline-grid;
  padding: 0;
  border: 0;
  border-radius: 12px;
  background: var(--soft);
  color: var(--danger);
  font: inherit;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
  transition: scale .3s cubic-bezier(.34, 1.56, .64, 1);
  -webkit-tap-highlight-color: transparent;
}
.ui-hold:focus-visible { outline: 2px solid var(--danger); outline-offset: 3px; }
.ui-hold[data-state="holding"] { scale: .96; }
.ui-hold-face {
  grid-area: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 22px;
  white-space: nowrap;
}
.ui-hold-fill {
  background: var(--danger);
  color: #fff;
  clip-path: inset(0 100% 0 0);
  transition: clip-path .35s cubic-bezier(.2, .8, .2, 1);
}
.ui-hold[data-state="holding"] .ui-hold-fill {
  clip-path: inset(0 0 0 0);
  transition: clip-path var(--ms, 1100ms) linear;
}
.ui-hold[data-state="done"] .ui-hold-fill { clip-path: inset(0 0 0 0); transition: none; }
.ui-hold-lid {
  transform-origin: 3px 5px;
  transition: transform .3s cubic-bezier(.34, 1.56, .64, 1);
}
.ui-hold[data-state="holding"] .ui-hold-lid { transform: rotate(-22deg); }
.ui-hold-check { stroke-dasharray: 16; stroke-dashoffset: 16; animation: ui-hold-draw .35s .05s forwards; }
@keyframes ui-hold-draw { to { stroke-dashoffset: 0; } }
@media (prefers-reduced-motion: reduce) {
  :is(.ui-hold, .ui-hold *), :is(.ui-hold, .ui-hold *)::before, :is(.ui-hold, .ui-hold *)::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    transition-delay: 0s !important;
  }
  /* The hold itself is the safeguard, so it keeps its full length. */
  .ui-hold[data-state="holding"] .ui-hold-fill { transition-duration: var(--ms, 1100ms) !important; }
}
`;

const Trash = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path className="ui-hold-lid" d="M3 5h12M7 5V3.2h4V5" />
    <path d="M4.6 7.5l.6 7.3h7.6l.6-7.3" />
  </svg>
);

const Check = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path className="ui-hold-check" d="M4 9.5l3.2 3.2L14 5.8" />
  </svg>
);

export default function HoldToConfirm({ label = "Hold to delete", doneLabel = "Deleted", duration = 1100, onConfirm }) {
  const [state, setState] = useState("idle"); // idle | holding | done
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const start = () => state === "idle" && setState("holding");
  const cancel = () => state === "holding" && setState("idle");
  const finish = (e) => {
    if (state !== "holding" || e.propertyName !== "clip-path") return;
    setState("done");
    onConfirm?.();
    timer.current = setTimeout(() => setState("idle"), 1800);
  };
  const isKey = (e) => e.key === " " || e.key === "Enter";

  return (
    <button
      type="button"
      className="ui-hold"
      data-state={state}
      style={{ "--ms": duration + "ms" }}
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onBlur={cancel}
      onKeyDown={(e) => isKey(e) && !e.repeat && start()}
      onKeyUp={(e) => isKey(e) && cancel()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <style>{css}</style>
      <span className="ui-hold-face"><Trash />{label}</span>
      <span className="ui-hold-face ui-hold-fill" aria-hidden={state !== "done"} onTransitionEnd={finish}>
        {state === "done" ? <><Check />{doneLabel}</> : <><Trash />{label}</>}
      </span>
    </button>
  );
}
