(function () {
    "use strict";

    function createElement(tagName, className, attributes) {
        const element = document.createElement(tagName);
        if (className) element.className = className;
        if (attributes) Object.keys(attributes).forEach((key) => element.setAttribute(key, attributes[key]));
        return element;
    }

    function executeCommand(commandName, commandValue = null) {
        document.execCommand(commandName, false, commandValue);
    }

    function isValidHex(hexValue) {
        return /^#([0-9a-fA-F]{6})$/.test(hexValue);
    }

    function saveSelectionRange() {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return null;
        return selection.getRangeAt(0).cloneRange();
    }

    function restoreSelectionRange(range) {
        if (!range) return;
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }

    function isSelectionInside(selector) {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return false;
        let node = selection.anchorNode;
        if (node && node.nodeType === 3) node = node.parentNode;
        return !!(node && node.closest(selector));
    }

    function wrapCurrentBlockAs(tagName) {
        executeCommand("formatBlock", tagName.toUpperCase());
    }

    function findClosestBlockElement(node) {
        if (!node) return null;
        if (node.nodeType === 3) node = node.parentNode;
        return node.closest("p,div,h1,h2,h3,h4,h5,h6,li,pre,blockquote");
    }

    function toggleCodeBlock() {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        let node = selection.anchorNode;
        if (node && node.nodeType === 3) node = node.parentNode;
        const existing = node ? node.closest("pre") : null;
        if (existing) {
            const paragraph = document.createElement("p");
            paragraph.textContent = existing.textContent;
            existing.replaceWith(paragraph);
        } else {
            const range = selection.getRangeAt(0);
            const contentText = range.toString() || "код…";
            const pre = document.createElement("pre");
            const code = document.createElement("code");
            code.textContent = contentText;
            pre.appendChild(code);
            range.deleteContents();
            range.insertNode(pre);
            selection.removeAllRanges();
        }
    }

    function toggleQuoteBlock() {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        let node = selection.anchorNode;
        if (node && node.nodeType === 3) node = node.parentNode;
        const existing = node ? node.closest("blockquote") : null;
        if (existing) {
            const fragment = document.createDocumentFragment();
            while (existing.firstChild) fragment.appendChild(existing.firstChild);
            existing.replaceWith(fragment);
        } else {
            let block = findClosestBlockElement(node);
            if (!block) {
                executeCommand("formatBlock", "P");
                block = findClosestBlockElement(node);
            }
            const wrapper = document.createElement("blockquote");
            block.replaceWith(wrapper);
            wrapper.appendChild(block);
        }
    }

    function insertTable(rowCount = 2, columnCount = 2) {
        let html = "<table><thead><tr>";
        for (let c = 0; c < columnCount; c++) html += "<th>Заголовок</th>";
        html += "</tr></thead><tbody>";
        for (let r = 0; r < rowCount; r++) {
            html += "<tr>";
            for (let c = 0; c < columnCount; c++) html += "<td>Ячейка</td>";
            html += "</tr>";
        }
        html += "</tbody></table>";
        executeCommand("insertHTML", html);
    }

    class WebHackerEditor {
        constructor(rootSelectorOrElement, options = {}) {
            this.rootElement = typeof rootSelectorOrElement === "string"
                ? document.querySelector(rootSelectorOrElement)
                : rootSelectorOrElement;
            if (!this.rootElement) throw new Error("WebHackerEditor: контейнер не найден");
            this.options = Object.assign({ placeholder: "Начните печатать…", onChange: null }, options);
            this.savedSelectionRange = null;
            this.trackedButtonsMap = {};
            this.renderInterface();
            this.bindEvents();
        }

        renderInterface() {
            const editorContainerElement = createElement("div", "wh-editor", { role: "region" });
            const toolbarElement = createElement("div", "wh-editor__toolbar");

            const historyGroupElement = createElement("div", "wh-editor__group");
            historyGroupElement.append(
                this.createToolbarButton("fa-solid fa-rotate-left", "Отменить", () => executeCommand("undo")),
                this.createToolbarButton("fa-solid fa-rotate-right", "Повторить", () => executeCommand("redo"))
            );

            const textGroupElement = createElement("div", "wh-editor__group");
            textGroupElement.append(
                this.createToolbarButton("fa-solid fa-bold", "Жирный", () => executeCommand("bold"), true, "bold"),
                this.createToolbarButton("fa-solid fa-italic", "Курсив", () => executeCommand("italic"), true, "italic"),
                this.createToolbarButton("fa-solid fa-underline", "Подчеркнуть", () => executeCommand("underline"), true, "underline"),
                this.createToolbarButton("fa-solid fa-strikethrough", "Зачеркнуть", () => executeCommand("strikeThrough"), true, "strikeThrough"),
                this.createColorDropdown(),
                this.createToolbarButton("fa-solid fa-eraser", "Очистить форматирование", () => executeCommand("removeFormat"))
            );

            const structureGroupElement = createElement("div", "wh-editor__group");
            structureGroupElement.append(
                this.createHeadingDropdown(),
                this.createToolbarButton("fa-solid fa-quote-left", "Цитата", () => toggleQuoteBlock(), true, "blockquote"),
                this.createToolbarButton("fa-solid fa-code", "Код", () => toggleCodeBlock(), true, "pre")
            );

            const listsGroupElement = createElement("div", "wh-editor__group");
            listsGroupElement.append(
                this.createToolbarButton("fa-solid fa-list-ul", "Маркированный список", () => executeCommand("insertUnorderedList"), true, "unorderedList"),
                this.createToolbarButton("fa-solid fa-list-ol", "Нумерованный список", () => executeCommand("insertOrderedList"), true, "orderedList"),
                this.createToolbarButton("fa-solid fa-table", "Таблица 2×2", () => insertTable())
            );

            toolbarElement.append(
                historyGroupElement,
                this.createSeparator(),
                textGroupElement,
                this.createSeparator(),
                structureGroupElement,
                this.createSeparator(),
                listsGroupElement
            );

            const contentElement = createElement("div", "wh-editor__content", { contenteditable: "true" });
            contentElement.setAttribute("data-placeholder", this.options.placeholder);

            editorContainerElement.append(toolbarElement, contentElement);
            this.rootElement.appendChild(editorContainerElement);

            this.editorContainerElement = editorContainerElement;
            this.toolbarElement = toolbarElement;
            this.contentElement = contentElement;
        }

        createSeparator() {
            return createElement("div", "wh-editor__separator");
        }

        createToolbarButton(iconClass, title, onClick, trackActive = false, trackKey = null) {
            const buttonElement = createElement("button", "wh-editor__button", { type: "button", title, "aria-label": title });
            const iconElement = createElement("i", `wh-editor__icon ${iconClass}`);
            buttonElement.appendChild(iconElement);
            buttonElement.addEventListener("mousedown", (event) => event.preventDefault());
            buttonElement.addEventListener("click", () => {
                this.contentElement.focus();
                onClick();
                this.emitChange();
                this.syncActiveStates();
            });
            if (trackActive && trackKey) this.trackedButtonsMap[trackKey] = buttonElement;
            return buttonElement;
        }

        createDropdownButton(iconClass, title) {
            const wrapperElement = createElement("div", "wh-editor__dropdown");
            const triggerButton = this.createToolbarButton(iconClass, title, () => {});
            wrapperElement.appendChild(triggerButton);
            return { wrapperElement, triggerButton };
        }

        createHeadingDropdown() {
            const { wrapperElement, triggerButton } = this.createDropdownButton("fa-solid fa-heading", "Заголовки");
            const menuElement = createElement("div", "wh-editor__menu wh-hidden");

            [
                { label: "Абзац", action: () => wrapCurrentBlockAs("p") },
                { label: "H1", action: () => wrapCurrentBlockAs("h1") },
                { label: "H2", action: () => wrapCurrentBlockAs("h2") },
                { label: "H3", action: () => wrapCurrentBlockAs("h3") }
            ].forEach((item) => {
                const itemElement = createElement("div", "wh-editor__menu-item");
                itemElement.textContent = item.label;
                itemElement.addEventListener("mousedown", (event) => event.preventDefault());
                itemElement.addEventListener("click", () => {
                    this.closeAllMenus();
                    this.contentElement.focus();
                    item.action();
                    this.emitChange();
                    this.syncActiveStates();
                });
                menuElement.appendChild(itemElement);
            });

            triggerButton.addEventListener("click", () => {
                this.savedSelectionRange = saveSelectionRange();
                this.toggleMenu(menuElement);
            });

            wrapperElement.appendChild(menuElement);
            return wrapperElement;
        }

        createColorDropdown() {
            const { wrapperElement, triggerButton } = this.createDropdownButton("fa-solid fa-palette", "Цвет текста");
            const menuElement = createElement("div", "wh-editor__menu wh-hidden");
            const colorContainerElement = createElement("div", "wh-editor__color");

            const presetColorList = [
                "#111827", "#374151", "#6B7280", "#9CA3AF", "#D1D5DB", "#F3F4F6", "#FFFFFF",
                "#6A5ACD",
                "#2563EB", "#0891B2", "#10B981", "#F59E0B", "#EF4444"
            ];

            const swatchesElement = createElement("div", "wh-editor__swatches");
            presetColorList.forEach((hex) => {
                const swatchButton = createElement("button", "wh-editor__swatch", { type: "button", "data-color": hex, title: hex });
                swatchButton.style.background = hex;
                swatchButton.addEventListener("click", () => {
                    this.selectSwatch(swatchesElement, swatchButton);
                    hexInputElement.value = hex.toUpperCase();
                    colorPickerInputElement.value = hex;
                    colorPreviewElement.style.color = hex;
                });
                swatchButton.addEventListener("dblclick", () => this.applyColorAndClose(hex));
                swatchesElement.appendChild(swatchButton);
            });

            const colorRowElement = createElement("div", "wh-editor__color-row");
            const hexInputElement = createElement("input", null, { type: "text", value: "#6a5acd", maxlength: "7", placeholder: "#RRGGBB", "aria-label": "HEX цвет" });
            const colorPickerInputElement = createElement("input", null, { type: "color", value: "#6a5acd", "aria-label": "Выбрать цвет" });
            colorRowElement.append(hexInputElement, colorPickerInputElement);

            const colorPreviewElement = createElement("div", "wh-editor__color-preview");
            colorPreviewElement.textContent = "Aa";
            colorPreviewElement.style.color = hexInputElement.value;

            const colorActionsElement = createElement("div", "wh-editor__color-actions");
            const applyButtonElement = createElement("button", "wh-editor__button wh-editor__button--primary", { type: "button" });
            applyButtonElement.textContent = "OK";
            const clearButtonElement = createElement("button", "wh-editor__button wh-editor__button--ghost", { type: "button" });
            clearButtonElement.textContent = "Сброс";
            colorActionsElement.append(applyButtonElement, clearButtonElement);

            colorContainerElement.append(swatchesElement, colorPreviewElement, colorRowElement, colorActionsElement);
            menuElement.appendChild(colorContainerElement);

            const syncInputs = (source) => {
                if (source === "hex" && isValidHex(hexInputElement.value)) {
                    colorPickerInputElement.value = hexInputElement.value;
                    colorPreviewElement.style.color = hexInputElement.value;
                    this.highlightSwatch(swatchesElement, hexInputElement.value);
                }
                if (source === "picker") {
                    hexInputElement.value = colorPickerInputElement.value.toUpperCase();
                    colorPreviewElement.style.color = colorPickerInputElement.value;
                    this.highlightSwatch(swatchesElement, colorPickerInputElement.value);
                }
            };

            hexInputElement.addEventListener("input", () => syncInputs("hex"));
            colorPickerInputElement.addEventListener("input", () => syncInputs("picker"));

            triggerButton.addEventListener("click", () => {
                this.savedSelectionRange = saveSelectionRange();
                this.toggleMenu(menuElement);
            });

            applyButtonElement.addEventListener("click", () => {
                const hex = hexInputElement.value;
                if (!isValidHex(hex)) {
                    hexInputElement.focus();
                    return;
                }
                this.applyColorAndClose(hex);
            });

            clearButtonElement.addEventListener("click", () => {
                this.closeAllMenus();
                this.contentElement.focus();
                restoreSelectionRange(this.savedSelectionRange);
                executeCommand("removeFormat");
                this.emitChange();
                this.syncActiveStates();
            });

            wrapperElement.appendChild(menuElement);
            return wrapperElement;
        }

        applyColorAndClose(hex) {
            this.closeAllMenus();
            this.contentElement.focus();
            restoreSelectionRange(this.savedSelectionRange);
            executeCommand("foreColor", hex);
            this.emitChange();
            this.syncActiveStates();
        }

        selectSwatch(swatchesElement, swatchButton) {
            Array.from(swatchesElement.querySelectorAll(".wh-editor__swatch")).forEach((button) => button.removeAttribute("aria-selected"));
            swatchButton.setAttribute("aria-selected", "true");
        }

        highlightSwatch(swatchesElement, hex) {
            let found = false;
            Array.from(swatchesElement.querySelectorAll(".wh-editor__swatch")).forEach((button) => {
                if (button.getAttribute("data-color").toLowerCase() === hex.toLowerCase()) {
                    button.setAttribute("aria-selected", "true");
                    found = true;
                } else {
                    button.removeAttribute("aria-selected");
                }
            });
            return found;
        }

        toggleMenu(menuElement) {
            this.closeAllMenus(menuElement);
            menuElement.classList.toggle("wh-hidden");
            const onOutside = (event) => {
                if (!menuElement.contains(event.target)) {
                    this.closeAllMenus();
                    document.removeEventListener("mousedown", onOutside, true);
                }
            };
            document.addEventListener("mousedown", onOutside, true);
        }

        closeAllMenus(exceptElement) {
            Array.from(this.editorContainerElement.querySelectorAll(".wh-editor__menu")).forEach((menu) => {
                if (menu !== exceptElement) menu.classList.add("wh-hidden");
            });
        }

        bindEvents() {
            this.contentElement.addEventListener("input", () => {
                this.emitChange();
                this.syncActiveStates();
            });

            this.contentElement.addEventListener("keydown", (event) => {
                const key = event.key.toLowerCase();
                const withCommand = event.ctrlKey || event.metaKey;
                if (withCommand && key === "b") {
                    event.preventDefault();
                    executeCommand("bold");
                    this.emitChange();
                    this.syncActiveStates();
                }
                if (withCommand && key === "i") {
                    event.preventDefault();
                    executeCommand("italic");
                    this.emitChange();
                    this.syncActiveStates();
                }
                if (withCommand && key === "u") {
                    event.preventDefault();
                    executeCommand("underline");
                    this.emitChange();
                    this.syncActiveStates();
                }
                if (withCommand && key === "z" && !event.shiftKey) {
                    event.preventDefault();
                    executeCommand("undo");
                    this.emitChange();
                    this.syncActiveStates();
                }
                if ((withCommand && key === "y") || (withCommand && event.shiftKey && key === "z")) {
                    event.preventDefault();
                    executeCommand("redo");
                    this.emitChange();
                    this.syncActiveStates();
                }
            });

            ["mouseup", "keyup"].forEach((eventName) => this.contentElement.addEventListener(eventName, () => this.syncActiveStates()));
            document.addEventListener("selectionchange", () => {
                const selection = window.getSelection();
                if (!selection || selection.rangeCount === 0) return;
                const node = selection.anchorNode && selection.anchorNode.nodeType === 3 ? selection.anchorNode.parentNode : selection.anchorNode;
                if (node && this.contentElement.contains(node)) this.syncActiveStates();
            });
        }

        emitChange() {
            if (typeof this.options.onChange === "function") this.options.onChange(this.getHTML());
        }

        syncActiveStates() {
            if (this.trackedButtonsMap.bold) this.trackedButtonsMap.bold.setAttribute("aria-pressed", String(document.queryCommandState("bold")));
            if (this.trackedButtonsMap.italic) this.trackedButtonsMap.italic.setAttribute("aria-pressed", String(document.queryCommandState("italic")));
            if (this.trackedButtonsMap.underline) this.trackedButtonsMap.underline.setAttribute("aria-pressed", String(document.queryCommandState("underline")));
            if (this.trackedButtonsMap.strikeThrough) this.trackedButtonsMap.strikeThrough.setAttribute("aria-pressed", String(document.queryCommandState("strikeThrough")));
            if (this.trackedButtonsMap.blockquote) this.trackedButtonsMap.blockquote.setAttribute("aria-pressed", String(isSelectionInside("blockquote")));
            if (this.trackedButtonsMap.pre) this.trackedButtonsMap.pre.setAttribute("aria-pressed", String(isSelectionInside("pre")));
            if (this.trackedButtonsMap.unorderedList) this.trackedButtonsMap.unorderedList.setAttribute("aria-pressed", String(document.queryCommandState("insertUnorderedList")));
            if (this.trackedButtonsMap.orderedList) this.trackedButtonsMap.orderedList.setAttribute("aria-pressed", String(document.queryCommandState("insertOrderedList")));
        }

        getHTML() {
            return this.contentElement.innerHTML.trim();
        }

        setHTML(html) {
            this.contentElement.innerHTML = html || "";
            this.syncActiveStates();
        }

        addAction(actionConfig) {
            const title = actionConfig.title;
            const iconClass = actionConfig.iconClass;
            const onClick = actionConfig.onClick;
            const trackActive = actionConfig.trackActive || false;
            const trackKey = actionConfig.trackKey || null;
            const groupPlacement = actionConfig.group === "start" ? "start" : "end";
            const buttonElement = this.createToolbarButton(iconClass, title, () => onClick(this), trackActive, trackKey);
            if (groupPlacement === "start") this.toolbarElement.prepend(buttonElement);
            else this.toolbarElement.appendChild(buttonElement);
            return buttonElement;
        }
    }

    window.WebHackerEditor = WebHackerEditor;
})();
