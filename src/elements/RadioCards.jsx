// RadioCards: one outlined frame slides between the options instead of each card switching on and off.
// Usage: <RadioCards options={[{ value: "express", title: "Express", note: "1 to 2 days", price: "$9" }]} onChange={(value) => setShipping(value)} />
// Built on real radio inputs: arrow keys move the choice.
import { useId, useState } from "react";

const css = `
.ui-radios {
  --accent: var(--ui-accent, #1a4be0);
  --ink: var(--ui-ink, #111);
  --bg: var(--ui-bg, #fff);
  --line: var(--ui-line, #e3e3e3);
  --muted: var(--ui-muted, #6b6b6b);
  position: relative;
  display: grid;
  gap: 8px;
  width: 280px;
  max-width: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  color: var(--ink);
  font: inherit;
  font-size: 15px;
  text-align: left;
}
.ui-radios-frame {
  position: absolute;
  z-index: 1;
  inset: 0 0 auto;
  height: 60px;
  border: 2px solid var(--accent);
  border-radius: 14px;
  background: color-mix(in srgb, var(--accent) 7%, transparent);
  translate: 0 calc(var(--at) * 68px);
  pointer-events: none;
  transition: translate .45s cubic-bezier(.3, 1.4, .5, 1);
}
.ui-radio {
  display: grid;
  grid-template-columns: 20px 1fr auto;
  align-items: center;
  gap: 12px;
  height: 60px;
  padding: 0 16px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--bg);
  box-sizing: border-box;
  cursor: pointer;
  transition: border-color .2s;
  -webkit-tap-highlight-color: transparent;
}
.ui-radio:hover { border-color: var(--muted); }
.ui-radio input { position: absolute; width: 1px; height: 1px; opacity: 0; }
.ui-radio-dot {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border: 1.5px solid color-mix(in srgb, var(--muted) 60%, var(--line));
  border-radius: 50%;
  box-sizing: border-box;
  transition: border-color .2s;
}
.ui-radio-dot::after {
  content: "";
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--accent);
  scale: 0;
  transition: scale .35s cubic-bezier(.34, 1.56, .64, 1);
}
.ui-radio input:checked + .ui-radio-dot { border-color: var(--accent); }
.ui-radio input:checked + .ui-radio-dot::after { scale: 1; }
.ui-radio input:focus-visible + .ui-radio-dot { outline: 2px solid var(--accent); outline-offset: 3px; }
.ui-radio-text { display: grid; line-height: 1.3; }
.ui-radio-text b { font-weight: 500; }
.ui-radio-text small { color: var(--muted); font-size: 13px; }
.ui-radio-price { font-weight: 500; font-variant-numeric: tabular-nums; }
@media (prefers-reduced-motion: reduce) {
  :is(.ui-radios, .ui-radios *), :is(.ui-radios, .ui-radios *)::before, :is(.ui-radios, .ui-radios *)::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    transition-delay: 0s !important;
  }
}
`;

const OPTIONS = [
  { value: "standard", title: "Standard", note: "3 to 5 working days", price: "Free" },
  { value: "express", title: "Express", note: "1 to 2 working days", price: "$9" },
  { value: "same-day", title: "Same day", note: "Order before noon", price: "$19" },
];

export default function RadioCards({ legend = "Delivery", options = OPTIONS, defaultValue = options[0].value, onChange }) {
  const name = useId();
  const [value, setValue] = useState(defaultValue);
  const at = Math.max(0, options.findIndex((o) => o.value === value));

  return (
    <fieldset className="ui-radios" aria-label={legend} style={{ "--at": at }}>
      <style>{css}</style>
      <span className="ui-radios-frame" aria-hidden="true" />
      {options.map((o) => (
        <label key={o.value} className="ui-radio">
          <input
            type="radio"
            name={name}
            value={o.value}
            checked={o.value === value}
            onChange={() => {
              setValue(o.value);
              onChange?.(o.value);
            }}
          />
          <span className="ui-radio-dot" aria-hidden="true" />
          <span className="ui-radio-text">
            <b>{o.title}</b>
            <small>{o.note}</small>
          </span>
          <span className="ui-radio-price">{o.price}</span>
        </label>
      ))}
    </fieldset>
  );
}
