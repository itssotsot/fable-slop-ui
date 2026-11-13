// PressButton: a button with real depth, held up by a cat. The cat peeks over the top edge with
// both paws on it. Hover and it perks up and chirps; press and it ducks, squeezes its eyes shut
// and lets out a little mew, then pops back up with a heart.
// The sounds are made in the browser (no audio files) and are picked at random each time.
// Usage: <PressButton onClick={save}>Save changes</PressButton>
// Pass sound={false} for a silent cat. Browsers only allow sound after the first click or key press on the page.
import { useRef, useState } from "react";

const css = `
.ui-pet {
  --accent: var(--ui-accent, #1a4be0);
  --on-accent: var(--ui-accent-ink, #fff);
  --edge: color-mix(in srgb, var(--accent) 62%, #000);
  --fur: #f4a24a;
  --fur-dark: #d97f2a;
  position: relative;
  display: inline-grid;
  justify-items: center;
  font: inherit;
  user-select: none;
  -webkit-user-select: none;
}
.ui-pet-cat {
  position: relative;
  display: block;
  margin-bottom: 3px;
  overflow: visible;
  transform-origin: 50% 100%;
  transition: translate .35s cubic-bezier(.34, 1.56, .64, 1), scale .35s cubic-bezier(.34, 1.56, .64, 1);
  pointer-events: none;
}
.ui-pet:hover .ui-pet-cat { translate: 0 -6px; }
.ui-pet:has(.ui-press:active) .ui-pet-cat { translate: 0 11px; scale: 1.06 .9; transition-duration: .08s; }
.ui-pet-ear { transform-box: fill-box; transform-origin: 50% 100%; }
.ui-pet:hover .ui-pet-ear { animation: ui-pet-twitch .5s 2; }
.ui-pet-ear + .ui-pet-ear { animation-delay: .12s; }
.ui-pet-open { transform-box: fill-box; transform-origin: center; animation: ui-pet-blink 4.2s infinite; }
.ui-pet-pupil { transform-box: fill-box; transform-origin: center; transition: scale .3s cubic-bezier(.34, 1.56, .64, 1); }
.ui-pet:hover .ui-pet-pupil { scale: 1.28; }
.ui-pet-shut { opacity: 0; }
.ui-pet:has(.ui-press:active) .ui-pet-open { opacity: 0; }
.ui-pet:has(.ui-press:active) .ui-pet-shut { opacity: 1; }
.ui-pet-blush { opacity: .0; transition: opacity .3s; }
.ui-pet:hover .ui-pet-blush { opacity: .7; }
.ui-pet-tail {
  position: absolute;
  right: -22px;
  bottom: 2px;
  overflow: visible;
  transform-origin: 10% 90%;
  animation: ui-pet-wag 2.4s ease-in-out infinite;
  pointer-events: none;
}
.ui-pet:hover .ui-pet-tail { animation-duration: .5s; }
.ui-pet-heart {
  position: absolute;
  left: calc(50% + var(--x));
  top: 0;
  color: #ff5c8a;
  font-size: 16px;
  line-height: 1;
  pointer-events: none;
  animation: ui-pet-heart 1s ease-out forwards;
}

.ui-press {
  position: relative;
  z-index: 1;
  padding: 0;
  border: 0;
  border-radius: 14px;
  background: var(--edge);
  font: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.ui-press:focus-visible { outline: 2px solid var(--accent); outline-offset: 10px; }
.ui-press-top {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 28px;
  border-radius: 14px;
  background: var(--accent);
  color: var(--on-accent);
  font-size: 16px;
  font-weight: 500;
  translate: 0 -6px;
  transition: translate .3s cubic-bezier(.34, 1.56, .64, 1);
}
.ui-press:hover .ui-press-top { translate: 0 -8px; }
.ui-press:active .ui-press-top { translate: 0 -1px; transition-duration: .06s; }
.ui-press-clip { position: absolute; inset: 0; border-radius: inherit; overflow: hidden; pointer-events: none; }
.ui-press-ring {
  position: absolute;
  left: var(--rx);
  top: var(--ry);
  width: 12px;
  height: 12px;
  margin: -6px;
  border-radius: 50%;
  background: currentColor;
  opacity: .3;
  animation: ui-press-ring .6s ease-out forwards;
}
/* The paws sit on the button's top edge and ride up and down with it. */
.ui-press-paw {
  position: absolute;
  top: -6px;
  left: calc(50% - 31px);
  width: 17px;
  height: 13px;
  border-radius: 9px 9px 7px 7px;
  background:
    linear-gradient(var(--fur-dark), var(--fur-dark)) 5px 100% / 1.5px 5px no-repeat,
    linear-gradient(var(--fur-dark), var(--fur-dark)) 10.5px 100% / 1.5px 5px no-repeat,
    var(--fur);
  box-shadow: inset 0 -2px 0 rgb(0 0 0 / .1), 0 2px 3px rgb(0 0 0 / .25);
  transition: translate .3s cubic-bezier(.34, 1.56, .64, 1), scale .2s;
  pointer-events: none;
}
.ui-press-paw + .ui-press-paw { left: calc(50% + 14px); }
.ui-press:hover .ui-press-paw { translate: -2px 0; }
.ui-press:hover .ui-press-paw + .ui-press-paw { translate: 2px 0; }
.ui-press:active .ui-press-paw { scale: 1.12 .82; }

@keyframes ui-press-ring { to { scale: 24; opacity: 0; } }
@keyframes ui-pet-twitch { 50% { rotate: -10deg; } }
@keyframes ui-pet-blink { 0%, 46%, 50%, 100% { scale: 1 1; } 48% { scale: 1 .1; } }
@keyframes ui-pet-wag { 0%, 100% { rotate: -8deg; } 50% { rotate: 16deg; } }
@keyframes ui-pet-heart {
  0% { opacity: 0; scale: .2; translate: 0 6px; }
  25% { opacity: 1; scale: 1.2; }
  100% { opacity: 0; scale: .9; translate: var(--drift) -44px; rotate: var(--spin); }
}
@media (prefers-reduced-motion: reduce) {
  .ui-press-ring, .ui-pet-heart { display: none; }
  :is(.ui-pet, .ui-pet *), :is(.ui-pet, .ui-pet *)::before, :is(.ui-pet, .ui-pet *)::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    transition-delay: 0s !important;
  }
}
`;

