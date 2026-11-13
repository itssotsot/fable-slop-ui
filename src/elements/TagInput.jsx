// TagInput: Enter, Space or a comma adds a tag. A new tag opens up from nothing, rises into place and
// flashes the accent colour while the field slides aside. A removed tag lifts, turns red, then
// drops away as its neighbours close the gap.
// Backspace arms the last tag, a second Backspace removes it. A duplicate makes the existing tag shake.
// Usage: <TagInput initial={["design"]} onChange={(tags) => setTags(tags)} />
import { useEffect, useLayoutEffect, useRef, useState } from "react";

const css = `
.ui-tags {
  --accent: var(--ui-accent, #1a4be0);
  --on-accent: var(--ui-accent-ink, #fff);
  --ink: var(--ui-ink, #111);
  --bg: var(--ui-bg, #fff);
  --soft: var(--ui-soft, #f4f4f4);
  --line: var(--ui-line, #e3e3e3);
  --muted: var(--ui-muted, #6b6b6b);
  --danger: var(--ui-danger, #d93025);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  width: 300px;
  max-width: 100%;
  min-height: 52px;
  padding: 8px;
  border: 1.5px solid var(--line);
  border-radius: 14px;
  background: var(--bg);
  font: inherit;
  font-size: 15px;
  text-align: left;
  cursor: text;
  box-sizing: border-box;
  transition: border-color .2s, box-shadow .2s;
}
.ui-tags:focus-within { border-color: var(--accent); box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 16%, transparent); }
.ui-tag {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  flex: none;
  height: 32px;
  padding: 0 4px 0 12px;
  border-radius: 16px;
  background: var(--soft);
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  box-sizing: border-box;
  transition: background .2s, color .2s;
}
.ui-tag[data-armed="true"] { background: var(--danger); color: #fff; }
.ui-tag[data-dupe="true"] { animation: ui-tag-shake .45s; }
.ui-tag button {
  display: grid;
  place-items: center;
  flex: none;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: none;
  color: inherit;
  opacity: .5;
  cursor: pointer;
  transition: opacity .2s, rotate .3s cubic-bezier(.34, 1.56, .64, 1), scale .2s;
}
.ui-tag button:hover { opacity: 1; rotate: 90deg; scale: 1.2; }
.ui-tag button:focus-visible { outline: 2px solid var(--accent); opacity: 1; }
.ui-tags input {
  flex: 1;
  min-width: 90px;
  height: 32px;
  padding: 0 6px;
  border: 0;
  background: none;
  color: var(--ink);
  font: inherit;
  font-size: 16px;
  outline: 0;
}
.ui-tags input::placeholder { color: var(--muted); }
@keyframes ui-tag-shake {
  15% { translate: -5px 0; rotate: -4deg; }
  35% { translate: 5px 0; rotate: 4deg; }
  55% { translate: -3px 0; rotate: -2deg; }
  75% { translate: 2px 0; }
}
@media (prefers-reduced-motion: reduce) {
  :is(.ui-tags, .ui-tags *) { animation-duration: .01ms !important; transition-duration: .01ms !important; }
}
`;

const calm = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

