// ColorSwatches: a colour picker for a product or a theme. The chosen swatch gets a ring
// that springs out, a tick that contrasts with the colour, and its name underneath.
// Usage: <ColorSwatches options={[{ name: "Ocean", value: "#1a4be0" }]} onChange={(option) => setColour(option.value)} />
// Keyboard: arrow keys move the choice.
import { useState } from "react";

const css = `
.ui-swatches {
  --accent: var(--ui-accent, #1a4be0);
  --ink: var(--ui-ink, #111);
  --bg: var(--ui-bg, #fff);
  --muted: var(--ui-muted, #6b6b6b);
  display: inline-grid;
  justify-items: center;
  gap: 12px;
  font: inherit;
}
.ui-swatches-row { display: flex; gap: 12px; }
.ui-swatch {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--c);
  box-shadow: 0 0 0 0 var(--bg), 0 0 0 0 var(--c), inset 0 0 0 1px rgb(0 0 0 / .08);
  cursor: pointer;
  transition: scale .3s cubic-bezier(.34, 1.56, .64, 1), box-shadow .4s cubic-bezier(.34, 1.56, .64, 1);
  -webkit-tap-highlight-color: transparent;
}
.ui-swatch:hover { scale: 1.12; }
.ui-swatch:active { scale: .92; }
.ui-swatch:focus-visible { outline: 2px solid var(--accent); outline-offset: 6px; }
.ui-swatch[aria-checked="true"] { box-shadow: 0 0 0 3px var(--bg), 0 0 0 5px var(--c), inset 0 0 0 1px rgb(0 0 0 / .08); }
.ui-swatch path { stroke-dasharray: 16; stroke-dashoffset: 16; transition: stroke-dashoffset .15s; }
.ui-swatch[aria-checked="true"] path { stroke-dashoffset: 0; transition: stroke-dashoffset .3s .1s; }
.ui-swatches-name { height: 20px; color: var(--muted); font-size: 14px; line-height: 20px; }
.ui-swatches-name span { display: block; animation: ui-swatches-name .3s cubic-bezier(.2, .8, .2, 1); }
.ui-swatches-name b { color: var(--ink); font-weight: 500; }
@keyframes ui-swatches-name { from { opacity: 0; translate: 0 5px; } }
@media (prefers-reduced-motion: reduce) {
  :is(.ui-swatches, .ui-swatches *), :is(.ui-swatches, .ui-swatches *)::before, :is(.ui-swatches, .ui-swatches *)::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    transition-delay: 0s !important;
  }
}
`;

const OPTIONS = [
  { name: "Graphite", value: "#2f2f2f" },
  { name: "Ocean", value: "#1a4be0" },
  { name: "Clay", value: "#c8553d" },
  { name: "Moss", value: "#5b7553" },
  { name: "Sand", value: "#d9c7a3" },
];

// Pick a dark or light tick so it stays readable on any swatch.
const tickOn = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return r * 0.299 + g * 0.587 + b * 0.114 > 160 ? "#111" : "#fff";
};

export default function ColorSwatches({ label = "Colour", options = OPTIONS, value, defaultValue = options[1]?.value, onChange }) {
  const [inner, setInner] = useState(defaultValue);
  const picked = value ?? inner;
  const at = Math.max(0, options.findIndex((o) => o.value === picked));

  const choose = (i) => {
    setInner(options[i].value);
    onChange?.(options[i]);
  };
  const key = (e) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const next = (at + step + options.length) % options.length;
    choose(next);
    e.currentTarget.children[next].focus();
  };

  return (
    <div className="ui-swatches">
      <style>{css}</style>
      <div className="ui-swatches-row" role="radiogroup" aria-label={label} onKeyDown={key}>
        {options.map((o, i) => (
          <button key={o.value} type="button" role="radio" className="ui-swatch" aria-checked={i === at} aria-label={o.name} tabIndex={i === at ? 0 : -1} style={{ "--c": o.value }} onClick={() => choose(i)}>
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke={tickOn(o.value)} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 9.5l3.2 3.2L14 5.8" />
            </svg>
          </button>
        ))}
      </div>
      <div className="ui-swatches-name" aria-hidden="true">
        <span key={options[at].name}>{label}: <b>{options[at].name}</b></span>
      </div>
    </div>
  );
}
