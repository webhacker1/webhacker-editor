import { createElement } from "../../../ui/elements.js";
import { TOOLBAR_LAYOUT } from "./layout.js";
import { createToolbarControl } from "./buttons/registry.js";
import { createSeparator } from "./ui.js";

export function buildToolbar(editor, toolbarElement, t) {
    TOOLBAR_LAYOUT.forEach(layoutItem => {
        if (layoutItem === "separator") {
            toolbarElement.appendChild(createSeparator());
            return;
        }

        const groupElement = createElement("div", "webhacker-toolbar__group");
        layoutItem.forEach(controlId => {
            const controlElement = createToolbarControl(controlId, editor, t);
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