// One tag. It animates its own width, so the rest of the row slides instead of jumping.
function Tag({ label, fresh, armed, dupe, leaving, onRemove, onGone, onShakeEnd }) {
  const el = useRef(null);
  const done = useRef(onGone);
  useEffect(() => {
    done.current = onGone;
  });

  useLayoutEffect(() => {
    if (!fresh || calm()) return;
    const node = el.current;
    const look = getComputedStyle(node);
    const accent = look.getPropertyValue("--accent");
    const onAccent = look.getPropertyValue("--on-accent");
    // Two animations: the width opens smoothly so the row never jitters, the tag itself bounces in.
    const open = node.animate(
      [{ width: "0px", paddingLeft: "0px", paddingRight: "0px", marginRight: "-6px" }, { width: node.offsetWidth + "px" }],
      { duration: 380, easing: "cubic-bezier(.2, .8, .2, 1)" }
    );
    const pop = node.animate(
      [
        { opacity: 0, transform: "translateY(18px) scale(.4) rotate(-12deg)", backgroundColor: accent, color: onAccent },
        { opacity: 1, backgroundColor: accent, color: onAccent, offset: 0.5 },
        { opacity: 1, transform: "none" },
      ],
      { duration: 620, easing: "cubic-bezier(.2, 1.5, .4, 1)" }
    );
    // Cancelling matters: if the effect runs twice, the second run must measure the tag at full size.
    return () => {
      open.cancel();
      pop.cancel();
    };
  }, [fresh]);

  useEffect(() => {
    if (!leaving) return;
    if (calm()) return done.current();
    const node = el.current;
    const width = node.offsetWidth + "px";
    const exit = node.animate(
      [
        { width, opacity: 1, transform: "none" },
        { width, opacity: 1, transform: "translateY(-6px) scale(1.1) rotate(4deg)", backgroundColor: getComputedStyle(node).getPropertyValue("--danger"), color: "#fff", offset: 0.3 },
        { width: "0px", paddingLeft: "0px", paddingRight: "0px", marginRight: "-6px", opacity: 0, transform: "translateY(22px) scale(.3) rotate(18deg)" },
      ],
      { duration: 420, easing: "cubic-bezier(.5, 0, .3, 1)", fill: "forwards" }
    );
    exit.onfinish = () => done.current();
    return () => exit.cancel();
  }, [leaving]);

  return (
    <span ref={el} className="ui-tag" data-armed={armed} data-dupe={dupe} onAnimationEnd={onShakeEnd}>
      {label}
      <button type="button" aria-label={"Remove " + label} onClick={onRemove}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
          <path d="M2 2l6 6M8 2l-6 6" />
        </svg>
      </button>
    </span>
  );
}

export default function TagInput({ initial = ["design", "react"], placeholder = "Add a tag", onChange }) {
  const [tags, setTags] = useState(initial);
  const [text, setText] = useState("");
  const [armed, setArmed] = useState(false);
  const [dupe, setDupe] = useState(null);
  const [leaving, setLeaving] = useState([]);
  const [added, setAdded] = useState([]); // tags typed in this session: only these animate in
  const input = useRef(null);
  const latest = useRef(initial); // the newest list, so overlapping removals never work from a stale one

  const commit = (next) => {
    latest.current = next;
    setTags(next);
    onChange?.(next);
  };
  const add = () => {
    const tag = text.trim().replace(/,+$/, "").toLowerCase();
    if (!tag) return;
    if (latest.current.includes(tag)) setDupe(tag);
    else {
      setAdded((all) => [...all, tag]);
      commit([...latest.current, tag]);
    }
    setText("");
  };
  const remove = (tag) => setLeaving((all) => (all.includes(tag) ? all : [...all, tag]));
  const gone = (tag) => {
    setLeaving((all) => all.filter((t) => t !== tag));
    setAdded((all) => all.filter((t) => t !== tag));
    commit(latest.current.filter((t) => t !== tag));
  };
  const key = (e) => {
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault();
      add();
    } else if (e.key === "Backspace" && text === "" && tags.length) {
      if (armed) remove(tags[tags.length - 1]);
      setArmed(!armed);
      return;
    }
    setArmed(false);
  };

  return (
    <div className="ui-tags" onClick={() => input.current.focus()}>
      <style>{css}</style>
      {tags.map((tag, i) => (
        <Tag
          key={tag}
          label={tag}
          fresh={added.includes(tag)}
          armed={armed && i === tags.length - 1}
          dupe={dupe === tag}
          leaving={leaving.includes(tag)}
          onRemove={() => remove(tag)}
          onGone={() => gone(tag)}
          onShakeEnd={() => setDupe(null)}
        />
      ))}
      <input
        ref={input}
        value={text}
        placeholder={tags.length ? "" : placeholder}
        aria-label={placeholder}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={key}
        onBlur={() => {
          add();
          setArmed(false);
        }}
      />
    </div>
  );
}
