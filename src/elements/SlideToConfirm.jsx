// SlideToConfirm: drag the handle to the end to confirm. Let go early and it springs back.
// Everything reacts while you drag: arrows race along the track, the handle stretches with your speed
// and throws sparks, each letter of the label is knocked away as the handle passes it, the socket at
// the far end spins up and the whole control starts to tremble as you get close. Land it and the
// handle slams home with a shockwave, a burst of confetti and the confirmation bouncing in.
// Usage: <SlideToConfirm label="Slide to pay" doneLabel="Paid" onConfirm={pay} />
// Keyboard: focus the handle and press Enter, Space or the right arrow.
import { useEffect, useRef, useState } from "react";

const css = `
.ui-slide {
  --accent: var(--ui-accent, #1a4be0);
  --on-accent: var(--ui-accent-ink, #fff);
  --bg: var(--ui-bg, #fff);
  --soft: var(--ui-soft, #f4f4f4);
  --muted: var(--ui-muted, #6b6b6b);
  position: relative;
  width: 264px;
  max-width: 100%;
  height: 56px;
  font: inherit;
  font-size: 15px;
  font-weight: 500;
  user-select: none;
  -webkit-user-select: none;
}
.ui-slide[data-state="drag"] { animation: ui-slide-rumble .09s linear infinite; }
.ui-slide-track {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  border-radius: 28px;
  background: var(--soft);
  box-shadow: 0 0 calc(var(--p) * 26px) color-mix(in srgb, var(--accent) calc(var(--p) * 70%), transparent);
  overflow: hidden;
}
/* Arrows racing toward the end, to show the way. */
.ui-slide-track::before {
  content: "";
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(115deg, transparent 0 14px, color-mix(in srgb, var(--muted) 16%, transparent) 14px 20px);
  -webkit-mask: linear-gradient(90deg, transparent 20%, #000 70%, transparent 96%);
  mask: linear-gradient(90deg, transparent 20%, #000 70%, transparent 96%);
  animation: ui-slide-flow .7s linear infinite;
}
.ui-slide-fill {
  position: absolute;
  inset: 0 auto 0 0;
  width: calc(var(--x) * 1px + 52px);
  border-radius: 28px;
  background:
    repeating-linear-gradient(115deg, transparent 0 10px, rgb(255 255 255 / .16) 10px 20px) 0 0 / 44px 100%,
    linear-gradient(90deg, color-mix(in srgb, var(--accent) 55%, transparent), var(--accent));
  opacity: calc(.35 + var(--p) * .65);
  animation: ui-slide-stripes .5s linear infinite;
}
.ui-slide-label { position: relative; display: flex; padding-left: 34px; color: var(--muted); white-space: pre; }
.ui-slide-label i {
  display: inline-block;
  font-style: normal;
  transition: translate .5s cubic-bezier(.3, 1.5, .5, 1) calc(var(--i) * 18ms), rotate .5s cubic-bezier(.3, 1.5, .5, 1) calc(var(--i) * 18ms), opacity .3s calc(var(--i) * 18ms), scale .4s;
}
.ui-slide[data-state="idle"] .ui-slide-label i { animation: ui-slide-hint 2.6s calc(var(--i) * 70ms) ease-in-out infinite; }
.ui-slide-label i[data-hit="true"] {
  translate: var(--dx) var(--dy);
  rotate: var(--r);
  scale: .4;
  opacity: 0;
  color: var(--accent);
  transition-delay: 0s;
  transition-duration: .35s;
}
/* The socket the handle has to reach. */
.ui-slide-socket {
  position: absolute;
  right: 8px;
  top: 8px;
  width: 40px;
  height: 40px;
  border: 2px dashed color-mix(in srgb, var(--muted) calc(40% + var(--p) * 60%), transparent);
  border-radius: 50%;
  scale: calc(.8 + var(--p) * .25);
  animation: ui-slide-turn calc(6s - var(--p) * 5.4s) linear infinite;
}
.ui-slide-socket::after { content: ""; position: absolute; inset: 11px; border-radius: 50%; background: var(--accent); opacity: var(--p); scale: var(--p); }
.ui-slide-done { position: absolute; display: flex; color: var(--on-accent); white-space: pre; }
.ui-slide-done i { display: inline-block; font-style: normal; animation: ui-slide-letter .5s calc(var(--i) * 45ms + .12s) cubic-bezier(.3, 1.8, .5, 1) backwards; }

.ui-slide-thumb {
  position: absolute;
  left: 4px;
  top: 4px;
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--accent);
  color: var(--on-accent);
  box-shadow: 0 2px 8px rgb(0 0 0 / .25), 0 0 calc(var(--p) * 22px) var(--accent);
  cursor: grab;
  touch-action: none;
  translate: calc(var(--x) * 1px) 0;
  scale: calc(1 + var(--v) * .3) calc(1 - var(--v) * .16);
  -webkit-tap-highlight-color: transparent;
}
.ui-slide-thumb:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.ui-slide-thumb svg { transition: translate .3s; }
.ui-slide[data-state="idle"] .ui-slide-thumb svg { animation: ui-slide-nudge 1.3s ease-in-out infinite; }
.ui-slide[data-state="idle"] .ui-slide-thumb { transition: translate .6s cubic-bezier(.3, 1.6, .5, 1), scale .4s cubic-bezier(.3, 1.6, .5, 1); }
.ui-slide[data-state="idle"] .ui-slide-fill { transition: width .6s cubic-bezier(.3, 1.6, .5, 1), opacity .3s; }
.ui-slide[data-state="drag"] .ui-slide-thumb { cursor: grabbing; transition: scale .12s; }
.ui-slide[data-state="done"] .ui-slide-track::before, .ui-slide[data-state="done"] .ui-slide-socket { opacity: 0; }
.ui-slide[data-state="done"] .ui-slide-fill { width: 100%; opacity: 1; transition: width .25s; animation: ui-slide-flash .5s; }
.ui-slide[data-state="done"] .ui-slide-thumb { background: var(--bg); color: var(--accent); cursor: default; animation: ui-slide-slam .5s cubic-bezier(.3, 1.8, .5, 1); }
.ui-slide[data-state="done"] .ui-slide-label { opacity: 0; }
.ui-slide-thumb path { stroke-dasharray: 20; animation: ui-slide-draw .4s; }

.ui-slide-spark, .ui-slide-bit, .ui-slide-wave { position: absolute; pointer-events: none; }
.ui-slide-spark {
  left: calc(var(--at) * 1px + 6px);
  top: var(--y);
  width: var(--s);
  height: var(--s);
  border-radius: 50%;
  background: var(--accent);
  animation: ui-slide-spark .5s ease-out forwards;
}
.ui-slide-bit {
  right: 22px;
  top: 24px;
  width: 7px;
  height: 7px;
  border-radius: var(--round);
  background: var(--tint);
  animation: ui-slide-bit .8s cubic-bezier(.1, .7, .3, 1) forwards;
}
.ui-slide-wave {
  right: 28px;
  top: 28px;
  width: 0;
  height: 0;
  border: 2px solid var(--accent);
  border-radius: 50%;
  box-sizing: border-box;
  animation: ui-slide-wave .6s ease-out forwards;
}

@keyframes ui-slide-rumble {
  0%, 100% { translate: 0 0; }
  25% { translate: calc(var(--p) * var(--p) * 1.6px) calc(var(--p) * var(--p) * -1.2px); }
  75% { translate: calc(var(--p) * var(--p) * -1.6px) calc(var(--p) * var(--p) * 1.2px); }
}
@keyframes ui-slide-flow { to { background-position: 22px 0; } }
@keyframes ui-slide-stripes { to { background-position: 44px 0, 0 0; } }
@keyframes ui-slide-hint { 0%, 30%, 100% { translate: 0 0; } 12% { translate: 0 -3px; color: var(--accent); } }
@keyframes ui-slide-nudge { 50% { translate: 4px 0; } }
@keyframes ui-slide-turn { to { rotate: 360deg; } }
@keyframes ui-slide-letter { from { opacity: 0; translate: 0 18px; scale: .3; rotate: -30deg; } }
@keyframes ui-slide-flash { 30% { filter: brightness(1.7); } }
@keyframes ui-slide-slam { 0% { scale: 1.5 .7; } 40% { scale: .8 1.2; rotate: 360deg; } 100% { rotate: 360deg; } }
@keyframes ui-slide-draw { from { stroke-dashoffset: 20; } }
@keyframes ui-slide-spark { to { translate: var(--dx) var(--dy); scale: 0; opacity: 0; } }
@keyframes ui-slide-bit { 0% { opacity: 1; } 100% { translate: var(--dx) var(--dy); rotate: var(--r); opacity: 0; } }
@keyframes ui-slide-wave { from { opacity: 1; } to { width: 150px; height: 150px; margin: -75px; opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  .ui-slide-spark, .ui-slide-bit, .ui-slide-wave { display: none; }
  :is(.ui-slide, .ui-slide *), :is(.ui-slide, .ui-slide *)::before, :is(.ui-slide, .ui-slide *)::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    transition-delay: 0s !important;
  }
}
`;

