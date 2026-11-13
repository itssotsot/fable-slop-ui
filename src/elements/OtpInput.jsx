// OtpInput: one real input behind six cells, so typing, deleting, pasting and SMS autofill all just work.
// Each digit rolls into its cell on a rising wash of colour with a key click that gets a little
// brighter each time; a deleted digit drops out with a duller click. A bar and a status line keep count underneath.
// When the code is complete a light scans the cells while it is checked, then the cells flip over
// one by one to the sound of a lock turning, or shake and clear with two dull knocks if the code is wrong.
// Usage: <OtpInput length={6} onComplete={(code) => verify(code)} />
// onComplete may return false, or a promise of false, to reject the code. Anything else accepts it.
// Pass sound={false} to keep it silent. The sounds are made in the browser: there are no audio files.
import { useEffect, useRef, useState } from "react";

const css = `
.ui-otp {
  --accent: var(--ui-accent, #1a4be0);
  --ink: var(--ui-ink, #111);
  --bg: var(--ui-bg, #fff);
  --soft: var(--ui-soft, #f4f4f4);
  --line: var(--ui-line, #e3e3e3);
  --muted: var(--ui-muted, #6b6b6b);
  --ok: var(--ui-success, #1a9a52);
  --bad: var(--ui-danger, #d93025);
  --tone: var(--accent);
  display: inline-grid;
  gap: 12px;
  max-width: 100%;
  font: inherit;
  cursor: text;
  user-select: none;
  -webkit-user-select: none;
}
.ui-otp[data-state="ok"] { --tone: var(--ok); }
.ui-otp[data-state="bad"] { --tone: var(--bad); }
.ui-otp-cells { position: relative; display: flex; gap: 8px; perspective: 400px; }
.ui-otp[data-state="bad"] .ui-otp-cells { animation: ui-otp-shake .45s; }
.ui-otp input {
  position: absolute;
  z-index: 2;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  color: transparent;
  caret-color: transparent;
  font-size: 16px;
  outline: 0;
  opacity: 0;
}
.ui-otp-cell {
  position: relative;
  display: grid;
  place-items: center;
  flex: 0 1 auto;
  width: 44px;
  min-width: 0;
  height: 56px;
  border: 1.5px solid var(--line);
  border-radius: 12px;
  background: linear-gradient(var(--bg), var(--soft));
  box-shadow: inset 0 1px 0 rgb(255 255 255 / .12), inset 0 -3px 6px rgb(0 0 0 / .05);
  color: var(--ink);
  font-size: 23px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  overflow: hidden;
  transition: border-color .2s, box-shadow .2s, translate .3s cubic-bezier(.34, 1.56, .64, 1);
}
.ui-otp-cell[data-split="true"] { margin-left: 10px; }
/* The wash that rises behind a digit. */
.ui-otp-cell::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, color-mix(in srgb, var(--tone) 26%, transparent), color-mix(in srgb, var(--tone) 6%, transparent));
  translate: 0 101%;
  transition: translate .45s cubic-bezier(.2, .8, .2, 1), background .3s;
}
.ui-otp-cell[data-filled="true"]::before { translate: 0 0; }
.ui-otp-cell[data-filled="true"] { border-color: color-mix(in srgb, var(--tone) 55%, var(--line)); }
.ui-otp-cell[data-active="true"] {
  border-color: var(--accent);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 16%, transparent), 0 8px 16px -8px color-mix(in srgb, var(--accent) 60%, transparent);
  translate: 0 -3px;
}
.ui-otp-cell b { position: relative; font-weight: inherit; animation: ui-otp-roll .42s cubic-bezier(.3, 1.5, .5, 1); }
.ui-otp-ghost { position: absolute; text-decoration: none; color: var(--bad); animation: ui-otp-drop .4s cubic-bezier(.5, 0, .8, .4) forwards; }
.ui-otp-caret { position: relative; width: 2px; height: 24px; border-radius: 1px; background: var(--accent); animation: ui-otp-blink 1s steps(2, jump-none) infinite; }
/* A marker at the foot of each cell: a dot, a bar under the active cell, solid once filled. */
.ui-otp-pip {
  position: absolute;
  left: 50%;
  bottom: 5px;
  width: 4px;
  height: 3px;
  margin-left: -2px;
  border-radius: 2px;
  background: var(--line);
  transition: width .3s cubic-bezier(.34, 1.56, .64, 1), margin .3s cubic-bezier(.34, 1.56, .64, 1), background .2s;
}
.ui-otp-cell[data-filled="true"] .ui-otp-pip { background: var(--tone); }
.ui-otp-cell[data-active="true"] .ui-otp-pip { width: 18px; margin-left: -9px; background: var(--accent); }

/* Checking: a light sweeps over the cells and the digits breathe in turn. */
.ui-otp-scan {
  position: absolute;
  z-index: 1;
  top: -4px;
  bottom: -4px;
  left: 0;
  width: 46px;
  border-radius: 12px;
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--accent) 45%, transparent), transparent);
  box-shadow: 0 0 18px color-mix(in srgb, var(--accent) 50%, transparent);
  pointer-events: none;
  animation: ui-otp-scan .9s ease-in-out infinite alternate;
}
.ui-otp[data-state="checking"] .ui-otp-cell b { animation: ui-otp-breathe .6s calc(var(--i) * 80ms) ease-in-out infinite; }
.ui-otp[data-state="ok"] .ui-otp-cell { animation: ui-otp-flip .7s calc(var(--i) * 70ms) cubic-bezier(.3, 1.4, .5, 1) backwards; }

.ui-otp-rail { position: relative; height: 3px; border-radius: 2px; background: var(--soft); overflow: hidden; }
.ui-otp-rail::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 2px;
  background: var(--tone);
  scale: var(--done) 1;
  transform-origin: 0 50%;
  transition: scale .4s cubic-bezier(.3, 1.4, .5, 1), background .3s;
}
.ui-otp[data-state="checking"] .ui-otp-rail::after { background: linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 30%, transparent), var(--accent)) 0 0 / 200% 100%; animation: ui-otp-run .8s linear infinite; }
.ui-otp-status { display: flex; align-items: center; justify-content: center; gap: 6px; height: 20px; color: var(--muted); font-size: 13px; line-height: 20px; overflow: hidden; }
.ui-otp-status > span { display: inline-flex; align-items: center; gap: 6px; animation: ui-otp-say .35s cubic-bezier(.3, 1.4, .5, 1); }
.ui-otp:is([data-state="ok"], [data-state="bad"]) .ui-otp-status { color: var(--tone); font-weight: 500; }
.ui-otp-status path { stroke-dasharray: 20; animation: ui-otp-draw .4s .25s backwards; }
.ui-otp-dots { display: inline-flex; gap: 3px; }
.ui-otp-dots i { width: 4px; height: 4px; border-radius: 50%; background: currentColor; animation: ui-otp-hop .6s calc(var(--i) * 110ms) ease-in-out infinite; }

@keyframes ui-otp-roll { from { translate: 0 -120%; filter: blur(3px); opacity: 0; } }
@keyframes ui-otp-drop { to { translate: 0 110%; rotate: 20deg; opacity: 0; } }
@keyframes ui-otp-blink { from { opacity: 1; } to { opacity: 0; } }
@keyframes ui-otp-scan { from { left: -10px; } to { left: calc(100% - 36px); } }
@keyframes ui-otp-breathe { 50% { scale: .82; opacity: .5; } }
@keyframes ui-otp-flip { 0% { transform: rotateX(0); } 45% { transform: rotateX(200deg) translateY(8px); } 100% { transform: rotateX(360deg); } }
@keyframes ui-otp-shake { 15% { translate: -8px 0; } 35% { translate: 7px 0; } 55% { translate: -5px 0; } 75% { translate: 3px 0; } }
@keyframes ui-otp-run { to { background-position: -200% 0; } }
@keyframes ui-otp-say { from { opacity: 0; translate: 0 100%; } }
@keyframes ui-otp-draw { from { stroke-dashoffset: 20; } }
@keyframes ui-otp-hop { 40% { translate: 0 -4px; } }
@media (prefers-reduced-motion: reduce) {
  :is(.ui-otp, .ui-otp *), :is(.ui-otp, .ui-otp *)::before, :is(.ui-otp, .ui-otp *)::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    transition-delay: 0s !important;
  }
}
`;

