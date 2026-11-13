// ElasticSlider: a native range input underneath, with a value bubble that leans back
// against the direction you drag and settles when you stop.
// Usage: <ElasticSlider label="Volume" min={0} max={100} defaultValue={40} onChange={(n) => setVolume(n)} />
import { useEffect, useRef, useState } from "react";

const css = `
.ui-slider {
  --accent: var(--ui-accent, #1a4be0);
  --on-accent: var(--ui-accent-ink, #fff);
  --bg: var(--ui-bg, #fff);
  --soft: var(--ui-soft, #f4f4f4);
  position: relative;
  width: 264px;
  max-width: 100%;
  height: 44px;
  font: inherit;
}
.ui-slider input {
  position: absolute;
  z-index: 1;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: grab;
  touch-action: pan-y;
  -webkit-appearance: none;
  appearance: none;
}
.ui-slider input:active { cursor: grabbing; }
.ui-slider input::-webkit-slider-thumb { -webkit-appearance: none; width: 28px; height: 44px; }
.ui-slider input::-moz-range-thumb { width: 28px; height: 44px; border: 0; }
.ui-slider-track {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 8px;
  border-radius: 6px;
  background: var(--soft);
  translate: 0 -50%;
  overflow: hidden;
  transition: height .3s cubic-bezier(.34, 1.56, .64, 1);
}
.ui-slider[data-active="true"] .ui-slider-track { height: 12px; }
.ui-slider-track i { display: block; width: calc(14px + var(--p) * (100% - 28px)); height: 100%; background: var(--accent); }
.ui-slider-thumb {
  position: absolute;
  left: calc(var(--p) * (100% - 28px));
  top: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--bg);
  box-shadow: 0 0 0 1.5px var(--accent), 0 4px 10px -2px rgb(0 0 0 / .25);
  transition: scale .3s cubic-bezier(.34, 1.56, .64, 1);
}
.ui-slider[data-active="true"] .ui-slider-thumb { scale: 1.15; }
.ui-slider input:focus-visible ~ .ui-slider-thumb { outline: 2px solid var(--accent); outline-offset: 3px; }
.ui-slider-bubble {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 10px);
  min-width: 36px;
  padding: 5px 8px;
  border-radius: 10px;
  background: var(--accent);
  color: var(--on-accent);
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  text-align: center;
  box-sizing: border-box;
  translate: -50% 8px;
  scale: .5;
  rotate: var(--tilt);
  opacity: 0;
  transform-origin: 50% calc(100% + 12px);
  transition: opacity .15s, scale .3s cubic-bezier(.34, 1.56, .64, 1), translate .3s cubic-bezier(.34, 1.56, .64, 1), rotate .5s cubic-bezier(.2, 2.2, .4, 1);
}
.ui-slider-bubble::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 100%;
  width: 8px;
  height: 8px;
  margin: -5px 0 0 -4px;
  border-radius: 2px;
  background: inherit;
  rotate: 45deg;
}
.ui-slider[data-active="true"] .ui-slider-bubble,
.ui-slider input:focus-visible ~ .ui-slider-thumb .ui-slider-bubble { opacity: 1; scale: 1; translate: -50% 0; }
@media (prefers-reduced-motion: reduce) {
  :is(.ui-slider, .ui-slider *), :is(.ui-slider, .ui-slider *)::before, :is(.ui-slider, .ui-slider *)::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    transition-delay: 0s !important;
  }
}
`;

export default function ElasticSlider({ label = "Volume", min = 0, max = 100, step = 1, defaultValue = 40, onChange }) {
  const [value, setValue] = useState(defaultValue);
  const [tilt, setTilt] = useState(0);
  const [active, setActive] = useState(false);
  const last = useRef(defaultValue);
  const settle = useRef(null);
  useEffect(() => () => clearTimeout(settle.current), []);

  const change = (e) => {
    const next = Number(e.target.value);
    const speed = ((next - last.current) / (max - min)) * 100;
    last.current = next;
    setValue(next);
    setTilt(Math.max(-30, Math.min(30, -speed * 6)));
    clearTimeout(settle.current);
    settle.current = setTimeout(() => setTilt(0), 80);
    onChange?.(next);
  };

  return (
    <div className="ui-slider" data-active={active} style={{ "--p": (value - min) / (max - min), "--tilt": tilt + "deg" }}>
      <style>{css}</style>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={change}
        onPointerDown={() => setActive(true)}
        onPointerUp={() => setActive(false)}
        onPointerCancel={() => setActive(false)}
        onBlur={() => setActive(false)}
      />
      <span className="ui-slider-track"><i /></span>
      <span className="ui-slider-thumb">
        <span className="ui-slider-bubble" aria-hidden="true">{value}</span>
      </span>
    </div>
  );
}
