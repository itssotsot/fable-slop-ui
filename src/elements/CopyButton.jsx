// CopyButton: copies a value, swaps its icon for a tick and sweeps a highlight across the text.
// Usage: <CopyButton value="npm install react" />
import { useEffect, useRef, useState } from "react";

const css = `
.ui-copy {
  --accent: var(--ui-accent, #1a4be0);
  --ink: var(--ui-ink, #111);
  --bg: var(--ui-bg, #fff);
  --soft: var(--ui-soft, #f4f4f4);
  --line: var(--ui-line, #e3e3e3);
  --muted: var(--ui-muted, #6b6b6b);
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 14px;
  padding: 6px 6px 6px 16px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--bg);
  color: var(--ink);
  font: inherit;
  cursor: pointer;
  transition: border-color .2s, scale .2s;
  -webkit-tap-highlight-color: transparent;
}
.ui-copy:hover { border-color: var(--ink); }
.ui-copy:active { scale: .98; }
.ui-copy:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.ui-copy-text {
  font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
  font-size: 14px;
  background: linear-gradient(100deg, transparent 40%, color-mix(in srgb, var(--accent) 22%, transparent) 50%, transparent 60%) no-repeat 200% 0 / 250% 100%;
  border-radius: 4px;
}
.ui-copy[data-copied="true"] .ui-copy-text { animation: ui-copy-sweep .7s ease-out; }
.ui-copy-icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: var(--soft);
  color: var(--muted);
  transition: background .25s, color .25s;
}
.ui-copy:hover .ui-copy-icon { color: var(--ink); }
.ui-copy[data-copied="true"] .ui-copy-icon { background: var(--accent); color: var(--ui-accent-ink, #fff); }
.ui-copy-icon svg { grid-area: 1 / 1; transition: scale .35s cubic-bezier(.34, 1.56, .64, 1), opacity .15s, rotate .35s; }
.ui-copy-icon svg + svg { scale: .3; opacity: 0; rotate: -40deg; }
.ui-copy[data-copied="true"] .ui-copy-icon svg { scale: .3; opacity: 0; rotate: 40deg; }
.ui-copy[data-copied="true"] .ui-copy-icon svg + svg { scale: 1; opacity: 1; rotate: 0deg; }
.ui-copy-tip {
  position: absolute;
  right: 0;
  bottom: calc(100% + 8px);
  padding: 5px 10px;
  border-radius: 8px;
  background: var(--ink);
  color: var(--bg);
  font-size: 12px;
  font-weight: 500;
  opacity: 0;
  translate: 0 6px;
  scale: .9;
  transform-origin: 80% 100%;
  pointer-events: none;
  transition: opacity .15s, translate .3s cubic-bezier(.34, 1.56, .64, 1), scale .3s cubic-bezier(.34, 1.56, .64, 1);
}
.ui-copy[data-copied="true"] .ui-copy-tip { opacity: 1; translate: 0 0; scale: 1; }
@keyframes ui-copy-sweep { from { background-position: 200% 0; } to { background-position: -100% 0; } }
@media (prefers-reduced-motion: reduce) {
  :is(.ui-copy, .ui-copy *), :is(.ui-copy, .ui-copy *)::before, :is(.ui-copy, .ui-copy *)::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    transition-delay: 0s !important;
  }
}
`;

export default function CopyButton({ value = "npm install react", copiedLabel = "Copied", onCopy }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard access can be blocked (insecure origin, denied permission). Still give feedback.
    }
    onCopy?.(value);
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  };

  return (
    <button type="button" className="ui-copy" data-copied={copied} onClick={copy} aria-label={"Copy " + value}>
      <style>{css}</style>
      <span className="ui-copy-text">{value}</span>
      <span className="ui-copy-icon" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6.5" y="6.5" width="8" height="8" rx="2" />
          <path d="M11.5 4.2V4a1.5 1.5 0 0 0-1.5-1.5H5A1.5 1.5 0 0 0 3.5 4v5A1.5 1.5 0 0 0 5 10.5h.2" />
        </svg>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 9.5l3.2 3.2L14 5.8" />
        </svg>
      </span>
      <span className="ui-copy-tip" role="status">{copied ? copiedLabel : ""}</span>
    </button>
  );
}
