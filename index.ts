import "katex/dist/katex.min.css";
import "./whEditor.less";
import WebHackerEditor from "./core/WebHackerEditor";
import "./features/editor/setup";

export { sanitizeHtmlStringToSafeHtml } from "./sanitize/sanitize";
export { highlightCodeBlocksInElement } from "./features/code/index";
export { renderMathBlocksInElement } from "./features/math/index";
export { renderMermaidBlocksInElement } from "./features/mermaid/index";
export default WebHackerEditor;
