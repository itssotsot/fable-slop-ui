// DayNightToggle: a whole day in one switch. Click it, or drag the sun across the sky.
// The scene is a sea with a lighthouse island. The sun comes up in a pink dawn, climbs to noon,
// sinks low and golden in the afternoon, sets into the water and comes back up as the moon, its
// light lying on the waves the whole way. The boat slips off, the clouds drift away, stars and the
// northern lights come out, and the lighthouse lamp sweeps its beam across the night.
//
// Two ways to use it:
//   A day and night switch (the default):
//     <DayNightToggle checked={dark} onChange={(dark) => setDark(dark)} />
//   A dial with more stops, for example four times of day:
//     <DayNightToggle steps={4} value={time} onChange={(index) => setTime(index)} />
//     A click runs it all the way from the first stop to the last, or from the last back to the first,
//     passing through the ones between. A drag lands on the nearest stop. Stops are named by `labels`.
//     Drag off the control without letting go and it runs to the nearest end.
//
// Listeners, if you want the rest of your page to react (the component itself touches nothing outside it):
//   onChange(value)        when it lands on a stop: true or false as a switch, the stop's index as a dial
//   onProgress(p, node)    on every frame while it moves or is dragged: p runs from 0 (first stop) to 1 (last)
//
// Works controlled (checked or value) or on its own (defaultChecked or defaultValue).
// Size it with font-size: 48px is the default height.
// Keyboard: Enter or Space sends it across, the left and right arrows step one stop back or forward.
import { useEffect, useLayoutEffect, useRef, useState } from "react";

