// LikeButton: the heart pops, throws sparks and the count rolls to its new value.
// Usage: <LikeButton count={128} onChange={(liked) => save(liked)} />
import { useState } from "react";

const css = `
.ui-like {
  --like: var(--ui-like, #e5484d);
  --ink: var(--ui-ink, #111);
  --bg: var(--ui-bg, #fff);
  --line: var(--ui-line, #e3e3e3);
  --muted: var(--ui-muted, #6b6b6b);
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 48px;
  padding: 0 18px 0 14px;
  border: 1px solid var(--line);
  border-radius: 24px;
  background: var(--bg);
  color: var(--ink);
  font: inherit;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: border-color .2s, background .3s, scale .2s;
  -webkit-tap-highlight-color: transparent;
}
.ui-like:hover { border-color: var(--like); }
.ui-like:active { scale: .95; }
.ui-like:focus-visible { outline: 2px solid var(--like); outline-offset: 3px; }
.ui-like[aria-pressed="true"] { border-color: transparent; background: color-mix(in srgb, var(--like) 12%, var(--bg)); }
.ui-like-heart { position: relative; display: grid; place-items: center; width: 24px; height: 24px; }
.ui-like-heart svg {
  fill: transparent;
  stroke: var(--muted);
  transition: fill .2s, stroke .2s;
}
.ui-like:hover .ui-like-heart svg { stroke: var(--like); }
.ui-like[aria-pressed="true"] .ui-like-heart svg {
  fill: var(--like);
  stroke: var(--like);
  animation: ui-like-pop .5s cubic-bezier(.3, 1.8, .5, 1);
}
.ui-like-spark {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 4px;
  height: 4px;
  margin: -2px;
  border-radius: 50%;
  background: var(--like);
  opacity: 0;
  rotate: calc(var(--i) * 60deg);
}
.ui-like[aria-pressed="true"] .ui-like-spark { animation: ui-like-spark .6s ease-out; }
.ui-like-count { display: inline-grid; overflow: hidden; font-variant-numeric: tabular-nums; line-height: 1.4; }
.ui-like-count span { grid-area: 1 / 1; }
.ui-like-count [data-dir="up"] { animation: ui-like-up .35s cubic-bezier(.2, .8, .2, 1); }
.ui-like-count [data-dir="down"] { animation: ui-like-down .35s cubic-bezier(.2, .8, .2, 1); }
@keyframes ui-like-pop { 0% { scale: .5; } 100% { scale: 1; } }
@keyframes ui-like-spark {
  0% { opacity: 1; transform: translateY(-6px) scale(1); }
  100% { opacity: 0; transform: translateY(-24px) scale(.3); }
}
@keyframes ui-like-up { from { translate: 0 100%; opacity: 0; } }
@keyframes ui-like-down { from { translate: 0 -100%; opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  :is(.ui-like, .ui-like *), :is(.ui-like, .ui-like *)::before, :is(.ui-like, .ui-like *)::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    transition-delay: 0s !important;
  }
}
`;

export default function LikeButton({ count = 128, defaultLiked = false, onChange }) {
  const [liked, setLiked] = useState(defaultLiked);
  const [touched, setTouched] = useState(false);
  const shown = count + (liked && !defaultLiked ? 1 : 0) - (!liked && defaultLiked ? 1 : 0);

  const toggle = () => {
    setTouched(true);
    setLiked(!liked);
    onChange?.(!liked);
  };

  return (
    <button type="button" className="ui-like" aria-pressed={liked} aria-label={liked ? "Unlike" : "Like"} onClick={toggle}>
      <style>{css}</style>
      <span className="ui-like-heart" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinejoin="round">
          <path d="M12 20.3s-7.6-4.5-7.6-10.1A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.6 2.8c0 5.6-7.6 10.1-7.6 10.1z" />
        </svg>
        {touched && [0, 1, 2, 3, 4, 5].map((i) => <i key={i} className="ui-like-spark" style={{ "--i": i }} />)}
      </span>
      <span className="ui-like-count" aria-live="polite">
        <span key={shown} data-dir={touched ? (liked ? "up" : "down") : undefined}>{shown.toLocaleString("en-US")}</span>
      </span>
    </button>
  );
}
