// PasswordField: an eye that opens and closes, and a strength meter that fills as you type.
// Showing the password flips the dots over into letters one by one, left to right, each landing
// with a flash of the accent colour. Hiding it squashes the letters back into dots from the right.
// Usage: <PasswordField onChange={(value, score) => setPassword(value)} />   // score: 0 to 4
import { useEffect, useRef, useState } from "react";

const css = `
.ui-pass {
  --accent: var(--ui-accent, #1a4be0);
  --ink: var(--ui-ink, #111);
  --bg: var(--ui-bg, #fff);
  --soft: var(--ui-soft, #f4f4f4);
  --line: var(--ui-line, #e3e3e3);
  --muted: var(--ui-muted, #6b6b6b);
  display: block;
  width: 280px;
  max-width: 100%;
  font: inherit;
  text-align: left;
}
.ui-pass-box { position: relative; display: block; }
.ui-pass input {
  width: 100%;
  height: 52px;
  padding: 0 52px 0 16px;
  border: 1.5px solid var(--line);
  border-radius: 12px;
  background: var(--bg);
  color: var(--ink);
  font: inherit;
  font-size: 16px;
  outline: 0;
  box-sizing: border-box;
  transition: border-color .2s, box-shadow .2s;
}
/* The animated copy is made of separate characters, which cannot be kerned against each other.
   Turning kerning and ligatures off in both places makes the copy and the real text line up exactly. */
.ui-pass input, .ui-pass-chars { font-kerning: none; font-variant-ligatures: none; letter-spacing: 0; }
.ui-pass input::placeholder { color: var(--muted); }
.ui-pass input:focus { border-color: var(--accent); box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 16%, transparent); }
/* During the flip the real text is hidden and a copy made of single characters plays on top of it. */
.ui-pass[data-flip="true"] input { color: transparent; caret-color: var(--ink); }
.ui-pass-chars {
  position: absolute;
  left: 17.5px;
  right: 53.5px;
  top: 0;
  height: 52px;
  overflow: hidden;
  color: var(--ink);
  font-size: 16px;
  line-height: 52px;
  white-space: pre;
  pointer-events: none;
}
.ui-pass-chars > span { display: inline-block; translate: calc(var(--scroll) * -1px) 0; }
/* Each character sits in a slot. The slot eases between the width of a dot and the width of the
   letter, so the rest of the row glides along instead of jumping. */
.ui-pass-chars i { display: inline-block; font-style: normal; text-align: center; transition: width .26s cubic-bezier(.2, .8, .2, 1); }
.ui-pass-chars b { display: inline-block; font-weight: inherit; transform-origin: 50% 60%; }
.ui-pass-chars b[data-dot="true"] { -webkit-text-security: disc; }
.ui-pass-chars b[data-turned="true"][data-dot="false"] { animation: ui-pass-reveal .45s cubic-bezier(.3, 1.6, .5, 1); }
.ui-pass-chars b[data-turned="true"][data-dot="true"] { animation: ui-pass-conceal .4s cubic-bezier(.3, 1.4, .5, 1); }
.ui-pass-eye {
  position: absolute;
  right: 8px;
  top: 8px;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 0;
  border-radius: 9px;
  background: none;
  color: var(--muted);
  cursor: pointer;
  transition: background .2s, color .2s;
}
.ui-pass-eye:hover { background: var(--soft); color: var(--ink); }
.ui-pass-eye:focus-visible { outline: 2px solid var(--accent); }
.ui-pass-eye svg { overflow: visible; }
.ui-pass-lid { transform-origin: 10px 10px; transition: transform .3s cubic-bezier(.34, 1.56, .64, 1); }
.ui-pass-pupil { transform-origin: 10px 10px; transition: transform .3s cubic-bezier(.34, 1.56, .64, 1); }
.ui-pass-slash { stroke-dasharray: 20; stroke-dashoffset: 0; transition: stroke-dashoffset .3s; }
.ui-pass[data-shown="true"] .ui-pass-slash { stroke-dashoffset: 20; }
.ui-pass[data-shown="false"] .ui-pass-pupil { transform: scale(.6); }
.ui-pass-eye:active .ui-pass-lid { transform: scaleY(.3); }
.ui-pass-meter { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; margin-top: 10px; }
.ui-pass-meter i { height: 4px; border-radius: 2px; background: var(--soft); overflow: hidden; }
.ui-pass-meter i::after {
  content: "";
  display: block;
  height: 100%;
  border-radius: 2px;
  background: var(--tone);
  scale: 0 1;
  transform-origin: 0 50%;
  transition: scale .35s cubic-bezier(.2, .8, .2, 1), background .3s;
}
.ui-pass-meter i[data-on="true"]::after { scale: 1 1; transition-delay: calc(var(--i) * 50ms), 0s; }
.ui-pass-note { display: flex; justify-content: space-between; margin-top: 8px; color: var(--muted); font-size: 13px; }
.ui-pass-note b { color: var(--tone); font-weight: 500; animation: ui-pass-in .3s; }
@keyframes ui-pass-in { from { opacity: 0; translate: 0 4px; } }
@keyframes ui-pass-reveal {
  0% { transform: translateY(-11px) scale(.5, .1); color: var(--accent); opacity: 0; }
  55% { color: var(--accent); opacity: 1; }
  100% { transform: none; }
}
@keyframes ui-pass-conceal {
  0% { transform: translateY(-9px) scale(1.7, .3); color: var(--accent); }
  60% { transform: translateY(2px) scale(.8, 1.25); }
  100% { transform: none; }
}
@media (prefers-reduced-motion: reduce) {
  :is(.ui-pass, .ui-pass *), :is(.ui-pass, .ui-pass *)::before, :is(.ui-pass, .ui-pass *)::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    transition-delay: 0s !important;
  }
}
`;

