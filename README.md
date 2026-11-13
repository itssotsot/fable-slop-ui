# Fable Slop UI

React interface elements you can copy into any site. Each one is a single
`.jsx` file with its styles inside and no dependency beyond React.

Made entirely with Fable.

## Run the gallery

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## Use an element

1. Open the gallery, press **Copy** on an element (or **Code** to read it first).
2. Save it in your project under the file name shown, for example `src/components/LikeButton.jsx`.
3. Import and render it. Every file has one default export and working default props.

```jsx
import LikeButton from "./components/LikeButton";

<LikeButton count={128} onChange={(liked) => console.log(liked)} />
```

The props each element accepts are listed in the comment at the top of its file.

## Theme

Every element reads the same seven CSS variables and falls back to its own
defaults when they are missing. Set them on `:root`, or on any parent.

```css
:root {
  --ui-accent: #1a4be0;      /* buttons, focus rings, highlights */
  --ui-accent-ink: #ffffff;  /* text on the accent */
  --ui-ink: #111111;         /* text */
  --ui-bg: #ffffff;          /* surfaces */
  --ui-soft: #f4f4f4;        /* quiet fills */
  --ui-line: #e3e3e3;        /* borders */
  --ui-muted: #6b6b6b;       /* secondary text */
}
```

## Project layout

```
src/elements/    the components, one file each
src/registry.js  the list the gallery shows: name, group and a hint for each
src/App.jsx      the gallery page
src/index.css    the gallery's own styles and theme variables
```

To add an element, drop a new file into `src/elements/` and add one line to the
list in `src/registry.js`. The gallery picks up the component and its source text
from the file itself.

## Notes

- All elements work with mouse, touch and keyboard, and respect `prefers-reduced-motion`.
- They use current CSS (`color-mix()`, individual `translate` / `scale` / `rotate`,
  `:has()` in one place), so they target browsers from 2023 onward.
- `ToastStack`, `Dialog` and `ContextMenu` position themselves against the viewport.
  Avoid putting them inside an ancestor that has a CSS `transform`.

## Licence

MIT. Copy anything you like. See [LICENSE](LICENSE).

Live site: https://fable-slop-ui.vercel.app
