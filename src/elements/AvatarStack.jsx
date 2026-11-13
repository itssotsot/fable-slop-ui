// AvatarStack: overlapping avatars that spread apart when you reach for them, each lifting to show its name.
// Usage: <AvatarStack people={[{ name: "Ana", color: "#1a4be0" }]} extra={3} onSelect={(name) => open(name)} />
// Give a person an `src` to show a photo. The initial stays underneath as a fallback while it loads or if it fails.
const css = `
.ui-avatars {
  --accent: var(--ui-accent, #1a4be0);
  --ink: var(--ui-ink, #111);
  --bg: var(--ui-bg, #fff);
  --soft: var(--ui-soft, #f4f4f4);
  display: inline-flex;
  align-items: center;
  padding-left: 14px;
  font: inherit;
}
.ui-avatar {
  position: relative;
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  margin-left: -14px;
  padding: 0;
  border: 3px solid var(--bg);
  border-radius: 50%;
  background: var(--c, var(--soft));
  overflow: visible;
  color: #fff;
  font: inherit;
  font-size: 16px;
  font-weight: 600;
  box-sizing: border-box;
  cursor: pointer;
  transition: margin .45s cubic-bezier(.3, 1.4, .5, 1) calc(var(--i) * 25ms), translate .3s cubic-bezier(.34, 1.56, .64, 1), scale .3s cubic-bezier(.34, 1.56, .64, 1);
  -webkit-tap-highlight-color: transparent;
}
.ui-avatars:hover .ui-avatar,
.ui-avatars:focus-within .ui-avatar { margin-left: 2px; }
.ui-avatar:hover,
.ui-avatar:focus-visible { z-index: 1; translate: 0 -6px; scale: 1.1; outline: 0; }
.ui-avatar:focus-visible { box-shadow: 0 0 0 2px var(--accent); }
.ui-avatar::before {
  content: attr(data-name);
  position: absolute;
  left: 50%;
  bottom: calc(100% + 8px);
  padding: 4px 9px;
  border-radius: 7px;
  background: var(--ink);
  color: var(--bg);
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  opacity: 0;
  translate: -50% 4px;
  pointer-events: none;
  transition: opacity .15s, translate .25s cubic-bezier(.34, 1.56, .64, 1);
}
.ui-avatar:hover::before,
.ui-avatar:focus-visible::before { opacity: 1; translate: -50% 0; }
.ui-avatar img { position: absolute; inset: 0; width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
.ui-avatar[data-more] { background: var(--soft); color: var(--ink); font-size: 14px; }
@media (prefers-reduced-motion: reduce) {
  :is(.ui-avatars, .ui-avatars *), :is(.ui-avatars, .ui-avatars *)::before, :is(.ui-avatars, .ui-avatars *)::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    transition-delay: 0s !important;
  }
}
`;

const PEOPLE = [
  { name: "Ana", color: "#1a4be0" },
  { name: "Ben", color: "#c8553d" },
  { name: "Chloe", color: "#5b7553" },
  { name: "Dev", color: "#b97400" },
  { name: "Emi", color: "#2b7a78" },
];

export default function AvatarStack({ people = PEOPLE, extra = 3, onSelect }) {
  return (
    <div className="ui-avatars" role="group" aria-label="People">
      <style>{css}</style>
      {people.map((person, i) => (
        <button
          key={person.name}
          type="button"
          className="ui-avatar"
          aria-label={person.name}
          data-name={person.name}
          style={{ "--i": i, "--c": person.color }}
          onClick={() => onSelect?.(person.name)}
        >
          {person.name[0]}
          {person.src && <img src={person.src} alt="" loading="lazy" onError={(e) => e.currentTarget.remove()} />}
        </button>
      ))}
      {extra > 0 && (
        <button type="button" className="ui-avatar" data-more data-name={extra + " more"} aria-label={extra + " more people"} style={{ "--i": people.length }} onClick={() => onSelect?.(null)}>
          +{extra}
        </button>
      )}
    </div>
  );
}
