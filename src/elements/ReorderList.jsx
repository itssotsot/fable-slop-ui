// ReorderList: a stack of paper slips. Each lies at its own slight angle, with grain, a ruled line,
// a red margin and a torn edge. Pick one up and it lifts off the desk and casts a deeper shadow
// while the others slide out of its way. Every time a slip is put down it lands at a new random
// angle and a few pixels off square, the way paper does. Let go and it settles into the gap and its number is re-stamped.
// Usage: <ReorderList items={["Oat milk", "Bread", "Coffee"]} onChange={(items) => setOrder(items)} />
// Mouse: drag a row. Touch: drag the grip. Keyboard: focus a grip and press the up or down arrow.
import { useRef, useState } from "react";

const css = `
.ui-reorder {
  --accent: var(--ui-accent, #1a4be0);
  --paper: #fdfaf1;
  --paper-ink: #2c2721;
  --paper-muted: #8d8375;
  position: relative;
  width: 260px;
  max-width: 100%;
  height: calc(var(--rows) * 52px - 8px);
  margin: 0;
  padding: 0;
  color: var(--paper-ink);
  font: inherit;
  font-size: 15px;
  text-align: left;
  list-style: none;
}
/* The row carries the position, the tilt and the shadow. The sheet inside it is the paper itself. */
.ui-reorder li {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 44px;
  cursor: grab;
  translate: var(--dx, 0px) calc(var(--y) * 1px + var(--dy, 0px));
  rotate: var(--tilt);
  filter: drop-shadow(0 1px .5px rgb(60 40 10 / .35)) drop-shadow(0 4px 5px rgb(60 40 10 / .16));
  user-select: none;
  -webkit-user-select: none;
  transition: translate .45s cubic-bezier(.3, 1.3, .5, 1), rotate .45s cubic-bezier(.3, 1.6, .5, 1), scale .3s cubic-bezier(.34, 1.56, .64, 1), filter .3s;
}
.ui-reorder li[data-held="true"] {
  z-index: 1;
  cursor: grabbing;
  scale: 1.04;
  filter: drop-shadow(0 2px 1px rgb(60 40 10 / .3)) drop-shadow(0 18px 16px rgb(60 40 10 / .32));
  transition: scale .3s cubic-bezier(.34, 1.56, .64, 1), filter .3s;
}
.ui-reorder li[data-dropped="true"] .ui-reorder-sheet { animation: ui-reorder-settle .5s cubic-bezier(.3, 1.4, .5, 1); }
.ui-reorder-sheet {
  position: relative;
  display: grid;
  grid-template-columns: 28px 1fr auto;
  align-items: center;
  gap: 6px;
  height: 100%;
  padding: 0 14px 0 6px;
  box-sizing: border-box;
  /* From the top: paper grain, the red margin, one ruled line, the paper. */
  background:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' seed='4'/%3E%3CfeColorMatrix values='0 0 0 0 .35 0 0 0 0 .25 0 0 0 0 .1 0 0 0 .16 0'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E"),
    linear-gradient(90deg, transparent 37px, rgb(226 92 92 / .55) 37px 38px, transparent 38px),
    linear-gradient(transparent 33px, rgb(92 140 214 / .4) 33px 34px, transparent 34px),
    var(--paper);
  /* A torn right edge and soft, hand-cut corners. */
  clip-path: polygon(0 3%, .8% 0, 99.2% 0, 100% 9%, 98.9% 22%, 99.8% 36%, 98.7% 50%, 99.7% 63%, 98.8% 78%, 99.9% 90%, 99% 100%, 1% 100%, 0 96%);
}
.ui-reorder-grip {
  position: relative;
  display: grid;
  place-items: center;
  width: 28px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: none;
  color: var(--paper-muted);
  cursor: inherit;
  touch-action: none;
}
.ui-reorder-grip:focus-visible { outline: 2px solid var(--accent); }
/* The position, stamped in ink. */
.ui-reorder small {
  position: relative;
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border: 1.5px solid currentColor;
  border-radius: 50%;
  color: color-mix(in srgb, var(--accent) 75%, var(--paper-ink));
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  rotate: -8deg;
  opacity: .85;
}
.ui-reorder small b { font-weight: inherit; animation: ui-reorder-stamp .35s cubic-bezier(.3, 1.8, .5, 1); }
.ui-reorder-text { position: relative; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
@keyframes ui-reorder-settle { 0% { scale: 1.03 .94; } 45% { scale: .985 1.03; } }
@keyframes ui-reorder-stamp { from { scale: 2; opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  :is(.ui-reorder, .ui-reorder *), :is(.ui-reorder, .ui-reorder *)::before, :is(.ui-reorder, .ui-reorder *)::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    transition-delay: 0s !important;
  }
}
`;

