// The raw text of every element, loaded as its own chunk so the page can render first.
export default import.meta.glob("./elements/*.jsx", { eager: true, query: "?raw", import: "default" });
