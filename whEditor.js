(function () {
    const DEFAULT_TEXT_PRESET_COLORS = [
        "#6A5ACD",
        "#2563EB",
        "#22D3EE",
        "#10B981",
        "#84CC16",
        "#F59E0B",
        "#EF4444",
        "#F472B6",
        "#A855F7",
        "#FB7185",
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

    function sanitizeStyleAttributeForElement(element, options = {}) {
        if (!element.hasAttribute("style")) return;
        const stripColors = !!options.stripColors;

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

        for (const rule of rules) {
            const parts = rule.split(":");
            const propertyName = parts[0] ? parts[0].trim().toLowerCase() : "";
            const propertyValue = parts[1] ? parts[1].trim() : "";

            if (
                !stripColors &&
                propertyName === "color" &&
                tagName === "span"
            ) {
                const hex = normalizeCssColorToHex(propertyValue);
                if (hex) colorHex = hex;
            }

            if (/^background(-color)?$/.test(propertyName)) {
                continue;
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

            if (propertyName === "text-decoration") {
                continue;
            }
        }

        const parts = [];
        if (colorHex) parts.push(`color: ${colorHex}`);
        if (textAlign) parts.push(`text-align: ${textAlign}`);

        if (parts.length) element.setAttribute("style", parts.join("; "));
        else element.removeAttribute("style");
    }

    function sanitizeElementAttributes(element, options = {}) {
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
                sanitizeStyleAttributeForElement(element, options);
                break;
            }
            case "img": {
                const srcValue = ensureSafeUrl(
                    element.getAttribute("src") || ""
                );
                const isDataImage = /^data:image\//i.test(srcValue);
                const isHttpImage =
                    /^https?:\/\//i.test(srcValue) &&
                    /\.(png|jpe?g|gif|webp|svg)$/i.test(srcValue);
                if (!(isDataImage || isHttpImage)) {
                    element.remove();
                    break;
                }
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
                sanitizeStyleAttributeForElement(element, options);
                [...element.attributes].forEach((attribute) => {
                    if (!["style"].includes(attribute.name))
                        element.removeAttribute(attribute.name);
                });
                break;
            }
            case "font": {
                const hexColor = options.stripColors
                    ? null
                    : normalizeCssColorToHex(element.getAttribute("color"));
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

                sanitizeStyleAttributeForElement(element, options);
                break;
            }
            default: {
                sanitizeStyleAttributeForElement(element, options);
                [...element.attributes].forEach((attribute) => {
                    if (!["style"].includes(attribute.name))
                        element.removeAttribute(attribute.name);
                });
            }
        }
    }

    function sanitizeNodeRecursively(node, options = {}) {
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

            sanitizeElementAttributes(node, options);
            [...node.childNodes].forEach((childNode) =>
                sanitizeNodeRecursively(childNode, options)
            );
        } else {
            [...(node.childNodes || [])].forEach((childNode) =>
                sanitizeNodeRecursively(childNode, options)
            );
        }
    }

    function sanitizeHtmlStringToSafeHtml(htmlString, options = {}) {
        const templateElement = document.createElement("template");
        templateElement.innerHTML = String(htmlString || "");
        sanitizeNodeRecursively(templateElement.content, options);
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
            this.createColorDropdown(),
            this.createLinkDropdown(),
            this.createDisabledImageButton()
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

        const betaBadge = createElement("span", "webhacker-badge--beta", {
            title: "Скоро",
        });
        betaBadge.textContent = "БЕТА";
        toolbarElement.append(betaBadge);

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

    WebHackerEditor.prototype.createDisabledImageButton = function () {
        const buttonElement = createElement("button", "webhacker-button", {
            type: "button",
            title: "Скоро",
            "aria-label": "Изображение (скоро)",
            "aria-disabled": "true",
            "data-tooltip": "Скоро",
        });
        const iconElement = createElement("i", "fa-solid fa-image");
        buttonElement.appendChild(iconElement);
        buttonElement.disabled = true;
        return buttonElement;
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

        const applySelectedColorAndClose = (hexColor) => {
            this.closeAllMenus();
            this.contentEditableElement.focus();
            this.restoreSelectionRange(this.currentSavedSelectionRange);
            executeRichCommand("foreColor", hexColor);
            this.emitChange();
            this.syncToggleStates();
        };

        DEFAULT_TEXT_PRESET_COLORS.forEach((hexColor) => {
            const swatchButtonElement = createElement(
                "button",
                "webhacker-swatch",
                {
                    type: "button",
                    "data-color": hexColor,
                    title: hexColor,
                }
            );
            swatchButtonElement.style.background = hexColor;
            swatchButtonElement.addEventListener("click", () =>
                applySelectedColorAndClose(hexColor)
            );
            swatchesContainerElement.appendChild(swatchButtonElement);
        });

        colorContainerElement.append(swatchesContainerElement);
        dropdownMenuElement.appendChild(colorContainerElement);
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

        const linkTriggerBtn =
            dropdownWrapperElement.querySelector(".webhacker-button");
        linkTriggerBtn.addEventListener("click", () => {
            const sel = window.getSelection();
            let node = sel && sel.anchorNode;
            if (node && node.nodeType === 3) node = node.parentNode;
            const a = node && node.closest ? node.closest("a") : null;

            linkUrlInputElement.value = a ? a.getAttribute("href") || "" : "";
            linkTextInputElement.value = a
                ? a.textContent || ""
                : sel && !sel.isCollapsed
                ? sel.toString()
                : "";
        });

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
            linkUrlInputElement.value = "";
            linkTextInputElement.value = "";
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
                const safeHtml = sanitizeHtmlStringToSafeHtml(htmlData, {
                    stripColors: true,
                });
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

        this.contentEditableElement.addEventListener("mousedown", (event) => {
            const targetCellElement =
                event.target && event.target.closest
                    ? event.target.closest("td,th")
                    : null;
            if (targetCellElement) {
                this.ensureCaretAnchorInTableCell(targetCellElement, false);
            }
        });

        document.addEventListener("selectionchange", () => {
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) return;

            const anchorNode =
                selection.anchorNode && selection.anchorNode.nodeType === 3
                    ? selection.anchorNode.parentNode
                    : selection.anchorNode;

            if (
                anchorNode &&
                this.contentEditableElement.contains(anchorNode)
            ) {
                this.syncToggleStates();

                const tableCellElement =
                    anchorNode.closest && anchorNode.closest("td,th");
                if (tableCellElement) {
                    this.ensureCaretAnchorInTableCell(tableCellElement, false);
                }
            }
        });

        this.contentEditableElement.addEventListener("keydown", (event) => {
            const pressedKey = event.key.toLowerCase();
            const hasCommandModifier = event.ctrlKey || event.metaKey;

            if (event.key === "Enter" && !event.shiftKey) {
                const sel = window.getSelection();
                if (sel && sel.rangeCount) {
                    let node = sel.anchorNode;
                    if (node && node.nodeType === 3) node = node.parentNode;
                    const li = node && node.closest ? node.closest("li") : null;
                    if (li) {
                        const text = li.textContent
                            .replace(/\u200B/g, "")
                            .trim();
                        if (text === "") {
                            event.preventDefault();
                            executeRichCommand("outdent");
                            this.emitChange();
                            this.syncToggleStates();
                            return;
                        }
                    }
                }
            }

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
        const tableElement = document.createElement("table");
        tableElement.className = "wh-table";

        const tableHeadElement = document.createElement("thead");
        const headerRowElement = document.createElement("tr");
        for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
            const headerCellElement = document.createElement("th");
            headerRowElement.appendChild(headerCellElement);
        }
        tableHeadElement.appendChild(headerRowElement);
        tableElement.appendChild(tableHeadElement);

        const tableBodyElement = document.createElement("tbody");
        for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
            const bodyRowElement = document.createElement("tr");
            for (
                let columnIndex = 0;
                columnIndex < columnCount;
                columnIndex += 1
            ) {
                const bodyCellElement = document.createElement("td");
                bodyRowElement.appendChild(bodyCellElement);
            }
            tableBodyElement.appendChild(bodyRowElement);
        }
        tableElement.appendChild(tableBodyElement);

        const selection = window.getSelection();
        if (selection && selection.rangeCount) {
            const insertionRange = selection.getRangeAt(0);
            insertionRange.deleteContents();
            insertionRange.insertNode(tableElement);
        } else {
            this.contentEditableElement.appendChild(tableElement);
        }

        const firstCellElement =
            tableElement.querySelector("thead th") ||
            tableElement.querySelector("tbody td");

        if (firstCellElement) {
            if (firstCellElement.childNodes.length === 0) {
                const zeroWidthSpaceTextNode =
                    document.createTextNode("\u200B");
                firstCellElement.appendChild(zeroWidthSpaceTextNode);
            }

            const caretTextNode = firstCellElement.firstChild;
            const selectionRange = document.createRange();
            selectionRange.setStart(
                caretTextNode,
                caretTextNode.nodeValue.length
            );
            selectionRange.collapse(true);

            const windowSelection = window.getSelection();
            windowSelection.removeAllRanges();
            windowSelection.addRange(selectionRange);
        }
    };

    WebHackerEditor.prototype.ensureCaretAnchorInTableCell = function (
        cellElement,
        shouldPlaceCaret = false
    ) {
        if (!cellElement) return;

        let textNode = cellElement.firstChild;
        if (!textNode || textNode.nodeType !== 3) {
            textNode = document.createTextNode("\u200B");
            cellElement.insertBefore(textNode, cellElement.firstChild || null);
        } else if (textNode.nodeValue.length === 0) {
            textNode.nodeValue = "\u200B";
        }

        if (shouldPlaceCaret) {
            const selectionRange = document.createRange();
            selectionRange.setStart(textNode, textNode.nodeValue.length);
            selectionRange.collapse(true);
            const windowSelection = window.getSelection();
            windowSelection.removeAllRanges();
            windowSelection.addRange(selectionRange);
        }
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