const WORDS = ["", "Weak", "Fair", "Good", "Strong"];
const TONES = ["transparent", "#d93025", "#e08a00", "#1a9a52", "var(--accent)"];

const scoreOf = (value) => {
  if (!value) return 0;
  const checks = [value.length >= 8, /[a-z]/.test(value) && /[A-Z]/.test(value), /\d/.test(value), /[^A-Za-z0-9]/.test(value)];
  return Math.max(1, checks.filter(Boolean).length);
};

export default function PasswordField({ placeholder = "Create a password", onChange }) {
  const [value, setValue] = useState("");
  const [shown, setShown] = useState(false);
  const [flip, setFlip] = useState(null); // while the characters are turning: { turned, scroll }
  const field = useRef(null);
  const frame = useRef(0);
  const score = scoreOf(value);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  // How wide each character is, as a letter or as a dot, measured with the field's own font.
  const widths = (letters) => {
    const probe = document.createElement("span");
    probe.className = "ui-pass-chars";
    probe.style.visibility = "hidden";
    const row = probe.appendChild(document.createElement("span"));
    for (const ch of value) {
      const glyph = row.appendChild(document.createElement("b"));
      glyph.textContent = ch;
      glyph.dataset.dot = String(!letters);
    }
    field.current.parentNode.appendChild(probe);
    const sizes = [...row.children].map((n) => n.getBoundingClientRect().width);
    probe.remove();
    return sizes;
  };

  // Turn the characters over one at a time. The real input swaps type straight away, hidden under the copy.
  const toggle = () => {
    const next = !shown;
    setShown(next);
    cancelAnimationFrame(frame.current);
    const count = [...value].length;
    if (!count || (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches)) return setFlip(null);
    const each = Math.min(34, 520 / count); // ms between characters, so long passwords do not take forever
    const scroll = field.current.scrollLeft;
    const from = widths(!next);
    const to = widths(next);
    let start;
    const tick = (now) => {
      start ??= now;
      const turned = Math.min(count, Math.floor((now - start) / each) + 1);
      if (now - start > count * each + 480) return setFlip(null);
      setFlip((was) => (was?.turned === turned ? was : { turned, scroll, from, to }));
      frame.current = requestAnimationFrame(tick);
    };
    setFlip({ turned: 0, scroll, from, to });
    frame.current = requestAnimationFrame(tick);
  };
  const chars = [...value];

  return (
    <span className="ui-pass" data-shown={shown} data-flip={flip != null} style={{ "--tone": TONES[score] }}>
      <style>{css}</style>
      <span className="ui-pass-box">
        <input
          ref={field}
          type={shown ? "text" : "password"}
          value={value}
          placeholder={placeholder}
          aria-label={placeholder}
          autoComplete="new-password"
          onChange={(e) => {
            cancelAnimationFrame(frame.current);
            setFlip(null);
            setValue(e.target.value);
            onChange?.(e.target.value, scoreOf(e.target.value));
          }}
        />
        <button type="button" className="ui-pass-eye" aria-label={shown ? "Hide password" : "Show password"} aria-pressed={shown} onClick={toggle}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path className="ui-pass-lid" d="M2 10s3-5.5 8-5.5S18 10 18 10s-3 5.5-8 5.5S2 10 2 10z" />
            <circle className="ui-pass-pupil" cx="10" cy="10" r="2.5" />
            <path className="ui-pass-slash" d="M3.5 3.5l13 13" />
          </svg>
        </button>
        {flip && (
          <span className="ui-pass-chars" aria-hidden="true" style={{ "--scroll": flip.scroll }}>
            <span>
              {chars.map((ch, i) => {
                // Showing runs left to right, hiding runs right to left.
                const turned = shown ? i < flip.turned : i >= chars.length - flip.turned;
                return (
                  <i key={i} style={{ width: (turned ? flip.to : flip.from)[i] }}>
                    <b key={turned} data-turned={turned} data-dot={turned ? !shown : shown}>
                      {ch}
                    </b>
                  </i>
                );
              })}
            </span>
          </span>
        )}
      </span>
      <span className="ui-pass-meter" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => <i key={i} data-on={i < score} style={{ "--i": i }} />)}
      </span>
      <span className="ui-pass-note" aria-live="polite">
        <span>8 or more characters, mixed case, a number and a symbol</span>
        {score > 0 && <b key={score}>{WORDS[score]}</b>}
      </span>
    </span>
  );
}
