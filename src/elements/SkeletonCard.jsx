// SkeletonCard: a loading state built from the real content, so nothing shifts when it arrives.
// While loading there are no grey bars: every word is a run of characters that never stop changing,
// with a wave of colour rolling through them in reading order. A ring turns around the avatar
// and a light sweeps across the card.
// When the content lands, the characters lock into the real text from left to right, word after word.
// Usage: <SkeletonCard loading={isLoading} title="Weekly report" meta="Ready to read" body="…" />
// Without a loading prop it runs a demo you can replay with the round button.
import { useEffect, useState } from "react";

const css = `
.ui-skel {
  --accent: var(--ui-accent, #1a4be0);
  --on-accent: var(--ui-accent-ink, #fff);
  --ink: var(--ui-ink, #111);
  --bg: var(--ui-bg, #fff);
  --soft: var(--ui-soft, #f4f4f4);
  --line: var(--ui-line, #e3e3e3);
  --muted: var(--ui-muted, #6b6b6b);
  position: relative;
  display: grid;
  gap: 14px;
  width: 290px;
  max-width: 100%;
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: var(--bg);
  color: var(--ink);
  font: inherit;
  font-size: 14px;
  line-height: 1.6;
  text-align: left;
  box-sizing: border-box;
  overflow: hidden;
}

/* A light that crosses the whole card while it loads. */
.ui-skel::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, transparent 35%, color-mix(in srgb, var(--bg) 75%, transparent) 50%, transparent 65%);
  translate: -100% 0;
  opacity: 0;
  pointer-events: none;
}
.ui-skel[data-loading="true"]::after { opacity: 1; animation: ui-skel-sweep 1.5s ease-in-out infinite; }

/* An indeterminate hairline along the top edge. */
.ui-skel-bar { position: absolute; left: 0; top: 0; width: 100%; height: 2px; overflow: hidden; opacity: 0; transition: opacity .3s; }
.ui-skel-bar::after { content: ""; display: block; width: 40%; height: 100%; border-radius: 2px; background: var(--accent); }
.ui-skel[data-loading="true"] .ui-skel-bar { opacity: 1; }
.ui-skel[data-loading="true"] .ui-skel-bar::after { animation: ui-skel-run 1.1s cubic-bezier(.4, 0, .3, 1) infinite; }

.ui-skel-head { display: grid; grid-template-columns: 44px 1fr; align-items: center; gap: 12px; padding-right: 36px; }
.ui-skel-avatar {
  position: relative;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--accent);
  color: var(--on-accent);
  font-weight: 600;
  animation: ui-skel-pop .6s cubic-bezier(.3, 1.7, .5, 1);
}
.ui-skel-avatar span { animation: ui-skel-fade .4s .2s backwards; }
.ui-skel-avatar::after {
  content: "";
  position: absolute;
  inset: -5px;
  border: 2px solid transparent;
  border-top-color: var(--accent);
  border-right-color: var(--accent);
  border-radius: 50%;
  opacity: 0;
  transition: opacity .3s;
}
.ui-skel[data-loading="true"] .ui-skel-avatar { background: var(--line); animation: none; }
.ui-skel[data-loading="true"] .ui-skel-avatar span { visibility: hidden; }
.ui-skel[data-loading="true"] .ui-skel-avatar::after { opacity: 1; animation: ui-skel-spin .8s linear infinite; }

.ui-skel-head b { display: block; font-size: 15px; font-weight: 500; }
.ui-skel-head small { color: var(--muted); font-size: 13px; }
.ui-skel p { margin: 0; color: var(--muted); }

/* A piece of text. The real word is always there to hold the space; while it is still
   being worked out, the changing characters are drawn on top of it. */
.ui-skel-text { position: relative; display: inline-block; white-space: nowrap; }
.ui-skel-text[data-done="false"] { color: transparent; user-select: none; }
.ui-skel-text[data-done="false"]::before {
  content: attr(data-show);
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  overflow: hidden;
  color: color-mix(in srgb, var(--muted) 55%, transparent);
  font-variant-ligatures: none;
}
.ui-skel[data-loading="true"] .ui-skel-text::before { animation: ui-skel-wave 1.4s calc(var(--i) * 60ms) ease-in-out infinite; }
.ui-skel[data-loading="false"] .ui-skel-text[data-done="false"]::before { color: var(--accent); }
.ui-skel-text[data-done="true"] { animation: ui-skel-land .5s cubic-bezier(.2, .8, .2, 1); }

.ui-skel-again {
  position: absolute;
  z-index: 1;
  right: 12px;
  top: 12px;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: none;
  color: var(--muted);
  cursor: pointer;
  transition: background .2s, color .2s, scale .2s;
}
.ui-skel-again:hover { background: var(--soft); color: var(--ink); }
.ui-skel-again:active { scale: .85; }
.ui-skel-again:focus-visible { outline: 2px solid var(--accent); }
.ui-skel-again svg { transition: rotate .7s cubic-bezier(.3, 1.3, .5, 1); }
.ui-skel[data-loading="true"] .ui-skel-again svg { rotate: 360deg; }

@keyframes ui-skel-sweep { to { translate: 100% 0; } }
@keyframes ui-skel-run { from { translate: -100% 0; } to { translate: 250% 0; } }
@keyframes ui-skel-spin { to { rotate: 360deg; } }
@keyframes ui-skel-wave { 40% { color: var(--accent); translate: 0 -2px; } }
@keyframes ui-skel-land { from { color: var(--accent); translate: 0 -3px; } }
@keyframes ui-skel-pop { from { scale: .5; } }
@keyframes ui-skel-fade { from { opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  :is(.ui-skel, .ui-skel *), :is(.ui-skel, .ui-skel *)::before, :is(.ui-skel, .ui-skel *)::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    animation-delay: 0s !important;
    transition-duration: .01ms !important;
    transition-delay: 0s !important;
  }
}
`;

