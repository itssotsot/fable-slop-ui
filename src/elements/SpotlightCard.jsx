// SpotlightCard: a card that is alive under the cursor. A light trails the pointer and
//   - leans the card toward it, with the icon, title and text floating at different depths
//   - sets the nearest stretch of border glowing and throws a coloured shadow the same way
//   - uncovers a dot grid whose dots swell the closer they are to the light
//   - tints the title where the light crosses it, and leaves a trail of sparks behind
// Click anywhere on it for a shockwave.
// Usage: <SpotlightCard title="Spotlight card">Any content.</SpotlightCard>
import { useEffect, useRef, useState } from "react";

const css = `
.ui-spot {
  --accent: var(--ui-accent, #1a4be0);
  --ink: var(--ui-ink, #111);
  --bg: var(--ui-bg, #fff);
  --soft: var(--ui-soft, #f4f4f4);
  --line: var(--ui-line, #e3e3e3);
  --muted: var(--ui-muted, #6b6b6b);
  --mx: 50%;
  --my: 50%;
  --px: 0; /* pointer position from -1 to 1, left to right */
  --py: 0; /* and top to bottom */
  position: relative;
  width: 280px;
  max-width: 100%;
  padding: 22px;
  border: 1px solid var(--line);
  border-radius: 20px;
  background: var(--bg);
  color: var(--ink);
  font: inherit;
  text-align: left;
  box-sizing: border-box;
  transform: perspective(700px) rotateX(calc(var(--py) * -9deg)) rotateY(calc(var(--px) * 11deg));
  transform-style: preserve-3d;
  box-shadow: calc(var(--px) * 18px) calc(var(--py) * 18px + 14px) 44px -22px color-mix(in srgb, var(--accent) calc(var(--lit, 0) * 85%), transparent);
  transition: box-shadow .4s;
  cursor: crosshair;
  -webkit-tap-highlight-color: transparent;
}

/* Border: brightest where the light is. */
.ui-spot::after {
  content: "";
  position: absolute;
  inset: -1px;
  padding: 2px;
  border-radius: inherit;
  background: radial-gradient(240px circle at var(--mx) var(--my), var(--accent), transparent 70%);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0);
  opacity: var(--lit, 0);
  pointer-events: none;
  transition: opacity .4s;
}

/* Everything that must stay inside the rounded corners. */
.ui-spot-fx {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(260px circle at var(--mx) var(--my), color-mix(in srgb, var(--accent) calc(var(--lit, 0) * 16%), transparent), transparent 70%);
  overflow: hidden;
  pointer-events: none;
}
.ui-spot-dots {
  position: absolute;
  inset: 0;
  background: radial-gradient(var(--accent) var(--dot), transparent calc(var(--dot) + .6px)) 7px 7px / 14px 14px;
  -webkit-mask: radial-gradient(var(--reach) circle at var(--mx) var(--my), #000, transparent);
  mask: radial-gradient(var(--reach) circle at var(--mx) var(--my), #000, transparent);
  opacity: calc(var(--lit, 0) * var(--strength));
  transition: opacity .4s;
}
.ui-spot-dots:nth-child(1) { --dot: 1px; --reach: 190px; --strength: .4; }
.ui-spot-dots:nth-child(2) { --dot: 1.7px; --reach: 105px; --strength: .7; }
.ui-spot-dots:nth-child(3) { --dot: 2.6px; --reach: 52px; --strength: 1; }
.ui-spot-spark {
  position: absolute;
  left: var(--x);
  top: var(--y);
  width: var(--s);
  height: var(--s);
  margin: calc(var(--s) / -2);
  background: var(--accent);
  clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%);
  animation: ui-spot-spark .7s ease-out forwards;
}
.ui-spot-ring {
  position: absolute;
  left: var(--x);
  top: var(--y);
  width: 0;
  height: 0;
  border: 2px solid var(--accent);
  border-radius: 50%;
  box-shadow: 0 0 18px var(--accent), inset 0 0 18px color-mix(in srgb, var(--accent) 50%, transparent);
  box-sizing: border-box;
  animation: ui-spot-ring .8s cubic-bezier(.2, .7, .3, 1) forwards;
}

/* Content floats above the surface, each piece a little higher. */
.ui-spot-icon {
  position: relative;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  margin-bottom: 18px;
  border-radius: 13px;
  background: var(--soft);
  color: var(--accent);
  transform: translateZ(calc(var(--lit, 0) * 46px)) rotate(calc(var(--px) * 24deg));
  transition: background .3s, color .3s;
}
.ui-spot[data-lit="true"] .ui-spot-icon { background: var(--accent); color: var(--ui-accent-ink, #fff); }
.ui-spot[data-lit="true"] .ui-spot-icon svg { animation: ui-spot-spin 5s linear infinite; }
.ui-spot h3 {
  position: relative;
  width: fit-content;
  margin: 0 0 6px;
  background: radial-gradient(90px circle at var(--tx, -200px) var(--ty, -200px), color-mix(in srgb, var(--accent) calc(var(--lit, 0) * 100%), var(--ink)), var(--ink) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -.01em;
  transform: translateZ(calc(var(--lit, 0) * 30px));
}
.ui-spot p {
  position: relative;
  margin: 0;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.5;
  transform: translateZ(calc(var(--lit, 0) * 16px));
}

@keyframes ui-spot-spark {
  0% { scale: 0; rotate: 0deg; opacity: 1; }
  35% { scale: 1; opacity: 1; }
  100% { scale: 0; rotate: 180deg; translate: var(--dx) var(--dy); opacity: 0; }
}
@keyframes ui-spot-ring { from { opacity: 1; } to { width: 640px; height: 640px; margin: -320px; opacity: 0; } }
@keyframes ui-spot-spin { to { rotate: 360deg; } }
@media (prefers-reduced-motion: reduce) {
  .ui-spot { transform: none; }
  .ui-spot-icon, .ui-spot h3, .ui-spot p { transform: none; }
  .ui-spot-spark, .ui-spot-ring { display: none; }
  .ui-spot[data-lit="true"] .ui-spot-icon svg { animation: none; }
}
`;

