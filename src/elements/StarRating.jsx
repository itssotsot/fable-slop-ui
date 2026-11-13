// StarRating: the stars react to the score you give.
//   1 star   the star sobs and sheds tears while the others droop
//   2 stars  they sag with a sigh
//   3 stars  they shrug
//   4 stars  they hop and throw sparkles
//   5 stars  they flip in the air over a burst of confetti
// Usage: <StarRating onChange={(stars) => setRating(stars)} />
// Keyboard: arrow keys change the rating. Choosing the current rating again clears it.
import { useState } from "react";

const css = `
.ui-stars {
  --star: var(--ui-star, #f5a400);
  --accent: var(--ui-accent, #1a4be0);
  --ink: var(--ui-ink, #111);
  --line: var(--ui-line, #e3e3e3);
  --muted: var(--ui-muted, #6b6b6b);
  display: inline-grid;
  justify-items: center;
  gap: 10px;
  font: inherit;
}
.ui-stars[data-level="1"] { --star: #e5484d; }
.ui-stars[data-level="2"] { --star: #f0803c; }
.ui-stars-row { position: relative; display: flex; }
.ui-stars-row[data-score="1"] { animation: ui-stars-no .5s; }
.ui-stars button {
  padding: 4px;
  border: 0;
  border-radius: 10px;
  background: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.ui-stars button:focus-visible { outline: 2px solid var(--accent); }
.ui-stars svg {
  display: block;
  fill: transparent;
  stroke: var(--line);
  transform-origin: 50% 85%;
  transition: fill .2s calc(var(--i) * 30ms), stroke .2s calc(var(--i) * 30ms), scale .3s cubic-bezier(.34, 1.56, .64, 1), rotate .3s cubic-bezier(.34, 1.56, .64, 1);
}
.ui-stars button[data-on="true"] svg { fill: var(--star); stroke: var(--star); }
.ui-stars button:hover svg { scale: 1.2; rotate: -8deg; }
.ui-stars button:active svg { scale: .9; }

/* What the stars do for each score. The svg is re-created on every choice, so the animation always restarts. */
.ui-stars-row[data-score="1"] [data-chosen="true"] svg { animation: ui-stars-sob 1s; }
.ui-stars-row[data-score="1"] [data-chosen="false"] svg { animation: ui-stars-droop 1.5s calc(var(--i) * 70ms) cubic-bezier(.3, 0, .3, 1); }
.ui-stars-row[data-score="2"] [data-chosen="true"] svg { animation: ui-stars-sag 1s calc(var(--i) * 90ms) cubic-bezier(.3, 0, .3, 1); }
.ui-stars-row[data-score="3"] [data-chosen="true"] svg { animation: ui-stars-shrug .8s calc(var(--i) * 60ms); }
.ui-stars-row[data-score="4"] [data-chosen="true"] svg { animation: ui-stars-hop .8s calc(var(--i) * 70ms) backwards; }
.ui-stars-row[data-score="5"] [data-chosen="true"] svg { animation: ui-stars-party 1.1s calc(var(--i) * 80ms) backwards; }

.ui-stars-fx { position: absolute; inset: 0; pointer-events: none; }
.ui-stars-fx i { position: absolute; left: var(--l, 50%); top: 50%; opacity: 0; }
.ui-stars-tear {
  width: 6px;
  height: 6px;
  margin: 4px -3px;
  border-radius: 0 50% 50% 50%;
  background: #4da3e8;
  rotate: 45deg;
  animation: ui-stars-tear .9s var(--d) cubic-bezier(.5, 0, .9, .6) 2;
}
.ui-stars-puff {
  width: 10px;
  height: 10px;
  margin: -14px -5px;
  border-radius: 50%;
  background: var(--line);
  animation: ui-stars-puff 1.1s var(--d) ease-out;
}
.ui-stars-spark {
  width: var(--s);
  height: var(--s);
  margin: calc(var(--s) / -2);
  background: var(--star);
  clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%);
  animation: ui-stars-spark .9s var(--d) ease-out;
}
.ui-stars-confetti {
  width: var(--w);
  height: var(--h);
  margin: -4px;
  border-radius: var(--round);
  background: var(--c);
  animation: ui-stars-confetti var(--t) var(--d) linear;
}
.ui-stars-ring {
  width: 30px;
  height: 30px;
  margin: -15px;
  border: 2px solid var(--star);
  border-radius: 50%;
  box-sizing: border-box;
  animation: ui-stars-ring .7s .25s ease-out;
}

.ui-stars-word { height: 24px; color: var(--muted); font-size: 14px; line-height: 24px; }
.ui-stars-word span { display: block; animation: ui-stars-word .25s; }
.ui-stars-word b { color: var(--ink); font-weight: 500; }
.ui-stars-word [data-mood="1"] { animation: ui-stars-no .5s; }
.ui-stars-word [data-mood="1"] b { color: #d93025; }
.ui-stars-word [data-mood="2"] { animation: ui-stars-sink .7s cubic-bezier(.3, 0, .3, 1); }
.ui-stars-word [data-mood="4"] { animation: ui-stars-cheer .5s .3s cubic-bezier(.3, 1.8, .5, 1) backwards; }
.ui-stars-word [data-mood="4"] b { font-weight: 600; }
.ui-stars-word [data-mood="5"] { animation: ui-stars-cheer .7s .55s cubic-bezier(.3, 2.2, .5, 1) backwards; }
.ui-stars-word [data-mood="5"] b { font-size: 18px; font-weight: 700; letter-spacing: -.01em; }

@keyframes ui-stars-no { 15% { translate: -6px 0; } 35% { translate: 6px 0; } 55% { translate: -4px 0; } 75% { translate: 3px 0; } }
@keyframes ui-stars-sob {
  10% { translate: -3px 0; rotate: -10deg; }
  20% { translate: 3px 0; rotate: 8deg; }
  30% { translate: -3px 1px; rotate: -8deg; }
  40% { translate: 3px 1px; rotate: 6deg; }
  50% { translate: -2px 2px; rotate: -5deg; scale: .9; }
  60% { translate: 2px 2px; rotate: 4deg; scale: .88; }
  75% { translate: 0 3px; rotate: 0deg; scale: .86; }
}
@keyframes ui-stars-droop {
  25%, 70% { translate: 0 9px; rotate: 22deg; opacity: .45; }
}
@keyframes ui-stars-sag {
  25% { scale: 1.2 .6; translate: 0 6px; }
  50% { scale: .94 1.06; translate: 0 0; }
  70% { scale: 1.08 .9; translate: 0 3px; }
}
@keyframes ui-stars-shrug {
  25% { rotate: -20deg; translate: 0 -4px; }
  55% { rotate: 16deg; translate: 0 -4px; }
  80% { rotate: -6deg; }
}
@keyframes ui-stars-hop {
  0% { scale: .6; }
  18% { scale: 1.25 .7; translate: 0 4px; }
  45% { scale: .88 1.22; translate: 0 -20px; }
  70% { scale: 1.18 .84; translate: 0 0; }
  86% { scale: .96 1.05; }
}
@keyframes ui-stars-party {
  0% { scale: .4; }
  14% { scale: 1.3 .65; translate: 0 5px; rotate: 0deg; }
  48% { scale: 1.35; translate: 0 -34px; rotate: 220deg; }
  72% { scale: 1.25 .78; translate: 0 0; rotate: 360deg; }
  86% { scale: .94 1.1; rotate: 360deg; }
  100% { rotate: 360deg; }
}
@keyframes ui-stars-tear {
  0% { opacity: 0; translate: 0 0; scale: .4; }
  20% { opacity: 1; scale: 1; }
  100% { opacity: 0; translate: 0 46px; scale: .8; }
}
@keyframes ui-stars-puff {
  0% { opacity: .9; scale: .4; }
  100% { opacity: 0; scale: 2.2; translate: var(--x) -38px; }
}
@keyframes ui-stars-spark {
  0% { opacity: 1; scale: 0; }
  40% { opacity: 1; scale: 1; translate: var(--x) calc(var(--y) * .8); rotate: 90deg; }
  100% { opacity: 0; scale: 0; translate: var(--x) var(--y); rotate: 180deg; }
}
@keyframes ui-stars-confetti {
  0% { opacity: 1; translate: 0 0; scale: 0; animation-timing-function: cubic-bezier(.1, .7, .3, 1); }
  45% { opacity: 1; translate: calc(var(--x) * .8) var(--y); scale: 1; rotate: calc(var(--r) * .5); animation-timing-function: cubic-bezier(.6, 0, .9, .6); }
  100% { opacity: 0; translate: var(--x) var(--fall); scale: .8; rotate: var(--r); }
}
@keyframes ui-stars-ring { 0% { opacity: .9; } 100% { opacity: 0; width: 300px; height: 300px; margin: -150px; } }
@keyframes ui-stars-word { from { opacity: 0; translate: 0 4px; } }
@keyframes ui-stars-sink { 40% { translate: 0 4px; rotate: -3deg; opacity: .6; } }
@keyframes ui-stars-cheer { from { scale: .5; opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  :is(.ui-stars, .ui-stars *), :is(.ui-stars, .ui-stars *)::before, :is(.ui-stars, .ui-stars *)::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    transition-delay: 0s !important;
  }
}
`;

