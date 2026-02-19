import "./whEditor.less";
import WebHackerEditor from "./core/WebHackerEditor.js";
import "./features/code/index.js";
import "./features/table/editorBindings.js";
import "./features/editor/events/index.js";

export { sanitizeHtmlStringToSafeHtml } from "./sanitize/sanitize.js";
export { highlightCodeBlocksInElement } from "./features/code/index.js";
export default WebHackerEditor;
