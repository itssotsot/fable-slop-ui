// CompareSlider: drag the handle to wipe between two versions of the same picture.
// Usage: <CompareSlider before={<img src="before.jpg" alt="" />} after={<img src="after.jpg" alt="" />} />
// Both layers fill the frame. Without props it shows the same scene twice: as a blueprint on the left
// and switched on at the right, with a pulsing sun, twinkling stars, comets and a floor that rushes at you.
// The divider is a beam of light that throws sparks.
// Keyboard: focus the handle and use the left and right arrows.
import { useId, useRef, useState } from "react";

const css = `
.ui-compare {
  --accent: var(--ui-accent, #1a4be0);
  --ink: var(--ui-ink, #111);
  --bg: var(--ui-bg, #fff);
  position: relative;
  width: 300px;
  max-width: 100%;
  aspect-ratio: 3 / 2;
  border-radius: 18px;
  overflow: hidden;
  font: inherit;
  cursor: ew-resize;
  touch-action: pan-y;
  user-select: none;
  -webkit-user-select: none;
}
.ui-compare-layer { position: absolute; inset: 0; }
.ui-compare-layer > * { display: block; width: 100%; height: 100%; object-fit: cover; }
.ui-compare-layer + .ui-compare-layer { clip-path: inset(0 calc(100% - var(--at) * 1%) 0 0); }
.ui-compare[data-drag="false"] .ui-compare-layer + .ui-compare-layer { transition: clip-path .5s cubic-bezier(.3, 1.3, .5, 1); }

/* The built-in scene. One drawing, two looks: [data-live] switches it on. */
.ui-compare-scene { position: relative; overflow: hidden; background: linear-gradient(#0d0630, #3a1078 38%, #c2297f 56%, #ff8a4c 64%, #12063a 64.2%); }
.ui-compare-scene:not([data-live]) {
  background:
    linear-gradient(rgb(255 255 255 / .1) 1px, transparent 1px) 0 0 / 12px 12px,
    linear-gradient(90deg, rgb(255 255 255 / .1) 1px, transparent 1px) 0 0 / 12px 12px,
    #173f8f;
}
.ui-compare-scene svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.ui-compare-scene text { fill: #dbe8ff; font: 6px ui-monospace, Menlo, monospace; }
.ui-compare-scene[data-live] :is(text, .ui-compare-note) { display: none; }
.ui-compare-note { fill: none; stroke: #dbe8ff; stroke-width: .6; opacity: .8; }

.ui-compare-star { fill: #dbe8ff; opacity: .5; }
.ui-compare-scene[data-live] .ui-compare-star { fill: #fff; opacity: 1; transform-box: fill-box; transform-origin: center; animation: ui-compare-twinkle 1.6s calc(var(--i) * -.37s) ease-in-out infinite; }
.ui-compare-comet { display: none; stroke-width: 1.4; stroke-linecap: round; }
.ui-compare-scene[data-live] .ui-compare-comet { display: block; animation: ui-compare-comet 3.2s calc(var(--i) * 1.7s) ease-in infinite backwards; }

.ui-compare-sun { stroke: #dbe8ff; stroke-width: 1; stroke-dasharray: 3 2; }
.ui-compare-scene[data-live] .ui-compare-sun { stroke: none; transform-box: fill-box; transform-origin: center; animation: ui-compare-pulse 2.4s ease-in-out infinite; }
.ui-compare-halo { display: none; }
.ui-compare-scene[data-live] .ui-compare-halo { display: block; transform-box: fill-box; transform-origin: center; animation: ui-compare-pulse 2.4s ease-in-out infinite reverse; }
.ui-compare-slat { animation: ui-compare-slat 2.4s linear infinite; }

.ui-compare-peak { fill: none; stroke: #dbe8ff; stroke-width: 1; stroke-linejoin: round; }
.ui-compare-scene[data-live] .ui-compare-peak { fill: #1b0b45; stroke: #ff5fd2; stroke-width: 1.2; filter: drop-shadow(0 0 3px #ff5fd2); }
.ui-compare-scene[data-live] .ui-compare-peak + .ui-compare-peak { fill: #0c0526; stroke: #37e6ff; filter: drop-shadow(0 0 3px #37e6ff); }

/* The floor: a flat grid tipped away from you. Live, it scrolls toward the viewer. */
.ui-compare-floor {
  position: absolute;
  left: -75%;
  top: 64%;
  width: 250%;
  height: 120%;
  background:
    linear-gradient(rgb(219 232 255 / .7) 1px, transparent 1px) 0 0 / 22px 22px,
    linear-gradient(90deg, rgb(219 232 255 / .7) 1px, transparent 1px) 50% 0 / 22px 22px;
  transform: perspective(90px) rotateX(64deg);
  transform-origin: 50% 0;
  -webkit-mask: linear-gradient(transparent, #000 30%);
  mask: linear-gradient(transparent, #000 30%);
}
.ui-compare-scene[data-live] .ui-compare-floor {
  background:
    linear-gradient(#ff5fd2 1.5px, transparent 1.5px) 0 0 / 22px 22px,
    linear-gradient(90deg, #37e6ff 1.5px, transparent 1.5px) 50% 0 / 22px 22px;
  filter: drop-shadow(0 0 2px #ff5fd2);
  animation: ui-compare-rush .5s linear infinite;
}
/* A scanline shimmer over the live side. */
.ui-compare-scene[data-live]::after {
  content: "";
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(rgb(0 0 0 / .14) 0 1px, transparent 1px 3px);
  pointer-events: none;
}
.ui-compare-tag {
  position: absolute;
  top: 12px;
  padding: 4px 9px;
  border-radius: 8px;
  background: rgb(17 17 17 / .7);
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  pointer-events: none;
  transition: opacity .2s;
}
.ui-compare-tag:nth-of-type(1) { left: 12px; opacity: clamp(0, calc((var(--at) - 25) / 10), 1); }
.ui-compare-tag:nth-of-type(2) { right: 12px; opacity: clamp(0, calc((75 - var(--at)) / 10), 1); }
.ui-compare-handle {
  position: absolute;
  top: 0;
  bottom: 0;
  left: calc(var(--at) * 1%);
  width: 2px;
  margin-left: -1px;
  padding: 0;
  border: 0;
  background: #fff;
  box-shadow: 0 0 6px #fff, 0 0 16px 2px #37e6ff, 0 0 34px 4px #ff5fd2;
  cursor: ew-resize;
  outline: 0;
}
.ui-compare-handle i {
  position: absolute;
  left: -1px;
  top: var(--y);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 6px 1px #37e6ff;
  opacity: 0;
  animation: ui-compare-spark 1.1s calc(var(--i) * -.19s) ease-out infinite;
}
.ui-compare[data-drag="false"] .ui-compare-handle { transition: left .5s cubic-bezier(.3, 1.3, .5, 1); }
.ui-compare-grip {
  position: absolute;
  left: 50%;
  top: 50%;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  margin: -20px;
  border-radius: 50%;
  background: #fff;
  color: #111;
  box-shadow: 0 4px 14px rgb(0 0 0 / .3);
  transition: scale .3s cubic-bezier(.34, 1.56, .64, 1);
}
.ui-compare:hover .ui-compare-grip { scale: 1.1; }
.ui-compare[data-drag="true"] .ui-compare-grip { scale: .92; }
.ui-compare-handle:focus-visible .ui-compare-grip { box-shadow: 0 0 0 3px var(--accent); }
@keyframes ui-compare-twinkle { 50% { scale: .3; opacity: .3; } }
@keyframes ui-compare-comet { 0% { translate: 0 0; opacity: 0; } 4% { opacity: 1; } 22% { translate: -150px 75px; opacity: 0; } 100% { translate: -150px 75px; opacity: 0; } }
@keyframes ui-compare-pulse { 50% { scale: 1.06; } }
@keyframes ui-compare-slat { to { translate: 0 10px; } }
@keyframes ui-compare-rush { to { background-position: 0 22px, 50% 0; } }
@keyframes ui-compare-spark { 0% { translate: 0 0; opacity: 1; scale: 1; } 100% { translate: var(--dx) var(--dy); opacity: 0; scale: .2; } }
@media (prefers-reduced-motion: reduce) {
  :is(.ui-compare, .ui-compare *), :is(.ui-compare, .ui-compare *)::before, :is(.ui-compare, .ui-compare *)::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    transition-delay: 0s !important;
  }
}
`;