const GLYPHS = "abcdefghijklmnopqrstuvwxyz0123456789#%&$<>/*+=?";
const calm = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const glyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
// Random characters from position `solid` onward; everything before it is already the real text.
const scramble = (text, solid = 0) => [...text].map((ch, i) => (i < solid || ch === " " ? ch : glyph())).join("");

// Returns what each text should show right now.
// Busy: characters that keep changing. Ready: each text locks in from left to right, one after another.
function useCipher(texts, busy) {
  const [shown, setShown] = useState(() => texts.map((t) => scramble(t)));
  const joined = texts.join("\n");

  useEffect(() => {
    const list = joined.split("\n");
    if (calm()) {
      const timer = setTimeout(() => setShown(busy ? list.map((t) => "·".repeat(t.length)) : list));
      return () => clearTimeout(timer);
    }
    if (busy) {
      const timer = setInterval(() => setShown(list.map((t) => scramble(t))), 70);
      return () => clearInterval(timer);
    }
    let frame;
    let start;
    let swapped = 0;
    const step = (now) => {
      start ??= now;
      let finished = true;
      const next = list.map((t, n) => {
        const done = Math.max(0, Math.min(1, (now - start - n * 40) / (260 + t.length * 30)));
        if (done < 1) finished = false;
        return done === 1 ? t : scramble(t, Math.floor(done * t.length));
      });
      if (finished || now - swapped > 45) {
        swapped = now;
        setShown(next);
      }
      if (!finished) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [joined, busy]);

  return shown;
}

function Text({ text, show, i }) {
  return (
    <span className="ui-skel-text" data-show={show} data-done={show === text} style={{ "--i": i }}>
      {text}
    </span>
  );
}

export default function SkeletonCard({
  loading,
  initials = "WR",
  title = "Weekly report",
  meta = "Ready to read",
  body = "Twelve tasks were closed this week and three are still open. The next review is on Monday.",
  delay = 2400,
}) {
  const [demo, setDemo] = useState(true);
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (loading != null) return;
    const timer = setTimeout(() => setDemo(false), delay);
    return () => clearTimeout(timer);
  }, [run, loading, delay]);

  const busy = loading ?? demo;
  const words = body.split(" ");
  const shown = useCipher([title, meta, ...words], busy);

  return (
    <article className="ui-skel" data-loading={busy} aria-busy={busy}>
      <style>{css}</style>
      <i className="ui-skel-bar" aria-hidden="true" />
      <div className="ui-skel-head">
        <span className="ui-skel-avatar" key={String(busy)}><span>{initials}</span></span>
        <div>
          <b aria-label={title}><Text text={title} show={shown[0] ?? title} i={0} /></b>
          <small aria-label={meta}><Text text={meta} show={shown[1] ?? meta} i={2} /></small>
        </div>
      </div>
      <p aria-label={body}>
        {words.map((word, i) => (
          <span key={i} aria-hidden="true">
            <Text text={word} show={shown[i + 2] ?? word} i={i + 4} />{" "}
          </span>
        ))}
      </p>
      {loading == null && (
        <button
          type="button"
          className="ui-skel-again"
          aria-label="Load again"
          onClick={() => {
            setDemo(true);
            setRun(run + 1);
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M13.5 8a5.5 5.5 0 1 1-1.7-4M13.5 2.5V5H11" />
          </svg>
        </button>
      )}
    </article>
  );
}
