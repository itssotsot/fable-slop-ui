// Dialog: a confirm dialog for something that cannot be undone, and it feels like it.
// The trigger fills with moving hazard stripes and its bin opens when you hover. The dialog slams
// in and rattles under a strip of warning tape, over a backdrop that goes red. Confirm, and a crack
// runs down the middle, the dialog breaks in two, the halves fall away and debris flies from the split.
// Cancelling just eases it out.
// It is built on the native <dialog> element, so focus is trapped, Escape works and the page behind is inert.
// Usage: <Dialog trigger="Delete project" title="Delete this project?" confirmLabel="Delete" onConfirm={remove}>
//          This removes the project for everyone.
//        </Dialog>
import { useId, useRef, useState } from "react";

const css = `
.ui-dialog-trigger, .ui-dialog {
  --accent: var(--ui-accent, #1a4be0);
  --ink: var(--ui-ink, #111);
  --bg: var(--ui-bg, #fff);
  --soft: var(--ui-soft, #f4f4f4);
  --line: var(--ui-line, #e3e3e3);
  --muted: var(--ui-muted, #6b6b6b);
  --danger: var(--ui-danger, #d93025);
  --danger-dark: color-mix(in srgb, var(--danger) 72%, #000);
  --tape: repeating-linear-gradient(-45deg, var(--danger) 0 10px, var(--danger-dark) 10px 20px);
  font: inherit;
}
.ui-dialog-trigger {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  height: 48px;
  padding: 0 22px 0 18px;
  border: 1.5px solid color-mix(in srgb, var(--danger) 40%, var(--line));
  border-radius: 24px;
  background: var(--bg);
  color: var(--danger);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  overflow: hidden;
  isolation: isolate;
  transition: border-color .2s, color .25s, scale .25s cubic-bezier(.34, 1.56, .64, 1);
  -webkit-tap-highlight-color: transparent;
}
.ui-dialog-trigger::before {
  content: "";
  position: absolute;
  z-index: -1;
  inset: 0 -30px 0 0;
  background: var(--tape);
  translate: 0 101%;
  transition: translate .35s cubic-bezier(.2, .8, .2, 1);
  animation: ui-dialog-tape .6s linear infinite;
}
.ui-dialog-trigger:hover { border-color: var(--danger); color: #fff; animation: ui-dialog-tremble .28s linear infinite; }
.ui-dialog-trigger:hover::before { translate: 0 0; }
.ui-dialog-trigger:active { scale: .94; }
.ui-dialog-trigger:focus-visible { outline: 2px solid var(--danger); outline-offset: 3px; }
.ui-dialog-lid { transform-box: fill-box; transform-origin: 0 100%; transition: rotate .3s cubic-bezier(.34, 1.56, .64, 1), translate .3s; }
.ui-dialog-trigger:hover .ui-dialog-lid { rotate: -28deg; translate: 0 -1px; }

.ui-dialog {
  width: min(380px, calc(100vw - 32px));
  padding: 0;
  border: 0;
  background: none;
  color: var(--ink);
  text-align: left;
  overflow: visible;
}
.ui-dialog[open] { animation: ui-dialog-slam .55s cubic-bezier(.2, .9, .3, 1); }
.ui-dialog[open]::backdrop {
  background: radial-gradient(circle, rgb(0 0 0 / .45), color-mix(in srgb, var(--danger) 55%, rgb(0 0 0 / .75)));
  backdrop-filter: blur(4px) saturate(.6);
  animation: ui-dialog-fade .3s;
}
.ui-dialog[data-mode="closing"] { animation: ui-dialog-out .18s ease-in forwards; }
.ui-dialog[data-mode="closing"]::backdrop { animation: ui-dialog-fade .18s reverse forwards; }
.ui-dialog[data-mode="destroy"] { animation: none; }
.ui-dialog[data-mode="destroy"]::backdrop { animation: ui-dialog-blast .95s forwards; }

/* The dialog is drawn as two identical halves. Only one shows until it breaks. */
.ui-dialog-half { position: relative; border-radius: 22px; background: var(--bg); box-shadow: 0 30px 80px -20px rgb(0 0 0 / .6); overflow: hidden; }
.ui-dialog-half + .ui-dialog-half { display: none; position: absolute; inset: 0; pointer-events: none; }
.ui-dialog-half::after { content: ""; position: absolute; inset: 0; background: var(--danger); opacity: 0; pointer-events: none; }
.ui-dialog[data-mode="destroy"] .ui-dialog-half {
  box-shadow: none;
  clip-path: polygon(0 0, 52% 0, 46% 14%, 55% 27%, 44% 41%, 53% 56%, 45% 70%, 54% 84%, 48% 100%, 0 100%);
  transform-origin: 30% 100%;
  animation: ui-dialog-fall-l .95s cubic-bezier(.5, 0, .8, .4) forwards;
}
.ui-dialog[data-mode="destroy"] .ui-dialog-half + .ui-dialog-half {
  display: block;
  clip-path: polygon(100% 0, 52% 0, 46% 14%, 55% 27%, 44% 41%, 53% 56%, 45% 70%, 54% 84%, 48% 100%, 100% 100%);
  transform-origin: 70% 100%;
  animation-name: ui-dialog-fall-r;
}
.ui-dialog[data-mode="destroy"] .ui-dialog-half::after { animation: ui-dialog-flash .95s forwards; }
.ui-dialog-crack { position: absolute; z-index: 1; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
.ui-dialog-crack path { fill: none; stroke: #fff; stroke-width: 3; stroke-linejoin: round; vector-effect: non-scaling-stroke; stroke-dasharray: 1; stroke-dashoffset: 1; filter: drop-shadow(0 0 6px var(--danger)); animation: ui-dialog-crack .95s forwards; }
.ui-dialog-bit {
  position: absolute;
  z-index: 1;
  left: 50%;
  top: var(--y);
  width: var(--s);
  height: var(--s);
  background: var(--tint);
  clip-path: polygon(50% 0, 100% 60%, 30% 100%, 0 40%);
  opacity: 0;
  pointer-events: none;
  animation: ui-dialog-bit .7s .28s cubic-bezier(.1, .6, .3, 1) forwards;
}

.ui-dialog-tape { height: 12px; background: var(--tape); background-size: 200% 100%; animation: ui-dialog-tape .6s linear infinite; }
.ui-dialog-body { padding: 22px 24px 24px; }
.ui-dialog-icon {
  position: relative;
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  margin-bottom: 16px;
  border-radius: 14px;
  background: var(--danger);
  color: #fff;
  animation: ui-dialog-alarm 1.1s ease-in-out infinite;
}
.ui-dialog-icon::after { content: ""; position: absolute; inset: 0; border-radius: inherit; border: 2px solid var(--danger); animation: ui-dialog-ring 1.1s ease-out infinite; }
.ui-dialog h2 { margin: 0 0 6px; font-size: 19px; font-weight: 600; letter-spacing: -.01em; }
.ui-dialog p { margin: 0; color: var(--muted); font-size: 15px; line-height: 1.5; }
.ui-dialog-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 22px; }
.ui-dialog-actions button {
  height: 46px;
  border: 0;
  border-radius: 14px;
  background: var(--soft);
  color: var(--ink);
  font: inherit;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: scale .25s cubic-bezier(.34, 1.56, .64, 1), filter .2s, box-shadow .2s;
}
.ui-dialog-actions button:last-child { background: var(--danger); color: #fff; }
.ui-dialog-actions button:hover { filter: brightness(.95); }
.ui-dialog-actions button:last-child:hover {
  background: var(--tape);
  background-size: 200% 100%;
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--danger) 25%, transparent);
  filter: none;
  animation: ui-dialog-tape .5s linear infinite, ui-dialog-tremble .22s linear infinite;
}
.ui-dialog-actions button:active { scale: .95; }
.ui-dialog-actions button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

@keyframes ui-dialog-tape { to { background-position: 28.3px 0; } }
@keyframes ui-dialog-tremble { 25% { translate: -1px 1px; rotate: -.6deg; } 75% { translate: 1px -1px; rotate: .6deg; } }
@keyframes ui-dialog-slam {
  0% { opacity: 0; scale: 1.5; }
  38% { opacity: 1; scale: .96; }
  50% { scale: 1; translate: -7px 3px; rotate: -1deg; }
  62% { translate: 6px -2px; rotate: .8deg; }
  74% { translate: -4px 1px; rotate: -.4deg; }
  86% { translate: 2px 0; }
}
@keyframes ui-dialog-out { to { opacity: 0; scale: .94; translate: 0 12px; } }
@keyframes ui-dialog-fade { from { opacity: 0; } }
@keyframes ui-dialog-blast { 0% { opacity: 1; } 28% { opacity: 1; filter: brightness(2.2) saturate(2); } 100% { opacity: 0; } }
@keyframes ui-dialog-alarm { 50% { scale: 1.08; rotate: -4deg; } }
@keyframes ui-dialog-ring { to { inset: -10px; opacity: 0; } }
/* Both halves shake together, then come apart. */
@keyframes ui-dialog-fall-l {
  0% { translate: 0 0; } 6% { translate: -6px 2px; } 12% { translate: 6px -3px; } 18% { translate: -5px -2px; } 24% { translate: 5px 3px; } 30% { translate: 0 0; rotate: 0deg; opacity: 1; }
  100% { translate: -90px 70vh; rotate: -38deg; opacity: 0; }
}
@keyframes ui-dialog-fall-r {
  0% { translate: 0 0; } 6% { translate: -6px 2px; } 12% { translate: 6px -3px; } 18% { translate: -5px -2px; } 24% { translate: 5px 3px; } 30% { translate: 0 0; rotate: 0deg; opacity: 1; }
  100% { translate: 110px 60vh; rotate: 46deg; opacity: 0; }
}
@keyframes ui-dialog-flash { 15% { opacity: .55; } 30% { opacity: .2; } 100% { opacity: .5; } }
@keyframes ui-dialog-crack { 0% { stroke-dashoffset: 1; opacity: 1; } 26% { stroke-dashoffset: 0; opacity: 1; } 40%, 100% { stroke-dashoffset: 0; opacity: 0; } }
@keyframes ui-dialog-bit { 0% { opacity: 1; } 100% { translate: var(--dx) var(--dy); rotate: var(--r); opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  :is(.ui-dialog-trigger, .ui-dialog-trigger *, .ui-dialog, .ui-dialog *), :is(.ui-dialog-trigger, .ui-dialog-trigger *, .ui-dialog, .ui-dialog *)::before, :is(.ui-dialog-trigger, .ui-dialog-trigger *, .ui-dialog, .ui-dialog *)::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    animation-delay: 0s !important;
    transition-duration: .01ms !important;
    transition-delay: 0s !important;
  }
}
`;