// A tiny synth. Every sound is one or two sine "voices" whose pitch slides, which is what makes them sound cute.
let audio;
function voice(pitches, length, volume, delay = 0) {
  try {
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return; // not allowed yet
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === "suspended") audio.resume();
    const start = audio.currentTime + delay;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "sine";
    pitches.forEach((hz, i) => {
      if (i === 0) osc.frequency.setValueAtTime(hz, start);
      else osc.frequency.exponentialRampToValueAtTime(hz, start + (length * i) / (pitches.length - 1));
    });
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
    osc.connect(gain).connect(audio.destination);
    osc.start(start);
    osc.stop(start + length + 0.03);
  } catch {
    // No audio available: stay quiet.
  }
}
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const wobble = () => 0.92 + Math.random() * 0.2; // each sound lands on a slightly different pitch
const HOVER_SOUNDS = [
  (k) => voice([820 * k, 1250 * k], 0.09, 0.05), // "pip?"
  (k) => voice([1100 * k, 900 * k, 1300 * k], 0.12, 0.05), // "prr-ip"
  (k) => {
    voice([980 * k, 1180 * k], 0.06, 0.04);
    voice([1180 * k, 1420 * k], 0.07, 0.04, 0.08);
  }, // "pi-pip"
];
const CLICK_SOUNDS = [
  (k) => voice([700 * k, 1150 * k, 780 * k], 0.26, 0.09), // "mew"
  (k) => voice([900 * k, 1500 * k, 1000 * k], 0.2, 0.08), // "mii!"
  (k) => {
    voice([760 * k, 1040 * k], 0.1, 0.08);
    voice([1040 * k, 1380 * k, 1100 * k], 0.16, 0.08, 0.11);
  }, // "mr-rao"
  (k) => {
    voice([1300 * k, 1700 * k], 0.07, 0.07);
    voice([1500 * k, 1900 * k], 0.07, 0.07, 0.09);
    voice([1700 * k, 2100 * k], 0.09, 0.07, 0.18);
  }, // "pip pip pip!"
];

