// Accordion: panels open at their true height (no fixed max-height), the plus turns into a minus,
// and opening one closes the others.
// Usage: <Accordion items={[{ title: "Do I need a CSS framework?", body: "No." }]} />
import { useId, useState } from "react";

const css = `
.ui-acc {
  --accent: var(--ui-accent, #1a4be0);
  --ink: var(--ui-ink, #111);
  --bg: var(--ui-bg, #fff);
  --soft: var(--ui-soft, #f4f4f4);
  --line: var(--ui-line, #e3e3e3);
  --muted: var(--ui-muted, #6b6b6b);
  width: 320px;
  max-width: 100%;
  border-top: 1px solid var(--line);
  color: var(--ink);
  font: inherit;
  font-size: 15px;
  text-align: left;
}
.ui-acc-item { border-bottom: 1px solid var(--line); }
.ui-acc-item > button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  padding: 14px 4px;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.ui-acc-item > button:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; border-radius: 8px; }
.ui-acc-sign {
  position: relative;
  flex: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--soft);
  transition: background .3s, color .3s, rotate .5s cubic-bezier(.3, 1.4, .5, 1), scale .25s;
}
.ui-acc-item > button:hover .ui-acc-sign { scale: 1.12; }
.ui-acc-sign::before,
.ui-acc-sign::after {
  content: "";
  position: absolute;
  left: 8px;
  top: 13px;
  width: 12px;
  height: 2px;
  border-radius: 1px;
  background: currentColor;
  transition: rotate .5s cubic-bezier(.3, 1.4, .5, 1);
}
.ui-acc-sign::after { rotate: 90deg; }
.ui-acc-item[data-open="true"] .ui-acc-sign { background: var(--ink); color: var(--bg); rotate: 180deg; }
.ui-acc-item[data-open="true"] .ui-acc-sign::after { rotate: 0deg; }
.ui-acc-panel { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .4s cubic-bezier(.2, .8, .2, 1); }
.ui-acc-item[data-open="true"] .ui-acc-panel { grid-template-rows: 1fr; }
.ui-acc-panel > div { overflow: hidden; visibility: hidden; transition: visibility .4s; }
.ui-acc-item[data-open="true"] .ui-acc-panel > div { visibility: visible; }
.ui-acc-panel p {
  margin: 0;
  padding: 0 44px 16px 4px;
  color: var(--muted);
  line-height: 1.5;
  opacity: 0;
  translate: 0 -8px;
  transition: opacity .25s, translate .4s cubic-bezier(.2, .8, .2, 1);
}
.ui-acc-item[data-open="true"] .ui-acc-panel p { opacity: 1; translate: 0 0; transition-delay: .08s; }
@media (prefers-reduced-motion: reduce) {
  :is(.ui-acc, .ui-acc *), :is(.ui-acc, .ui-acc *)::before, :is(.ui-acc, .ui-acc *)::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    transition-delay: 0s !important;
  }
}
`;

const ITEMS = [
  { title: "How do I add one to my project?", body: "Copy the file, save it beside your other components and import it. There is nothing to install." },
  { title: "Do I need a CSS framework?", body: "No. Each file carries its own styles, scoped by class name." },
  { title: "Can I change the colours?", body: "Yes. Set --ui-accent and the other --ui variables on any parent element." },
];

export default function Accordion({ items = ITEMS, defaultOpen = 0 }) {
  const id = useId();
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="ui-acc">
      <style>{css}</style>
      {items.map((item, i) => (
        <div key={item.title} className="ui-acc-item" data-open={open === i}>
          <button type="button" id={id + "b" + i} aria-expanded={open === i} aria-controls={id + "p" + i} onClick={() => setOpen(open === i ? -1 : i)}>
            {item.title}
            <span className="ui-acc-sign" aria-hidden="true" />
          </button>
          <div className="ui-acc-panel" id={id + "p" + i} role="region" aria-labelledby={id + "b" + i}>
            <div><p>{item.body}</p></div>
          </div>
        </div>
      ))}
    </div>
  );
}