const css = `
.ui-daynight {
  --accent: var(--ui-accent, #1a4be0);
  --p: 0; /* 0 = day, 1 = night; the spring and the drag write this */
  /* The scene is drawn from these. The component writes them on every frame. */
  --q: 0;    /* how much night */
  --dusk: 0; /* how much sunset */
  --dawn: 0; /* how much sunrise */
  --oy: 0;   /* how far the orb has sunk, in em */
  position: relative;
  display: inline-block;
  flex: none;
  width: 2.6em;
  height: 1em;
  padding: 0;
  border: 0;
  border-radius: 1em;
  background: linear-gradient(#2a7fd6, #6fb4ee 55%, #b9dcf7);
  font-size: 48px;
  cursor: grab;
  overflow: hidden;
  isolation: isolate;
  touch-action: pan-y;
  user-select: none;
  -webkit-user-select: none;
  transition: scale .3s cubic-bezier(.34, 1.56, .64, 1);
  -webkit-tap-highlight-color: transparent;
}
.ui-daynight:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.ui-daynight:active { scale: .97; }
.ui-daynight[data-drag="true"] { cursor: grabbing; }
.ui-daynight > * { position: absolute; pointer-events: none; }

/* Sky: a daytime gradient with night and sunset laid over it. */
.ui-daynight-dawn { inset: 0; background: linear-gradient(to top, #ffd6a0, #ffb0a4 42%, #c9b2ee 80%, transparent); opacity: calc(var(--dawn) * .95); }
.ui-daynight-night { inset: 0; background: linear-gradient(#03061a, #0d1640 55%, #24306b); opacity: var(--q); }
.ui-daynight-dusk {
  inset: 0;
  background: linear-gradient(to top, #ffb169, #f2707a 34%, #7a4a9c 68%, transparent);
  opacity: var(--dusk);
}

.ui-daynight-star {
  left: var(--x);
  top: var(--y);
  width: var(--s);
  height: var(--s);
  opacity: clamp(0, calc(var(--q) * 1.7 - .35 - var(--i) * .06), 1);
  translate: 0 calc((1 - var(--q)) * .3em);
}
.ui-daynight-star::before { content: ""; position: absolute; inset: 0; border-radius: 50%; background: #fff; box-shadow: 0 0 .05em .01em rgb(190 210 255 / .8); }
.ui-daynight[data-night="true"] .ui-daynight-star::before { animation: ui-daynight-twinkle .9s calc(var(--i) * .13s + .5s) 2; }
.ui-daynight:hover .ui-daynight-star::before { animation: ui-daynight-twinkle 1.1s calc(var(--i) * -.21s) infinite; }
.ui-daynight-shoot {
  left: .5em;
  top: .12em;
  width: .5em;
  height: .02em;
  border-radius: 1em;
  background: linear-gradient(to left, #fff, transparent);
  opacity: 0;
  rotate: 24deg;
}
.ui-daynight[data-night="true"] .ui-daynight-shoot { animation: ui-daynight-shoot .8s .7s ease-out; }

/* The light the orb throws into the air around it. It travels with the orb. */
.ui-daynight-glow {
  left: -.5em;
  top: -.58em;
  width: 2em;
  height: 2em;
  border-radius: 50%;
  background: radial-gradient(circle, color-mix(in oklab, #aebcff calc(var(--q) * 100%), #fff3b8) 0, transparent 62%);
  opacity: calc(.85 - var(--q) * .45);
  translate: calc(var(--p) * 1.6em) calc(var(--oy) * 1em);
}

/* Clouds: soft lumps of light with a shaded underside. */
.ui-daynight-cloud {
  right: .12em;
  top: .13em;
  width: .9em;
  height: .36em;
  background:
    radial-gradient(closest-side, #fff 55%, transparent) 8% 78% / 46% 52% no-repeat,
    radial-gradient(closest-side, #fff 60%, transparent) 34% 30% / 44% 78% no-repeat,
    radial-gradient(closest-side, #fff 60%, transparent) 64% 46% / 40% 66% no-repeat,
    radial-gradient(closest-side, #fff 55%, transparent) 94% 82% / 40% 44% no-repeat,
    radial-gradient(closest-side, #dfe9f6 70%, transparent) 50% 100% / 78% 46% no-repeat;
  filter: blur(.012em) drop-shadow(0 .03em .03em rgb(40 70 120 / .25));
  opacity: clamp(0, calc(1 - var(--q) * 2.5), 1);
  translate: calc(var(--p) * 1.2em) 0;
}
.ui-daynight-cloud + .ui-daynight-cloud { right: .86em; top: .4em; scale: .55; opacity: clamp(0, calc(.8 - var(--q) * 2.5), 1); translate: calc(var(--p) * -1.6em) 0; }

/* The orb rolls across, sinking into the sea on the way. */
.ui-daynight-orb {
  left: .17em;
  top: .07em;
  width: .66em;
  height: .66em;
  translate: calc(var(--p) * 1.6em) calc(var(--oy) * 1em);
  rotate: calc(var(--p) * 360deg);
  transition: scale .3s cubic-bezier(.34, 1.56, .64, 1);
}
.ui-daynight:hover .ui-daynight-orb { scale: 1.06; }
.ui-daynight[data-drag="true"] .ui-daynight-orb { scale: 1.12; }
.ui-daynight-orb > * { position: absolute; inset: 0; border-radius: 50%; }
.ui-daynight-sun {
  background: radial-gradient(circle at 42% 40%, #fffdf0 0, #ffe98a 34%, #ffc23d 72%, #ff9d2e);
  box-shadow: 0 0 .08em #fff6c9, 0 0 .3em rgb(255 200 80 / .9), 0 0 .7em rgb(255 170 60 / .5);
  opacity: calc(1 - var(--q));
}
.ui-daynight-moon {
  background:
    radial-gradient(circle at 30% 34%, rgb(120 128 150 / .55) 0 .075em, transparent .09em),
    radial-gradient(circle at 62% 60%, rgb(120 128 150 / .5) 0 .06em, transparent .075em),
    radial-gradient(circle at 36% 72%, rgb(120 128 150 / .45) 0 .04em, transparent .052em),
    radial-gradient(circle at 70% 28%, rgb(120 128 150 / .4) 0 .03em, transparent .042em),
    radial-gradient(circle at 52% 44%, rgb(150 156 176 / .35) 0 .1em, transparent .2em),
    radial-gradient(circle at 36% 34%, #fbfbf6 0, #dfe2ea 55%, #aab0c2);
  box-shadow: inset -.09em -.07em .12em rgb(20 26 60 / .55), 0 0 .12em rgb(214 224 255 / .9), 0 0 .5em rgb(150 170 255 / .45);
  opacity: var(--q);
}

/* The northern lights, once it is properly dark. */
.ui-daynight-aurora {
  left: .2em;
  top: -.16em;
  width: 1.5em;
  height: .7em;
  background:
    radial-gradient(ellipse 42% 60% at 28% 45%, rgb(70 255 170 / .6), transparent 70%),
    radial-gradient(ellipse 40% 55% at 66% 35%, rgb(150 110 255 / .55), transparent 70%),
    radial-gradient(ellipse 30% 50% at 48% 55%, rgb(60 200 255 / .4), transparent 70%);
  filter: blur(.045em);
  opacity: clamp(0, calc(var(--q) * 2 - 1), .85);
  animation: ui-daynight-sway 5s ease-in-out infinite alternate;
}

/* The sea. The orb sinks behind its horizon, and the water takes the colour of the sky. */
.ui-daynight-sea {
  left: 0;
  bottom: 0;
  width: 100%;
  height: .26em;
  background: linear-gradient(color-mix(in oklab, #0c1648 calc(var(--q) * 100%), #3a9ad8), color-mix(in oklab, #03061a calc(var(--q) * 100%), #0c4c92));
  box-shadow: 0 -.008em .03em rgb(255 255 255 / .45);
}
.ui-daynight-sea::before { content: ""; position: absolute; inset: 0; background: linear-gradient(#ffa066, #a8407c); opacity: calc(var(--dusk) * .8); }
.ui-daynight-sea::after {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse .07em .012em at 50% 50%, rgb(255 255 255 / .5), transparent) 0 .02em / .24em .075em;
  animation: ui-daynight-waves 3s linear infinite;
}
/* The orb's light lying on the water. It follows the orb across. */
.ui-daynight-shine {
  left: .2em;
  bottom: 0;
  width: .6em;
  height: .26em;
  background: repeating-linear-gradient(to bottom, color-mix(in oklab, #e3e9ff calc(var(--q) * 100%), #fff0a0) 0 .016em, transparent .016em .048em);
  -webkit-mask: radial-gradient(ellipse 50% 110% at 50% 0, #000 15%, transparent 72%);
  mask: radial-gradient(ellipse 50% 110% at 50% 0, #000 15%, transparent 72%);
  translate: calc(var(--p) * 1.6em) 0;
  animation: ui-daynight-shimmer .8s linear infinite;
}

/* A sailing boat by day. It slips away as the light goes. */
.ui-daynight-boat {
  left: .56em;
  bottom: .17em;
  width: .15em;
  height: .17em;
  translate: calc(var(--p) * -.5em) 0;
  opacity: clamp(0, calc(1 - var(--q) * 2.5), 1);
  transform-origin: 50% 100%;
  animation: ui-daynight-bob 2.6s ease-in-out infinite;
}
.ui-daynight-boat::before { content: ""; position: absolute; left: 34%; bottom: 30%; width: 56%; height: 70%; background: linear-gradient(90deg, #fff, #dfe8f2); clip-path: polygon(0 0, 100% 100%, 0 100%); }
.ui-daynight-boat::after { content: ""; position: absolute; left: 0; bottom: 0; width: 100%; height: 24%; border-radius: 0 0 .07em .07em; background: #7a3f24; }

/* An island with a lighthouse. The lamp comes on at dusk and its beam sweeps the night. */
.ui-daynight-isle {
  left: 1em;
  bottom: .21em;
  width: .64em;
  height: .17em;
  background: linear-gradient(color-mix(in oklab, #0a0f2c calc(var(--q) * 100%), #5d6b5a), color-mix(in oklab, #04071a calc(var(--q) * 100%), #2f3a36));
  clip-path: polygon(0 100%, 7% 66%, 20% 52%, 31% 24%, 47% 8%, 62% 20%, 76% 50%, 90% 68%, 100% 100%);
}
.ui-daynight-tower {
  left: 1.285em;
  bottom: .355em;
  width: .075em;
  height: .25em;
  background: repeating-linear-gradient(to bottom, #f6f2ea 0 .05em, #d6453c .05em .1em);
  clip-path: polygon(24% 0, 76% 0, 100% 100%, 0 100%);
  filter: brightness(calc(1 - var(--q) * .5));
}
.ui-daynight-lamp {
  left: 1.296em;
  bottom: .6em;
  width: .053em;
  height: .05em;
  border-radius: .012em .012em 0 0;
  background: color-mix(in oklab, #fff3b0 calc(var(--q) * 100%), #2b303b);
  box-shadow: 0 0 calc(var(--q) * .14em) calc(var(--q) * .03em) rgb(255 233 150 / .9);
}
.ui-daynight-beam {
  left: 1.322em;
  top: .265em;
  width: 1.1em;
  height: .22em;
  background: linear-gradient(90deg, rgb(255 240 190 / .8), transparent 85%);
  clip-path: polygon(0 50%, 100% 0, 100% 100%);
  opacity: clamp(0, calc(var(--q) * 2 - 1), 1);
  transform-origin: 0 50%;
  animation: ui-daynight-sweep 4s ease-in-out infinite;
}
/* Glass: an inner shadow and a rim of light so the scene sits inside the switch. */
.ui-daynight-glass {
  inset: 0;
  border-radius: inherit;
  box-shadow: inset 0 .06em .1em rgb(0 0 0 / .38), inset 0 -.02em .03em rgb(255 255 255 / .35), inset 0 0 0 .012em rgb(0 0 0 / .18);
}

@keyframes ui-daynight-sway { from { translate: -.08em 0; transform: skewX(-8deg); } to { translate: .1em .03em; transform: skewX(10deg); } }
@keyframes ui-daynight-waves { to { background-position: -.24em .02em; } }
@keyframes ui-daynight-shimmer { to { background-position: 0 .048em; } }
@keyframes ui-daynight-bob { 0%, 100% { rotate: -5deg; } 50% { rotate: 5deg; } }
@keyframes ui-daynight-sweep { 0%, 100% { transform: scaleX(1); } 50% { transform: scaleX(-1); } }
@keyframes ui-daynight-twinkle { 50% { scale: .3; opacity: .4; } }
@keyframes ui-daynight-shoot { 0% { opacity: 0; translate: -.5em -.2em; } 25% { opacity: 1; } 100% { opacity: 0; translate: 1.2em .5em; } }
@media (prefers-reduced-motion: reduce) {
  :is(.ui-daynight, .ui-daynight *), :is(.ui-daynight, .ui-daynight *)::before, :is(.ui-daynight, .ui-daynight *)::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    transition-delay: 0s !important;
  }
}
`;