// A tiny synth for mechanical clicks: a few milliseconds of noise pushed through a narrow filter.
// `pitch` sets how bright the click is, `length` how long it rings.
let audio;
let hiss;
function click(pitch = 2400, { length = 0.03, volume = 0.5, delay = 0, sharp = 6 } = {}) {
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === "suspended") audio.resume();
    if (!hiss) {
      hiss = audio.createBuffer(1, audio.sampleRate * 0.2, audio.sampleRate);
      const data = hiss.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    const start = audio.currentTime + delay;
    const source = audio.createBufferSource();
    const filter = audio.createBiquadFilter();
    const gain = audio.createGain();
    source.buffer = hiss;
    filter.type = "bandpass";
    filter.frequency.value = pitch;
    filter.Q.value = sharp;
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
    source.connect(filter).connect(gain).connect(audio.destination);
    source.start(start, Math.random() * 0.1);
    source.stop(start + length + 0.01);
  } catch {
    // No audio available: stay quiet.
  }
}
const SOUNDS = {
  type: (i) => click(2200 + i * 260), // each key clicks a little brighter than the last
  erase: () => click(1100, { length: 0.04, volume: 0.4 }),
  // Accepted: a lock turning. Five quick ratchet clicks, then the bolt.
  ok: () => {
    for (let i = 0; i < 5; i++) click(2600 + i * 300, { delay: i * 0.045, length: 0.02, volume: 0.35 });
    click(900, { delay: 0.27, length: 0.09, volume: 0.7, sharp: 3 });
    click(3400, { delay: 0.27, length: 0.03, volume: 0.4 });
  },
  // Rejected: two dull knocks.
  bad: () => [0, 0.14].forEach((delay) => click(320, { delay, length: 0.08, volume: 0.8, sharp: 2 })),
};

