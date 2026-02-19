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
            groupElement.appendChild(createToolbarControl(controlId, editor, t));
        });
        toolbarElement.appendChild(groupElement);
    });

    const betaBadgeElement = createElement("span", "webhacker-badge--beta", { title: t.soon });
    betaBadgeElement.textContent = t.beta;
    toolbarElement.appendChild(betaBadgeElement);
}