// Confetti thrown when the handle lands: direction, spin, shape and colour for each piece.
const BITS = Array.from({ length: 16 }, (_, i) => {
  const a = (i / 16) * Math.PI * 2 + (i % 3) * 0.2;
  const far = 46 + ((i * 29) % 40);
  return { dx: Math.cos(a) * far, dy: Math.sin(a) * far * 0.8 - 14, r: (i % 2 ? 1 : -1) * (120 + i * 20), round: i % 3 ? "2px" : "50%", tint: ["var(--accent)", "#ffb400", "#ff5c8a", "#1a9a52"][i % 4] };
});

export default function SlideToConfirm({ label = "Slide to pay", doneLabel = "Paid", onConfirm, resetAfter = 2200 }) {
  const track = useRef(null);
  const text = useRef(null);
  const grab = useRef(0);
  const timer = useRef(null);
  const still = useRef(null);
  const pace = useRef({ x: 0, sparkAt: 0, id: 0 });
  const [x, setX] = useState(0);
  const [v, setV] = useState(0);
  const [limit, setLimit] = useState(208);
  const [state, setState] = useState("idle"); // idle | drag | done
  const [sparks, setSparks] = useState([]);
  const [marks, setMarks] = useState([]); // where each letter of the label sits along the track
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      clearTimeout(still.current);
    },
    []
  );

  const reach = () => track.current.clientWidth - 56;
  const confirm = () => {
    const end = reach();
    setLimit(end);
    setX(end);
    setV(0);
    setState("done");
    onConfirm?.();
    if (resetAfter) {
      timer.current = setTimeout(() => {
        setX(0);
        setState("idle");
      }, resetAfter);
    }
  };

  const down = (e) => {
    if (state !== "idle") return;
    e.currentTarget.setPointerCapture(e.pointerId);
    grab.current = e.clientX;
    const left = track.current.getBoundingClientRect().left;
    setMarks(
      [...text.current.children].map((n) => {
        const r = n.getBoundingClientRect();
        return r.left + r.width / 2 - left;
      })
    );
    pace.current.x = 0;
    pace.current.sparkAt = 0;
    setLimit(reach());
    setState("drag");
  };
  const move = (e) => {
    if (state !== "drag") return;
    const next = Math.max(0, Math.min(limit, e.clientX - grab.current));
    const p = pace.current;
    setV(Math.max(0, Math.min(1, Math.abs(next - p.x) / 22)));
    clearTimeout(still.current);
    still.current = setTimeout(() => setV(0), 70); // relax the stretch once the handle stops moving
    p.x = next;
    setX(next);
    if (Math.abs(next - p.sparkAt) > 10) {
      p.sparkAt = next;
      const id = p.id++;
      setSparks((all) => [...all, { id, at: next, y: 14 + ((id * 17) % 28), s: 3 + (id % 3) * 2, dx: -(14 + ((id * 13) % 22)), dy: ((id * 23) % 36) - 18 }].slice(-18));
    }
  };
  const up = () => {
    if (state !== "drag") return;
    if (x >= limit * 0.92) return confirm();
    setX(0);
    setV(0);
    setState("idle");
  };
  const key = (e) => {
    if (state === "idle" && ["Enter", " ", "ArrowRight"].includes(e.key)) {
      e.preventDefault();
      confirm();
    }
  };

  const front = x + 52; // the leading edge of the handle
  return (
    <div ref={track} className="ui-slide" data-state={state} style={{ "--x": x, "--p": limit ? x / limit : 0, "--v": v }}>
      <style>{css}</style>
      <span className="ui-slide-track">
        <span className="ui-slide-fill" />
        <span className="ui-slide-socket" />
        <span ref={text} className="ui-slide-label" aria-hidden="true">
          {[...label].map((ch, i) => (
            <i key={i} data-hit={state === "drag" && front > (marks[i] ?? Infinity)} style={{ "--i": i, "--dx": 10 + ((i * 7) % 14) + "px", "--dy": (i % 2 ? 1 : -1) * (14 + ((i * 5) % 10)) + "px", "--r": (i % 2 ? 1 : -1) * (40 + i * 9) + "deg" }}>
              {ch}
            </i>
          ))}
        </span>
        <span className="ui-slide-done" role="status" aria-label={state === "done" ? doneLabel : undefined}>
          {state === "done" && [...doneLabel].map((ch, i) => <i key={i} aria-hidden="true" style={{ "--i": i }}>{ch}</i>)}
        </span>
      </span>
      {sparks.map((s) => (
        <i key={s.id} className="ui-slide-spark" style={{ "--at": s.at, "--y": s.y + "px", "--s": s.s + "px", "--dx": s.dx + "px", "--dy": s.dy + "px" }} onAnimationEnd={() => setSparks((all) => all.filter((n) => n.id !== s.id))} />
      ))}
      {state === "done" && <i className="ui-slide-wave" />}
      {state === "done" && BITS.map((b, i) => <i key={i} className="ui-slide-bit" style={{ "--dx": b.dx + "px", "--dy": b.dy + "px", "--r": b.r + "deg", "--round": b.round, "--tint": b.tint }} />)}
      <button type="button" className="ui-slide-thumb" aria-label={label} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onKeyDown={key}>
        <svg key={state === "done" ? "done" : "arrow"} width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={state === "done" ? "M4.5 10.5l3.6 3.6 7.4-7.6" : "M4 10h12M11 5l5 5-5 5"} />
        </svg>
      </button>
    </div>
  );
}
