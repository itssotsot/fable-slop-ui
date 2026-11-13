// MoodSlider: a feedback slider where everything emotes. The track bends from a frown into a smile,
// and the face follows on a spring: it changes colour, tilts, watches the handle, raises its brows,
// blushes, opens into a grin, and sheds a tear at the bottom or throws sparkles at the top.
// Usage: <MoodSlider defaultValue={50} onChange={(value, word) => setMood(value)} />   // value: 0 to 100
// A native range input sits on top of the drawing, so keyboard and screen readers work as usual.
import { useEffect, useId, useRef, useState } from "react";

const css = `
.ui-mood {
  --accent: var(--ui-accent, #1a4be0);
  --ink: var(--ui-ink, #111);
  --bg: var(--ui-bg, #fff);
  --soft: var(--ui-soft, #f4f4f4);
  --muted: var(--ui-muted, #6b6b6b);
  position: relative;
  width: 260px;
  height: 204px;
  color: var(--ink);
  font: inherit;
  user-select: none;
  -webkit-user-select: none;
}
.ui-mood svg { display: block; overflow: visible; }
.ui-mood-word {
  position: absolute;
  left: 0;
  right: 0;
  top: 118px;
  height: 22px;
  font-size: 16px;
  font-weight: 600;
  line-height: 22px;
  text-align: center;
  overflow: hidden;
}
.ui-mood-word span { display: block; animation: ui-mood-word .35s cubic-bezier(.3, 1.5, .5, 1); }
.ui-mood-word span[data-dir="-1"] { --from: -100%; }
.ui-mood input {
  position: absolute;
  left: 10px;
  top: 150px;
  width: 240px;
  height: 44px;
  margin: 0;
  opacity: 0;
  cursor: grab;
  touch-action: pan-y;
  -webkit-appearance: none;
  appearance: none;
}
.ui-mood input:active { cursor: grabbing; }
.ui-mood input::-webkit-slider-thumb { width: 28px; height: 44px; -webkit-appearance: none; }
.ui-mood input::-moz-range-thumb { width: 28px; height: 44px; border: 0; }
.ui-mood-rail { fill: none; stroke: var(--soft); stroke-width: 8; stroke-linecap: round; }
.ui-mood-fill { fill: none; stroke: var(--accent); stroke-width: 8; stroke-linecap: round; }
.ui-mood-stop { fill: var(--muted); opacity: .45; }
.ui-mood-stop[data-passed="true"] { fill: var(--bg); opacity: .9; }
.ui-mood-halo { fill: var(--accent); opacity: 0; transform-box: fill-box; transform-origin: center; scale: .5; transition: opacity .2s, scale .35s cubic-bezier(.34, 1.56, .64, 1); }
.ui-mood-thumb { fill: var(--bg); stroke: var(--accent); stroke-width: 3; transform-box: fill-box; transform-origin: center; transition: scale .3s cubic-bezier(.34, 1.56, .64, 1); filter: drop-shadow(0 3px 4px rgb(0 0 0 / .25)); }
.ui-mood[data-active="true"] .ui-mood-halo { opacity: .18; scale: 1; }
.ui-mood[data-active="true"] .ui-mood-thumb { scale: 1.18; }
.ui-mood:has(input:focus-visible) .ui-mood-halo { opacity: .28; scale: 1; }
.ui-mood-ink { stroke: #2a1c14; fill: none; stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; }
.ui-mood-tear { fill: #7cc4f5; stroke: #fff; stroke-width: .8; stroke-opacity: .7; animation: ui-mood-drip 1.3s ease-in 3; }
.ui-mood-ring { fill: none; stroke: var(--accent); transform-box: fill-box; transform-origin: center; animation: ui-mood-ring 2.6s calc(var(--i) * -.87s) ease-out infinite; }
.ui-mood-spark { fill: var(--accent); transform-box: fill-box; transform-origin: center; animation: ui-mood-spark .7s calc(var(--i) * 90ms) cubic-bezier(.3, 1.6, .5, 1) backwards; }
.ui-mood-blink { transform-box: fill-box; transform-origin: center; animation: ui-mood-blink .28s .15s; }
@keyframes ui-mood-word { from { opacity: 0; translate: 0 var(--from, 100%); } }
@keyframes ui-mood-drip { 0% { opacity: 0; translate: 0 -4px; } 20% { opacity: 1; } 100% { opacity: 0; translate: 0 22px; } }
@keyframes ui-mood-spark { from { scale: 0; rotate: -90deg; opacity: 0; } }
@keyframes ui-mood-blink { 50% { scale: 1 .1; } }
@keyframes ui-mood-ring { from { scale: .8; opacity: .5; } to { scale: 1.45; opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  :is(.ui-mood, .ui-mood *), :is(.ui-mood, .ui-mood *)::before, :is(.ui-mood, .ui-mood *)::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    transition-delay: 0s !important;
  }
}
`;

