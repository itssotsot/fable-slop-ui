// AddToCart: the button turns into its own quantity stepper, and back again at zero.
// Usage: <AddToCart max={9} onChange={(quantity) => updateCart(quantity)} />
import { useState } from "react";

const css = `
.ui-cart {
  --accent: var(--ui-accent, #1a4be0);
  --on-accent: var(--ui-accent-ink, #fff);
  position: relative;
  display: inline-grid;
  width: 172px;
  height: 48px;
  border-radius: 24px;
  background: var(--accent);
  color: var(--on-accent);
  font: inherit;
  font-size: 15px;
  font-weight: 500;
  overflow: hidden;
  transition: scale .3s cubic-bezier(.34, 1.56, .64, 1);
}
.ui-cart:has(.ui-cart-add:active) { scale: .96; }
.ui-cart button {
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.ui-cart button:focus-visible { outline: 2px solid var(--on-accent); outline-offset: -5px; border-radius: 24px; }
.ui-cart > * {
  grid-area: 1 / 1;
  transition: opacity .2s, translate .4s cubic-bezier(.2, .8, .2, 1), visibility .4s;
}
.ui-cart-add { display: flex; align-items: center; justify-content: center; gap: 10px; }
.ui-cart[data-active="true"] .ui-cart-add { opacity: 0; translate: 0 -100%; visibility: hidden; }
.ui-cart-step { display: grid; grid-template-columns: 48px 1fr 48px; align-items: center; }
.ui-cart[data-active="false"] .ui-cart-step { opacity: 0; translate: 0 100%; visibility: hidden; }
.ui-cart-step button { display: grid; place-items: center; height: 48px; transition: scale .2s; }
.ui-cart-step button:active { scale: .7; }
.ui-cart-step button:disabled { opacity: .4; cursor: default; }
.ui-cart-qty { display: grid; justify-items: center; overflow: hidden; font-variant-numeric: tabular-nums; line-height: 48px; }
.ui-cart-qty span { grid-area: 1 / 1; }
.ui-cart-qty [data-dir="1"] { animation: ui-cart-up .3s cubic-bezier(.2, .8, .2, 1); }
.ui-cart-qty [data-dir="-1"] { animation: ui-cart-down .3s cubic-bezier(.2, .8, .2, 1); }
@keyframes ui-cart-up { from { translate: 0 60%; opacity: 0; } }
@keyframes ui-cart-down { from { translate: 0 -60%; opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  :is(.ui-cart, .ui-cart *), :is(.ui-cart, .ui-cart *)::before, :is(.ui-cart, .ui-cart *)::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    transition-delay: 0s !important;
  }
}
`;

const Icon = ({ d }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

export default function AddToCart({ label = "Add to cart", max = 9, onChange }) {
  const [qty, setQty] = useState(0);
  const [dir, setDir] = useState(1);
  const active = qty > 0;

  const step = (d) => {
    const next = Math.max(0, Math.min(max, qty + d));
    setDir(d);
    setQty(next);
    onChange?.(next);
  };

  return (
    <div className="ui-cart" data-active={active}>
      <style>{css}</style>
      <button type="button" className="ui-cart-add" tabIndex={active ? -1 : 0} aria-hidden={active} onClick={() => step(1)}>
        <Icon d="M2.5 3.5h2l1.6 8h7.4l1.3-5.5H5.2M7 14.8h.01M12.5 14.8h.01" />
        {label}
      </button>
      <div className="ui-cart-step" role="group" aria-label="Quantity" aria-hidden={!active}>
        <button type="button" tabIndex={active ? 0 : -1} aria-label="Remove one" onClick={() => step(-1)}>
          <Icon d="M4.5 9h9" />
        </button>
        <span className="ui-cart-qty" aria-live="polite">
          <span key={qty} data-dir={dir}>{qty} in cart</span>
        </span>
        <button type="button" tabIndex={active ? 0 : -1} aria-label="Add one" disabled={qty >= max} onClick={() => step(1)}>
          <Icon d="M4.5 9h9M9 4.5v9" />
        </button>
      </div>
    </div>
  );
}
