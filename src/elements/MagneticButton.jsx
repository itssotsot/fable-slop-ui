// MagneticButton: leans toward the cursor and springs back when it leaves.
// Usage: <MagneticButton onClick={start}>Get started</MagneticButton>
// Theme (optional): set --ui-accent, --ui-accent-ink, --ui-ink, --ui-bg on any parent.
import { useRef } from "react";

const css = `
.ui-magnet-zone {
  display: inline-block;
  padding: 28px;
}
.ui-magnet {
  --accent: var(--ui-accent, #1a4be0);
  --on-accent: var(--ui-accent-ink, #fff);
  --ink: var(--ui-ink, #111);
  --bg: var(--ui-bg, #fff);
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 8px 8px 8px 24px;
  border: 0;
  border-radius: 999px;
  background: var(--ink);
  color: var(--bg);
  font: inherit;
  font-size: 16px;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
  translate: var(--x, 0px) var(--y, 0px);
  transition: translate .6s cubic-bezier(.2, 1.6, .3, 1), scale .2s;
  -webkit-tap-highlight-color: transparent;
}
.ui-magnet[data-pull] { transition: translate .1s linear, scale .2s; }
.ui-magnet:active { scale: .96; }
.ui-magnet:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.ui-magnet-label {
  translate: calc(var(--x, 0px) * .3) calc(var(--y, 0px) * .3);
  transition: inherit;
}
.ui-magnet-dot {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--accent);
  color: var(--on-accent);
  overflow: hidden;
}
.ui-magnet-dot svg {
  grid-area: 1 / 1;
  transition: translate .4s cubic-bezier(.2, .8, .2, 1);
}
.ui-magnet-dot svg + svg { translate: -30px 0; }
.ui-magnet:hover .ui-magnet-dot svg { translate: 30px 0; }
.ui-magnet:hover .ui-magnet-dot svg + svg { translate: 0 0; }
@media (prefers-reduced-motion: reduce) {
  .ui-magnet, .ui-magnet * { translate: none !important; transition: none !important; }
}
@media (prefers-reduced-motion: reduce) {
  :is(.ui-magnet-zone, .ui-magnet-zone *), :is(.ui-magnet-zone, .ui-magnet-zone *)::before, :is(.ui-magnet-zone, .ui-magnet-zone *)::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    transition-delay: 0s !important;
  }
}
`;

const Arrow = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 8h10M9 4l4 4-4 4" />
  </svg>
);

export default function MagneticButton({ children = "Get started", strength = 0.4, ...props }) {
  const button = useRef(null);
  const offset = useRef({ x: 0, y: 0 });

  const pull = (e) => {
    if (e.pointerType === "touch") return;
    const el = button.current;
    const r = el.getBoundingClientRect();
    // The rect already includes the current offset, so take it back out.
    const cx = r.left + r.width / 2 - offset.current.x;
    const cy = r.top + r.height / 2 - offset.current.y;
    offset.current = { x: (e.clientX - cx) * strength, y: (e.clientY - cy) * strength };
    el.style.setProperty("--x", offset.current.x + "px");
    el.style.setProperty("--y", offset.current.y + "px");
    el.dataset.pull = "";
  };

  const release = () => {
    const el = button.current;
    offset.current = { x: 0, y: 0 };
    el.style.removeProperty("--x");
    el.style.removeProperty("--y");
    delete el.dataset.pull;
  };

  return (
    <span className="ui-magnet-zone" onPointerMove={pull} onPointerLeave={release}>
      <style>{css}</style>
      <button ref={button} type="button" className="ui-magnet" {...props}>
        <span className="ui-magnet-label">{children}</span>
        <span className="ui-magnet-dot"><Arrow /><Arrow /></span>
      </button>
    </span>
  );
}