export default function PressButton({ children = "Press me", sound = true, onClick, onPointerEnter, ...props }) {
  const [rings, setRings] = useState([]);
  const [hearts, setHearts] = useState([]);
  const next = useRef(0);

  const ripple = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const ring = { id: next.current++, x: e.clientX - r.left, y: e.clientY - r.top };
    setRings((all) => [...all, ring]);
  };
  const enter = (e) => {
    if (sound && e.pointerType === "mouse") pick(HOVER_SOUNDS)(wobble());
    onPointerEnter?.(e);
  };
  const click = (e) => {
    if (sound) pick(CLICK_SOUNDS)(wobble());
    const id = next.current++;
    setHearts((all) => [...all, { id, x: (id % 5) * 9 - 18, drift: ((id * 7) % 30) - 15, spin: ((id * 13) % 50) - 25 }].slice(-6));
    onClick?.(e);
  };

  return (
    <span className="ui-pet">
      <style>{css}</style>
      {hearts.map((h) => (
        <i key={h.id} className="ui-pet-heart" aria-hidden="true" style={{ "--x": h.x + "px", "--drift": h.drift + "px", "--spin": h.spin + "deg" }} onAnimationEnd={() => setHearts((all) => all.filter((x) => x.id !== h.id))}>
          ♥
        </i>
      ))}
      <svg className="ui-pet-tail" width="30" height="40" viewBox="0 0 30 40" fill="none" aria-hidden="true">
        <path d="M4 38C16 36 24 26 21 14 20 9 23 5 26 4" stroke="#f4a24a" strokeWidth="7" strokeLinecap="round" />
        <path d="M21.5 15C20.5 10 23 5.5 26 4" stroke="#d97f2a" strokeWidth="7" strokeLinecap="round" />
      </svg>
      <svg className="ui-pet-cat" width="72" height="48" viewBox="0 0 72 48" aria-hidden="true">
        <path className="ui-pet-ear" d="M11 28L12 4 31 17z" fill="#f4a24a" />
        <path className="ui-pet-ear" d="M61 28L60 4 41 17z" fill="#f4a24a" />
        <path d="M15 21L15.5 10 24 16z" fill="#ffb7c2" />
        <path d="M57 21L56.5 10 48 16z" fill="#ffb7c2" />
        <ellipse cx="36" cy="35" rx="27" ry="20" fill="#f4a24a" />
        <path d="M36 16v6M29 17l1.5 5M43 17l-1.5 5" stroke="#d97f2a" strokeWidth="2.4" strokeLinecap="round" />
        <ellipse cx="36" cy="41" rx="11" ry="8" fill="#ffe7cc" />
        <ellipse className="ui-pet-blush" cx="17" cy="38" rx="5" ry="3" fill="#ff8fa3" />
        <ellipse className="ui-pet-blush" cx="55" cy="38" rx="5" ry="3" fill="#ff8fa3" />
        <g className="ui-pet-open">
          <circle className="ui-pet-pupil" cx="25" cy="32" r="3.8" fill="#2a1c14" />
          <circle className="ui-pet-pupil" cx="47" cy="32" r="3.8" fill="#2a1c14" />
          <circle cx="23.8" cy="30.6" r="1.3" fill="#fff" />
          <circle cx="45.8" cy="30.6" r="1.3" fill="#fff" />
        </g>
        <path className="ui-pet-shut" d="M21 29.5l6 2.5-6 2.5M51 29.5l-6 2.5 6 2.5" fill="none" stroke="#2a1c14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M34 36.5h4l-2 2.3z" fill="#ff7d92" />
        <path d="M36 38.8q-2.5 3-5.5 1M36 38.8q2.5 3 5.5 1" fill="none" stroke="#2a1c14" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M14 34l-9-2M14 37l-9 1M58 34l9-2M58 37l9 1" stroke="#fff" strokeOpacity=".8" strokeWidth="1" strokeLinecap="round" />
      </svg>
      <button type="button" className="ui-press" onClick={click} onPointerEnter={enter} {...props}>
        <span className="ui-press-top" onPointerDown={ripple}>
          <span className="ui-press-clip" aria-hidden="true">
            {rings.map((ring) => (
              <i key={ring.id} className="ui-press-ring" style={{ "--rx": ring.x + "px", "--ry": ring.y + "px" }} onAnimationEnd={() => setRings((all) => all.filter((r) => r.id !== ring.id))} />
            ))}
          </span>
          <i className="ui-press-paw" aria-hidden="true" />
          <i className="ui-press-paw" aria-hidden="true" />
          {children}
        </span>
      </button>
    </span>
  );
}