const STARS = [
  { x: ".3em", y: ".2em", s: ".04em" },
  { x: ".62em", y: ".46em", s: ".03em" },
  { x: ".9em", y: ".14em", s: ".026em" },
  { x: "1.2em", y: ".38em", s: ".034em" },
  { x: "1.5em", y: ".12em", s: ".024em" },
  { x: ".16em", y: ".5em", s: ".022em" },
  { x: "1.06em", y: ".56em", s: ".02em" },
  { x: ".46em", y: ".1em", s: ".018em" },
  { x: ".78em", y: ".34em", s: ".018em" },
  { x: "1.36em", y: ".26em", s: ".02em" },
  { x: "1.74em", y: ".5em", s: ".018em" },
];

const calm = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (n, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, n));
// Reads a value off a curve given as [time, value] points, easing between them.
const along = (points, t) => {
  if (t <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    const [t1, v1] = points[i];
    if (t > t1) continue;
    const [t0, v0] = points[i - 1];
    const k = (t - t0) / (t1 - t0);
    return v0 + (v1 - v0) * k * k * (3 - 2 * k);
  }
  return points[points.length - 1][1];
};
// The day, as a time from 0 (dawn) through 1/3 (noon) and 2/3 (afternoon) to 1 (night).
const NIGHT = [[0.72, 0], [0.93, 1]];
const DUSK = [[0.45, 0], [0.667, 0.5], [0.8, 1], [0.95, 0]];
const DAWN = [[0, 1], [0.3, 0]];
const SINK = [[0, 0.3], [0.333, 0], [0.667, 0.2], [0.82, 0.62], [1, 0]]; // low at dawn, high at noon, under the sea at dusk, up again as the moon

