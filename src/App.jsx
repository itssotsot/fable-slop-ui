import { memo, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { byFile, elements, groups, loadRest, sourceOf, sourcesReady } from "./registry.js";
import { highlight } from "./highlight.jsx";
import Backdrop from "./Backdrop.jsx";

const PHASES = ["Morning", "Noon", "Afternoon", "Evening"];
const ACCENTS = [
  { name: "Biro", value: "#1a4be0", dark: "#7f9cff" },
  { name: "Clay", value: "#c2452d", dark: "#ff8f73" },
  { name: "Moss", value: "#1f7a4d", dark: "#5fd39a" },
  { name: "Amber", value: "#a86400", dark: "#ffb84d" },
  { name: "Ink", value: "#111111", dark: "#f5f5f3" },
];

const DayNightToggle = byFile("DayNightToggle").Component;
const HERO = ["PressButton", "Knob", "ElasticSlider", "SubmitButton"].map(byFile);
const THEMED = ["PressButton", "ElasticSwitch", "SegmentedControl"].map(byFile);

// The mark: a small pixel robot. Two antennae, stubby arms, four legs, one leg that drips (the slop),
// and eyes that watch the pointer for as long as the logo is on screen.
function Logo() {
  const mark = useRef(null);
  const id = useId().replace(/:/g, "");

  useEffect(() => {
    const node = mark.current;
    let frame = 0;
    let at = null;
    const look = () => {
      frame = 0;
      const r = node.getBoundingClientRect();
      const dx = at.x - (r.left + r.width / 2);
      const dy = at.y - (r.top + r.height * 0.36); // the eyes sit about a third of the way down
      const far = Math.hypot(dx, dy) || 1;
      const reach = Math.min(1, far / 90); // close by, the eyes only turn a little
      node.style.setProperty("--ex", ((dx / far) * reach).toFixed(3));
      node.style.setProperty("--ey", ((dy / far) * reach).toFixed(3));
    };
    const move = (e) => {
      at = { x: e.clientX, y: e.clientY };
      frame ||= requestAnimationFrame(look);
    };
    // Only listen while the logo can be seen.
    const watch = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) addEventListener("pointermove", move, { passive: true });
      else removeEventListener("pointermove", move);
    });
    watch.observe(node);
    return () => {
      watch.disconnect();
      removeEventListener("pointermove", move);
      cancelAnimationFrame(frame);
    };
  }, []);

  // The eyes are two slots cut out of the body. The cut-outs are what move.
  return (
    <svg ref={mark} className="brand-mark" width="30" height="33" viewBox="0 0 11 12.2" aria-hidden="true">
      <mask id={id}>
        <rect width="11" height="12.2" fill="#fff" />
        <path className="brand-pupils" d="M3 3h1v2h-1zM7 3h1v2h-1z" />
      </mask>
      <path className="brand-bot" mask={"url(#" + id + ")"} d="M3 0h1v1h-1zM7 0h1v1h-1zM2 1h7v1h-7zM1 2h9v1h-9zM1 3h9v1h-9zM1 4h9v1h-9zM0 5h11v1h-11zM1 6h9v1h-9zM1 7h9v1h-9zM1 8h1v1h-1zM3 8h1v1h-1zM7 8h1v1h-1zM9 8h1v1h-1zM1 9h1v1h-1zM3 9h1v1h-1zM7 9h1v1h-1zM9 9h1v1h-1zM7 10h1v1h-1z" />
      <path className="brand-lids brand-pupils" d="M3 3h1v2h-1zM7 3h1v2h-1z" />
      <rect className="brand-drop" x="7" y="11.2" width="1" height="1" />
    </svg>
  );
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers and insecure origins: fall back to a hidden textarea.
    const area = document.createElement("textarea");
    area.value = text;
    area.style.cssText = "position:fixed;opacity:0";
    document.body.append(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}

function useCopied() {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = async (text) => {
    await copyText(text);
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  };
  return [copied, copy];
}

