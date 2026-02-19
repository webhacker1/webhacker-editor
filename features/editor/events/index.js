import WebHackerEditor from "../../../core/WebHackerEditor.js";
import { bindInputEvents } from "./input.js";
import { bindClipboardEvents } from "./clipboard.js";
import { bindSelectionEvents } from "./selection.js";
import { bindKeyboardEvents } from "./keyboard.js";

WebHackerEditor.prototype.bindEditorEvents = function () {
    bindInputEvents(this);
    bindClipboardEvents(this);
    bindSelectionEvents(this);
    bindKeyboardEvents(this);
    this.highlightCodeBlocks();
};