// Debris thrown out of the crack: where along it, how far, how big.
const BITS = Array.from({ length: 14 }, (_, i) => ({
  y: 6 + ((i * 37) % 88) + "%",
  dx: (i % 2 ? 1 : -1) * (50 + ((i * 53) % 120)) + "px",
  dy: ((i * 29) % 160) - 60 + "px",
  r: (i % 2 ? 1 : -1) * (160 + i * 30) + "deg",
  s: 6 + ((i * 7) % 9) + "px",
  tint: i % 3 ? "var(--danger)" : "var(--ink)",
}));

export default function Dialog({
  trigger = "Delete project",
  title = "Delete this project?",
  children = "This removes the project and its files for everyone on the team. It can't be undone.",
  cancelLabel = "Cancel",
  confirmLabel = "Delete",
  onConfirm,
}) {
  const dialog = useRef(null);
  const titleId = useId();
  const [mode, setMode] = useState("open"); // open | closing | destroy

  const close = () => mode === "open" && setMode("closing");
  const ended = (e) => {
    if (e.animationName !== "ui-dialog-out" && e.animationName !== "ui-dialog-fall-r") return;
    setMode("open");
    dialog.current.close();
  };

  // The dialog's contents. They are rendered twice so the dialog can split; the copy is hidden from everything.
  const face = (copy) => (
    <div className="ui-dialog-half" aria-hidden={copy || undefined} inert={copy || undefined}>
      <div className="ui-dialog-tape" />
      <div className="ui-dialog-body">
        <div className="ui-dialog-icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 3.5L2.5 18h17zM11 9v4M11 15.5v.01" />
          </svg>
        </div>
        <h2 id={copy ? undefined : titleId}>{title}</h2>
        <p>{children}</p>
        <div className="ui-dialog-actions">
          <button type="button" onClick={close}>{cancelLabel}</button>
          <button
            type="button"
            onClick={() => {
              if (mode !== "open") return;
              onConfirm?.();
              setMode("destroy");
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <style>{css}</style>
      <button type="button" className="ui-dialog-trigger" onClick={() => dialog.current.showModal()}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path className="ui-dialog-lid" d="M3 4.5h12M7 4.5V3h4v1.5" />
          <path d="M4.5 7l.7 8h7.6l.7-8M7.5 9.5v3M10.5 9.5v3" />
        </svg>
        {trigger}
      </button>
      <dialog
        ref={dialog}
        className="ui-dialog"
        data-mode={mode}
        aria-labelledby={titleId}
        onAnimationEnd={ended}
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        onClick={(e) => e.target === dialog.current && close()}
      >
        {face(false)}
        {face(true)}
        {mode === "destroy" && (
          <>
            <svg className="ui-dialog-crack" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <path pathLength="1" d="M52 0L46 14 55 27 44 41 53 56 45 70 54 84 48 100" />
            </svg>
            {BITS.map((b, i) => <i key={i} className="ui-dialog-bit" aria-hidden="true" style={{ "--y": b.y, "--dx": b.dx, "--dy": b.dy, "--r": b.r, "--s": b.s, "--tint": b.tint }} />)}
          </>
        )}
      </dialog>
    </>
  );
}
