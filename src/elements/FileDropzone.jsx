// FileDropzone: lifts when a file is dragged over it, then lists each file with a progress bar and a tick.
// Usage: <FileDropzone accept="image/*,.pdf" onFiles={(files) => upload(files)} />
// The progress bar is a visual stand-in. Drive it from your own upload if you need real progress.
import { useRef, useState } from "react";

const css = `
.ui-drop {
  --accent: var(--ui-accent, #1a4be0);
  --ink: var(--ui-ink, #111);
  --bg: var(--ui-bg, #fff);
  --soft: var(--ui-soft, #f4f4f4);
  --line: var(--ui-line, #e3e3e3);
  --muted: var(--ui-muted, #6b6b6b);
  --ok: var(--ui-success, #1a9a52);
  display: grid;
  gap: 8px;
  width: 300px;
  max-width: 100%;
  color: var(--ink);
  font: inherit;
  font-size: 14px;
  text-align: left;
}
.ui-drop-zone {
  display: grid;
  justify-items: center;
  gap: 4px;
  padding: 22px 16px;
  border: 1.5px dashed var(--line);
  border-radius: 16px;
  background: var(--bg);
  text-align: center;
  cursor: pointer;
  transition: border-color .2s, background .2s, scale .3s cubic-bezier(.34, 1.56, .64, 1);
}
.ui-drop-zone:hover { border-color: var(--muted); }
.ui-drop-zone:focus-within { border-color: var(--accent); box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 16%, transparent); }
.ui-drop-zone input { position: absolute; width: 1px; height: 1px; opacity: 0; }
.ui-drop-zone[data-over="true"] { border-style: solid; border-color: var(--accent); background: color-mix(in srgb, var(--accent) 8%, var(--bg)); scale: 1.03; }
.ui-drop-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  margin-bottom: 4px;
  border-radius: 12px;
  background: var(--soft);
  color: var(--ink);
  transition: background .2s, color .2s, translate .3s cubic-bezier(.34, 1.56, .64, 1);
}
.ui-drop-zone:hover .ui-drop-icon { translate: 0 -3px; }
.ui-drop-zone[data-over="true"] .ui-drop-icon { background: var(--accent); color: var(--ui-accent-ink, #fff); animation: ui-drop-hop .6s ease-in-out infinite alternate; }
.ui-drop-zone b { font-weight: 500; }
.ui-drop-zone u { color: var(--accent); text-underline-offset: 3px; }
.ui-drop-zone small { color: var(--muted); font-size: 13px; }
.ui-drop-file {
  position: relative;
  display: grid;
  grid-template-columns: 1fr auto 28px;
  align-items: center;
  gap: 10px;
  height: 44px;
  padding: 0 6px 0 14px;
  border-radius: 12px;
  background: var(--soft);
  overflow: hidden;
  animation: ui-drop-in .4s cubic-bezier(.3, 1.3, .5, 1);
}
.ui-drop-file span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-drop-file small { color: var(--muted); font-size: 12px; font-variant-numeric: tabular-nums; }
.ui-drop-bar { position: absolute; left: 0; bottom: 0; height: 2px; width: 100%; background: var(--accent); transform-origin: 0 50%; animation: ui-drop-load 1.4s cubic-bezier(.6, 0, .3, 1) forwards; }
.ui-drop-file[data-done="true"] .ui-drop-bar { opacity: 0; transition: opacity .4s; }
.ui-drop-file button {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: none;
  color: var(--muted);
  cursor: pointer;
}
.ui-drop-file button:hover { background: var(--bg); color: var(--ink); }
.ui-drop-file[data-done="true"] button:not(:hover) { color: var(--ok); }
.ui-drop-file path { stroke-dasharray: 16; animation: ui-drop-draw .3s; }
@keyframes ui-drop-hop { to { translate: 0 -6px; } }
@keyframes ui-drop-in { from { opacity: 0; translate: 0 -10px; scale: .96; } }
@keyframes ui-drop-load { from { scale: 0 1; } }
@keyframes ui-drop-draw { from { stroke-dashoffset: 16; } }
@media (prefers-reduced-motion: reduce) {
  :is(.ui-drop, .ui-drop *), :is(.ui-drop, .ui-drop *)::before, :is(.ui-drop, .ui-drop *)::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    transition-delay: 0s !important;
  }
}
`;

const size = (bytes) => (bytes < 1e6 ? Math.max(1, Math.round(bytes / 1e3)) + " KB" : (bytes / 1e6).toFixed(1) + " MB");

export default function FileDropzone({ accept, hint = "PNG, JPG or PDF, up to 10 MB", onFiles }) {
  const [over, setOver] = useState(false);
  const [files, setFiles] = useState([]);
  const depth = useRef(0);
  const next = useRef(0);

  const add = (list) => {
    const picked = [...list];
    if (!picked.length) return;
    const rows = picked.map((f) => ({ id: next.current++, name: f.name, size: f.size, done: false }));
    setFiles((all) => [...rows, ...all].slice(0, 3));
    onFiles?.(picked);
  };
  const patch = (id, change) => setFiles((all) => all.map((f) => (f.id === id ? { ...f, ...change } : f)));

  return (
    <div className="ui-drop">
      <style>{css}</style>
      <label
        className="ui-drop-zone"
        data-over={over}
        onDragEnter={() => {
          depth.current++;
          setOver(true);
        }}
        onDragLeave={() => --depth.current <= 0 && setOver(false)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          depth.current = 0;
          setOver(false);
          add(e.dataTransfer.files);
        }}
      >
        <input type="file" multiple accept={accept} onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
        <span className="ui-drop-icon" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13V4M6.5 7.5L10 4l3.5 3.5M4 13v3h12v-3" />
          </svg>
        </span>
        <b>{over ? "Drop to upload" : <>Drop files here or <u>browse</u></>}</b>
        <small>{hint}</small>
      </label>
      {files.map((f) => (
        <div key={f.id} className="ui-drop-file" data-done={f.done}>
          <span>{f.name}</span>
          <small>{size(f.size)}</small>
          <button type="button" aria-label={"Remove " + f.name} onClick={() => setFiles((all) => all.filter((x) => x.id !== f.id))}>
            <svg key={String(f.done)} width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d={f.done ? "M4 9.5l3.2 3.2L14 5.8" : "M5 5l8 8M13 5l-8 8"} />
            </svg>
          </button>
          <i className="ui-drop-bar" onAnimationEnd={() => patch(f.id, { done: true })} />
        </div>
      ))}
    </div>
  );
}
