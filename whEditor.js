(function () {
    const DEFAULT_TEXT_PRESET_COLORS = [
        "#111827",
        "#374151",
        "#6B7280",
        "#9CA3AF",
        "#D1D5DB",
        "#F3F4F6",
        "#FFFFFF",
        "#6A5ACD",
        "#2563EB",
        "#0891B2",
        "#10B981",
        "#F59E0B",
        "#EF4444",
    ];

    function createElement(tagName, className, attributes) {
        const element = document.createElement(tagName);
        if (className) element.className = className;
        if (attributes)
            Object.entries(attributes).forEach(([key, value]) =>
                element.setAttribute(key, value)
            );
        return element;
    }

    function executeRichCommand(commandName, commandValue = null) {
        document.execCommand(commandName, false, commandValue);
    }

    function escapeHtml(stringValue) {
        return String(stringValue).replace(
            /[&<>"']/g,
            (match) =>
                ({
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#39;",
                }[match])
        );
    }

    function ensureSafeUrl(rawUrl) {
        const value = String(rawUrl || "").trim();
        if (/^(https?:|mailto:|tel:|data:image\/)/i.test(value)) return value;
        const stripped = value.replace(/^[a-zA-Z][\w+.-]*:/, "");
        return stripped ? "https://" + stripped : "https://";
    }

    const ALLOWED_TAG_SET = new Set([
        "p",
        "br",
        "hr",
        "strong",
        "b",
        "em",
        "i",
        "u",
        "s",
        "mark",
        "small",
        "sub",
        "sup",
        "span",
        "font",
        "a",
        "ul",
        "ol",
        "li",
        "blockquote",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "figure",
        "figcaption",
        "dl",
        "dt",
        "dd",
        "img",
        "table",
        "thead",
        "tbody",
        "tr",
        "th",
        "td",
        "div",
    ]);

    const TABLE_ALLOWED_CLASS_LIST = ["wh-table"];

    function normalizeCssColorToHex(inputValue) {
        const value = String(inputValue || "").trim();
        if (/^#([0-9a-fA-F]{3}){1,2}$/.test(value)) {
            if (value.length === 4)
                return (
                    "#" +
                    value[1] +
                    value[1] +
                    value[2] +
                    value[2] +
                    value[3] +
                    value[3]
                ).toUpperCase();
            return value.toUpperCase();
        }
        const rgbMatch = value.match(
            /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*[\d.]+\s*)?\)$/
        );
        if (rgbMatch) {
            const clamp = (n) => Math.max(0, Math.min(255, parseInt(n, 10)));
            const toHex = (n) => clamp(n).toString(16).padStart(2, "0");
            return (
                "#" +
                toHex(rgbMatch[1]) +
                toHex(rgbMatch[2]) +
                toHex(rgbMatch[3])
            ).toUpperCase();
        }
        return null;
    }

    function sanitizeStyleAttributeForElement(element) {
        if (!element.hasAttribute("style")) return;
        const tagName = element.tagName.toLowerCase();
        const rules = (element.getAttribute("style") || "")
            .split(";")
            .map((s) => s.trim())
            .filter(Boolean);
        const blockAlignTags = new Set([
            "p",
            "div",
            "blockquote",
            "li",
            "td",
            "th",
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
        ]);
        let colorHex = null;
        let textAlign = null;
        let textDecorationLine = null;
        for (const rule of rules) {
            const parts = rule.split(":");
            const propertyName = parts[0] ? parts[0].trim().toLowerCase() : "";
            const propertyValue = parts[1] ? parts[1].trim() : "";
            if (propertyName === "color" && tagName === "span") {
                const hex = normalizeCssColorToHex(propertyValue);
                if (hex) colorHex = hex;
            }
            if (propertyName === "text-align" && blockAlignTags.has(tagName)) {
                const val = propertyValue.toLowerCase();
                if (
                    val === "left" ||
                    val === "right" ||
                    val === "center" ||
                    val === "justify"
                )
                    textAlign = val;
            }
            if (propertyName === "text-decoration" && tagName === "span") {
                if (/line-through/i.test(propertyValue))
                    textDecorationLine = "line-through";
            }
        }
        const parts = [];
        if (colorHex) parts.push(`color: ${colorHex}`);
        if (textAlign) parts.push(`text-align: ${textAlign}`);
        if (textDecorationLine)
            parts.push(`text-decoration: ${textDecorationLine}`);
        if (parts.length) element.setAttribute("style", parts.join("; "));
        else element.removeAttribute("style");
    }

    function sanitizeElementAttributes(element) {
        [...element.attributes]
            .filter((attribute) => /^on/i.test(attribute.name))
            .forEach((attribute) => element.removeAttribute(attribute.name));
        const tagName = element.tagName.toLowerCase();
        element.removeAttribute("id");
        switch (tagName) {
            case "a": {
                const hrefValue = ensureSafeUrl(
                    element.getAttribute("href") || ""
                );
                element.setAttribute("href", hrefValue);
                element.setAttribute("target", "_blank");
                element.setAttribute("rel", "noopener noreferrer");
                [...element.attributes].forEach((attribute) => {
                    if (
                        !["href", "target", "rel", "style"].includes(
                            attribute.name
                        )
                    )
                        element.removeAttribute(attribute.name);
                });
                sanitizeStyleAttributeForElement(element);
                break;
            }
            case "img": {
                const srcValue = ensureSafeUrl(
                    element.getAttribute("src") || ""
                );
                element.setAttribute("src", srcValue);
                const altValue = element.getAttribute("alt") || "";
                element.setAttribute("alt", altValue);
                [...element.attributes].forEach((attribute) => {
                    if (!["src", "alt"].includes(attribute.name))
                        element.removeAttribute(attribute.name);
                });
                break;
            }
            case "span": {
                sanitizeStyleAttributeForElement(element);
                [...element.attributes].forEach((attribute) => {
                    if (!["style"].includes(attribute.name))
                        element.removeAttribute(attribute.name);
                });
                break;
            }
            case "font": {
                const hexColor = normalizeCssColorToHex(
                    element.getAttribute("color")
                );
                if (hexColor) element.setAttribute("color", hexColor);
                else element.removeAttribute("color");
                [...element.attributes].forEach((attribute) => {
                    if (!["color"].includes(attribute.name))
                        element.removeAttribute(attribute.name);
                });
                break;
            }
            case "table": {
                const filteredClassList = (element.getAttribute("class") || "")
                    .split(/\s+/)
                    .filter((className) =>
                        TABLE_ALLOWED_CLASS_LIST.includes(className)
                    );
                if (filteredClassList.length)
                    element.setAttribute("class", filteredClassList.join(" "));
                else element.removeAttribute("class");
                [...element.attributes].forEach((attribute) => {
                    if (!["class"].includes(attribute.name))
                        element.removeAttribute(attribute.name);
                });
                break;
            }
            case "td":
            case "th": {
                const filteredCellClassList = (
                    element.getAttribute("class") || ""
                )
                    .split(/\s+/)
                    .filter((className) => className === "is-numeric");
                if (filteredCellClassList.length)
                    element.setAttribute(
                        "class",
                        filteredCellClassList.join(" ")
                    );
                else element.removeAttribute("class");
                const colspanValue = element.getAttribute("colspan");
                const rowspanValue = element.getAttribute("rowspan");
                [...element.attributes].forEach((attribute) => {
                    if (
                        !["class", "colspan", "rowspan", "style"].includes(
                            attribute.name
                        )
                    )
                        element.removeAttribute(attribute.name);
                });
                if (colspanValue && !/^\d+$/.test(colspanValue))
                    element.removeAttribute("colspan");
                if (rowspanValue && !/^\d+$/.test(rowspanValue))
                    element.removeAttribute("rowspan");
                sanitizeStyleAttributeForElement(element);
                break;
            }
            default: {
                sanitizeStyleAttributeForElement(element);
                [...element.attributes].forEach((attribute) => {
                    if (!["style"].includes(attribute.name))
                        element.removeAttribute(attribute.name);
                });
            }
        }
    }

    function sanitizeNodeRecursively(node) {
        if (node.nodeType === Node.COMMENT_NODE) {
            node.remove();
            return;
        }
        if (node.nodeType === Node.ELEMENT_NODE) {
            const tagName = node.tagName.toLowerCase();
            if (!ALLOWED_TAG_SET.has(tagName)) {
                const textNode = document.createTextNode(
                    node.textContent || ""
                );
                node.replaceWith(textNode);
                return;
            }
            sanitizeElementAttributes(node);
            [...node.childNodes].forEach((childNode) =>
                sanitizeNodeRecursively(childNode)
            );
        } else {
            [...(node.childNodes || [])].forEach((childNode) =>
                sanitizeNodeRecursively(childNode)
            );
        }
    }

    function sanitizeHtmlStringToSafeHtml(htmlString) {
        const templateElement = document.createElement("template");
        templateElement.innerHTML = String(htmlString || "");
        sanitizeNodeRecursively(templateElement.content);
        return templateElement.innerHTML;
    }

    function applyThemeVariables(editorRootElement, themeOptions) {
        if (!themeOptions) return;
        if (themeOptions.backgroundColor)
            editorRootElement.style.setProperty(
                "--editor-background",
                themeOptions.backgroundColor
            );
        if (themeOptions.textColor)
            editorRootElement.style.setProperty(
                "--text-color",
                themeOptions.textColor
            );
    }

    function WebHackerEditor(rootSelectorOrElement, editorOptions = {}) {
        this.hostContainerElement =
            typeof rootSelectorOrElement === "string"
                ? document.querySelector(rootSelectorOrElement)
                : rootSelectorOrElement;
        if (!this.hostContainerElement)
            throw new Error("WebHackerEditor: контейнер не найден");
        const defaultEditorOptions = {
            placeholderText: "Начните печатать…",
            onChange: null,
            theme: null,
        };
        this.editorOptions = Object.assign(
            {},
            defaultEditorOptions,
            editorOptions
        );
        this.currentSavedSelectionRange = null;
        this.trackedToggleButtonsMap = {};
        this.renderEditorInterface();
        applyThemeVariables(this.editorRootElement, this.editorOptions.theme);
        this.bindEditorEvents();
    }

    WebHackerEditor.prototype.getHTML = function () {
        return sanitizeHtmlStringToSafeHtml(
            this.contentEditableElement.innerHTML
        ).trim();
    };

    WebHackerEditor.prototype.setHTML = function (htmlString) {
        const safeHtml = sanitizeHtmlStringToSafeHtml(htmlString);
        this.contentEditableElement.innerHTML = safeHtml || "";
        this.syncToggleStates();
    };

    WebHackerEditor.prototype.renderEditorInterface = function () {
        const editorRootElement = createElement("div", "webhacker-editor", {
            role: "region",
        });
        const toolbarElement = createElement("div", "webhacker-toolbar");

        const historyGroupElement = createElement(
            "div",
            "webhacker-toolbar__group"
        );
        historyGroupElement.append(
            this.createToolbarButton(
                "fa-solid fa-rotate-left",
                "Отменить",
                () => executeRichCommand("undo")
            ),
            this.createToolbarButton(
                "fa-solid fa-rotate-right",
                "Повторить",
                () => executeRichCommand("redo")
            )
        );

        const textGroupElement = createElement(
            "div",
            "webhacker-toolbar__group"
        );
        textGroupElement.append(
            this.createToolbarButton(
                "fa-solid fa-bold",
                "Жирный",
                () => executeRichCommand("bold"),
                true,
                "bold"
            ),
            this.createToolbarButton(
                "fa-solid fa-italic",
                "Курсив",
                () => executeRichCommand("italic"),
                true,
                "italic"
            ),
            this.createToolbarButton(
                "fa-solid fa-underline",
                "Подчеркнуть",
                () => executeRichCommand("underline"),
                true,
                "underline"
            ),
            this.createToolbarButton(
                "fa-solid fa-strikethrough",
                "Зачеркнуть",
                () => executeRichCommand("strikeThrough"),
                true,
                "strikeThrough"
            ),
            this.createColorDropdown(),
            this.createLinkDropdown(),
            this.createImageDropdown(),
            this.createToolbarButton(
                "fa-solid fa-eraser",
                "Очистить форматирование",
                () => executeRichCommand("removeFormat")
            )
        );

        const structureGroupElement = createElement(
            "div",
            "webhacker-toolbar__group"
        );
        structureGroupElement.append(this.createHeadingDropdown());

        const alignGroupElement = createElement(
            "div",
            "webhacker-toolbar__group"
        );
        alignGroupElement.append(
            this.createToolbarButton(
                "fa-solid fa-align-left",
                "По левому краю",
                () => executeRichCommand("justifyLeft"),
                true,
                "alignLeft"
            ),
            this.createToolbarButton(
                "fa-solid fa-align-center",
                "По центру",
                () => executeRichCommand("justifyCenter"),
                true,
                "alignCenter"
            ),
            this.createToolbarButton(
                "fa-solid fa-align-right",
                "По правому краю",
                () => executeRichCommand("justifyRight"),
                true,
                "alignRight"
            )
        );

        const listsGroupElement = createElement(
            "div",
            "webhacker-toolbar__group"
        );
        listsGroupElement.append(
            this.createToolbarButton(
                "fa-solid fa-list-ul",
                "Маркированный список",
                () => executeRichCommand("insertUnorderedList"),
                true,
                "unorderedList"
            ),
            this.createToolbarButton(
                "fa-solid fa-list-ol",
                "Нумерованный список",
                () => executeRichCommand("insertOrderedList"),
                true,
                "orderedList"
            ),
            this.createTableDropdown()
        );

        toolbarElement.append(
            historyGroupElement,
            this.createSeparator(),
            textGroupElement,
            this.createSeparator(),
            structureGroupElement,
            this.createSeparator(),
            alignGroupElement,
            this.createSeparator(),
            listsGroupElement
        );

        const contentEditableElement = createElement(
            "div",
            "webhacker-content",
            { contenteditable: "true" }
        );
        contentEditableElement.setAttribute(
            "data-placeholder",
            this.editorOptions.placeholderText
        );

        editorRootElement.append(toolbarElement, contentEditableElement);
        this.hostContainerElement.appendChild(editorRootElement);

        this.editorRootElement = editorRootElement;
        this.toolbarElement = toolbarElement;
        this.contentEditableElement = contentEditableElement;
    };

    WebHackerEditor.prototype.createSeparator = function () {
        return createElement("div", "webhacker-toolbar__separator");
    };

    WebHackerEditor.prototype.createTableDropdown = function () {
        const { dropdownWrapperElement, dropdownMenuElement } =
            this.createDropdown("fa-solid fa-table", "Таблица");
        const tablePickerWrapperElement = createElement(
            "div",
            "webhacker-tablepick"
        );
        const tablePickerLabelElement = createElement(
            "div",
            "webhacker-tablepick__label"
        );
        tablePickerLabelElement.textContent = "0×0";
        const tablePickerGridElement = createElement(
            "div",
            "webhacker-tablepick__grid"
        );

        const updateHighlight = (rowsSelected, colsSelected) => {
            tablePickerLabelElement.textContent = `${rowsSelected}×${colsSelected}`;
            tablePickerGridElement
                .querySelectorAll(".webhacker-tablepick__cell")
                .forEach((cellElement) => {
                    const rowIndex = parseInt(
                        cellElement.getAttribute("data-row"),
                        10
                    );
                    const colIndex = parseInt(
                        cellElement.getAttribute("data-col"),
                        10
                    );
                    if (rowIndex <= rowsSelected && colIndex <= colsSelected) {
                        cellElement.classList.add("is-selected");
                    } else {
                        cellElement.classList.remove("is-selected");
                    }
                });
        };

        for (let rowIndex = 1; rowIndex <= 10; rowIndex += 1) {
            for (let colIndex = 1; colIndex <= 10; colIndex += 1) {
                const cellElement = createElement(
                    "button",
                    "webhacker-tablepick__cell",
                    {
                        type: "button",
                        "data-row": String(rowIndex),
                        "data-col": String(colIndex),
                        title: `${rowIndex}×${colIndex}`,
                    }
                );
                cellElement.addEventListener("mouseenter", () =>
                    updateHighlight(rowIndex, colIndex)
                );
                cellElement.addEventListener("click", () => {
                    this.closeAllMenus();
                    this.contentEditableElement.focus();
                    this.restoreSelectionRange(this.currentSavedSelectionRange);
                    this.insertMinimalTable(rowIndex, colIndex);
                    this.emitChange();
                    this.syncToggleStates();
                });
                tablePickerGridElement.appendChild(cellElement);
            }
        }

        tablePickerWrapperElement.append(
            tablePickerLabelElement,
            tablePickerGridElement
        );
        dropdownMenuElement.appendChild(tablePickerWrapperElement);
        return dropdownWrapperElement;
    };

    WebHackerEditor.prototype.createToolbarButton = function (
        iconClassName,
        buttonTitleText,
        onClickHandler,
        trackToggleState = false,
        toggleKey = null
    ) {
        const buttonElement = createElement("button", "webhacker-button", {
            type: "button",
            title: buttonTitleText,
            "aria-label": buttonTitleText,
        });
        const iconElement = createElement("i", iconClassName);
        buttonElement.appendChild(iconElement);
        buttonElement.addEventListener("mousedown", (event) =>
            event.preventDefault()
        );
        buttonElement.addEventListener("click", () => {
            this.contentEditableElement.focus();
            onClickHandler();
            this.emitChange();
            this.syncToggleStates();
        });
        if (trackToggleState && toggleKey)
            this.trackedToggleButtonsMap[toggleKey] = buttonElement;
        return buttonElement;
    };

    WebHackerEditor.prototype.createDropdown = function (
        triggerIconClassName,
        triggerTitleText
    ) {
        const dropdownWrapperElement = createElement(
            "div",
            "webhacker-dropdown"
        );
        const triggerButtonElement = this.createToolbarButton(
            triggerIconClassName,
            triggerTitleText,
            () => {}
        );
        const dropdownMenuElement = createElement(
            "div",
            "webhacker-menu webhacker-menu--hidden"
        );
        triggerButtonElement.addEventListener("click", () => {
            this.currentSavedSelectionRange = this.saveSelectionRange();
            this.toggleMenu(dropdownMenuElement);
        });
        dropdownWrapperElement.append(
            triggerButtonElement,
            dropdownMenuElement
        );
        return { dropdownWrapperElement, dropdownMenuElement };
    };

    WebHackerEditor.prototype.createHeadingDropdown = function () {
        const { dropdownWrapperElement, dropdownMenuElement } =
            this.createDropdown("fa-solid fa-heading", "Заголовки");
        [
            { label: "Абзац", tag: "p" },
            { label: "H1", tag: "h1" },
            { label: "H2", tag: "h2" },
            { label: "H3", tag: "h3" },
        ].forEach(({ label, tag }) => {
            const menuItemElement = createElement(
                "div",
                "webhacker-menu__item"
            );
            menuItemElement.textContent = label;
            menuItemElement.addEventListener("mousedown", (event) =>
                event.preventDefault()
            );
            menuItemElement.addEventListener("click", () => {
                this.closeAllMenus();
                this.contentEditableElement.focus();
                this.restoreSelectionRange(this.currentSavedSelectionRange);
                executeRichCommand("formatBlock", tag.toUpperCase());
                this.emitChange();
                this.syncToggleStates();
            });
            dropdownMenuElement.appendChild(menuItemElement);
        });
        return dropdownWrapperElement;
    };

    WebHackerEditor.prototype.createColorDropdown = function () {
        const { dropdownWrapperElement, dropdownMenuElement } =
            this.createDropdown("fa-solid fa-palette", "Цвет текста");
        const colorContainerElement = createElement("div", "webhacker-color");
        const swatchesContainerElement = createElement(
            "div",
            "webhacker-color__swatches"
        );
        DEFAULT_TEXT_PRESET_COLORS.forEach((hexColor) => {
            const swatchButtonElement = createElement(
                "button",
                "webhacker-swatch",
                { type: "button", "data-color": hexColor, title: hexColor }
            );
            swatchButtonElement.style.background = hexColor;
            swatchButtonElement.addEventListener("click", () => {
                swatchesContainerElement
                    .querySelectorAll(".webhacker-swatch")
                    .forEach((node) => node.removeAttribute("aria-selected"));
                swatchButtonElement.setAttribute("aria-selected", "true");
                colorHexInputElement.value = hexColor.toUpperCase();
                colorPickerInputElement.value = hexColor;
                colorPreviewElement.style.color = hexColor;
            });
            swatchButtonElement.addEventListener("dblclick", () =>
                applySelectedColorAndClose(hexColor)
            );
            swatchesContainerElement.appendChild(swatchButtonElement);
        });
        const colorPreviewElement = createElement(
            "div",
            "webhacker-color__preview"
        );
        colorPreviewElement.textContent = "Aa";
        colorPreviewElement.style.color = "#6a5acd";
        const colorRowElement = createElement("div", "webhacker-color__row");
        const colorHexInputElement = createElement("input", "webhacker-input", {
            type: "text",
            maxlength: "7",
            value: "#6a5acd",
            placeholder: "#RRGGBB",
            "aria-label": "HEX цвет",
        });
        const colorPickerInputElement = createElement("input", null, {
            type: "color",
            value: "#6a5acd",
            "aria-label": "Выбрать цвет",
        });
        colorRowElement.append(colorHexInputElement, colorPickerInputElement);
        const colorActionsRowElement = createElement(
            "div",
            "webhacker-actions"
        );
        const confirmButtonElement = createElement(
            "button",
            "webhacker-button webhacker-button--primary",
            { type: "button" }
        );
        confirmButtonElement.textContent = "OK";
        const resetButtonElement = createElement(
            "button",
            "webhacker-button webhacker-button--ghost",
            { type: "button" }
        );
        resetButtonElement.textContent = "Сброс";
        colorActionsRowElement.append(confirmButtonElement, resetButtonElement);
        colorContainerElement.append(
            swatchesContainerElement,
            colorPreviewElement,
            colorRowElement,
            colorActionsRowElement
        );
        dropdownMenuElement.appendChild(colorContainerElement);
        function handleHexInputChange() {
            const value = colorHexInputElement.value.trim();
            if (!/^#[0-9a-fA-F]{6}$/.test(value)) return;
            colorPickerInputElement.value = value;
            colorPreviewElement.style.color = value;
        }
        function handlePickerInputChange() {
            const value = colorPickerInputElement.value;
            colorHexInputElement.value = value.toUpperCase();
            colorPreviewElement.style.color = value;
        }
        colorHexInputElement.addEventListener("input", handleHexInputChange);
        colorPickerInputElement.addEventListener(
            "input",
            handlePickerInputChange
        );
        const applySelectedColorAndClose = (hexColor) => {
            if (!/^#[0-9a-fA-F]{6}$/.test(hexColor)) return;
            this.closeAllMenus();
            this.contentEditableElement.focus();
            this.restoreSelectionRange(this.currentSavedSelectionRange);
            executeRichCommand("foreColor", hexColor);
            this.emitChange();
            this.syncToggleStates();
        };
        confirmButtonElement.addEventListener("click", () => {
            const hexColor = colorHexInputElement.value.trim();
            if (!/^#[0-9a-fA-F]{6}$/.test(hexColor)) {
                colorHexInputElement.focus();
                return;
            }
            applySelectedColorAndClose(hexColor);
        });
        resetButtonElement.addEventListener("click", () => {
            this.closeAllMenus();
            this.contentEditableElement.focus();
            this.restoreSelectionRange(this.currentSavedSelectionRange);
            executeRichCommand("removeFormat");
            this.emitChange();
            this.syncToggleStates();
        });
        return dropdownWrapperElement;
    };

    WebHackerEditor.prototype.createLinkDropdown = function () {
        const { dropdownWrapperElement, dropdownMenuElement } =
            this.createDropdown("fa-solid fa-link", "Ссылка");
        const linkFormElement = createElement("div", "webhacker-form");
        const linkUrlInputElement = createElement("input", "webhacker-input", {
            type: "text",
            placeholder: "https://пример.ру",
        });
        const linkTextInputElement = createElement("input", "webhacker-input", {
            type: "text",
            placeholder: "Текст ссылки (необязательно)",
        });
        const linkActionsRowElement = createElement("div", "webhacker-actions");
        const linkConfirmButtonElement = createElement(
            "button",
            "webhacker-button webhacker-button--primary",
            { type: "button" }
        );
        linkConfirmButtonElement.textContent = "OK";
        const linkRemoveButtonElement = createElement(
            "button",
            "webhacker-button webhacker-button--ghost",
            { type: "button" }
        );
        linkRemoveButtonElement.textContent = "Удалить";
        linkActionsRowElement.append(
            linkConfirmButtonElement,
            linkRemoveButtonElement
        );
        linkFormElement.append(
            linkUrlInputElement,
            linkTextInputElement,
            linkActionsRowElement
        );
        dropdownMenuElement.appendChild(linkFormElement);
        linkConfirmButtonElement.addEventListener("click", () => {
            let hrefValue = linkUrlInputElement.value.trim();
            const labelValue = linkTextInputElement.value.trim();
            if (!hrefValue) return;
            hrefValue = ensureSafeUrl(hrefValue);
            this.closeAllMenus();
            this.contentEditableElement.focus();
            this.restoreSelectionRange(this.currentSavedSelectionRange);
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) return;
            const visibleText = selection.isCollapsed
                ? hrefValue
                : selection.toString();
            const linkHtml = `<a href="${hrefValue}" target="_blank" rel="noopener noreferrer">${escapeHtml(
                labelValue || visibleText
            )}</a>`;
            executeRichCommand("insertHTML", linkHtml);
            this.emitChange();
            this.syncToggleStates();
        });
        linkRemoveButtonElement.addEventListener("click", () => {
            this.closeAllMenus();
            this.contentEditableElement.focus();
            this.restoreSelectionRange(this.currentSavedSelectionRange);
            executeRichCommand("unlink");
            this.emitChange();
            this.syncToggleStates();
        });
        return dropdownWrapperElement;
    };

    WebHackerEditor.prototype.createImageDropdown = function () {
        const { dropdownWrapperElement, dropdownMenuElement } =
            this.createDropdown("fa-solid fa-image", "Изображение");
        const imageFormElement = createElement("div", "webhacker-form");
        const imageUrlInputElement = createElement("input", "webhacker-input", {
            type: "text",
            placeholder: "URL изображения",
        });
        const imageFileInputElement = createElement("input", "webhacker-file", {
            type: "file",
            accept: "image/*",
        });
        const imageActionsRowElement = createElement(
            "div",
            "webhacker-actions"
        );
        const imageConfirmButtonElement = createElement(
            "button",
            "webhacker-button webhacker-button--primary",
            { type: "button" }
        );
        imageConfirmButtonElement.textContent = "OK";
        const imageRemoveButtonElement = createElement(
            "button",
            "webhacker-button webhacker-button--ghost",
            { type: "button" }
        );
        imageRemoveButtonElement.textContent = "Удалить";
        imageActionsRowElement.append(
            imageConfirmButtonElement,
            imageRemoveButtonElement
        );
        imageFormElement.append(
            imageUrlInputElement,
            imageFileInputElement,
            imageActionsRowElement
        );
        dropdownMenuElement.appendChild(imageFormElement);
        const insertImageAtSelection = (srcValue) => {
            this.closeAllMenus();
            this.contentEditableElement.focus();
            this.restoreSelectionRange(this.currentSavedSelectionRange);
            executeRichCommand(
                "insertHTML",
                `<img src="${escapeHtml(srcValue)}" alt="">`
            );
            this.emitChange();
            this.syncToggleStates();
        };
        imageConfirmButtonElement.addEventListener("click", () => {
            const urlValue = imageUrlInputElement.value.trim();
            if (urlValue) {
                insertImageAtSelection(ensureSafeUrl(urlValue));
                return;
            }
            const fileObject =
                imageFileInputElement.files && imageFileInputElement.files[0];
            if (!fileObject) return;
            const fileReader = new FileReader();
            fileReader.onload = () => insertImageAtSelection(fileReader.result);
            fileReader.readAsDataURL(fileObject);
        });
        imageRemoveButtonElement.addEventListener("click", () => {
            this.closeAllMenus();
            this.contentEditableElement.focus();
            this.restoreSelectionRange(this.currentSavedSelectionRange);
            const selection = window.getSelection();
            let node = selection && selection.anchorNode;
            if (node && node.nodeType === 3) node = node.parentNode;
            const imageElement = node ? node.closest("img") : null;
            if (imageElement) imageElement.remove();
            this.emitChange();
            this.syncToggleStates();
        });
        return dropdownWrapperElement;
    };

    WebHackerEditor.prototype.toggleMenu = function (dropdownMenuElement) {
        this.closeAllMenus(dropdownMenuElement);
        dropdownMenuElement.classList.toggle("webhacker-menu--hidden");
        const onOutsideMouseDown = (event) => {
            if (!dropdownMenuElement.contains(event.target)) {
                this.closeAllMenus();
                document.removeEventListener(
                    "mousedown",
                    onOutsideMouseDown,
                    true
                );
            }
        };
        document.addEventListener("mousedown", onOutsideMouseDown, true);
    };

    WebHackerEditor.prototype.closeAllMenus = function (
        exceptDropdownMenuElement
    ) {
        this.editorRootElement
            .querySelectorAll(".webhacker-menu")
            .forEach((menuElement) => {
                if (menuElement !== exceptDropdownMenuElement)
                    menuElement.classList.add("webhacker-menu--hidden");
            });
    };

    WebHackerEditor.prototype.bindEditorEvents = function () {
        this.contentEditableElement.addEventListener("input", () => {
            this.emitChange();
            this.syncToggleStates();
        });
        this.contentEditableElement.addEventListener("paste", (event) => {
            event.preventDefault();
            const clipboardData = event.clipboardData || window.clipboardData;
            const htmlData = clipboardData.getData("text/html");
            const textData = clipboardData.getData("text/plain");
            if (htmlData) {
                const safeHtml = sanitizeHtmlStringToSafeHtml(htmlData);
                document.execCommand("insertHTML", false, safeHtml);
            } else if (textData) {
                const safeTextHtml = escapeHtml(textData).replace(
                    /\r?\n/g,
                    "<br>"
                );
                document.execCommand("insertHTML", false, safeTextHtml);
            }
            this.emitChange();
            this.syncToggleStates();
        });
        ["mouseup", "keyup"].forEach((eventName) => {
            this.contentEditableElement.addEventListener(eventName, () =>
                this.syncToggleStates()
            );
        });
        document.addEventListener("selectionchange", () => {
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) return;
            const anchorNode =
                selection.anchorNode && selection.anchorNode.nodeType === 3
                    ? selection.anchorNode.parentNode
                    : selection.anchorNode;
            if (anchorNode && this.contentEditableElement.contains(anchorNode))
                this.syncToggleStates();
        });
        this.contentEditableElement.addEventListener("keydown", (event) => {
            const pressedKey = event.key.toLowerCase();
            const hasCommandModifier = event.ctrlKey || event.metaKey;
            if (hasCommandModifier && pressedKey === "b") {
                event.preventDefault();
                executeRichCommand("bold");
                this.emitChange();
                this.syncToggleStates();
            }
            if (hasCommandModifier && pressedKey === "i") {
                event.preventDefault();
                executeRichCommand("italic");
                this.emitChange();
                this.syncToggleStates();
            }
            if (hasCommandModifier && pressedKey === "u") {
                event.preventDefault();
                executeRichCommand("underline");
                this.emitChange();
                this.syncToggleStates();
            }
            if (hasCommandModifier && pressedKey === "z" && !event.shiftKey) {
                event.preventDefault();
                executeRichCommand("undo");
                this.emitChange();
                this.syncToggleStates();
            }
            if (
                (hasCommandModifier && pressedKey === "y") ||
                (hasCommandModifier && event.shiftKey && pressedKey === "z")
            ) {
                event.preventDefault();
                executeRichCommand("redo");
                this.emitChange();
                this.syncToggleStates();
            }
        });
    };

    WebHackerEditor.prototype.emitChange = function () {
        if (typeof this.editorOptions.onChange === "function")
            this.editorOptions.onChange(this.getHTML());
    };

    WebHackerEditor.prototype.syncToggleStates = function () {
        const readCommandState = (commandName) =>
            String(document.queryCommandState(commandName));
        const updateToggleButton = (key, value) => {
            if (this.trackedToggleButtonsMap[key])
                this.trackedToggleButtonsMap[key].setAttribute(
                    "aria-pressed",
                    value
                );
        };
        updateToggleButton("bold", readCommandState("bold"));
        updateToggleButton("italic", readCommandState("italic"));
        updateToggleButton("underline", readCommandState("underline"));
        updateToggleButton("strikeThrough", readCommandState("strikeThrough"));
        updateToggleButton(
            "unorderedList",
            readCommandState("insertUnorderedList")
        );
        updateToggleButton(
            "orderedList",
            readCommandState("insertOrderedList")
        );
        updateToggleButton("alignLeft", readCommandState("justifyLeft"));
        updateToggleButton("alignCenter", readCommandState("justifyCenter"));
        updateToggleButton("alignRight", readCommandState("justifyRight"));
    };

    WebHackerEditor.prototype.insertMinimalTable = function (
        rowCount = 2,
        columnCount = 2
    ) {
        let tableHeadHtml = "<thead><tr>";
        for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1)
            tableHeadHtml += "<th>Заголовок</th>";
        tableHeadHtml += "</tr></thead>";
        let tableBodyHtml = "<tbody>";
        for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
            tableBodyHtml += "<tr>";
            for (
                let columnIndex = 0;
                columnIndex < columnCount;
                columnIndex += 1
            )
                tableBodyHtml += "<td>Ячейка</td>";
            tableBodyHtml += "</tr>";
        }
        tableBodyHtml += "</tbody>";
        const htmlToInsert = `<table class="wh-table">${tableHeadHtml}${tableBodyHtml}</table>`;
        document.execCommand("insertHTML", false, htmlToInsert);
    };

    WebHackerEditor.prototype.saveSelectionRange = function () {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return null;
        return selection.getRangeAt(0).cloneRange();
    };

    WebHackerEditor.prototype.restoreSelectionRange = function (savedRange) {
        if (!savedRange) return;
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(savedRange);
    };

    WebHackerEditor.prototype.setTheme = function (themeOptions) {
        applyThemeVariables(this.editorRootElement, themeOptions || null);
    };

    window.WebHackerEditor = WebHackerEditor;
    window.sanitizeHtmlStringToSafeHtml = sanitizeHtmlStringToSafeHtml;
})();