const WORDS = ["Terrible", "Poor", "Okay", "Good", "Excellent"];
const CONFETTI = ["var(--star)", "var(--accent)", "#e5484d", "#1a9a52", "var(--ink)"];

// A repeatable stand-in for Math.random, so the burst looks scattered but renders the same every time.
const rand = (i, salt) => {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const px = (n) => Math.round(n) + "px";

function Effects({ score, max }) {
  const centre = (i) => ((i + 0.5) / max) * 100 + "%";
  if (score === 1) {
    return [0, 1, 2].map((i) => <i key={i} className="ui-stars-tear" style={{ "--l": "calc(" + centre(0) + " + " + (i - 1) * 8 + "px)", "--d": i * 180 + "ms" }} />);
  }
  if (score === 2) {
    return [0, 1, 2, 3].map((i) => <i key={i} className="ui-stars-puff" style={{ "--l": centre(i % 2), "--x": px((rand(i, 1) - 0.5) * 30), "--d": 250 + i * 120 + "ms" }} />);
  }
  if (score === 4) {
    return Array.from({ length: 10 }, (_, i) => (
      <i
        key={i}
        className="ui-stars-spark"
        style={{ "--l": centre(i % 4), "--s": px(7 + rand(i, 2) * 7), "--x": px((rand(i, 3) - 0.5) * 50), "--y": px(-26 - rand(i, 4) * 30), "--d": 300 + (i % 4) * 70 + rand(i, 5) * 120 + "ms" }}
      />
    ));
  }
  if (score >= 5) {
    return [
      <i key="ring" className="ui-stars-ring" />,
      ...Array.from({ length: 30 }, (_, i) => (
        <i
          key={i}
          className="ui-stars-confetti"
          style={{
            "--c": CONFETTI[i % CONFETTI.length],
            "--w": px(5 + rand(i, 1) * 4),
            "--h": px(5 + rand(i, 2) * 7),
            "--round": i % 3 ? "2px" : "50%",
            "--x": px((rand(i, 3) - 0.5) * 300),
            "--y": px(-50 - rand(i, 4) * 80),
            "--fall": px(50 + rand(i, 5) * 70),
            "--r": Math.round((rand(i, 6) - 0.5) * 1080) + "deg",
            "--t": 1100 + rand(i, 7) * 600 + "ms",
            "--d": 250 + rand(i, 8) * 200 + "ms",
          }}
        />
      )),
      ...Array.from({ length: 6 }, (_, i) => (
        <i key={"s" + i} className="ui-stars-spark" style={{ "--l": centre(i % 5), "--s": px(9 + rand(i, 9) * 8), "--x": px((rand(i, 10) - 0.5) * 60), "--y": px(-44 - rand(i, 11) * 30), "--d": 420 + i * 60 + "ms" }} />
      )),
    ];
  }
  return null;
}

export default function StarRating({ max = 5, defaultValue = 0, words = WORDS, onChange }) {
  const [value, setValue] = useState(defaultValue);
  const [hover, setHover] = useState(0);
  const [picks, setPicks] = useState(0);
  const shown = hover || value;
  const score = picks ? value : 0; // nothing plays until the first choice

  const choose = (n) => {
    const next = n === value ? 0 : n;
    setValue(next);
    setHover(0);
    setPicks((p) => p + 1);
    onChange?.(next);
  };
  const key = (e) => {
    const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const next = Math.max(1, Math.min(max, value + step));
    if (next !== value) choose(next);
    e.currentTarget.querySelectorAll("button")[next - 1]?.focus();
  };

  return (
    <div className="ui-stars" data-level={shown}>
      <style>{css}</style>
      <div className="ui-stars-row" role="radiogroup" aria-label="Rating" data-score={score || undefined} onKeyDown={key} onPointerLeave={() => setHover(0)}>
        {Array.from({ length: max }, (_, i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={value === i + 1}
            aria-label={i + 1 + (i ? " stars" : " star")}
            tabIndex={value === i + 1 || (!value && i === 0) ? 0 : -1}
            style={{ "--i": i }}
            data-on={i < shown}
            data-chosen={i < value}
            onPointerEnter={(e) => e.pointerType === "mouse" && setHover(i + 1)}
            onClick={() => choose(i + 1)}
          >
            <svg key={picks} width="32" height="32" viewBox="0 0 24 24" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3l2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 16.9l-5.4 2.9 1.1-6.1-4.5-4.3 6.1-.8z" />
            </svg>
          </button>
        ))}
        <span key={picks} className="ui-stars-fx" aria-hidden="true">
          <Effects score={score} max={max} />
        </span>
      </div>
      <div className="ui-stars-word" aria-live="polite">
        <span key={shown + "-" + picks} data-mood={hover ? undefined : score || undefined}>
          {shown ? <b>{words[shown - 1] ?? shown + " of " + max}</b> : "Tap a star to rate"}
        </span>
      </div>
    </div>
  );
}
