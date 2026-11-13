// ElasticSwitch: the thumb stretches while you press and snaps across when you let go.
// You can also drag it: the thumb follows your finger, the track fills as it goes, it pulls like
// rubber past either end, and it lands on whichever side you let go of.
// Its mark changes from a circle (off) to a bar (on), so the state never depends on colour alone.
// Usage: <ElasticSwitch label="Notifications" defaultChecked onChange={(on) => setNotify(on)} />
import { useRef, useState } from "react";

const css = `
.ui-switch {
  --accent: var(--ui-accent, #1a4be0);
  --ink: var(--ui-ink, #111);
  --line: var(--ui-line, #e3e3e3);
  --muted: var(--ui-muted, #6b6b6b);
  display: inline-flex;
  align-items: center;
  gap: 40px;
  color: var(--ink);
  font: inherit;
  font-size: 16px;
  text-align: left;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
}
.ui-switch input { position: absolute; width: 1px; height: 1px; opacity: 0; }
.ui-switch-text { display: grid; gap: 2px; }
.ui-switch-text small { color: var(--muted); font-size: 13px; }
.ui-switch-track {
  position: relative;
  flex: none;
  width: 56px;
  height: 32px;
  border-radius: 16px;
  background: color-mix(in srgb, var(--muted) 45%, var(--line));
  touch-action: pan-y;
  transition: background .3s;
}
.ui-switch input:checked + .ui-switch-track { background: var(--accent); }
.ui-switch input:focus-visible + .ui-switch-track { outline: 2px solid var(--accent); outline-offset: 3px; }
.ui-switch-thumb {
  position: absolute;
  left: 3px;
  top: 3px;
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 13px;
  background: #fff;
  box-shadow: 0 2px 6px rgb(0 0 0 / .25);
  transition: left .45s cubic-bezier(.3, 1.5, .5, 1), width .25s cubic-bezier(.2, .8, .2, 1);
}
.ui-switch:active .ui-switch-thumb { width: 36px; }
.ui-switch input:checked + .ui-switch-track .ui-switch-thumb { left: 27px; }
.ui-switch:active input:checked + .ui-switch-track .ui-switch-thumb { left: 17px; }
.ui-switch-thumb::after {
  content: "";
  width: 8px;
  height: 8px;
  border: 1.5px solid #9a9a9a;
  border-radius: 5px;
  box-sizing: border-box;
  transition: width .3s, height .3s, border-color .3s, background .3s;
}
.ui-switch input:checked + .ui-switch-track .ui-switch-thumb::after { width: 2px; height: 10px; border-width: 1px; border-color: var(--accent); background: var(--accent); }
/* Dragging: the thumb is placed by --d (0 at off, 24 at on) and nothing lags behind the finger. */
.ui-switch[data-drag="true"] { cursor: grabbing; }
.ui-switch[data-drag="true"] input + .ui-switch-track { background: color-mix(in srgb, var(--accent) clamp(0%, calc(var(--d) / 24 * 100%), 100%), color-mix(in srgb, var(--muted) 45%, var(--line))); transition: none; }
.ui-switch[data-drag="true"] .ui-switch-thumb,
.ui-switch[data-drag="true"]:active input:checked + .ui-switch-track .ui-switch-thumb { left: calc(3px + var(--d) * .75px); width: 32px; transition: width .25s cubic-bezier(.2, .8, .2, 1); }
.ui-switch[data-drag="true"][data-lean="off"] input + .ui-switch-track .ui-switch-thumb::after { width: 8px; height: 8px; border-width: 1.5px; border-color: #9a9a9a; background: none; }
.ui-switch[data-drag="true"][data-lean="on"] input + .ui-switch-track .ui-switch-thumb::after { width: 2px; height: 10px; border-width: 1px; border-color: var(--accent); background: var(--accent); }
@media (prefers-reduced-motion: reduce) {
  :is(.ui-switch, .ui-switch *), :is(.ui-switch, .ui-switch *)::before, :is(.ui-switch, .ui-switch *)::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    transition-delay: 0s !important;
  }
}
`;

const TRAVEL = 24; // how far the thumb moves between off and on

export default function ElasticSwitch({ label = "Notifications", defaultChecked = true, onChange }) {
  const [on, setOn] = useState(defaultChecked);
  const [drag, setDrag] = useState(null); // thumb position while dragging, 0 to TRAVEL (and a little past)
  const grip = useRef(null);
  const dragged = useRef(false);

  const set = (next) => {
    if (next === on) return;
    setOn(next);
    onChange?.(next);
  };
  const down = (e) => {
    if (e.button) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    grip.current = { x: e.clientX, from: on ? TRAVEL : 0, moved: false };
  };
  const move = (e) => {
    const g = grip.current;
    if (!g) return;
    const dx = e.clientX - g.x;
    if (!g.moved && Math.abs(dx) < 3) return;
    g.moved = true;
    const raw = g.from + dx;
    // Past either end it keeps moving, but only a quarter as far: that is the rubber.
    setDrag(raw < 0 ? raw * 0.25 : raw > TRAVEL ? TRAVEL + (raw - TRAVEL) * 0.25 : raw);
  };
  const up = () => {
    const g = grip.current;
    grip.current = null;
    if (!g?.moved) return; // a plain tap: the label's own click toggles it
    dragged.current = true;
    setTimeout(() => (dragged.current = false), 0);
    set(drag > TRAVEL / 2);
    setDrag(null);
  };

  const lean = drag == null ? on : drag > TRAVEL / 2;
  return (
    <label
      className="ui-switch"
      data-drag={drag != null}
      data-lean={lean ? "on" : "off"}
      style={drag == null ? undefined : { "--d": Math.max(-3, Math.min(TRAVEL + 3, drag)) }}
      onClick={(e) => dragged.current && e.preventDefault()} // the click that ends a drag must not toggle it again
    >
      <style>{css}</style>
      <span className="ui-switch-text">
        {label}
        <small>{lean ? "On" : "Off"}</small>
      </span>
      <input type="checkbox" role="switch" checked={on} onChange={(e) => set(e.target.checked)} />
      <span className="ui-switch-track" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        <span className="ui-switch-thumb" />
      </span>
    </label>
  );
}
