// PricingToggle: switch between monthly and yearly billing. The price rolls to its new value
// and the saving badge gives a small wave when yearly is chosen.
// Usage: <PricingToggle monthly={25} yearly={20} onChange={(period) => setPeriod(period)} />   // yearly = price per month when billed yearly
import { useState } from "react";

const css = `
.ui-price {
  --accent: var(--ui-accent, #1a4be0);
  --on-accent: var(--ui-accent-ink, #fff);
  --ink: var(--ui-ink, #111);
  --bg: var(--ui-bg, #fff);
  --soft: var(--ui-soft, #f4f4f4);
  --muted: var(--ui-muted, #6b6b6b);
  display: inline-grid;
  justify-items: center;
  gap: 18px;
  color: var(--ink);
  font: inherit;
}
.ui-price-switch { position: relative; display: grid; grid-template-columns: 1fr 1fr; padding: 4px; border-radius: 24px; background: var(--soft); }
.ui-price-switch::before {
  content: "";
  position: absolute;
  left: 4px;
  top: 4px;
  bottom: 4px;
  width: calc(50% - 4px);
  border-radius: 20px;
  background: var(--bg);
  box-shadow: 0 1px 2px rgb(0 0 0 / .12), 0 4px 10px -4px rgb(0 0 0 / .18);
  transition: translate .45s cubic-bezier(.3, 1.35, .5, 1);
}
.ui-price[data-period="yearly"] .ui-price-switch::before { translate: 100% 0; }
.ui-price-switch button {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 40px;
  padding: 0 16px;
  border: 0;
  border-radius: 20px;
  background: none;
  color: var(--muted);
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: color .25s;
  -webkit-tap-highlight-color: transparent;
}
.ui-price-switch button[aria-checked="true"] { color: var(--ink); }
.ui-price-switch button:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
.ui-price-save { padding: 2px 7px; border-radius: 10px; background: var(--accent); color: var(--on-accent); font-size: 12px; font-weight: 600; }
.ui-price[data-period="yearly"] .ui-price-save { animation: ui-price-wave .6s .15s cubic-bezier(.3, 1.4, .5, 1); }
.ui-price-amount { display: flex; align-items: baseline; gap: 6px; }
.ui-price-number { display: flex; font-size: 52px; font-weight: 500; font-variant-numeric: tabular-nums; letter-spacing: -.03em; line-height: 1.15; }
.ui-price-digit { display: block; height: 1.15em; overflow: hidden; }
.ui-price-reel { display: grid; transition: transform .7s cubic-bezier(.2, 1, .2, 1) calc(var(--i) * 60ms); }
.ui-price-reel span { height: 1.15em; }
.ui-price-per { color: var(--muted); font-size: 15px; }
.ui-price-note { height: 20px; margin-top: -12px; color: var(--muted); font-size: 14px; line-height: 20px; }
.ui-price-note span { display: block; animation: ui-price-note .3s cubic-bezier(.2, .8, .2, 1); }
@keyframes ui-price-wave { 30% { rotate: -10deg; scale: 1.15; } 60% { rotate: 6deg; } }
@keyframes ui-price-note { from { opacity: 0; translate: 0 5px; } }
@media (prefers-reduced-motion: reduce) {
  :is(.ui-price, .ui-price *), :is(.ui-price, .ui-price *)::before, :is(.ui-price, .ui-price *)::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    transition-delay: 0s !important;
  }
}
`;

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export default function PricingToggle({ monthly = 25, yearly = 20, currency = "$", onChange }) {
  const [period, setPeriod] = useState("monthly");
  const price = period === "yearly" ? yearly : monthly;
  const saving = Math.round((1 - yearly / monthly) * 100);
  const chars = String(price).split("");

  const choose = (next) => {
    setPeriod(next);
    onChange?.(next);
  };

  return (
    <div className="ui-price" data-period={period}>
      <style>{css}</style>
      <div className="ui-price-switch" role="radiogroup" aria-label="Billing period">
        <button type="button" role="radio" aria-checked={period === "monthly"} onClick={() => choose("monthly")}>Monthly</button>
        <button type="button" role="radio" aria-checked={period === "yearly"} onClick={() => choose("yearly")}>
          Yearly <span className="ui-price-save">-{saving}%</span>
        </button>
      </div>
      <div className="ui-price-amount" aria-live="polite" aria-label={currency + price + " per month"}>
        <span className="ui-price-number" aria-hidden="true">
          {currency}
          {chars.map((char, i) => (
            <span key={chars.length - i} className="ui-price-digit">
              <span className="ui-price-reel" style={{ "--i": chars.length - 1 - i, transform: "translateY(" + -char * 10 + "%)" }}>
                {DIGITS.map((d) => <span key={d}>{d}</span>)}
              </span>
            </span>
          ))}
        </span>
        <span className="ui-price-per" aria-hidden="true">per month</span>
      </div>
      <div className="ui-price-note">
        <span key={period}>{period === "yearly" ? "Billed yearly, " + currency + yearly * 12 + " a year" : "Billed monthly, cancel any time"}</span>
      </div>
    </div>
  );
}
