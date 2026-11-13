// DownloadButton: the arrow drops, a ring fills around it, and the button settles on a tick.
// Usage: <DownloadButton duration={2000} onDone={() => console.log("saved")} />
// Press it again after it finishes to reset.
import { useLayoutEffect, useRef, useState } from "react";

const css = `
.ui-dl {
  --accent: var(--ui-accent, #1a4be0);
  --on-accent: var(--ui-accent-ink, #fff);
  --ink: var(--ui-ink, #111);
  --bg: var(--ui-bg, #fff);
  --soft: var(--ui-soft, #f4f4f4);
  --line: var(--ui-line, #e3e3e3);
  display: inline-flex;
  align-items: center;
  gap: 12px;
  height: 56px;
  padding: 0 22px 0 8px;
  border: 1px solid var(--line);
  border-radius: 28px;
  background: var(--bg);
  color: var(--ink);
  font: inherit;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: border-color .2s, scale .25s cubic-bezier(.34, 1.56, .64, 1);
  -webkit-tap-highlight-color: transparent;
}
.ui-dl:hover { border-color: var(--ink); }
.ui-dl:active { scale: .95; }
.ui-dl:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.ui-dl[data-state="loading"] { pointer-events: none; }
.ui-dl-ring {
  position: relative;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--soft);
  overflow: hidden;
  transition: background .3s, color .3s;
}
.ui-dl[data-state="done"] .ui-dl-ring { background: var(--accent); color: var(--on-accent); animation: ui-dl-pop .5s cubic-bezier(.3, 1.8, .5, 1); }
.ui-dl-ring > svg:first-child { position: absolute; inset: 0; rotate: -90deg; }
.ui-dl-ring circle { fill: none; stroke: var(--accent); stroke-width: 3; stroke-dasharray: 116.3; stroke-dashoffset: 116.3; }
.ui-dl[data-state="loading"] .ui-dl-ring circle { stroke-dashoffset: 0; transition: stroke-dashoffset var(--ms) cubic-bezier(.5, 0, .3, 1); }
.ui-dl:hover .ui-dl-arrow { translate: 0 2px; }
.ui-dl-arrow { transition: translate .25s cubic-bezier(.34, 1.56, .64, 1); }
.ui-dl[data-state="loading"] .ui-dl-arrow { animation: ui-dl-drop .7s cubic-bezier(.5, 0, .5, 1) infinite; }
.ui-dl-tick { stroke-dasharray: 16; animation: ui-dl-draw .35s .1s backwards; }
.ui-dl-word { display: block; overflow: hidden; white-space: nowrap; text-align: left; transition: width .45s cubic-bezier(.3, 1.3, .5, 1); }
.ui-dl-word span { display: inline-block; animation: ui-dl-word .3s cubic-bezier(.2, .8, .2, 1); }
@keyframes ui-dl-drop { 0% { translate: 0 -22px; } 100% { translate: 0 22px; } }
@keyframes ui-dl-draw { from { stroke-dashoffset: 16; } }
@keyframes ui-dl-pop { 0% { scale: .8; } }
@keyframes ui-dl-word { from { opacity: 0; translate: 0 70%; } }
@media (prefers-reduced-motion: reduce) {
  :is(.ui-dl, .ui-dl *), :is(.ui-dl, .ui-dl *)::before, :is(.ui-dl, .ui-dl *)::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    transition-delay: 0s !important;
  }
}
`;

const WORDS = { idle: "Download", loading: "Downloading", done: "Saved" };

export default function DownloadButton({ duration = 2000, words = WORDS, onDone }) {
  const [state, setState] = useState("idle"); // idle | loading | done
  const [width, setWidth] = useState(null);
  const word = useRef(null);

  // Measure the current word and animate the label to exactly that width.
  useLayoutEffect(() => {
    const measure = () => setWidth(word.current.offsetWidth);
    measure();
    const observer = new ResizeObserver(measure); // fonts loading, text size changes
    observer.observe(word.current);
    return () => observer.disconnect();
  }, [state]);

  const finish = (e) => {
    if (state !== "loading" || e.propertyName !== "stroke-dashoffset") return;
    setState("done");
    onDone?.();
  };

  return (
    <button type="button" className="ui-dl" data-state={state} style={{ "--ms": duration + "ms" }} aria-busy={state === "loading"} onClick={() => setState(state === "idle" ? "loading" : "idle")}>
      <style>{css}</style>
      <span className="ui-dl-ring" aria-hidden="true">
        <svg width="40" height="40" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="18.5" onTransitionEnd={finish} />
        </svg>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {state === "done" ? <path className="ui-dl-tick" d="M4 9.5l3.2 3.2L14 5.8" /> : <path className="ui-dl-arrow" d="M9 3v10M5 9.5l4 4 4-4" />}
        </svg>
      </span>
      <span className="ui-dl-word" aria-live="polite" style={{ width: width ?? "auto" }}>
        <span key={state} ref={word}>{words[state]}</span>
      </span>
    </button>
  );
}