const TILTS = [-0.9, 0.7, -0.5, 1, -0.7, 0.5]; // the angle each slip starts at
// A random angle up to `most` degrees either way, never so close to flat that it looks deliberate.
const angle = (most) => (Math.random() < 0.5 ? -1 : 1) * (most * 0.3 + Math.random() * most * 0.7);
const ROW = 52;
const ITEMS = ["Oat milk", "Sourdough bread", "Coffee beans", "Tomatoes"];

export default function ReorderList({ items: initial = ITEMS, onChange }) {
  const [items, setItems] = useState(initial);
  const [held, setHeld] = useState(null); // { item, y } while a row is being dragged
  const [dropped, setDropped] = useState(null); // the row that was just let go, so it can settle
  const [tilts, setTilts] = useState({}); // how each slip was last dropped: { r: angle, x, y: a few pixels off square }
  // Nobody puts paper down perfectly: a new angle and a slight nudge sideways and up or down.
  const land = (item) => setTilts({ ...tilts, [item]: { r: angle(3.2), x: angle(5), y: angle(2.5) } });
  const grab = useRef(0);

  const move = (item, to) => {
    const from = items.indexOf(item);
    const target = Math.max(0, Math.min(items.length - 1, to));
    if (target === from) return;
    const next = items.filter((x) => x !== item);
    next.splice(target, 0, item);
    setItems(next);
    onChange?.(next);
  };

  const down = (e, item) => {
    if (e.pointerType === "touch" && !e.target.closest(".ui-reorder-grip")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    grab.current = e.clientY - items.indexOf(item) * ROW;
    setHeld({ item, y: items.indexOf(item) * ROW });
  };
  const drag = (e) => {
    if (!held) return;
    const y = Math.max(0, Math.min((items.length - 1) * ROW, e.clientY - grab.current));
    setHeld({ item: held.item, y });
    move(held.item, Math.round(y / ROW));
  };
  const release = () => {
    if (held) {
      setDropped(held.item);
      land(held.item);
    }
    setHeld(null);
  };
  const key = (e, item) => {
    const step = { ArrowUp: -1, ArrowDown: 1 }[e.key];
    if (!step) return;
    e.preventDefault();
    move(item, items.indexOf(item) + step);
    land(item);
  };

  // Rows stay in their original DOM order and are placed with translate, so they animate between slots.
  return (
    <ol className="ui-reorder" style={{ "--rows": items.length }}>
      <style>{css}</style>
      {initial.map((item, n) => {
        const index = items.indexOf(item);
        const isHeld = held?.item === item;
        return (
          <li
            key={item}
            data-held={isHeld}
            data-dropped={dropped === item}
            style={{ "--y": isHeld ? held.y : index * ROW, "--tilt": (tilts[item]?.r ?? TILTS[n % TILTS.length]) + "deg", "--dx": (tilts[item]?.x ?? 0) + "px", "--dy": (tilts[item]?.y ?? 0) + "px" }}
            onPointerDown={(e) => down(e, item)}
            onPointerMove={drag}
            onPointerUp={release}
            onPointerCancel={release}
            onAnimationEnd={() => setDropped(null)}
          >
            <div className="ui-reorder-sheet">
            <button type="button" className="ui-reorder-grip" aria-label={"Reorder " + item + ", position " + (index + 1) + " of " + items.length} onKeyDown={(e) => key(e, item)}>
              <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor" aria-hidden="true">
                <circle cx="3" cy="3" r="1.4" /><circle cx="9" cy="3" r="1.4" />
                <circle cx="3" cy="8" r="1.4" /><circle cx="9" cy="8" r="1.4" />
                <circle cx="3" cy="13" r="1.4" /><circle cx="9" cy="13" r="1.4" />
              </svg>
            </button>
            <span className="ui-reorder-text">{item}</span>
            <small><b key={index}>{index + 1}</b></small>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
