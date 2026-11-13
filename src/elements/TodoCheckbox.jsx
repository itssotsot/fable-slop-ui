// TodoCheckbox: the tick draws itself, the box bounces, and a line strikes through the task.
// Usage: <TodoCheckbox items={["Reply to Sam", "Book the dentist"]} onChange={(done) => save(done)} />
// onChange receives the list of checked items. Built on real checkboxes, so it works with forms and keyboards.
import { useState } from "react";

const css = `
.ui-todos {
  --accent: var(--ui-accent, #1a4be0);
  --on-accent: var(--ui-accent-ink, #fff);
  --ink: var(--ui-ink, #111);
  --soft: var(--ui-soft, #f4f4f4);
  --line: var(--ui-line, #e3e3e3);
  --muted: var(--ui-muted, #6b6b6b);
  display: grid;
  gap: 2px;
  width: 260px;
  max-width: 100%;
  margin: 0;
  padding: 0;
  color: var(--ink);
  font: inherit;
  font-size: 16px;
  text-align: left;
  list-style: none;
}
.ui-todo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: background .2s;
  -webkit-tap-highlight-color: transparent;
}
.ui-todo:hover { background: var(--soft); }
.ui-todo input { position: absolute; width: 1px; height: 1px; opacity: 0; }
.ui-todo-box {
  display: grid;
  place-items: center;
  flex: none;
  width: 22px;
  height: 22px;
  border: 1.5px solid color-mix(in srgb, var(--muted) 60%, var(--line));
  border-radius: 7px;
  color: var(--on-accent);
  box-sizing: border-box;
  transition: background .2s, border-color .2s, scale .2s;
}
.ui-todo:hover .ui-todo-box { border-color: var(--accent); }
.ui-todo:active .ui-todo-box { scale: .85; }
.ui-todo input:focus-visible + .ui-todo-box { outline: 2px solid var(--accent); outline-offset: 3px; }
.ui-todo input:checked + .ui-todo-box { border-color: var(--accent); background: var(--accent); animation: ui-todo-pop .4s cubic-bezier(.3, 1.8, .5, 1); }
.ui-todo-box path { stroke-dasharray: 16; stroke-dashoffset: 16; transition: stroke-dashoffset .15s; }
.ui-todo input:checked + .ui-todo-box path { stroke-dashoffset: 0; transition: stroke-dashoffset .3s .1s; }
.ui-todo-text {
  background: linear-gradient(currentColor, currentColor) no-repeat 0 55% / 0% 1.5px;
  transition: background-size .35s cubic-bezier(.2, .8, .2, 1), color .3s;
}
.ui-todo input:checked ~ .ui-todo-text { background-size: 100% 1.5px; color: var(--muted); }
@keyframes ui-todo-pop { 0% { scale: .7; } }
@media (prefers-reduced-motion: reduce) {
  :is(.ui-todos, .ui-todos *), :is(.ui-todos, .ui-todos *)::before, :is(.ui-todos, .ui-todos *)::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    transition-delay: 0s !important;
  }
}
`;

const ITEMS = ["Reply to Sam", "Book the dentist", "Water the plants"];

export default function TodoCheckbox({ items = ITEMS, defaultChecked = [items[0]], onChange }) {
  const [done, setDone] = useState(defaultChecked);

  const toggle = (item) => {
    const next = done.includes(item) ? done.filter((d) => d !== item) : [...done, item];
    setDone(next);
    onChange?.(next);
  };

  return (
    <ul className="ui-todos">
      <style>{css}</style>
      {items.map((item) => (
        <li key={item}>
          <label className="ui-todo">
            <input type="checkbox" checked={done.includes(item)} onChange={() => toggle(item)} />
            <span className="ui-todo-box" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 9.5l3.2 3.2L14 5.8" />
              </svg>
            </span>
            <span className="ui-todo-text">{item}</span>
          </label>
        </li>
      ))}
    </ul>
  );
}