export default function OtpInput({ length = 6, onComplete, label = "Verification code", sound = true }) {
  const [code, setCode] = useState("");
  const [focused, setFocused] = useState(false);
  const [state, setState] = useState("idle"); // idle | checking | ok | bad
  const [ghost, setGhost] = useState(null); // the digit that was just deleted, so it can fall out
  const run = useRef(0);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const active = Math.min(code.length, length - 1);
  const toEnd = (e) => e.target.setSelectionRange(e.target.value.length, e.target.value.length);
  const play = (name, arg) => sound && SOUNDS[name](arg);

  const check = async (full) => {
    const mine = ++run.current;
    setState("checking");
    const [verdict] = await Promise.all([Promise.resolve(onComplete?.(full)).catch(() => false), new Promise((done) => setTimeout(done, 1100))]);
    if (mine !== run.current) return; // the code was edited while it was being checked
    if (verdict === false) {
      setState("bad");
      play("bad");
      timer.current = setTimeout(() => {
        setCode("");
        setState("idle");
      }, 1300);
    } else {
      setState("ok");
      play("ok");
    }
  };

  const change = (e) => {
    const next = e.target.value.replace(/\D/g, "").slice(0, length);
    if (next === code) return;
    run.current++;
    clearTimeout(timer.current);
    if (next.length > code.length) play("type", next.length - 1);
    else {
      play("erase");
      setGhost({ at: next.length, digit: code[next.length], id: run.current });
    }
    setCode(next);
    if (next.length === length) check(next);
    else setState("idle");
  };

  const filled = code.length;
  const says = {
    idle: filled ? filled + " of " + length : "Enter the " + length + "-digit code",
    checking: "Checking",
    ok: "Code accepted",
    bad: "That code is not right",
  }[state];

  return (
    <label className="ui-otp" data-state={state} style={{ "--done": filled / length }}>
      <style>{css}</style>
      <span className="ui-otp-cells">
        <input
          value={code}
          inputMode="numeric"
          autoComplete="one-time-code"
          aria-label={label}
          onChange={change}
          onFocus={(e) => {
            setFocused(true);
            toEnd(e);
          }}
          onBlur={() => setFocused(false)}
          onClick={toEnd}
          onSelect={toEnd}
        />
        {Array.from({ length }, (_, i) => {
          const live = focused && state === "idle" && i === active;
          return (
            <span key={i} className="ui-otp-cell" aria-hidden="true" style={{ "--i": i }} data-filled={i < filled} data-active={live} data-split={length % 2 === 0 && length > 4 && i === length / 2}>
              {code[i] ? <b>{code[i]}</b> : live && <i className="ui-otp-caret" />}
              {ghost?.at === i && !code[i] && (
                <s key={ghost.id} className="ui-otp-ghost" onAnimationEnd={() => setGhost(null)}>
                  {ghost.digit}
                </s>
              )}
              <u className="ui-otp-pip" />
            </span>
          );
        })}
        {state === "checking" && <i className="ui-otp-scan" aria-hidden="true" />}
      </span>
      <span className="ui-otp-rail" aria-hidden="true" />
      <span className="ui-otp-status" aria-live="polite">
        <span key={says}>
          {state === "ok" && (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M2.5 7.5l3 3 6-6.5" />
            </svg>
          )}
          {says}
          {state === "checking" && (
            <span className="ui-otp-dots" aria-hidden="true">
              <i style={{ "--i": 0 }} /><i style={{ "--i": 1 }} /><i style={{ "--i": 2 }} />
            </span>
          )}
        </span>
      </span>
    </label>
  );
}
