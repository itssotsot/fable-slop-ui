// Backdrop: the page background. The sheet of paper is alive: hundreds of biro strokes drift along
// an invisible current that never repeats. The pointer stirs them into a whirlpool, scrolling drags
// the whole current along, and a click anywhere drops a splash of accent ink.
// It reads its colours from --p-ink and --ui-accent, so it follows the theme and the accent picker.
import { useEffect, useRef } from "react";

const calm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function Backdrop() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    const still = calm();
    let w = 0;
    let h = 0;
    let frame = 0;
    let tick = 0;
    let time = Math.random() * 100;
    let ink = "#111";
    let accent = "#1a4be0";
    let strokes = [];
    const pointer = { x: -999, y: -999, vx: 0, vy: 0, on: false };
    const scroll = { y: scrollY, v: 0 };

    const colours = () => {
      // The theme colours are blends, so let the browser work them out on the canvas element itself.
      const look = getComputedStyle(canvas);
      ink = look.color || ink;
      accent = look.outlineColor || accent;
    };

    const spawn = (s = {}, x = Math.random() * w, y = Math.random() * h) => {
      s.x = s.px = x;
      s.y = s.py = y;
      s.vx = s.vy = 0;
      s.life = 80 + Math.random() * 260;
      s.accent = Math.random() < 0.3;
      s.width = s.accent ? 1 + Math.random() * 1.6 : 0.6 + Math.random() * 0.9;
      s.speed = 0.7 + Math.random() * 1.5;
      s.splash = false;
      return s;
    };

    const resize = () => {
      const ratio = Math.min(2, devicePixelRatio || 1);
      w = innerWidth;
      h = innerHeight;
      canvas.width = w * ratio;
      canvas.height = h * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.lineCap = "round";
      const count = Math.min(420, Math.round((w * h) / 3600));
      strokes = Array.from({ length: count }, () => spawn());
      if (still) settle();
    };

    // The current: a few slow waves laid over each other. Scrolling slides the page through it.
    const angle = (x, y) => {
      const sy = y + scroll.y * 0.35;
      return (
        Math.sin(x * 0.0023 + time * 0.21) * Math.cos(sy * 0.0019 - time * 0.16) * 4.2 +
        Math.sin((x + sy) * 0.0011 + time * 0.09) * 1.6 +
        Math.cos(x * 0.006 - sy * 0.004 + time * 0.3) * 0.5
      );
    };

    const step = () => {
      // Fade what is already drawn instead of clearing it, so every stroke leaves a tail.
      ctx.globalCompositeOperation = "destination-out";
      ctx.globalAlpha = 0.09;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";
      move(1);
    };

    const move = (fade) => {
      for (const s of strokes) {
        const a = angle(s.x, s.y);
        let ax = Math.cos(a) * s.speed;
        let ay = Math.sin(a) * s.speed - scroll.v * 0.25;
        if (pointer.on) {
          const dx = s.x - pointer.x;
          const dy = s.y - pointer.y;
          const d = Math.hypot(dx, dy);
          if (d < 240 && d > 1) {
            const pull = (1 - d / 240) ** 2;
            // Spin around the pointer, lean away from it a little, and get dragged along with it.
            ax += (-dy / d) * pull * 5 + (dx / d) * pull * 1.2 + pointer.vx * pull * 0.3;
            ay += (dx / d) * pull * 5 + (dy / d) * pull * 1.2 + pointer.vy * pull * 0.3;
          }
        }
        const grip = s.splash ? 0.03 : 0.12;
        s.vx += (ax - s.vx) * grip;
        s.vy += (ay - s.vy) * grip;
        s.px = s.x;
        s.py = s.y;
        s.x += s.vx;
        s.y += s.vy;
        s.life -= 1;

        const end = Math.min(1, s.life / 30);
        ctx.globalAlpha = (s.accent ? 0.75 : 0.26) * Math.max(0, end) * fade;
        ctx.strokeStyle = s.accent ? accent : ink;
        ctx.lineWidth = s.width * (s.splash ? 1.6 : 1);
        ctx.beginPath();
        ctx.moveTo(s.px, s.py);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();

        if (s.life <= 0 || s.x < -40 || s.x > w + 40 || s.y < -40 || s.y > h + 40) {
          if (s.extra) s.dead = true;
          else spawn(s);
        }
      }
      if (strokes.some((s) => s.dead)) strokes = strokes.filter((s) => !s.dead);
    };

    // Reduced motion: draw the current once, as a still drawing.
    const settle = () => {
      colours();
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < 90; i++) move(0.5);
    };

    const loop = () => {
      frame = requestAnimationFrame(loop);
      if (tick++ % 4 === 0) colours();
      time += 0.016;
      scroll.v += (scrollY - scroll.y - scroll.v) * 0.2;
      scroll.y = scrollY;
      scroll.v *= 0.9;
      pointer.vx *= 0.85;
      pointer.vy *= 0.85;
      step();
    };

    const onMove = (e) => {
      if (pointer.on) {
        pointer.vx = e.clientX - pointer.x;
        pointer.vy = e.clientY - pointer.y;
      }
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.on = true;
    };
    const onLeave = () => (pointer.on = false);
    const onDown = (e) => {
      // A splash: a ring of accent strokes thrown outward, which the current then carries off.
      for (let i = 0; i < 36; i++) {
        const s = spawn({}, e.clientX, e.clientY);
        const a = (i / 36) * Math.PI * 2 + Math.random() * 0.3;
        const force = 5 + Math.random() * 9;
        s.vx = Math.cos(a) * force;
        s.vy = Math.sin(a) * force;
        s.accent = true;
        s.splash = true;
        s.extra = true;
        s.width = 1.2 + Math.random() * 1.8;
        s.life = 50 + Math.random() * 60;
        strokes.push(s);
      }
    };
    const onVisible = () => {
      cancelAnimationFrame(frame);
      if (!document.hidden && !still) frame = requestAnimationFrame(loop);
    };

    colours();
    resize();
    addEventListener("resize", resize);
    if (!still) {
      addEventListener("pointermove", onMove, { passive: true });
      addEventListener("pointerdown", onDown, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);
      document.addEventListener("visibilitychange", onVisible);
      frame = requestAnimationFrame(loop);
    }
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("resize", resize);
      removeEventListener("pointermove", onMove);
      removeEventListener("pointerdown", onDown);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return <canvas ref={ref} className="backdrop" aria-hidden="true" />;
}