export default function DayNightToggle({
  checked,
  defaultChecked = false,
  steps = 2,
  value,
  defaultValue,
  labels = steps === 4 ? ["Morning", "Noon", "Afternoon", "Evening"] : [],
  onChange,
  onProgress,
  label = steps === 2 ? "Dark mode" : "Time of day",
  ...props
}) {
  const last = steps - 1;
  const asSwitch = steps === 2;
  const [inner, setInner] = useState(defaultValue ?? (defaultChecked ? last : 0));
  const [dragging, setDragging] = useState(false);
  const [settle, setSettle] = useState(0);
  const index = clamp(value ?? (checked == null ? inner : checked ? last : 0), 0, last);
  const el = useRef(null);
  const sim = useRef({ p: index / last, v: 0, frame: 0, last: 0 });
  const grip = useRef(null);

  const live = useRef({ onProgress, asSwitch }); // the latest props, for the code that runs every frame
  useEffect(() => {
    live.current = { onProgress, asSwitch };
  });
  const paint = (p) => {
    const node = el.current;
    if (!node) return;
    // A plain day and night switch only plays the second part of the day: noon to night.
    const time = clamp(live.current.asSwitch ? 1 / 3 + (p * 2) / 3 : p);
    node.style.setProperty("--p", p.toFixed(4));
    node.style.setProperty("--q", along(NIGHT, time).toFixed(4));
    node.style.setProperty("--dusk", along(DUSK, time).toFixed(4));
    node.style.setProperty("--dawn", along(DAWN, time).toFixed(4));
    node.style.setProperty("--oy", along(SINK, time).toFixed(4));
    live.current.onProgress?.(p, node);
  };

  // A soft spring carries --p to its target, so the orb settles like something with weight.
  const springTo = (target) => {
    const s = sim.current;
    cancelAnimationFrame(s.frame);
    s.last = performance.now();
    const step = (now) => {
      const dt = Math.min(0.032, (now - s.last) / 1000);
      s.last = now;
      s.v += (-11 * (s.p - target) - 5.4 * s.v) * dt;
      s.p += s.v * dt;
      if (calm() || (Math.abs(s.v) < 0.002 && Math.abs(s.p - target) < 0.002)) {
        s.p = target;
        s.v = 0;
        return paint(target);
      }
      paint(s.p);
      s.frame = requestAnimationFrame(step);
    };
    s.frame = requestAnimationFrame(step);
  };

  useLayoutEffect(() => {
    paint(sim.current.p);
  }, []);
  useEffect(() => {
    const s = sim.current;
    springTo(index / last);
    return () => cancelAnimationFrame(s.frame);
  }, [index, last, settle]);

  const commit = (next) => {
    setInner(next);
    if (next !== index) onChange?.(asSwitch ? next === last : next);
    setSettle((n) => n + 1); // spring home even when the value did not change
  };

  const down = (e) => {
    if (e.button) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    grip.current = { x: e.clientX, p: sim.current.p, moved: false, at: performance.now(), travel: el.current.offsetWidth * (1.6 / 2.6) };
  };
  const move = (e) => {
    const g = grip.current;
    if (!g) return;
    const dx = e.clientX - g.x;
    // Dragged right off the control while still holding: let go of it and run to the nearest end.
    const box = el.current.getBoundingClientRect();
    if (e.clientX < box.left || e.clientX > box.right || e.clientY < box.top || e.clientY > box.bottom) {
      grip.current = null;
      setDragging(false);
      return commit(e.clientX < box.left ? 0 : e.clientX > box.right ? last : sim.current.p < 0.5 ? 0 : last);
    }
    if (!g.moved && Math.abs(dx) < 4) return;
    if (!g.moved) {
      g.moved = true;
      cancelAnimationFrame(sim.current.frame);
      setDragging(true);
    }
    const s = sim.current;
    const p = clamp(g.p + dx / g.travel, -0.06, 1.06);
    const now = performance.now();
    s.v = clamp((p - s.p) / Math.max(0.008, (now - g.at) / 1000), -6, 6);
    s.p = p;
    g.at = now;
    paint(p);
  };
  const up = () => {
    const g = grip.current;
    if (!g) return;
    grip.current = null;
    setDragging(false);
    // A tap goes all the way across. A drag lands on the stop nearest to where it was thrown.
    commit(g.moved ? clamp(Math.round((sim.current.p + sim.current.v * 0.12) * last), 0, last) : across);
  };
  const key = (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") commit(Math.min(last, index + 1));
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") commit(Math.max(0, index - 1));
  };
  const across = index === last ? 0 : last; // where a click sends it: to the last stop, or back to the first
  const role = asSwitch
    ? { role: "switch", "aria-checked": index === last }
    : { role: "slider", "aria-valuemin": 0, "aria-valuemax": last, "aria-valuenow": index, "aria-valuetext": labels[index] };

  return (
    <button
      ref={el}
      type="button"
      {...role}
      className="ui-daynight"
      data-night={index === last}
      aria-label={label}
      data-drag={dragging}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onClick={(e) => e.detail === 0 && commit(across)} // keyboard only: pointers are handled above
      onKeyDown={key}
      {...props}
    >
      <style>{css}</style>
      <span className="ui-daynight-dawn" />
      <span className="ui-daynight-night" />
      <span className="ui-daynight-aurora" />
      <span className="ui-daynight-dusk" />
      {STARS.map((star, i) => (
        <i key={i} className="ui-daynight-star" style={{ "--x": star.x, "--y": star.y, "--s": star.s, "--i": i }} />
      ))}
      <i className="ui-daynight-shoot" />
      <span className="ui-daynight-glow" />
      <span className="ui-daynight-cloud" />
      <span className="ui-daynight-cloud" />
      <span className="ui-daynight-orb">
        <span className="ui-daynight-sun" />
        <span className="ui-daynight-moon" />
      </span>
      <span className="ui-daynight-sea" />
      <span className="ui-daynight-shine" />
      <span className="ui-daynight-boat" />
      <span className="ui-daynight-isle" />
      <span className="ui-daynight-tower" />
      <span className="ui-daynight-lamp" />
      <span className="ui-daynight-beam" />
      <span className="ui-daynight-glass" />
    </button>
  );
}