function CopyAction({ text, label = "Copy", className = "btn sm" }) {
  const [copied, copy] = useCopied();
  return (
    <button type="button" className={className} data-copied={copied} onClick={async () => copy(typeof text === "function" ? await text() : text)}>
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {copied ? (
          <path className="draw" d="M4 9.5l3.2 3.2L14 5.8" />
        ) : (
          <>
            <rect x="6.5" y="6.5" width="8" height="8" rx="2" />
            <path d="M11.5 4V3.8a1.3 1.3 0 0 0-1.3-1.3H4.8a1.3 1.3 0 0 0-1.3 1.3v5.4a1.3 1.3 0 0 0 1.3 1.3H5" />
          </>
        )}
      </svg>
      <span aria-live="polite">{copied ? "Copied" : label}</span>
    </button>
  );
}

// Memoised, so a theme change or a keystroke in the search box does not redraw all fifty demos.
// `ready` is only there to redraw a card once its element has arrived.
const Card = memo(function Card({ element, onCode, demoProps }) {
  const { Component } = element; // not there yet for cards past the first six, until the rest has loaded
  return (
    <article className="card" id={element.id}>
      {Component ? (
        <div className="stage" data-align={element.align}>
          <Component {...demoProps} />
        </div>
      ) : (
        <div className="stage stage-wait" aria-busy="true" aria-label={"Loading " + element.name}>
          <i /><i /><i />
        </div>
      )}
      <footer className="card-foot">
        <h3>
          <span className="num">{element.number}</span>
          <span>{element.name}</span>
        </h3>
        <div className="card-actions">
          <button type="button" className="btn sm quiet" onClick={() => onCode(element)} aria-label={"View the code for " + element.name}>
            Code
          </button>
          <CopyAction text={() => sourcesReady.then(() => sourceOf(element))} />
        </div>
        <p>{element.hint}</p>
      </footer>
    </article>
  );
});

function CodeSheet({ element, onClose }) {
  const dialog = useRef(null);
  const [closing, setClosing] = useState(false);
  const [ready, setReady] = useState(false);
  const source = element && ready ? sourceOf(element) : "";
  const lines = useMemo(() => highlight(source), [source]);

  useEffect(() => {
    sourcesReady.then(() => setReady(true));
  }, []);

  useEffect(() => {
    if (element && !dialog.current.open) dialog.current.showModal();
  }, [element]);

  const close = () => setClosing(true);
  const ended = (e) => {
    if (e.animationName !== "sheet-out") return;
    setClosing(false);
    dialog.current.close();
    onClose();
  };

  return (
    <dialog
      ref={dialog}
      className="sheet"
      data-closing={closing}
      aria-label={element ? element.file : "Code"}
      onAnimationEnd={ended}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => e.target === dialog.current && close()}
    >
      {element && (
        <div className="sheet-body">
          <header className="sheet-head">
            <div>
              <h2>{element.file}</h2>
              <p>{source ? source.split("\n").length - 1 + " lines, React only" : "Loading"}</p>
            </div>
            <CopyAction text={source} label="Copy file" />
            <button type="button" className="icon-btn" aria-label="Close" onClick={close}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
              </svg>
            </button>
          </header>
          <pre className="usage">
            <code>
              <span className="tok-k">import</span> {element.exportName} <span className="tok-k">from</span> <span className="tok-s">"./{element.exportName}"</span>;{"\n\n"}
              <span className="tok-t">&lt;{element.exportName}</span> <span className="tok-t">/&gt;</span>
            </code>
          </pre>
          <pre className="code" tabIndex={0}>
            <code>{lines}</code>
          </pre>
        </div>
      )}
    </dialog>
  );
}

