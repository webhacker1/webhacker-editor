import { createElement } from "@/ui/indexUi";
import { TOOLBAR_LAYOUT } from "@/features/editor/toolbar/toolbarConfig";
import { createToolbarControl } from "@/features/editor/toolbar/createToolbarControl";
import { createSeparator } from "@/features/editor/toolbar/toolbarContext";

export function buildToolbar(editor, toolbarElement, t) {
    TOOLBAR_LAYOUT.forEach(layoutItem => {
        if (layoutItem === "separator") {
            toolbarElement.appendChild(createSeparator());
            return;
        }

        const groupElement = createElement("div", "webhacker-toolbar__group");
        (layoutItem as string[]).forEach(controlId => {
            const controlElement = createToolbarControl(controlId, editor, t);
            if (controlElement && controlElement.setAttribute) {
                controlElement.setAttribute("data-control-id", controlId);
            }
            const controlButtonElement =
                controlElement && controlElement.tagName === "BUTTON"
                    ? controlElement
                    : controlElement.querySelector && controlElement.querySelector(".webhacker-button");
            if (controlButtonElement) {
                controlButtonElement.setAttribute("data-control-id", controlId);
            }
            groupElement.appendChild(controlElement);
        });
        toolbarElement.appendChild(groupElement);
    });

    const betaBadgeElement = createElement("span", "webhacker-badge--beta", { title: t.soon });
    betaBadgeElement.textContent = t.beta;
    toolbarElement.appendChild(betaBadgeElement);
}
