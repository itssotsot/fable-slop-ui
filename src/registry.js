// Every file in ./elements is one self-contained component. The gallery renders the
// component and offers the same file's raw text for copying, so the two can never drift apart.
// To keep the first load small, only what the top of the page needs ships with it: the hero tiles
// and the first six cards of the library. Everything else arrives in a second file, fetched once
// those are on screen (see loadRest).
const components = import.meta.glob(
  [
    // the first six cards
    "./elements/PressButton.jsx",
    "./elements/DayNightToggle.jsx",
    "./elements/SpotlightCard.jsx",
    "./elements/MoodSlider.jsx",
    "./elements/SlideToConfirm.jsx",
    "./elements/Knob.jsx",
    // also shown in the hero
    "./elements/ElasticSlider.jsx",
    "./elements/SubmitButton.jsx",
  ],
  { eager: true, import: "default" }
);

let rest = null;
export const loadRest = () => (rest ??= import("./rest.js").then((m) => void Object.assign(components, m.default)).finally(startSources));

// The raw text for the Copy and Code buttons. It is the last thing fetched: after the rest of the elements.
let sources = null;
let startSources;
export const sourcesReady = new Promise((go) => (startSources = go)).then(() => import("./sources.js")).then((m) => (sources = m.default));
export const sourceOf = (element) => sources?.["./elements/" + element.file] ?? "";

export const groups = ["Buttons", "Inputs", "Toggles", "Navigation", "Feedback", "Display"];

// [file, name, group, what to try, stage alignment]
// Ordered from the most interactive to the least: the ones you can drag, scrub and play with come first.
const LIST = [
  ["PressButton", "Press button", "Buttons", "Hover the cat, then press. Sound on."],
  ["DayNightToggle", "Day and night toggle", "Toggles", "Click to run the whole day, or drag the sun slowly."],
  ["SpotlightCard", "Spotlight card", "Display", "Sweep the cursor across it, then click."],
  ["MoodSlider", "Mood slider", "Toggles", "Drag slowly from one end to the other."],
  ["SlideToConfirm", "Slide to confirm", "Buttons", "Drag the handle to the end."],
  ["Knob", "Volume knob", "Inputs", "Turn it up and watch the bars jump."],
  ["ReorderList", "Reorder list", "Display", "Drag a row up or down."],
  ["CompareSlider", "Comparison slider", "Display", "Drag the handle across."],
  ["ElasticSlider", "Elastic slider", "Inputs", "Drag quickly, then stop."],
  ["OtpInput", "One-time code", "Inputs", "Type six digits. 000000 is rejected."],
  ["StarRating", "Star rating", "Inputs", "Rate it 1, then rate it 5."],
  ["TagInput", "Tag input", "Inputs", "Add a tag, then remove one."],
  ["Dialog", "Confirm dialog", "Feedback", "Open it, then press Delete."],
  ["Dock", "Dock", "Navigation", "Sweep the cursor across it."],
  ["PasswordField", "Password field", "Inputs", "Type a password and press the eye."],
  ["MagneticButton", "Magnetic button", "Buttons", "Move the cursor close to it."],
  ["ElasticSwitch", "Elastic switch", "Toggles", "Drag the thumb, or press and let go."],
  ["ToastStack", "Toast stack", "Feedback", "Click three times, then hover the pile."],
  ["NumberStepper", "Number stepper", "Inputs", "Hold a button down."],
  ["HoldToConfirm", "Hold to confirm", "Buttons", "Press and hold until it fills."],
  ["SearchBar", "Search bar", "Inputs", "Click it and type a letter.", "top"],
  ["FileDropzone", "File dropzone", "Inputs", "Drop a file on it, or click to browse."],
  ["ContextMenu", "Context menu", "Navigation", "Right-click inside the box."],
  ["Pagination", "Pagination", "Navigation", "Jump to the last page, then back to 1."],
  ["TooltipGroup", "Gliding tooltip", "Feedback", "Hover one button, then slide along."],
  ["AddToCart", "Add to cart", "Buttons", "Add one, then change the quantity."],
  ["SelectMenu", "Select menu", "Inputs", "Open it and move over the options.", "top"],
  ["NotificationBell", "Notification bell", "Feedback", "Hover the bell, then open it.", "top"],
  ["MenuButton", "Menu button", "Navigation", "Open the menu.", "top"],
  ["ShareButton", "Share button", "Buttons", "Open it and pick an option."],
  ["SkeletonCard", "Skeleton loader", "Feedback", "Press the reload button."],
  ["MorphTabs", "Tabs", "Navigation", "Switch tabs in both directions."],
  ["BottomNav", "Bottom navigation", "Navigation", "Choose each tab in turn."],
  ["SegmentedControl", "Segmented control", "Toggles", "Pick another range."],
  ["StepProgress", "Step progress", "Navigation", "Press Continue."],
  ["TodoCheckbox", "To-do checkbox", "Toggles", "Tick a task off."],
  ["LikeButton", "Like button", "Buttons", "Click the heart, then click again."],
  ["ChipFilter", "Filter chips", "Toggles", "Select a few."],
  ["Accordion", "Accordion", "Display", "Open another question."],
  ["RadioCards", "Radio cards", "Toggles", "Pick another option."],
  ["ColorSwatches", "Colour swatches", "Toggles", "Pick a colour."],
  ["PricingToggle", "Pricing toggle", "Display", "Switch to yearly."],
  ["Odometer", "Odometer", "Display", "Add a walk."],
  ["AvatarStack", "Avatar stack", "Display", "Hover the group."],
  ["TextareaCounter", "Textarea with counter", "Inputs", "Type more than 140 characters."],
  ["FloatingInput", "Floating label input", "Inputs", "Type an email address, then click away."],
  ["SubmitButton", "Submit button", "Buttons", "Click it once and wait."],
  ["DownloadButton", "Download button", "Feedback", "Click it once."],
  ["CopyButton", "Copy button", "Buttons", "Click to copy the command."],
  ["ProgressBar", "Progress bar", "Feedback", "Watch it finish, then run it again."],
];

// Props the gallery passes to a demo. The copied file itself stays free of sample assets.
const DEMO_PROPS = {
  OtpInput: { onComplete: (code) => code !== "000000" },
  AvatarStack: {
    people: [
      { name: "Ana", src: "/avatars/1.jpg", color: "#8a8a8a" },
      { name: "Ben", color: "#c8553d" },
      { name: "Chloe", src: "/avatars/3.jpg", color: "#8a8a8a" },
      { name: "Dev", color: "#b97400" },
      { name: "Emi", src: "/avatars/5.jpg", color: "#8a8a8a" },
    ],
  },
};

export const elements = LIST.map(([file, name, group, hint, align], i) => {
  const path = "./elements/" + file + ".jsx";
  return {
    id: file.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase(),
    number: String(i + 1).padStart(2, "0"),
    file: file + ".jsx",
    exportName: file,
    // Read when rendering: undefined until the element's code has arrived.
    get Component() {
      return components[path];
    },
    props: DEMO_PROPS[file],
    name,
    group,
    hint,
    align,
  };
});

export const byFile = (file) => elements.find((e) => e.exportName === file);
