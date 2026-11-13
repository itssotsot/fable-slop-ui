// ToastStack: toasts pile up as a deck in the corner. Hover the deck to fan it out and pause the timers.
// Usage: <ToastStack messages={["Changes saved"]} />   // the button is a demo trigger
// To raise toasts from your own code, lift `push` out of this file or pass it down through context.
import { useRef, useState } from "react";

const css = `
.ui-toast-trigger, .ui-toasts {
  --accent: var(--ui-accent, #1a4be0);
  --ink: var(--ui-ink, #111);
  --bg: var(--ui-bg, #fff);
  --line: var(--ui-line, #e3e3e3);
  font: inherit;
  font-size: 15px;
}
.ui-toast-trigger {
  height: 48px;
  padding: 0 22px;
  border: 1px solid var(--line);
  border-radius: 24px;
  background: var(--bg);
  color: var(--ink);
  font-weight: 500;
  cursor: pointer;
  transition: border-color .2s, scale .25s cubic-bezier(.34, 1.56, .64, 1);
  -webkit-tap-highlight-color: transparent;
}
.ui-toast-trigger:hover { border-color: var(--ink); }
.ui-toast-trigger:active { scale: .94; }
.ui-toast-trigger:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.ui-toasts {
  position: fixed;
  z-index: 1000;
  right: 20px;
  bottom: 20px;
  width: min(320px, calc(100vw - 40px));
  height: var(--h);
  text-align: left;
  transition: height .3s;
}
.ui-toasts[data-count="0"] { pointer-events: none; }
.ui-toast {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  height: 56px;
  padding: 0 8px 0 14px;
  border-radius: 14px;
  background: var(--ink);
  color: var(--bg);
  box-shadow: 0 12px 30px -10px rgb(0 0 0 / .45);
  box-sizing: border-box;
  overflow: hidden;
  translate: 0 calc(var(--n) * -12px);
  scale: calc(1 - var(--n) * .06);
  opacity: clamp(0, calc(3 - var(--n)), 1);
  transform-origin: 50% 0;
  transition: translate .45s cubic-bezier(.3, 1.3, .5, 1), scale .45s cubic-bezier(.3, 1.3, .5, 1), opacity .3s;
  animation: ui-toast-in .5s cubic-bezier(.3, 1.3, .5, 1);
}
.ui-toasts[data-open="true"] .ui-toast { translate: 0 calc(var(--n) * -64px); scale: 1; opacity: 1; }
.ui-toast[data-leaving="true"] { animation: ui-toast-out .25s ease-in forwards; }
.ui-toast-icon { display: grid; place-items: center; flex: none; width: 24px; height: 24px; border-radius: 50%; background: var(--accent); color: var(--ui-accent-ink, #fff); }
.ui-toast-icon path { stroke-dasharray: 16; animation: ui-toast-draw .4s .25s backwards; }
.ui-toast-text { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-toast button {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: none;
  color: inherit;
  opacity: .6;
  cursor: pointer;
  transition: opacity .2s, rotate .3s;
}
.ui-toast button:hover { opacity: 1; rotate: 90deg; }
.ui-toast-timer {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 3px;
  background: var(--accent);
  transform-origin: 0 50%;
  animation: ui-toast-timer var(--ms) linear forwards;
}
.ui-toasts:hover .ui-toast-timer { animation-play-state: paused; }
@keyframes ui-toast-in { from { transform: translateY(120%); opacity: 0; } }
@keyframes ui-toast-out { to { transform: translateX(110%); opacity: 0; } }
@keyframes ui-toast-timer { to { transform: scaleX(0); } }
@keyframes ui-toast-draw { from { stroke-dashoffset: 16; } }
@media (prefers-reduced-motion: reduce) {
  :is(.ui-toast-trigger, .ui-toast-trigger *, .ui-toasts, .ui-toasts *), :is(.ui-toast-trigger, .ui-toast-trigger *, .ui-toasts, .ui-toasts *)::before, :is(.ui-toast-trigger, .ui-toast-trigger *, .ui-toasts, .ui-toasts *)::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    transition-delay: 0s !important;
  }
  /* The timer decides how long a toast stays, so it keeps running. */
  .ui-toast-timer { animation-duration: var(--ms) !important; }
}
`;

const MESSAGES = ["Changes saved", "Link copied to clipboard", "File moved to Archive"];

export default function ToastStack({ messages = MESSAGES, duration = 4000, label = "Show a toast" }) {
  const [toasts, setToasts] = useState([]);
  const [open, setOpen] = useState(false);
  const count = useRef(0);

  const push = (text) => {
    const id = count.current++;
    setToasts((all) => [...all, { id, text: text ?? messages[id % messages.length] }].slice(-4));
  };
  const dismiss = (id) => setToasts((all) => all.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
  const remove = (id) => setToasts((all) => all.filter((t) => t.id !== id));

  const total = toasts.length;
  const height = total === 0 ? 0 : open ? total * 64 - 8 : 56 + (Math.min(total, 3) - 1) * 12;

  return (
    <>
      <style>{css}</style>
      <button type="button" className="ui-toast-trigger" onClick={() => push()}>{label}</button>
      <div
        className="ui-toasts"
        role="status"
        aria-live="polite"
        data-count={total}
        data-open={open}
        style={{ "--h": height + "px", "--ms": duration + "ms" }}
        onPointerEnter={() => setOpen(true)}
        onPointerLeave={() => setOpen(false)}
      >
        {toasts.map((t, i) => (
          <div
            key={t.id}
            className="ui-toast"
            data-leaving={t.leaving}
            style={{ "--n": total - 1 - i }}
            onAnimationEnd={(e) => {
              if (e.animationName === "ui-toast-timer") dismiss(t.id);
              if (e.animationName === "ui-toast-out") remove(t.id);
            }}
          >
            <span className="ui-toast-icon" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 9.5l3.2 3.2L14 5.8" />
              </svg>
            </span>
            <span className="ui-toast-text">{t.text}</span>
            <button type="button" aria-label="Dismiss" onClick={() => dismiss(t.id)}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" />
              </svg>
            </button>
            <i className="ui-toast-timer" />
          </div>
        ))}
      </div>
    </>
  );
}
