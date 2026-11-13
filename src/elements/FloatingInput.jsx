// FloatingInput: the label lifts out of the way, a tick draws itself when the value is valid,
// and a wrong value gets a short shake and a plain message.
// Usage: <FloatingInput label="Email address" type="email" onChange={(value) => setEmail(value)} />
import { useId, useState } from "react";

const css = `
.ui-field {
  --accent: var(--ui-accent, #1a4be0);
  --ink: var(--ui-ink, #111);
  --bg: var(--ui-bg, #fff);
  --line: var(--ui-line, #e3e3e3);
  --muted: var(--ui-muted, #6b6b6b);
  --danger: var(--ui-danger, #d93025);
  --ok: var(--ui-success, #1a9a52);
  display: block;
  width: 280px;
  max-width: 100%;
  font: inherit;
  text-align: left;
}
.ui-field-box { position: relative; display: block; }
.ui-field input {
  width: 100%;
  height: 56px;
  padding: 20px 44px 4px 16px;
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
.ui-field input:hover { border-color: var(--muted); }
.ui-field input:focus { border-color: var(--accent); box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 16%, transparent); }
.ui-field-label {
  position: absolute;
  left: 17px;
  top: 18px;
  color: var(--muted);
  font-size: 16px;
  line-height: 20px;
  pointer-events: none;
  transform-origin: 0 0;
  transition: translate .25s cubic-bezier(.2, .8, .2, 1), scale .25s cubic-bezier(.2, .8, .2, 1), color .2s;
}
.ui-field input:focus + .ui-field-label,
.ui-field input:not(:placeholder-shown) + .ui-field-label { translate: 0 -10px; scale: .75; }
.ui-field input:focus + .ui-field-label { color: var(--accent); }
.ui-field-tick { position: absolute; right: 14px; top: 18px; color: var(--ok); }
.ui-field-tick path { stroke-dasharray: 16; stroke-dashoffset: 16; transition: stroke-dashoffset .3s; }
.ui-field[data-ok="true"] .ui-field-tick path { stroke-dashoffset: 0; }
.ui-field[data-bad="true"] input { border-color: var(--danger); box-shadow: 0 0 0 4px color-mix(in srgb, var(--danger) 14%, transparent); }
.ui-field[data-bad="true"] .ui-field-box { animation: ui-field-shake .4s; }
.ui-field[data-bad="true"] .ui-field-label { color: var(--danger); }
.ui-field-error {
  display: grid;
  grid-template-rows: 0fr;
  color: var(--danger);
  font-size: 13px;
  transition: grid-template-rows .3s cubic-bezier(.2, .8, .2, 1);
}
.ui-field-error span { overflow: hidden; }
.ui-field-error span::before { content: ""; display: block; height: 6px; }
.ui-field[data-bad="true"] .ui-field-error { grid-template-rows: 1fr; }
@keyframes ui-field-shake {
  20% { translate: -6px 0; }
  40% { translate: 5px 0; }
  60% { translate: -3px 0; }
  80% { translate: 2px 0; }
}
@media (prefers-reduced-motion: reduce) {
  :is(.ui-field, .ui-field *), :is(.ui-field, .ui-field *)::before, :is(.ui-field, .ui-field *)::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    transition-delay: 0s !important;
  }
}
`;

const isEmail = (value) => /^\S+@\S+\.\S+$/.test(value);

export default function FloatingInput({ label = "Email address", type = "email", validate = isEmail, error = "Enter a full address, like name@example.com", onChange, ...props }) {
  const id = useId();
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);
  const ok = value !== "" && validate(value);
  const bad = touched && value !== "" && !ok;

  return (
    <span className="ui-field" data-ok={ok} data-bad={bad}>
      <style>{css}</style>
      <span className="ui-field-box">
        <input
          id={id}
          type={type}
          value={value}
          placeholder=" "
          aria-invalid={bad}
          aria-describedby={id + "-error"}
          onChange={(e) => {
            setValue(e.target.value);
            setTouched(false);
            onChange?.(e.target.value);
          }}
          onBlur={() => setTouched(true)}
          {...props}
        />
        <label className="ui-field-label" htmlFor={id}>{label}</label>
        <svg className="ui-field-tick" width="20" height="20" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 9.5l3.2 3.2L14 5.8" />
        </svg>
      </span>
      <span className="ui-field-error" id={id + "-error"} role="alert">
        <span>{bad ? error : ""}</span>
      </span>
    </span>
  );
}
