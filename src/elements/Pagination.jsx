// Pagination: every page number sits on one strip that slides sideways behind the first and last
// page. Numbers glide out from under the "…" on one side and tuck away under it on the other,
// while the active pill travels to its new number.
// Usage: <Pagination total={12} defaultPage={1} onChange={(page) => load(page)} />
// The pinned ends are painted with --ui-bg, so set that variable to the colour behind the component.
import { useState } from "react";

const css = `
.ui-pages {
  --accent: var(--ui-accent, #1a4be0);
  --on-accent: var(--ui-accent-ink, #fff);
  --ink: var(--ui-ink, #111);
  --bg: var(--ui-bg, #fff);
  --soft: var(--ui-soft, #f4f4f4);
  --muted: var(--ui-muted, #6b6b6b);
  --slide: .6s cubic-bezier(.2, .8, .2, 1);
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: var(--ink);
  font: inherit;
  font-size: 14px;
}
.ui-pages button {
  display: grid;
  place-items: center;
  flex: none;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 10px;
  background: none;
  color: inherit;
  font: inherit;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  transition: background .2s, color .3s, opacity .2s, scale .2s;
  -webkit-tap-highlight-color: transparent;
}
.ui-pages button:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
.ui-pages button:active { scale: .88; }
.ui-pages button:disabled { opacity: .3; cursor: default; scale: 1; }
.ui-pages-arrow svg { transition: translate .25s cubic-bezier(.34, 1.56, .64, 1); }
.ui-pages-arrow:not(:disabled):hover { background: var(--soft); }
.ui-pages-arrow:first-of-type:not(:disabled):hover svg { translate: -3px 0; }
.ui-pages-arrow:last-of-type:not(:disabled):hover svg { translate: 3px 0; }

.ui-pages-view { position: relative; width: calc(var(--slots) * 34px - 2px); height: 32px; overflow: hidden; }
.ui-pages-strip { position: absolute; left: 0; top: 0; display: flex; gap: 2px; translate: calc(var(--off) * -34px) 0; transition: translate var(--slide); }
.ui-pages-strip button { position: relative; }
.ui-pages-strip button:not([aria-current]):hover { background: var(--soft); }
.ui-pages-strip button[aria-current] { color: var(--on-accent); }
.ui-pages-pill {
  position: absolute;
  left: 0;
  top: 0;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: var(--accent);
  translate: calc(var(--at) * 34px) 0;
  transition: translate var(--slide); /* same timing as the strip, so the pill never drifts past the edge */
}

/* The first and last page stay put. The strip slides underneath them. */
.ui-pages-pin {
  position: absolute;
  top: 0;
  display: flex;
  gap: 2px;
  background: var(--bg);
  transition: opacity .25s, translate .4s cubic-bezier(.3, 1.3, .5, 1), visibility .25s;
}
.ui-pages-pin::after { content: ""; position: absolute; top: 0; width: 14px; height: 100%; pointer-events: none; }
.ui-pages-pin[data-side="left"] { left: 0; }
.ui-pages-pin[data-side="left"]::after { left: 100%; background: linear-gradient(to right, var(--bg), transparent); }
.ui-pages-pin[data-side="right"] { right: 0; }
.ui-pages-pin[data-side="right"]::after { right: 100%; background: linear-gradient(to left, var(--bg), transparent); }
.ui-pages-pin[data-on="false"] { opacity: 0; visibility: hidden; }
.ui-pages-pin[data-on="false"][data-side="left"] { translate: -10px 0; }
.ui-pages-pin[data-on="false"][data-side="right"] { translate: 10px 0; }
.ui-pages-pin button:hover { background: var(--soft); }
.ui-pages-dots { display: flex; align-items: center; justify-content: center; gap: 3px; width: 32px; height: 32px; }
.ui-pages-dots i { width: 3px; height: 3px; border-radius: 50%; background: var(--muted); animation: ui-pages-gulp .5s calc(var(--n) * 70ms) cubic-bezier(.3, 1.6, .5, 1); }
.ui-pages[data-dir="-1"] .ui-pages-dots i { animation-delay: calc((2 - var(--n)) * 70ms); }
@keyframes ui-pages-gulp { 40% { scale: 2.2; translate: 0 -3px; background: var(--accent); } }
@media (prefers-reduced-motion: reduce) {
  :is(.ui-pages, .ui-pages *), :is(.ui-pages, .ui-pages *)::before, :is(.ui-pages, .ui-pages *)::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    transition-delay: 0s !important;
  }
}
`;

const WINDOW = 7; // how many slots are on show at once

const Chevron = ({ d }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

// The dots swallow each number that passes: they bulge in turn, in the direction of travel.
const Dots = () => (
  <span className="ui-pages-dots" aria-hidden="true">
    <i style={{ "--n": 0 }} /><i style={{ "--n": 1 }} /><i style={{ "--n": 2 }} />
  </span>
);

export default function Pagination({ total = 12, defaultPage = 1, onChange }) {
  const [page, setPage] = useState(defaultPage);
  const [dir, setDir] = useState(1);

  // Slide the strip so the current page sits in the middle slot whenever there is room.
  const last = Math.max(0, total - WINDOW);
  const off = Math.max(0, Math.min(last, page - 4));
  const pinLeft = off > 0;
  const pinRight = off < last;
  const inView = (n) => {
    const slot = n - 1 - off;
    return slot >= (pinLeft ? 2 : 0) && slot <= (pinRight ? WINDOW - 3 : WINDOW - 1);
  };

  const go = (next) => {
    if (next < 1 || next > total || next === page) return;
    setDir(next > page ? 1 : -1);
    setPage(next);
    onChange?.(next);
  };

  return (
    <nav className="ui-pages" aria-label="Pagination" data-dir={dir} style={{ "--off": off, "--at": page - 1, "--slots": Math.min(WINDOW, total) }}>
      <style>{css}</style>
      <button type="button" className="ui-pages-arrow" aria-label="Previous page" disabled={page === 1} onClick={() => go(page - 1)}>
        <Chevron d="M10 3.5L5.5 8l4.5 4.5" />
      </button>
      <div className="ui-pages-view">
        <div className="ui-pages-strip">
          <span className="ui-pages-pill" aria-hidden="true" />
          {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
            <button key={n} type="button" aria-label={"Page " + n} aria-current={n === page ? "page" : undefined} aria-hidden={!inView(n)} tabIndex={inView(n) ? 0 : -1} onClick={() => go(n)}>
              {n}
            </button>
          ))}
        </div>
        <div className="ui-pages-pin" data-side="left" data-on={pinLeft}>
          <button type="button" aria-label="Page 1" tabIndex={pinLeft ? 0 : -1} onClick={() => go(1)}>1</button>
          <Dots key={off} />
        </div>
        <div className="ui-pages-pin" data-side="right" data-on={pinRight}>
          <Dots key={off} />
          <button type="button" aria-label={"Page " + total} tabIndex={pinRight ? 0 : -1} onClick={() => go(total)}>{total}</button>
        </div>
      </div>
      <button type="button" className="ui-pages-arrow" aria-label="Next page" disabled={page === total} onClick={() => go(page + 1)}>
        <Chevron d="M6 3.5L10.5 8 6 12.5" />
      </button>
    </nav>
  );
}