const WORDS = ["Awful", "Not great", "Okay", "Good", "Great"];
// Face colours from the bottom of the scale to the top.
const TONES = [
  [122, 146, 190],
  [150, 176, 184],
  [222, 198, 150],
  [244, 190, 96],
  [250, 168, 58],
];
const SPARKS = [
  [70, 24, 6],
  [192, 18, 7.5],
  [204, 80, 4.5],
  [56, 86, 4],
];

const clamp = (n, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, n));
const tone = (k) => {
  const at = k * (TONES.length - 1);
  const i = Math.min(TONES.length - 2, Math.floor(at));
  return "rgb(" + TONES[i].map((c, n) => Math.round(c + (TONES[i + 1][n] - c) * (at - i))).join(" ") + ")";
};
const calm = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const star = (x, y, r) => "M" + x + " " + (y - r) + "Q" + x + " " + y + " " + (x + r) + " " + y + "Q" + x + " " + y + " " + x + " " + (y + r) + "Q" + x + " " + y + " " + (x - r) + " " + y + "Q" + x + " " + y + " " + x + " " + (y - r) + "Z";

export default function MoodSlider({ defaultValue = 50, words = WORDS, label = "How was it?", onChange }) {
  const clip = useId().replace(/:/g, "");
  const [value, setValue] = useState(defaultValue);
  const [active, setActive] = useState(false);
  const [dir, setDir] = useState(1);
  const t = value / 100;

  // The face is built in layers: a floor shadow, an aura, the lit body, then the features on top.
  // The face does not jump to the new value. It chases it on a spring and overshoots a little.
  const [s, setS] = useState(t);
  const sim = useRef({ p: t, v: 0, last: 0 });
  useEffect(() => {
    const m = sim.current;
    let frame;
    m.last = performance.now();
    const step = (now) => {
      const dt = Math.min(0.032, (now - m.last) / 1000);
      m.last = now;
      m.v += (-150 * (m.p - t) - 13 * m.v) * dt;
      m.p += m.v * dt;
      if (calm() || (Math.abs(m.v) < 0.002 && Math.abs(m.p - t) < 0.002)) {
        m.p = t;
        m.v = 0;
        return setS(t);
      }
      setS(m.p);
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [t]);

  const k = clamp(s);
  const level = Math.round(t * (words.length - 1));
  const word = words[level];
  const sad = clamp((0.45 - k) / 0.45); // 1 at the bottom, 0 from the middle up
  const joy = clamp((k - 0.55) / 0.45); // 0 up to the middle, 1 at the top
  const open = clamp((k - 0.72) / 0.28); // how far the mouth opens
  const grin = clamp((k - 0.78) / 0.14); // eyes turn into happy arcs
  const tears = clamp((0.2 - k) / 0.2);

  // Track: a curve from (24,172) to (236,172) whose middle sags or lifts with the mood.
  const bend = (s - 0.5) * 44;
  const curve = "M24 172Q130 " + (172 + bend) + " 236 172";
  const along = (u) => [24 + 212 * u, 172 + 2 * u * (1 - u) * bend];
  const [tx, ty] = along(t);

  // Face
  const face = tone(k);
  const lookX = (t - 0.5) * 7;
  const lookY = active ? 2.5 : 0;
  const eyeY = 55 + lookY;
  const lid = 8.5 - 3 * sad - 1.5 * joy; // how far the eyes are open
  const browOut = 37 + 6 * sad - 3 * joy;
  const browIn = 37 - 6 * sad - 3 * joy;
  const my = 88 + 3 * sad - 2 * joy;
  const half = 16 + 7 * joy;
  const lower = my - 17 * sad + 30 * joy;
  const upper = my + (1 - open) * (lower - my);
  const mouth = "M" + (130 - half) + " " + my + "Q130 " + lower + " " + (130 + half) + " " + my + "Q130 " + upper + " " + (130 - half) + " " + my + "Z";

  const change = (e) => {
    const next = Number(e.target.value);
    setDir(next >= value ? 1 : -1);
    setValue(next);
    onChange?.(next, words[Math.round((next / 100) * (words.length - 1))]);
  };

  return (
    <div className="ui-mood" data-active={active}>
      <style>{css}</style>
      <svg width="260" height="204" viewBox="0 0 260 204" aria-hidden="true">
        <defs>
          <clipPath id={clip}><path d={mouth} /></clipPath>
          <clipPath id={clip + "l"}><ellipse cx="112" cy="55" rx="8.5" ry={lid} /></clipPath>
          <clipPath id={clip + "r"}><ellipse cx="148" cy="55" rx="8.5" ry={lid} /></clipPath>
          <radialGradient id={clip + "body"} cx=".36" cy=".28" r=".85">
            <stop offset="0" stopColor="#fff" stopOpacity=".55" />
            <stop offset=".45" stopColor="#fff" stopOpacity="0" />
            <stop offset=".8" stopColor="#3a1a08" stopOpacity=".16" />
            <stop offset="1" stopColor="#3a1a08" stopOpacity=".42" />
          </radialGradient>
          <radialGradient id={clip + "blush"}>
            <stop offset="0" stopColor="#f0506e" stopOpacity=".7" />
            <stop offset="1" stopColor="#f0506e" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={clip + "iris"} cx=".4" cy=".35">
            <stop offset="0" stopColor="#7a5a40" />
            <stop offset=".7" stopColor="#3a2618" />
            <stop offset="1" stopColor="#1c110a" />
          </radialGradient>
          <filter id={clip + "soft"} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" /></filter>
        </defs>

        {/* Layer 1: the floor shadow tightens as the face lifts. */}
        <ellipse cx="130" cy="113" rx={34 - 8 * s} ry="4" fill="#000" opacity={0.2 - 0.08 * s} filter={"url(#" + clip + "soft)"} />
        {/* Layer 2: an aura in the mood's colour, and rings that pulse out of a happy face. */}
        <circle cx="130" cy="60" r={50 + 10 * joy} fill={face} opacity={0.2 + 0.35 * joy} filter={"url(#" + clip + "soft)"} />
        {joy > 0.5 && [0, 1, 2].map((i) => <circle key={i} className="ui-mood-ring" style={{ "--i": i }} cx="130" cy="60" r="50" strokeWidth="1.5" strokeOpacity={(joy - 0.5) * 2} />)}

        <g transform={"translate(0 " + (0.5 - s) * 8 + ") rotate(" + (s - 0.5) * 12 + " 130 60) translate(130 60) scale(" + (0.92 + 0.08 * s) + ") translate(-130 -60)"}>
          {/* Layer 3: the body, with light from the upper left and shade round the rim. */}
          <circle cx="130" cy="60" r="48" fill={face} />
          <circle cx="130" cy="60" r="48" fill={"url(#" + clip + "body)"} />
          <circle cx="130" cy="60" r="47" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="1.2" strokeDasharray="70 300" strokeLinecap="round" transform="rotate(200 130 60)" />
          <ellipse cx="112" cy="30" rx="15" ry="6" fill="#fff" opacity=".4" transform="rotate(-24 112 30)" />

          {/* Layer 4: features. They slide further than the body's light does, which gives the face depth. */}
          <g transform={"translate(" + lookX * 0.6 + " 0)"}>
            <ellipse cx="97" cy="76" rx="12" ry="8" fill={"url(#" + clip + "blush)"} opacity={joy} />
            <ellipse cx="163" cy="76" rx="12" ry="8" fill={"url(#" + clip + "blush)"} opacity={joy} />

            <g opacity={0.35 + 0.65 * Math.max(sad, joy)}>
              <path className="ui-mood-ink" d={"M100 " + browOut + "Q110 " + (Math.min(browOut, browIn) - 3) + " 121 " + browIn} />
              <path className="ui-mood-ink" d={"M160 " + browOut + "Q150 " + (Math.min(browOut, browIn) - 3) + " 139 " + browIn} />
            </g>

            <g key={level} className="ui-mood-blink">
              <g opacity={1 - grin}>
                {[112, 148].map((x, n) => (
                  <g key={x}>
                    <ellipse cx={x} cy="55" rx="8.5" ry={lid} fill="#fffdf8" />
                    <g clipPath={"url(#" + clip + (n ? "r" : "l") + ")"}>
                      <circle cx={x + lookX} cy={eyeY} r="5.6" fill={"url(#" + clip + "iris)"} />
                      <circle cx={x + lookX} cy={eyeY} r="2.6" fill="#0d0705" />
                      <circle cx={x + lookX - 2} cy={eyeY - 2.4} r={1.5 + 0.9 * sad} fill="#fff" />
                      <circle cx={x + lookX + 2.2} cy={eyeY + 2} r=".8" fill="#fff" opacity=".7" />
                      <ellipse cx={x} cy={55 - lid} rx="9" ry="3.5" fill="#3a1a08" opacity=".22" />
                    </g>
                    <path className="ui-mood-ink" strokeWidth="2" d={"M" + (x - 8.5) + " 55A8.5 " + lid + " 0 0 1 " + (x + 8.5) + " 55"} />
                  </g>
                ))}
              </g>
              <g opacity={grin}>
                <path className="ui-mood-ink" d="M104 58Q112 48 120 58" />
                <path className="ui-mood-ink" d="M140 58Q148 48 156 58" />
              </g>
            </g>

            {tears > 0 && <path key={"tear" + level} className="ui-mood-tear" opacity={tears} d="M112 66c3 4 4.5 6.5 4.5 8.5a4.5 4.5 0 0 1-9 0c0-2 1.5-4.5 4.5-8.5z" />}

            <path d={mouth} fill="#3a1012" fillOpacity={open} />
            <g clipPath={"url(#" + clip + ")"} opacity={open}>
              <rect x="100" y={my - 2} width="60" height="7" rx="2" fill="#fffdf8" />
              <ellipse cx="130" cy={(my + lower) / 2 + 6} rx="10" ry="6" fill="#e8607a" />
            </g>
            <path className="ui-mood-ink" d={mouth} />
          </g>
        </g>

        {level === words.length - 1 && SPARKS.map(([x, y, r], i) => <path key={i} className="ui-mood-spark" style={{ "--i": i }} d={star(x, y, r)} />)}

        <path className="ui-mood-rail" d={curve} />
        <path className="ui-mood-fill" d={curve} pathLength="1" strokeDasharray={t + " 1"} />
        {words.map((w, i) => {
          const u = i / (words.length - 1);
          const [x, y] = along(u);
          return <circle key={w} className="ui-mood-stop" data-passed={u < t} cx={x} cy={y} r="2" />;
        })}
        <circle className="ui-mood-halo" cx={tx} cy={ty} r="22" />
        <circle className="ui-mood-thumb" cx={tx} cy={ty} r="12" />
      </svg>
      <div className="ui-mood-word" aria-hidden="true">
        <span key={word} data-dir={dir}>{word}</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        aria-label={label}
        aria-valuetext={word}
        onChange={change}
        onPointerDown={() => setActive(true)}
        onPointerUp={() => setActive(false)}
        onPointerCancel={() => setActive(false)}
        onBlur={() => setActive(false)}
      />
    </div>
  );
}
