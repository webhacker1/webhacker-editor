import WebHackerEditor from "@/core/indexCore";
import { installCodeFeature } from "@/features/code/indexCode";
import { installEditorEvents } from "@/features/editor/events/indexEvents";
import { installFeatures } from "@/features/editor/featureRegistry";
import { installMathFeature } from "@/features/math/indexMath";
import { installMermaidFeature } from "@/features/mermaid/indexMermaid";
import { installTableFeature } from "@/features/table/indexTable";

let installed = false;

export function installDefaultEditorFeatures() {
    if (installed) return;
    installed = true;

    installFeatures([
        installCodeFeature,
        installMathFeature,
        installMermaidFeature,
        installTableFeature,
        () => installEditorEvents(WebHackerEditor)
    ]);
}

installDefaultEditorFeatures();
