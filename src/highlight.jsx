// A small highlighter for the code view. It only needs to tell comments, strings,
// keywords, numbers and JSX tags apart, so one regular expression is enough.
const TOKEN = new RegExp(
  [
    "(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)", // 1 comment
    "(\"(?:[^\"\\\\\\n]|\\\\.)*\"|'(?:[^'\\\\\\n]|\\\\.)*')", // 2 string
    "\\b(import|from|export|default|function|return|const|let|if|else|for|of|in|new|await|async|try|catch|typeof|null|undefined|true|false)\\b", // 3 keyword
    "(<\\/?[A-Za-z][\\w.]*|\\/?>)", // 4 JSX tag
    "((?:--|\\.)[a-z][\\w-]*(?=[\\s:,;{)]))", // 5 CSS class or custom property
    "(#[0-9a-fA-F]{3,8}\\b|\\b\\d+(?:\\.\\d+)?\\b)", // 6 colour or number
  ].join("|"),
  "g"
);

const KIND = [null, "tok-c", "tok-s", "tok-k", "tok-t", "tok-p", "tok-n"];

export function highlight(source) {
  const out = [];
  let last = 0;
  let key = 0;
  for (const match of source.matchAll(TOKEN)) {
    if (match.index > last) out.push(source.slice(last, match.index));
    const kind = KIND[match.findIndex((group, i) => i > 0 && group !== undefined)];
    out.push(<span key={key++} className={kind}>{match[0]}</span>);
    last = match.index + match[0].length;
  }
  out.push(source.slice(last));
  return out;
}
