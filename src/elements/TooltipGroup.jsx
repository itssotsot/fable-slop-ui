// TooltipGroup: one tooltip shared by a row of buttons. It waits a moment before the first appearance,
// then glides from button to button instead of blinking off and on.
// The tooltip wears whatever is switched on: turn on bold and italic and every tooltip is set in bold italic.
// Give an item a `style` and the tooltip text takes it on while that item is pressed.
// Usage: <TooltipGroup items={[{ id: "bold", label: "Bold", hint: "⌘B", icon: <b>B</b> }]} onToggle={(id, on) => format(id, on)} />
import { useEffect, useRef, useState } from "react";

const css = `
.ui-tips {
  --accent: var(--ui-accent, #1a4be0);
  --ink: var(--ui-ink, #111);
  --bg: var(--ui-bg, #fff);
  --soft: var(--ui-soft, #f4f4f4);
  --line: var(--ui-line, #e3e3e3);
  position: relative;
  display: inline-flex;
  gap: 4px;
  padding: 6px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--bg);
  color: var(--ink);
  font: inherit;
}
.ui-tips > button {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: 10px;
  background: none;
  color: inherit;
  font: inherit;
  font-size: 17px;
  cursor: pointer;
  transition: background .2s, color .2s, scale .25s cubic-bezier(.34, 1.56, .64, 1);
  -webkit-tap-highlight-color: transparent;
}
.ui-tips > button:hover { background: var(--soft); }
.ui-tips > button:active { scale: .88; }
.ui-tips > button:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
.ui-tips > button[aria-pressed="true"] { background: var(--ink); color: var(--bg); }
.ui-tip {
  position: absolute;
  left: 0;
  bottom: calc(100% + 10px);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 9px;
  background: var(--ink);
  color: var(--bg);
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  opacity: 0;
  scale: .8;
  translate: calc(var(--x) * 1px - 50%) 6px;
  transform-origin: 50% 100%;
  pointer-events: none;
  transition: opacity .15s, scale .3s cubic-bezier(.34, 1.56, .64, 1), translate .3s cubic-bezier(.34, 1.56, .64, 1);
}
.ui-tips[data-shown="true"] .ui-tip { opacity: 1; scale: 1; translate: calc(var(--x) * 1px - 50%) 0; }
.ui-tip::after {
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
.ui-tip span { text-decoration-thickness: 1.5px; text-underline-offset: 2px; animation: ui-tip-swap .25s; }
.ui-tip { animation: ui-tip-pop .35s cubic-bezier(.34, 1.56, .64, 1); }
.ui-tip kbd { font: inherit; font-size: 12px; opacity: .6; }
@keyframes ui-tip-swap { from { opacity: 0; } }
@keyframes ui-tip-pop { 40% { scale: 1.12; } }
@media (prefers-reduced-motion: reduce) {
  :is(.ui-tips, .ui-tips *), :is(.ui-tips, .ui-tips *)::before, :is(.ui-tips, .ui-tips *)::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    transition-delay: 0s !important;
  }
}
`;

const ITEMS = [
  { id: "bold", label: "Bold", hint: "⌘B", icon: <b>B</b>, style: { fontWeight: 800 } },
  { id: "italic", label: "Italic", hint: "⌘I", icon: <i>I</i>, style: { fontStyle: "italic" } },
  { id: "underline", label: "Underline", hint: "⌘U", icon: <u>U</u>, style: { textDecorationLine: "underline" } },
  { id: "strike", label: "Strikethrough", hint: "⌘⇧X", icon: <s>S</s>, style: { textDecorationLine: "line-through" } },
];

export default function TooltipGroup({ items = ITEMS, delay = 350, onToggle }) {
  const [tip, setTip] = useState({ at: 0, x: 0 });
  const [shown, setShown] = useState(false);
  const [pressed, setPressed] = useState(["bold"]);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const point = (e, at) => {
    const el = e.currentTarget;
    setTip({ at, x: el.offsetLeft + el.offsetWidth / 2 });
    clearTimeout(timer.current);
    // Wait before the first tooltip, but move at once when one is already showing.
    if (!shown) timer.current = setTimeout(() => setShown(true), delay);
  };
  const leave = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setShown(false), 120);
  };
  const toggle = (id) => {
    const on = !pressed.includes(id);
    setPressed(on ? [...pressed, id] : pressed.filter((p) => p !== id));
    onToggle?.(id, on);
  };

  // Everything that is switched on, folded into one style. Underline and strikethrough share a property, so they are joined.
  const worn = {};
  for (const item of items) {
    if (!pressed.includes(item.id) || !item.style) continue;
    const { textDecorationLine, ...rest } = item.style;
    Object.assign(worn, rest);
    if (textDecorationLine) worn.textDecorationLine = [worn.textDecorationLine, textDecorationLine].filter(Boolean).join(" ");
  }

  return (
    <div className="ui-tips" role="toolbar" aria-label="Text formatting" data-shown={shown} style={{ "--x": tip.x }}>
      <style>{css}</style>
      {items.map((item, i) => (
        <button
          key={item.id}
          type="button"
          aria-label={item.label}
          aria-pressed={pressed.includes(item.id)}
          onPointerEnter={(e) => point(e, i)}
          onPointerLeave={leave}
          onFocus={(e) => point(e, i)}
          onBlur={leave}
          onClick={() => toggle(item.id)}
        >
          {item.icon}
        </button>
      ))}
      <span className="ui-tip" role="tooltip" key={pressed.join()}>
        <span key={tip.at} style={worn}>{items[tip.at].label}</span>
        {items[tip.at].hint && <kbd>{items[tip.at].hint}</kbd>}
      </span>
    </div>
  );
}
