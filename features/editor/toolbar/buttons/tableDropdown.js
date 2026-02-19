import { createElement } from "../../../../ui/elements.js";
import { createDropdown, createMenuAction } from "../ui.js";

export function createTableDropdown(editor, t) {
    const { dropdownWrapperElement, dropdownMenuElement } = createDropdown(
        editor,
        "fa-solid fa-table",
        t.table
    );
    const tablePickerWrapperElement = createElement("div", "webhacker-tablepick");
    const tablePickerLabelElement = createElement("div", "webhacker-tablepick__label");
    tablePickerLabelElement.textContent = "0x0";
    const tablePickerGridElement = createElement("div", "webhacker-tablepick__grid");

    const updateHighlight = (rowsSelected, colsSelected) => {
        tablePickerLabelElement.textContent = `${rowsSelected}x${colsSelected}`;
        tablePickerGridElement.querySelectorAll(".webhacker-tablepick__cell").forEach(cellElement => {
            const rowIndex = parseInt(cellElement.getAttribute("data-row"), 10);
            const colIndex = parseInt(cellElement.getAttribute("data-col"), 10);
            cellElement.classList.toggle("is-selected", rowIndex <= rowsSelected && colIndex <= colsSelected);
        });
    };

    for (let rowIndex = 1; rowIndex <= 10; rowIndex += 1) {
        for (let colIndex = 1; colIndex <= 10; colIndex += 1) {
            const cellElement = createElement("button", "webhacker-tablepick__cell", {
                type: "button",
                "data-row": String(rowIndex),
                "data-col": String(colIndex),
                "aria-label": `${rowIndex}x${colIndex}`
            });
            cellElement.addEventListener("mouseenter", () => updateHighlight(rowIndex, colIndex));
            cellElement.addEventListener(
                "click",
                createMenuAction(editor, () => editor.insertMinimalTable(rowIndex, colIndex))
            );
            tablePickerGridElement.appendChild(cellElement);
        }
    }

    tablePickerWrapperElement.append(tablePickerLabelElement, tablePickerGridElement);
    dropdownMenuElement.appendChild(tablePickerWrapperElement);
    return dropdownWrapperElement;
}