const calm = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function SpotlightCard({ title = "Spotlight card", children = "Sweep the cursor across the card, then click. The light, the border and the dots all follow you.", icon }) {
  const card = useRef(null);
  const heading = useRef(null);
  const light = useRef({ x: 0, y: 0, tx: 0, ty: 0, lit: 0, goal: 0, frame: 0, sparkX: 0, sparkY: 0 });
  const next = useRef(0);
  const [lit, setLit] = useState(false);
  const [sparks, setSparks] = useState([]);
  const [rings, setRings] = useState([]);

  useEffect(() => () => cancelAnimationFrame(light.current.frame), []);

  // The light eases after the pointer instead of sticking to it, which is what makes it feel soft.
  const run = () => {
    const l = light.current;
    cancelAnimationFrame(l.frame);
    const step = () => {
      const node = card.current;
      if (!node) return;
      const ease = calm() ? 1 : 0.16;
      l.x += (l.tx - l.x) * ease;
      l.y += (l.ty - l.y) * ease;
      l.lit += (l.goal - l.lit) * (calm() ? 1 : 0.12);
      const w = node.offsetWidth;
      const h = node.offsetHeight;
      node.style.setProperty("--mx", l.x.toFixed(1) + "px");
      node.style.setProperty("--my", l.y.toFixed(1) + "px");
      node.style.setProperty("--px", (((l.x / w) * 2 - 1) * l.lit).toFixed(3));
      node.style.setProperty("--py", (((l.y / h) * 2 - 1) * l.lit).toFixed(3));
      node.style.setProperty("--lit", l.lit.toFixed(3));
      if (heading.current) {
        node.style.setProperty("--tx", (l.x - heading.current.offsetLeft).toFixed(1) + "px");
        node.style.setProperty("--ty", (l.y - heading.current.offsetTop).toFixed(1) + "px");
      }
      const resting = Math.abs(l.tx - l.x) < 0.3 && Math.abs(l.ty - l.y) < 0.3 && Math.abs(l.goal - l.lit) < 0.004;
      if (!resting) l.frame = requestAnimationFrame(step);
    };
    l.frame = requestAnimationFrame(step);
  };

  const at = (e) => {
    const r = card.current.getBoundingClientRect();
    // Scale back to layout pixels, because the tilt changes the size of the box on screen.
    return { x: ((e.clientX - r.left) / r.width) * card.current.offsetWidth, y: ((e.clientY - r.top) / r.height) * card.current.offsetHeight };
  };

  const follow = (e) => {
    const l = light.current;
    const p = at(e);
    if (!l.goal) {
      // First contact: start the light where the pointer came in, not in the middle.
      l.x = p.x;
      l.y = p.y;
      setLit(true);
    }
    l.tx = p.x;
    l.ty = p.y;
    l.goal = 1;
    run();
    if (!calm() && Math.hypot(p.x - l.sparkX, p.y - l.sparkY) > 30) {
      l.sparkX = p.x;
      l.sparkY = p.y;
      const id = next.current++;
      const spark = { id, x: p.x, y: p.y, s: 7 + (id % 4) * 3, dx: ((id * 37) % 40) - 20, dy: ((id * 53) % 40) - 10 };
      setSparks((all) => [...all, spark].slice(-14));
    }
  };
  const leave = () => {
    const l = light.current;
    l.goal = 0;
    setLit(false);
    run();
  };
  const burst = (e) => {
    const p = at(e);
    setRings((all) => [...all, { id: next.current++, ...p }].slice(-4));
  };

  return (
    <div ref={card} className="ui-spot" data-lit={lit} onPointerMove={follow} onPointerLeave={leave} onPointerCancel={leave} onPointerDown={burst}>
      <style>{css}</style>
      <span className="ui-spot-fx" aria-hidden="true">
        <i className="ui-spot-dots" />
        <i className="ui-spot-dots" />
        <i className="ui-spot-dots" />
        {sparks.map((s) => (
          <i
            key={s.id}
            className="ui-spot-spark"
            style={{ "--x": s.x + "px", "--y": s.y + "px", "--s": s.s + "px", "--dx": s.dx + "px", "--dy": s.dy + "px" }}
            onAnimationEnd={() => setSparks((all) => all.filter((x) => x.id !== s.id))}
          />
        ))}
        {rings.map((r) => (
          <i key={r.id} className="ui-spot-ring" style={{ "--x": r.x + "px", "--y": r.y + "px" }} onAnimationEnd={() => setRings((all) => all.filter((x) => x.id !== r.id))} />
        ))}
      </span>
      <div className="ui-spot-icon" aria-hidden="true">
        {icon ?? (
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 2.5v3M11 16.5v3M2.5 11h3M16.5 11h3M5 5l2 2M15 15l2 2M17 5l-2 2M7 15l-2 2" />
          </svg>
        )}
      </div>
      <h3 ref={heading}>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
