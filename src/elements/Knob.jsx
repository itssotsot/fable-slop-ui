// Knob: a volume dial ringed by a spectrum visualiser. The bars dance to a built-in beat,
// and the higher you turn it, the bigger they jump. At zero they fall flat.
// Usage: <Knob label="Volume" min={0} max={100} defaultValue={35} onChange={(n) => setVolume(n)} />
// Drag around the dial, or use the arrow keys (Page Up and Page Down step by 10, Home and End jump to the limits).
// The visualiser pauses with its button, when it scrolls out of view, and for people who prefer reduced motion.
// To drive it from real audio, replace the `target` line in the loop with your analyser's frequency data.
import { useEffect, useRef, useState } from "react";

const css = `
.ui-knob {
  --accent: var(--ui-accent, #1a4be0);
  --ink: var(--ui-ink, #111);
  --bg: var(--ui-bg, #fff);
  --soft: var(--ui-soft, #f4f4f4);
  --line: var(--ui-line, #e3e3e3);
  --muted: var(--ui-muted, #6b6b6b);
  display: inline-grid;
  justify-items: center;
  gap: 4px;
  color: var(--ink);
  font: inherit;
}
.ui-knob-dial {
  --beat: 0;
  position: relative;
  display: grid;
  place-items: center;
  width: 196px;
  height: 196px;
  border-radius: 50%;
  cursor: grab;
  outline: 0;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}
.ui-knob-dial[data-active="true"] { cursor: grabbing; }
.ui-knob-spoke { position: absolute; left: 50%; top: 50%; width: 0; height: 0; }
.ui-knob-spoke b {
  position: absolute;
  left: -1.5px;
  bottom: 58px;
  width: 3px;
  height: 5px;
  border-radius: 2px;
  background: color-mix(in srgb, var(--muted) 35%, var(--line));
  transition: background .2s;
}
.ui-knob-spoke[data-on="true"] b { background: var(--accent); }
.ui-knob[data-playing="false"] .ui-knob-spoke b { transition: background .2s, height .5s cubic-bezier(.3, 1.4, .5, 1); }
.ui-knob-body {
  position: relative;
  display: grid;
  place-items: center;
  width: 96px;
  height: 96px;
  border: 1px solid var(--line);
  border-radius: 50%;
  background: var(--bg);
  box-shadow:
    0 0 0 calc(var(--beat) * 9px) color-mix(in srgb, var(--accent) 16%, transparent),
    0 10px 24px -10px rgb(0 0 0 / .35),
    inset 0 1px 0 rgb(255 255 255 / .2);
  scale: calc(1 + var(--beat) * .06);
}
.ui-knob-dial[data-active="true"] .ui-knob-body { border-color: var(--accent); }
.ui-knob-dial:focus-visible .ui-knob-body { outline: 2px solid var(--accent); outline-offset: 3px; }
.ui-knob-mark { position: absolute; inset: 0; }
.ui-knob-mark::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 8px;
  width: 4px;
  height: 16px;
  margin-left: -2px;
  border-radius: 2px;
  background: var(--accent);
}
.ui-knob-value { font-size: 24px; font-weight: 500; font-variant-numeric: tabular-nums; line-height: 1; }
.ui-knob-foot { display: flex; align-items: center; gap: 8px; color: var(--muted); font-size: 13px; }
.ui-knob-foot button {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--soft);
  color: var(--ink);
  cursor: pointer;
  transition: scale .25s cubic-bezier(.34, 1.56, .64, 1), background .2s, color .2s;
  -webkit-tap-highlight-color: transparent;
}
.ui-knob-foot button:hover { background: var(--ink); color: var(--bg); }
.ui-knob-foot button:active { scale: .85; }
.ui-knob-foot button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
`;

const BARS = 40;
const SWEEP = 270;
const REST = 5; // bar height in px when silent
const JUMP = 32; // the most a bar can grow at full volume

