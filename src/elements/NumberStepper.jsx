// NumberStepper: digits roll in the direction of travel, holding a button repeats,
// and the control nudges back when it hits a limit.
// Every step clicks: brighter going up, duller going down, and a dull knock at a limit.
// Pass sound={false} to keep it silent. The clicks are made in the browser: there are no audio files.
// Usage: <NumberStepper label="Guests" min={1} max={10} defaultValue={2} onChange={(n) => setGuests(n)} />
import { useEffect, useRef, useState } from "react";

const css = `
.ui-stepper {
  --accent: var(--ui-accent, #1a4be0);
  --ink: var(--ui-ink, #111);
  --soft: var(--ui-soft, #f4f4f4);
  --muted: var(--ui-muted, #6b6b6b);
  display: inline-grid;
  justify-items: center;
  gap: 10px;
  color: var(--ink);
  font: inherit;
}
.ui-stepper-label { color: var(--muted); font-size: 14px; }
.ui-stepper-row { display: flex; align-items: center; gap: 6px; padding: 6px; border-radius: 32px; background: var(--soft); }
.ui-stepper-row[data-bump="min"] { animation: ui-stepper-min .3s; }
.ui-stepper-row[data-bump="max"] { animation: ui-stepper-max .3s; }
.ui-stepper button {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--ui-bg, #fff);
  color: var(--ink);
  cursor: pointer;
  touch-action: manipulation;
  user-select: none;
  -webkit-user-select: none;
  transition: scale .2s cubic-bezier(.34, 1.56, .64, 1), opacity .2s, background .2s, color .2s;
  -webkit-tap-highlight-color: transparent;
}
.ui-stepper button:hover { background: var(--ink); color: var(--ui-bg, #fff); }
.ui-stepper button:active { scale: .85; }
.ui-stepper button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.ui-stepper button[aria-disabled="true"] { opacity: .35; }
.ui-stepper output {
  display: grid;
  justify-items: center;
  width: 64px;
  overflow: hidden;
  font-size: 26px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  line-height: 44px;
}
.ui-stepper output span { grid-area: 1 / 1; }
.ui-stepper output [data-dir="1"] { animation: ui-stepper-up .3s cubic-bezier(.2, .8, .2, 1); }
.ui-stepper output [data-dir="-1"] { animation: ui-stepper-down .3s cubic-bezier(.2, .8, .2, 1); }
@keyframes ui-stepper-up { from { translate: 0 70%; opacity: 0; } }
@keyframes ui-stepper-down { from { translate: 0 -70%; opacity: 0; } }
@keyframes ui-stepper-min { 40% { translate: -5px 0; } }
@keyframes ui-stepper-max { 40% { translate: 5px 0; } }
@media (prefers-reduced-motion: reduce) {
  :is(.ui-stepper, .ui-stepper *), :is(.ui-stepper, .ui-stepper *)::before, :is(.ui-stepper, .ui-stepper *)::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    transition-delay: 0s !important;
  }
}
`;

// A tiny synth for mechanical clicks: a few milliseconds of noise pushed through a narrow filter.
// `pitch` sets how bright the click is, `length` how long it rings.
let audio;
let hiss;
function click(pitch = 2400, { length = 0.03, volume = 0.5, delay = 0, sharp = 6 } = {}) {
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === "suspended") audio.resume();
    if (!hiss) {
      hiss = audio.createBuffer(1, audio.sampleRate * 0.2, audio.sampleRate);
      const data = hiss.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    const start = audio.currentTime + delay;
    const source = audio.createBufferSource();
    const filter = audio.createBiquadFilter();
    const gain = audio.createGain();
    source.buffer = hiss;
    filter.type = "bandpass";
    filter.frequency.value = pitch;
    filter.Q.value = sharp;
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
    source.connect(filter).connect(gain).connect(audio.destination);
    source.start(start, Math.random() * 0.1);
    source.stop(start + length + 0.01);
  } catch {
    // No audio available: stay quiet.
  }
}

export default function NumberStepper({ label = "Guests", min = 1, max = 10, defaultValue = 2, sound = true, onChange }) {
  const [value, setValue] = useState(defaultValue);
  const [dir, setDir] = useState(0);
  const [bump, setBump] = useState(null);
  const latest = useRef(defaultValue);
  const repeat = useRef(null);

  const stop = () => {
    clearTimeout(repeat.current);
    clearInterval(repeat.current);
  };
  useEffect(() => stop, []);

  const step = (d) => {
    const next = Math.max(min, Math.min(max, latest.current + d));
    if (next === latest.current) {
      setBump(d > 0 ? "max" : "min");
      if (sound) click(380, { length: 0.07, volume: 0.7, sharp: 2 });
      return stop();
    }
    latest.current = next;
    if (sound) click(d > 0 ? 3000 : 1900, { length: 0.025 });
    setDir(d);
    setValue(next);
    onChange?.(next);
  };

  // Press steps once, then repeats while the button stays held.
  const hold = (d) => ({
    onPointerDown: () => {
      step(d);
      repeat.current = setTimeout(() => {
        repeat.current = setInterval(() => step(d), 90);
      }, 400);
    },
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
    onKeyDown: (e) => (e.key === "Enter" || e.key === " ") && step(d),
  });

  return (
    <div className="ui-stepper" role="group" aria-label={label}>
      <style>{css}</style>
      <span className="ui-stepper-label">{label}</span>
      <div className="ui-stepper-row" data-bump={bump} onAnimationEnd={(e) => e.target === e.currentTarget && setBump(null)}>
        <button type="button" aria-label="Decrease" aria-disabled={value <= min} {...hold(-1)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M3.5 8h9" /></svg>
        </button>
        <output aria-live="polite">
          <span key={value} data-dir={dir}>{value}</span>
        </output>
        <button type="button" aria-label="Increase" aria-disabled={value >= max} {...hold(1)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M3.5 8h9M8 3.5v9" /></svg>
        </button>
      </div>
    </div>
  );
}
