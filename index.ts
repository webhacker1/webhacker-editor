import "katex/dist/katex.min.css";
import "@/styles/less/index.less";
import WebHackerEditor from "@/core/indexCore";
import "@/features/editor/setup";

export { sanitizeHtmlStringToSafeHtml } from "@/sanitize/sanitize";
export { highlightCodeBlocksInElement } from "@/features/code/indexCode";
export { renderMathBlocksInElement } from "@/features/math/indexMath";
export { renderMermaidBlocksInElement } from "@/features/mermaid/indexMermaid";
export default WebHackerEditor;