const calm = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function Knob({ label = "Volume", min = 0, max = 100, defaultValue = 35, onChange }) {
  const [value, setValue] = useState(defaultValue);
  const [active, setActive] = useState(false);
  const [playing, setPlaying] = useState(() => !calm());
  const dial = useRef(null);
  const loudness = useRef(0);
  const portion = (value - min) / (max - min);
  const angle = -SWEEP / 2 + portion * SWEEP;

  useEffect(() => {
    loudness.current = Math.pow(portion, 1.2);
  }, [portion]);

  // The visualiser writes straight to the DOM, so React does not re-render sixty times a second.
  useEffect(() => {
    const node = dial.current;
    const bars = [...node.querySelectorAll(".ui-knob-spoke b")];
    if (!playing) {
      for (const bar of bars) bar.style.height = REST + "px";
      node.style.setProperty("--beat", 0);
      return;
    }
    const levels = new Float32Array(BARS);
    let visible = true;
    let frame;
    const watcher = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    watcher.observe(node);

    const draw = (now) => {
      frame = requestAnimationFrame(draw);
      if (!visible) return;
      const t = now / 1000;
      const loud = loudness.current;
      const beat = Math.pow(Math.max(0, Math.sin(t * Math.PI * 4)), 8); // a kick drum at 120 beats a minute
      for (let i = 0; i < BARS; i++) {
        const x = i / (BARS - 1); // 0 = bass end, 1 = treble end
        const bass = beat * (1 - x) * (1 - x);
        const mids = (0.5 + 0.5 * Math.sin(t * 5.3 + i * 0.7)) * Math.sin(Math.PI * x) * 0.75;
        const highs = (0.5 + 0.5 * Math.sin(t * 17 + i * 2.3)) * x * 0.55;
        const flutter = 0.55 + 0.45 * Math.sin(t * 9.1 + i * 12.9898);
        const target = Math.min(1, (bass + mids + highs) * flutter);
        levels[i] += (target - levels[i]) * (target > levels[i] ? 0.5 : 0.13); // fast attack, slow release
        bars[i].style.height = REST + levels[i] * loud * JUMP + "px";
      }
      node.style.setProperty("--beat", (beat * loud).toFixed(3));
    };
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      watcher.disconnect();
    };
  }, [playing]);

  const set = (next) => {
    const clamped = Math.max(min, Math.min(max, Math.round(next)));
    setValue(clamped);
    onChange?.(clamped);
  };
  const point = (e) => {
    const r = dial.current.getBoundingClientRect();
    let a = (Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2))) * 180) / Math.PI;
    // In the gap at the bottom, stay on whichever end is closer to the current value.
    if (Math.abs(a) > SWEEP / 2) a = portion > 0.5 ? SWEEP / 2 : -SWEEP / 2;
    set(min + ((a + SWEEP / 2) / SWEEP) * (max - min));
  };
  const key = (e) => {
    const moves = { ArrowUp: value + 1, ArrowRight: value + 1, ArrowDown: value - 1, ArrowLeft: value - 1, PageUp: value + 10, PageDown: value - 10, Home: min, End: max };
    if (e.key in moves) {
      e.preventDefault();
      set(moves[e.key]);
    }
  };

  return (
    <div className="ui-knob" data-playing={playing}>
      <style>{css}</style>
      <div
        ref={dial}
        className="ui-knob-dial"
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        data-active={active}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          setActive(true);
          point(e);
        }}
        onPointerMove={(e) => active && point(e)}
        onPointerUp={() => setActive(false)}
        onPointerCancel={() => setActive(false)}
        onKeyDown={key}
      >
        {Array.from({ length: BARS }, (_, i) => (
          <i key={i} className="ui-knob-spoke" data-on={portion > 0 && i / (BARS - 1) <= portion} style={{ transform: "rotate(" + (-SWEEP / 2 + (i / (BARS - 1)) * SWEEP) + "deg)" }}>
            <b />
          </i>
        ))}
        <div className="ui-knob-body">
          <span className="ui-knob-mark" style={{ transform: "rotate(" + angle + "deg)" }} />
          <span className="ui-knob-value">{value}</span>
        </div>
      </div>
      <div className="ui-knob-foot">
        <button type="button" aria-label={playing ? "Pause the visualiser" : "Play the visualiser"} aria-pressed={playing} onClick={() => setPlaying(!playing)}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
            {playing ? <path d="M2 1.5h3v9H2zM7 1.5h3v9H7z" /> : <path d="M3 1.2v9.6L10.5 6z" />}
          </svg>
        </button>
        {label}
      </div>
    </div>
  );
}