const STARS = [[22, 18, 1.2], [58, 40, .8], [84, 14, 1], [118, 30, .7], [196, 16, 1.1], [228, 44, .8], [262, 22, 1.3], [284, 58, .7], [40, 70, .7], [246, 84, .9]];
const SPARKS = [[12, 14, -10], [30, -16, 8], [47, 18, 12], [62, -12, -14], [78, 16, -6], [90, -18, 10]];

// The demo picture. With live it is lit, coloured and moving; without, it is the plan for it.
function Scene({ live }) {
  const id = useId().replace(/:/g, "");
  return (
    <div className="ui-compare-scene" data-live={live ? "" : undefined}>
      <svg viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <linearGradient id={id + "sun"} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff27a" />
            <stop offset=".55" stopColor="#ff8a4c" />
            <stop offset="1" stopColor="#ff2e93" />
          </linearGradient>
          <radialGradient id={id + "halo"}>
            <stop offset=".5" stopColor="#ff8a4c" stopOpacity=".55" />
            <stop offset="1" stopColor="#ff2e93" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={id + "tail"} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          {/* Cuts the bands out of the lower half of the sun; the bands drift downward. */}
          <mask id={id + "bands"}>
            <rect width="300" height="200" fill="#fff" />
            <g className="ui-compare-slat" fill="#000">
              {[0, 1, 2, 3, 4, 5].map((n) => <rect key={n} x="90" y={84 + n * 10} width="120" height={1.5 + n * 0.9} />)}
            </g>
          </mask>
        </defs>

        {STARS.map(([x, y, r], i) => <circle key={i} className="ui-compare-star" style={{ "--i": i }} cx={x} cy={y} r={r} />)}
        <path className="ui-compare-comet" style={{ "--i": 0 }} d="M250 6l26-13" stroke={"url(#" + id + "tail)"} />
        <path className="ui-compare-comet" style={{ "--i": 1 }} d="M150 -4l22-11" stroke={"url(#" + id + "tail)"} />

        <circle className="ui-compare-halo" cx="150" cy="88" r="74" fill={"url(#" + id + "halo)"} />
        <circle className="ui-compare-sun" cx="150" cy="88" r="46" style={{ fill: live ? "url(#" + id + "sun)" : "none" }} mask={live ? "url(#" + id + "bands)" : undefined} />

        <path className="ui-compare-note" d="M150 78v20M140 88h20M104 142v8M196 142v8M104 146h92" />
        <text x="150" y="155" textAnchor="middle">Ø 92</text>
        <text x="10" y="124">HORIZON 0.64</text>
        <text x="236" y="72">PEAK B</text>
        <path className="ui-compare-note" d="M234 74l-12 14" />

        <path className="ui-compare-peak" d="M-4 129L30 96l18 16 26-34 30 38 22-18 24 31z" />
        <path className="ui-compare-peak" d="M150 129l32-27 20 15 34-45 30 34 16-12 24 35z" />
      </svg>
      <div className="ui-compare-floor" />
    </div>
  );
}