export default function App() {
  // The theme is a time of day. Evening is the dark theme; the other three are light ones.
  const [phase, setPhase] = useState(() => Number(document.documentElement.dataset.phase ?? 0));
  const dark = phase === 3;
  const [accent, setAccent] = useState(ACCENTS[0].name);
  const [group, setGroup] = useState("All");
  const [query, setQuery] = useState("");
  const driver = useRef(null); // the day and night toggle that was last touched
  useEffect(() => {
    const note = (e) => {
      const toggle = e.target.closest?.(".ui-daynight");
      if (toggle) driver.current = toggle;
    };
    addEventListener("pointerdown", note, true);
    addEventListener("keydown", note, true);
    return () => {
      removeEventListener("pointerdown", note, true);
      removeEventListener("keydown", note, true);
    };
  }, []);
  const [, setFull] = useState(false); // flips once every element's code is in, to draw the waiting cards
  // The first six cards are on screen now: fetch the rest.
  useEffect(() => {
    let live = true;
    loadRest().then(() => live && setFull(true));
    return () => {
      live = false;
    };
  }, []);
  const ColorSwatches = byFile("ColorSwatches").Component;
  const [code, setCode] = useState(null);

  // Each accent has a lighter twin for the dark theme, so the swatches always show what you get.
  const swatches = ACCENTS.map((a) => ({ name: a.name, value: dark ? a.dark : a.value }));
  const accentNow = (swatches.find((s) => s.name === accent) ?? swatches[0]).value;
  const chosen = ACCENTS.find((a) => a.name === accent) ?? ACCENTS[0];
  const accentInk = dark ? "#0d0d0d" : "#ffffff";

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.phase = phase;
    // Both ends of the accent: the stylesheet blends between them as the theme moves.
    root.style.setProperty("--accent-day", chosen.value);
    root.style.setProperty("--accent-night", chosen.dark);
    try {
      localStorage.setItem("fable-slop-theme", PHASES[phase].toLowerCase());
    } catch {
      // Storage can be unavailable in private windows. The theme still applies for this visit.
    }
  }, [phase, chosen]);

  // The page's colours follow the toggle as it moves (see --day-p in index.css). There are three
  // toggles on the page and all of them move when the theme changes, so only one is listened to:
  // the one that was last touched, or the header's before anything has been touched.
  const themeProgress = useCallback((p, node) => {
    if (driver.current?.isConnected ? node !== driver.current : !node.closest(".top")) return;
    const root = document.documentElement;
    const n = Math.max(0, Math.min(1, p));
    root.style.setProperty("--day-p", n.toFixed(4));
    root.classList.toggle("theme-switching", Math.abs(n * 3 - Math.round(n * 3)) > 0.02); // anywhere between two stops
  }, []);

  const needle = query.trim().toLowerCase();
  const shown = elements.filter((e) => (group === "All" || e.group === group) && (!needle || (e.name + " " + e.group + " " + e.exportName).toLowerCase().includes(needle)));
  const countOf = (g) => (g === "All" ? elements.length : elements.filter((e) => e.group === g).length);

  const tokens = `:root {
  --ui-accent: ${accentNow};      /* buttons, focus rings, highlights */
  --ui-accent-ink: ${accentInk};  /* text on the accent */
  --ui-ink: ${dark ? "#f5f5f3" : "#111111"};         /* text */
  --ui-bg: ${dark ? "#171717" : "#ffffff"};          /* surfaces */
  --ui-soft: ${dark ? "#252525" : "#f4f4f4"};        /* quiet fills */
  --ui-line: ${dark ? "#353535" : "#e3e3e3"};        /* borders */
  --ui-muted: ${dark ? "#9c9c9c" : "#6b6b6b"};       /* secondary text */
}`;

  return (
    <>
      <Backdrop />
      <header className="top">
        <div className="wrap top-row">
          <a className="brand" href="#top" aria-label="Fable Slop UI, back to top">
            <Logo />
            Fable Slop <span className="brand-ui">UI</span>
          </a>
          <DayNightToggle steps={4} labels={PHASES} value={phase} onChange={setPhase} onProgress={themeProgress} style={{ fontSize: 30 }} />
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="wrap hero-grid">
            <div className="hero-copy">
              <h1>React elements to copy into your site.</h1>
              <p className="lede">
                Buttons, inputs, toggles, menus and feedback, each with the small motion that makes it feel right. Every element is one file with its styles inside.
              </p>
              <ul className="facts">
                <li><b>1</b> file each</li>
                <li><b>0</b> dependencies beyond React</li>
              </ul>
              <div className="hero-actions">
                <a className="btn" href="#elements">Browse the elements</a>
                <a className="btn quiet" href="#use">See how to use them</a>
              </div>
            </div>
            <div className="hero-tiles">
              {HERO.map(({ exportName, Component }) => (
                <div key={exportName} className="tile">
                  {exportName === "DayNightToggle" ? <Component steps={4} labels={PHASES} value={phase} onChange={setPhase} onProgress={themeProgress} /> : <Component />}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="library" id="elements">
          <div className="wrap">
            <div className="section-head">
              <h2>All elements</h2>
              <p>Try each one, then press Copy and paste the file into your project.</p>
            </div>
            <div className="toolbar">
              <div className="chips" role="group" aria-label="Filter by type">
                {["All", ...groups].map((g) => (
                  <button key={g} type="button" className="chip" aria-pressed={group === g} onClick={() => setGroup(g)}>
                    {g} <span>{countOf(g)}</span>
                  </button>
                ))}
              </div>
              <label className="find">
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                  <circle cx="8" cy="8" r="5.2" />
                  <path d="M12 12l3.5 3.5" />
                </svg>
                <input type="search" value={query} placeholder="Find an element" aria-label="Find an element" onChange={(e) => setQuery(e.target.value)} />
              </label>
            </div>
            {shown.length > 0 ? (
              <div className="grid">
                {shown.map((element) => (
                  <Card
                    key={element.id}
                    element={element}
                    onCode={setCode}
                    ready={Boolean(element.Component)}
                    // The toggle in the gallery is wired to the page, so flipping it changes the theme for real.
                    demoProps={element.exportName === "DayNightToggle" ? { steps: 4, labels: PHASES, value: phase, onChange: setPhase, onProgress: themeProgress } : element.props}
                  />
                ))}
              </div>
            ) : (
              <div className="empty">
                <p>No element matches "{query.trim()}"{group !== "All" ? " in " + group : ""}.</p>
                <button
                  type="button"
                  className="btn quiet"
                  onClick={() => {
                    setQuery("");
                    setGroup("All");
                  }}
                >
                  Show all elements
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="use" id="use">
          <div className="wrap">
            <div className="section-head">
              <h2>Three steps to use an element</h2>
              <p>There is no package to install and no build plugin to configure.</p>
            </div>
            <ol className="steps">
              <li>
                <span className="num">01</span>
                <h3>Copy the file</h3>
                <p>Press Copy on any element. The whole component, styles included, is now on your clipboard.</p>
              </li>
              <li>
                <span className="num">02</span>
                <h3>Paste it into your project</h3>
                <p>Save it under the name shown in the code view, for example <code>src/components/LikeButton.jsx</code>.</p>
              </li>
              <li>
                <span className="num">03</span>
                <h3>Import and render it</h3>
                <p>Each file has one default export and working default props, so <code>&lt;LikeButton /&gt;</code> renders straight away.</p>
              </li>
            </ol>

            <div className="theme">
              <div className="theme-copy">
                <h3>Match your brand with seven variables</h3>
                <p>
                  Every element reads the same CSS variables and falls back to its own defaults when they are missing. Set them once on <code>:root</code>, or on any parent to theme one area.
                </p>
                <div className="theme-controls">
                  {ColorSwatches && <ColorSwatches label="Accent" options={swatches} value={accentNow} onChange={(option) => setAccent(option.name)} />}
                </div>
                <div className="theme-samples">
                  {THEMED.map(({ exportName, Component }) => Component && <Component key={exportName} />)}
                </div>
              </div>
              <div className="theme-code">
                <div className="theme-code-head">
                  <span>theme.css</span>
                  <CopyAction text={tokens} className="btn sm quiet" />
                </div>
                <pre><code>{tokens}</code></pre>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="foot">
        <div className="wrap foot-row">
          <span className="brand">
            <Logo />
            Fable Slop <span className="brand-ui">UI</span>
          </span>
          <p>Made entirely with Fable. Built with React and plain CSS. Copy anything you like.</p>
          <a href="#top">Back to top</a>
        </div>
      </footer>

      <CodeSheet element={code} onClose={() => setCode(null)} />
    </>
  );
}
