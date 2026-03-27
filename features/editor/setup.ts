import WebHackerEditor from "../../core/WebHackerEditor";
import { installCodeFeature } from "../code/index";
import { installMathFeature } from "../math/index";
import { installMermaidFeature } from "../mermaid/index";
import { installTableFeature } from "../table/index";
import { installEditorEvents } from "./events/index";

let installed = false;

export function installDefaultEditorFeatures() {
    if (installed) return;
    installed = true;

    installCodeFeature();
    installMathFeature();
    installMermaidFeature();
    installTableFeature();
    installEditorEvents(WebHackerEditor);
}

installDefaultEditorFeatures();