export default function CompareSlider({ before, after, defaultValue = 50, labels = ["Before", "After"], onChange }) {
  const [at, setAt] = useState(defaultValue);
  const [drag, setDrag] = useState(false);
  const frame = useRef(null);

  const set = (next) => {
    const clamped = Math.max(0, Math.min(100, next));
    setAt(clamped);
    onChange?.(clamped);
  };
  const point = (e) => {
    const r = frame.current.getBoundingClientRect();
    set(((e.clientX - r.left) / r.width) * 100);
  };
  const key = (e) => {
    const moves = { ArrowLeft: at - 5, ArrowRight: at + 5, Home: 0, End: 100 };
    if (e.key in moves) {
      e.preventDefault();
      set(moves[e.key]);
    }
  };

  return (
    <div
      ref={frame}
      className="ui-compare"
      data-drag={drag}
      style={{ "--at": at }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        setDrag(true);
        point(e);
      }}
      onPointerMove={(e) => drag && point(e)}
      onPointerUp={() => setDrag(false)}
      onPointerCancel={() => setDrag(false)}
    >
      <style>{css}</style>
      <div className="ui-compare-layer">{after ?? <Scene live />}</div>
      <div className="ui-compare-layer">{before ?? <Scene />}</div>
      <span className="ui-compare-tag">{labels[0]}</span>
      <span className="ui-compare-tag">{labels[1]}</span>
      <button type="button" className="ui-compare-handle" role="slider" aria-label="Comparison position" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(at)} onKeyDown={key}>
        {SPARKS.map(([y, dx, dy], i) => <i key={i} style={{ "--i": i, "--y": y + "%", "--dx": dx + "px", "--dy": dy + "px" }} aria-hidden="true" />)}
        <span className="ui-compare-grip" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6.5 5L3 9l3.5 4M11.5 5L15 9l-3.5 4" />
          </svg>
        </span>
      </button>
    </div>
  );
}
