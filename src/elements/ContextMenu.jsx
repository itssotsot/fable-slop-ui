// ContextMenu: a right-click menu that grows out of the pointer. The chosen row blinks once before the menu closes.
// Usage: <ContextMenu items={[{ label: "Copy", hint: "⌘C" }, null, { label: "Delete", danger: true }]} onSelect={(label) => run(label)}>
//          <YourContent />
//        </ContextMenu>
// null adds a divider. Touch: press and hold. Keyboard: arrows move, Escape closes.
import { useEffect, useRef, useState } from "react";

const css = `
.ui-ctx {
  --accent: var(--ui-accent, #1a4be0);
  --ink: var(--ui-ink, #111);
  --bg: var(--ui-bg, #fff);
  --soft: var(--ui-soft, #f4f4f4);
  --line: var(--ui-line, #e3e3e3);
  --muted: var(--ui-muted, #6b6b6b);
  display: inline-block;
  max-width: 100%;
  color: var(--ink);
  font: inherit;
  font-size: 14px;
  -webkit-touch-callout: none;
}
.ui-ctx-area {
  display: grid;
  place-items: center;
  width: 280px;
  max-width: 100%;
  height: 160px;
  border: 1.5px dashed var(--line);
  border-radius: 16px;
  color: var(--muted);
  text-align: center;
  box-sizing: border-box;
  user-select: none;
  -webkit-user-select: none;
  transition: border-color .2s, background .2s;
}
.ui-ctx-area:hover { border-color: var(--muted); }
.ui-ctx-area b { color: var(--ink); font-weight: 500; }
.ui-ctx-area span { display: block; animation: ui-ctx-note .3s cubic-bezier(.2, .8, .2, 1); }
.ui-ctx-menu {
  position: fixed;
  z-index: 1000;
  left: var(--x);
  top: var(--y);
  display: grid;
  width: 200px;
  padding: 6px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--bg);
  box-shadow: 0 16px 40px -10px rgb(0 0 0 / .3);
  box-sizing: border-box;
  text-align: left;
  transform-origin: 0 0;
  animation: ui-ctx-in .3s cubic-bezier(.3, 1.4, .5, 1);
}
.ui-ctx-menu button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 34px;
  padding: 0 10px;
  border: 0;
  border-radius: 8px;
  background: none;
  color: var(--ink);
  font: inherit;
  cursor: default;
}
.ui-ctx-menu button:hover,
.ui-ctx-menu button:focus-visible { background: var(--accent); color: var(--ui-accent-ink, #fff); outline: 0; }
.ui-ctx-menu button[data-danger="true"]:not(:hover):not(:focus-visible) { color: var(--ui-danger, #d93025); }
.ui-ctx-menu button[data-picked="true"] { animation: ui-ctx-blink .2s steps(2, jump-none); }
.ui-ctx-menu kbd { font: inherit; font-size: 12px; opacity: .6; }
.ui-ctx-menu hr { width: auto; height: 1px; margin: 5px 4px; border: 0; background: var(--line); }
@keyframes ui-ctx-in { from { opacity: 0; scale: .7; } }
@keyframes ui-ctx-blink { from { background: none; color: var(--ink); } to { background: var(--accent); color: var(--ui-accent-ink, #fff); } }
@keyframes ui-ctx-note { from { opacity: 0; translate: 0 6px; } }
@media (prefers-reduced-motion: reduce) {
  :is(.ui-ctx, .ui-ctx *), :is(.ui-ctx, .ui-ctx *)::before, :is(.ui-ctx, .ui-ctx *)::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    transition-delay: 0s !important;
  }
}
`;

const ITEMS = [
  { label: "Copy", hint: "⌘C" },
  { label: "Paste", hint: "⌘V" },
  { label: "Duplicate", hint: "⌘D" },
  null,
  { label: "Delete", hint: "⌫", danger: true },
];

export default function ContextMenu({ items = ITEMS, onSelect, children }) {
  const [menu, setMenu] = useState(null); // { x, y } while open
  const [picked, setPicked] = useState(null);
  const [last, setLast] = useState(null);
  const panel = useRef(null);
  const hold = useRef(null);

  const openAt = (x, y) => {
    const height = items.reduce((sum, item) => sum + (item ? 34 : 11), 14);
    setMenu({ x: Math.max(8, Math.min(x, window.innerWidth - 208)), y: Math.max(8, Math.min(y, window.innerHeight - height - 8)) });
  };

  useEffect(() => {
    if (!menu) return;
    panel.current.querySelector("button")?.focus({ preventScroll: true });
    const close = () => setMenu(null);
    const outside = (e) => !panel.current?.contains(e.target) && close();
    document.addEventListener("pointerdown", outside);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    window.addEventListener("blur", close);
    return () => {
      document.removeEventListener("pointerdown", outside);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      window.removeEventListener("blur", close);
    };
  }, [menu]);

  const pick = (item) => {
    setPicked(item.label);
    setTimeout(() => {
      setPicked(null);
      setMenu(null);
      setLast(item.label);
      onSelect?.(item.label);
    }, 220);
  };
  const key = (e) => {
    const rows = [...panel.current.querySelectorAll("button")];
    const at = rows.indexOf(document.activeElement);
    if (e.key === "Escape") setMenu(null);
    else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      rows[(at + (e.key === "ArrowDown" ? 1 : -1) + rows.length) % rows.length].focus();
    }
  };
  const cancelHold = () => clearTimeout(hold.current);

  return (
    <div
      className="ui-ctx"
      onContextMenu={(e) => {
        e.preventDefault();
        openAt(e.clientX, e.clientY);
      }}
      onPointerDown={(e) => {
        if (e.pointerType !== "touch" || panel.current?.contains(e.target)) return;
        const { clientX, clientY } = e;
        hold.current = setTimeout(() => openAt(clientX, clientY), 500);
      }}
      onPointerUp={cancelHold}
      onPointerMove={cancelHold}
      onPointerCancel={cancelHold}
    >
      <style>{css}</style>
      {children ?? (
        <div className="ui-ctx-area">
          <span key={last}>{last ? <>You chose <b>{last}</b></> : "Right-click or press and hold here"}</span>
        </div>
      )}
      {menu && (
        <div ref={panel} className="ui-ctx-menu" role="menu" style={{ "--x": menu.x + "px", "--y": menu.y + "px" }} onKeyDown={key}>
          {items.map((item, i) =>
            item ? (
              <button key={item.label} type="button" role="menuitem" data-danger={item.danger} data-picked={picked === item.label} onClick={() => pick(item)}>
                {item.label}
                {item.hint && <kbd>{item.hint}</kbd>}
              </button>
            ) : (
              <hr key={i} />
            )
          )}
        </div>
      )}
    </div>
  );
}
