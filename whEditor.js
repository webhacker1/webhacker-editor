// (function () {
//     "use strict";

//     const LANG_OPTIONS = [
//         { label: "Auto", value: "auto" },
//         { label: "JavaScript", value: "javascript" },
//         { label: "TypeScript", value: "typescript" },
//         { label: "HTML", value: "xml" },      // у hljs html = xml
//         { label: "CSS", value: "css" },
//         { label: "JSON", value: "json" },
//         { label: "Bash", value: "bash" },
//         { label: "Python", value: "python" },
//         { label: "PHP", value: "php" },
//         { label: "Go", value: "go" },
//         { label: "YAML", value: "yaml" },
//         { label: "Markdown", value: "markdown" },
//         { label: "SQL", value: "sql" },
//         { label: "Java", value: "java" },
//         { label: "C#", value: "csharp" },
//         { label: "C++", value: "cpp" },
//     ];

//     function createElement(tagName, className, attributes) {
//         const element = document.createElement(tagName);
//         if (className) element.className = className;
//         if (attributes) Object.keys(attributes).forEach((key) => element.setAttribute(key, attributes[key]));
//         return element;
//     }

//     function executeCommand(commandName, commandValue = null) {
//         document.execCommand(commandName, false, commandValue);
//     }

//     const isValidHex = (hex) => /^#([0-9a-fA-F]{6})$/.test(hex);

//     function saveSelectionRange() {
//         const sel = window.getSelection();
//         if (!sel || sel.rangeCount === 0) return null;
//         return sel.getRangeAt(0).cloneRange();
//     }
//     function restoreSelectionRange(range) {
//         if (!range) return;
//         const sel = window.getSelection();
//         sel.removeAllRanges();
//         sel.addRange(range);
//     }

//     function isSelectionInside(selector) {
//         const sel = window.getSelection();
//         if (!sel || sel.rangeCount === 0) return false;
//         let node = sel.anchorNode;
//         if (node && node.nodeType === 3) node = node.parentNode;
//         return !!(node && node.closest(selector));
//     }

//     function wrapCurrentBlockAs(tag) { executeCommand("formatBlock", tag.toUpperCase()); }

//     function getActiveCodeElement() {
//         const sel = window.getSelection();
//         if (!sel || sel.rangeCount === 0) return null;
//         let node = sel.anchorNode;
//         if (node && node.nodeType === 3) node = node.parentNode;
//         const pre = node ? node.closest("pre") : null;
//         if (!pre) return null;
//         return pre.querySelector("code") || pre;
//     }

//     function getCaretOffsetWithin(root) {
//         const sel = window.getSelection();
//         if (!sel || sel.rangeCount === 0) return 0;
//         const range = sel.getRangeAt(0);
//         const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
//         let offset = 0;
//         while (walker.nextNode()) {
//             const n = walker.currentNode;
//             if (n === range.startContainer) {
//                 offset += range.startOffset;
//                 break;
//             } else {
//                 offset += n.nodeValue.length;
//             }
//         }
//         return offset;
//     }

//     function setCaretOffsetWithin(root, offset) {
//         const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
//         let acc = 0, target = null, local = 0, n;
//         while ((n = walker.nextNode())) {
//             const len = n.nodeValue.length;
//             if (acc + len >= offset) {
//                 target = n;
//                 local = offset - acc;
//                 break;
//             }
//             acc += len;
//         }
//         if (!target) {
//             target = root;
//             local = (root.firstChild && root.firstChild.nodeType === 3) ? root.firstChild.length : 0;
//         }
//         const range = document.createRange();
//         range.setStart(target, local);
//         range.collapse(true);
//         const sel = window.getSelection();
//         sel.removeAllRanges();
//         sel.addRange(range);
//     }

//     function replaceTextInCode(codeElement, startOffset, endOffset, insertText) {
//         const text = codeElement.textContent;
//         const before = text.slice(0, startOffset);
//         const after = text.slice(endOffset);
//         codeElement.textContent = before + insertText + after;
//         return before.length + insertText.length;
//     }

//     function insertTable(rowCount = 2, columnCount = 2) {
//         let html = "<table><thead><tr>";
//         for (let c = 0; c < columnCount; c++) html += "<th>Заголовок</th>";
//         html += "</tr></thead><tbody>";
//         for (let r = 0; r < rowCount; r++) {
//             html += "<tr>";
//             for (let c = 0; c < columnCount; c++) html += "<td>Ячейка</td>";
//             html += "</tr>";
//         }
//         html += "</tbody></table>";
//         executeCommand("insertHTML", html);
//     }

//     const isCaretAtEnd = (code) => getCaretOffsetWithin(code) === code.textContent.length;
//     function currentLineInfo(code) {
//         const offset = getCaretOffsetWithin(code);
//         const text = code.textContent;
//         const lineStart = text.lastIndexOf("\n", offset - 1) + 1;
//         const lineEnd = text.indexOf("\n", offset);
//         return { offset, text, lineStart, lineEnd: lineEnd === -1 ? text.length : lineEnd, line: text.slice(lineStart, offset) };
//     }

//     function getCodeLanguage(codeEl) {
//         for (const cls of codeEl.classList) {
//             if (cls.startsWith("language-")) return cls.slice("language-".length);
//         }
//         return "auto";
//     }
//     function setCodeLanguage(codeEl, lang) {
//         [...codeEl.classList].forEach(c => c.startsWith("language-") && codeEl.classList.remove(c));
//         if (lang && lang !== "auto") codeEl.classList.add(`language-${lang}`);
//     }

//     // === КЛЮЧЕВАЯ часть: надёжная подсветка ===
//     function highlightCodeElement(codeEl) {
//         if (!window.hljs) return;
//         const text = codeEl.textContent; // plain
//         const lang = getCodeLanguage(codeEl);

//         let html;
//         try {
//             if (lang && lang !== "auto") {
//                 html = window.hljs.highlight(text, { language: lang, ignoreIllegals: true }).value;
//             } else {
//                 html = window.hljs.highlightAuto(text).value;
//             }
//         } catch (e) {
//             // на всякий случай — без падения
//             html = text.replace(/[&<>]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[s]));
//         }

//         codeEl.innerHTML = html;
//         codeEl.classList.add("hljs"); // гарантия применения темы
//     }

//     class WebHackerEditor {
//         constructor(rootSelectorOrElement, options = {}) {
//             this.rootElement = typeof rootSelectorOrElement === "string"
//                 ? document.querySelector(rootSelectorOrElement)
//                 : rootSelectorOrElement;
//             if (!this.rootElement) throw new Error("WebHackerEditor: контейнер не найден");
//             this.options = Object.assign({ placeholder: "Начните печатать…", onChange: null }, options);
//             this.savedSelectionRange = null;
//             this.trackedButtonsMap = {};
//             this.currentSuggestion = null;
//             this.renderInterface();
//             this.bindEvents();
//         }

//         renderInterface() {
//             const editorContainerElement = createElement("div", "wh-editor", { role: "region" });
//             const toolbarElement = createElement("div", "wh-editor__toolbar");

//             const historyGroupElement = createElement("div", "wh-editor__group");
//             historyGroupElement.append(
//                 this.createToolbarButton("fa-solid fa-rotate-left", "Отменить", () => executeCommand("undo")),
//                 this.createToolbarButton("fa-solid fa-rotate-right", "Повторить", () => executeCommand("redo"))
//             );

//             const textGroupElement = createElement("div", "wh-editor__group");
//             textGroupElement.append(
//                 this.createToolbarButton("fa-solid fa-bold", "Жирный", () => executeCommand("bold"), true, "bold"),
//                 this.createToolbarButton("fa-solid fa-italic", "Курсив", () => executeCommand("italic"), true, "italic"),
//                 this.createToolbarButton("fa-solid fa-underline", "Подчеркнуть", () => executeCommand("underline"), true, "underline"),
//                 this.createToolbarButton("fa-solid fa-strikethrough", "Зачеркнуть", () => executeCommand("strikeThrough"), true, "strikeThrough"),
//                 this.createColorDropdown(),
//                 this.createLinkDropdown(),
//                 this.createImageDropdown(),
//                 this.createToolbarButton("fa-solid fa-eraser", "Очистить форматирование", () => executeCommand("removeFormat"))
//             );

//             const structureGroupElement = createElement("div", "wh-editor__group");
//             structureGroupElement.append(
//                 this.createHeadingDropdown(),
//                 this.createToolbarButton("fa-solid fa-code", "Код", () => { this.toggleCodeBlockEnhanced(); }, true, "pre")
//             );

//             const alignGroupElement = createElement("div", "wh-editor__group");
//             alignGroupElement.append(
//                 this.createToolbarButton("fa-solid fa-align-left", "По левому краю", () => executeCommand("justifyLeft"), true, "alignLeft"),
//                 this.createToolbarButton("fa-solid fa-align-center", "По центру", () => executeCommand("justifyCenter"), true, "alignCenter"),
//                 this.createToolbarButton("fa-solid fa-align-right", "По правому краю", () => executeCommand("justifyRight"), true, "alignRight")
//             );

//             const listsGroupElement = createElement("div", "wh-editor__group");
//             listsGroupElement.append(
//                 this.createToolbarButton("fa-solid fa-list-ul", "Маркированный список", () => executeCommand("insertUnorderedList"), true, "unorderedList"),
//                 this.createToolbarButton("fa-solid fa-list-ol", "Нумерованный список", () => executeCommand("insertOrderedList"), true, "orderedList"),
//                 this.createToolbarButton("fa-solid fa-table", "Таблица 2×2", () => insertTable())
//             );

//             toolbarElement.append(
//                 historyGroupElement,
//                 this.createSeparator(),
//                 textGroupElement,
//                 this.createSeparator(),
//                 structureGroupElement,
//                 this.createSeparator(),
//                 alignGroupElement,
//                 this.createSeparator(),
//                 listsGroupElement
//             );

//             const contentElement = createElement("div", "wh-editor__content", { contenteditable: "true" });
//             contentElement.setAttribute("data-placeholder", this.options.placeholder);

//             editorContainerElement.append(toolbarElement, contentElement);

//             // ---- Панель кода (язык + завершить) ----
//             const codeControls = createElement("div", "wh-editor__code-controls");
//             const langSelect = createElement("select", "wh-editor__lang");
//             LANG_OPTIONS.forEach(o => {
//                 const opt = createElement("option", null, { value: o.value });
//                 opt.textContent = o.label;
//                 langSelect.appendChild(opt);
//             });
//             const codeExitButton = createElement("button", "wh-editor__code-exit");
//             const codeExitIcon = createElement("i", "wh-editor__icon fa-solid fa-check");
//             codeExitButton.append(codeExitIcon, document.createTextNode("Завершить код"));
//             codeControls.append(langSelect, codeExitButton);
//             editorContainerElement.appendChild(codeControls);

//             const suggestionElement = createElement("div", "wh-editor__suggestion");
//             editorContainerElement.appendChild(suggestionElement);

//             this.rootElement.appendChild(editorContainerElement);

//             this.editorContainerElement = editorContainerElement;
//             this.toolbarElement = toolbarElement;
//             this.contentElement = contentElement;
//             this.codeControls = codeControls;
//             this.codeExitButton = codeExitButton;
//             this.langSelect = langSelect;
//             this.suggestionElement = suggestionElement;

//             this.codeExitButton.addEventListener("mousedown", (e) => e.preventDefault());
//             this.codeExitButton.addEventListener("click", () => {
//                 this.finishCodeBlock();
//                 this.applySyntaxHighlightingInEditor();
//                 this.hideSuggestion();
//             });

//             this.langSelect.addEventListener("change", () => {
//                 const code = getActiveCodeElement();
//                 if (!code) return;
//                 const lang = this.langSelect.value;
//                 const caret = getCaretOffsetWithin(code);
//                 setCodeLanguage(code, lang);
//                 highlightCodeElement(code); // пересветить выбранным языком
//                 setCaretOffsetWithin(code, Math.min(caret, code.textContent.length));
//             });
//         }

//         createSeparator() { return createElement("div", "wh-editor__separator"); }

//         createToolbarButton(iconClass, title, onClick, trackActive = false, trackKey = null) {
//             const btn = createElement("button", "wh-editor__button", { type: "button", title, "aria-label": title });
//             const icon = createElement("i", `wh-editor__icon ${iconClass}`);
//             btn.appendChild(icon);
//             btn.addEventListener("mousedown", (e) => e.preventDefault());
//             btn.addEventListener("click", () => { this.contentElement.focus(); onClick(); this.emitChange(); this.syncActiveStates(); });
//             if (trackActive && trackKey) this.trackedButtonsMap[trackKey] = btn;
//             return btn;
//         }

//         createDropdownButton(iconClass, title) {
//             const wrapper = createElement("div", "wh-editor__dropdown");
//             const trigger = this.createToolbarButton(iconClass, title, () => {});
//             wrapper.appendChild(trigger);
//             return { wrapperElement: wrapper, triggerButton: trigger };
//         }

//         createHeadingDropdown() {
//             const { wrapperElement, triggerButton } = this.createDropdownButton("fa-solid fa-heading", "Заголовки");
//             const menu = createElement("div", "wh-editor__menu wh-hidden");
//             [
//                 { label: "Абзац", action: () => wrapCurrentBlockAs("p") },
//                 { label: "H1", action: () => wrapCurrentBlockAs("h1") },
//                 { label: "H2", action: () => wrapCurrentBlockAs("h2") },
//                 { label: "H3", action: () => wrapCurrentBlockAs("h3") }
//             ].forEach((item) => {
//                 const it = createElement("div", "wh-editor__menu-item");
//                 it.textContent = item.label;
//                 it.addEventListener("mousedown", (e) => e.preventDefault());
//                 it.addEventListener("click", () => { this.closeAllMenus(); this.contentElement.focus(); item.action(); this.emitChange(); this.syncActiveStates(); });
//                 menu.appendChild(it);
//             });
//             triggerButton.addEventListener("click", () => { this.savedSelectionRange = saveSelectionRange(); this.toggleMenu(menu); });
//             wrapperElement.appendChild(menu);
//             return wrapperElement;
//         }

//         createColorDropdown() {
//             const { wrapperElement, triggerButton } = this.createDropdownButton("fa-solid fa-palette", "Цвет текста");
//             const menu = createElement("div", "wh-editor__menu wh-hidden");
//             const cont = createElement("div", "wh-editor__color");
//             const preset = ["#111827","#374151","#6B7280","#9CA3AF","#D1D5DB","#F3F4F6","#FFFFFF","#6A5ACD","#2563EB","#0891B2","#10B981","#F59E0B","#EF4444"];
//             const sw = createElement("div", "wh-editor__swatches");
//             preset.forEach((hex) => {
//                 const b = createElement("button", "wh-editor__swatch", { type: "button", "data-color": hex, title: hex });
//                 b.style.background = hex;
//                 b.addEventListener("click", () => { this.selectSwatch(sw, b); hexInput.value = hex.toUpperCase(); colorInput.value = hex; prev.style.color = hex; });
//                 b.addEventListener("dblclick", () => this.applyColorAndClose(hex));
//                 sw.appendChild(b);
//             });
//             const row = createElement("div", "wh-editor__color-row");
//             const hexInput = createElement("input", null, { type: "text", value: "#6a5acd", maxlength: "7", placeholder: "#RRGGBB", "aria-label": "HEX цвет" });
//             const colorInput = createElement("input", null, { type: "color", value: "#6a5acd", "aria-label": "Выбрать цвет" });
//             row.append(hexInput, colorInput);
//             const prev = createElement("div", "wh-editor__color-preview"); prev.textContent = "Aa"; prev.style.color = hexInput.value;
//             const actions = createElement("div", "wh-editor__color-actions");
//             const ok = createElement("button", "wh-editor__button wh-editor__button--primary", { type: "button" }); ok.textContent = "OK";
//             const clear = createElement("button", "wh-editor__button wh-editor__button--ghost", { type: "button" }); clear.textContent = "Сброс";
//             actions.append(ok, clear);
//             cont.append(sw, prev, row, actions);
//             menu.appendChild(cont);
//             const sync = (src) => {
//                 if (src === "hex" && isValidHex(hexInput.value)) { colorInput.value = hexInput.value; prev.style.color = hexInput.value; this.highlightSwatch(sw, hexInput.value); }
//                 if (src === "picker") { hexInput.value = colorInput.value.toUpperCase(); prev.style.color = colorInput.value; this.highlightSwatch(sw, colorInput.value); }
//             };
//             hexInput.addEventListener("input", () => sync("hex"));
//             colorInput.addEventListener("input", () => sync("picker"));
//             triggerButton.addEventListener("click", () => { this.savedSelectionRange = saveSelectionRange(); this.toggleMenu(menu); });
//             ok.addEventListener("click", () => { const hex = hexInput.value; if (!isValidHex(hex)) { hexInput.focus(); return; } this.applyColorAndClose(hex); });
//             clear.addEventListener("click", () => { this.closeAllMenus(); this.contentElement.focus(); restoreSelectionRange(this.savedSelectionRange); executeCommand("removeFormat"); this.emitChange(); this.syncActiveStates(); });
//             wrapperElement.appendChild(menu);
//             return wrapperElement;
//         }

//         createLinkDropdown() {
//             const { wrapperElement, triggerButton } = this.createDropdownButton("fa-solid fa-link", "Ссылка");
//             const menu = createElement("div", "wh-editor__menu wh-hidden");
//             const form = createElement("div", "wh-editor__form");
//             const url = createElement("input", "wh-editor__input", { type: "text", placeholder: "https://пример.ру", value: "" });
//             const text = createElement("input", "wh-editor__input", { type: "text", placeholder: "Текст ссылки (необязательно)", value: "" });
//             const actions = createElement("div", "wh-editor__color-actions");
//             const ok = createElement("button", "wh-editor__button wh-editor__button--primary", { type: "button" }); ok.textContent = "OK";
//             const rm = createElement("button", "wh-editor__button wh-editor__button--ghost", { type: "button" }); rm.textContent = "Удалить";
//             actions.append(ok, rm); form.append(url, text, actions); menu.appendChild(form);
//             triggerButton.addEventListener("click", () => { this.savedSelectionRange = saveSelectionRange(); this.toggleMenu(menu); });
//             ok.addEventListener("click", () => {
//                 let href = url.value.trim(); const txt = text.value.trim();
//                 if (!href) return;
//                 if (!/^[a-zA-Z][\w+.-]*:/.test(href)) href = "https://" + href;
//                 this.closeAllMenus(); this.contentElement.focus(); restoreSelectionRange(this.savedSelectionRange);
//                 const sel = window.getSelection(); if (!sel || sel.rangeCount === 0) return;
//                 const html = `<a href="${href}" target="_blank" rel="noopener noreferrer">${txt || (sel.isCollapsed ? href : sel.toString())}</a>`;
//                 executeCommand("insertHTML", html); this.emitChange(); this.syncActiveStates();
//             });
//             rm.addEventListener("click", () => { this.closeAllMenus(); this.contentElement.focus(); restoreSelectionRange(this.savedSelectionRange); executeCommand("unlink"); this.emitChange(); this.syncActiveStates(); });
//             wrapperElement.appendChild(menu);
//             return wrapperElement;
//         }

//         createImageDropdown() {
//             const { wrapperElement, triggerButton } = this.createDropdownButton("fa-solid fa-image", "Изображение");
//             const menu = createElement("div", "wh-editor__menu wh-hidden");
//             const form = createElement("div", "wh-editor__form");
//             const url = createElement("input", "wh-editor__input", { type: "text", placeholder: "URL изображения", value: "" });
//             const file = createElement("input", "wh-editor__file", { type: "file", accept: "image/*" });
//             const actions = createElement("div", "wh-editor__color-actions");
//             const ok = createElement("button", "wh-editor__button wh-editor__button--primary", { type: "button" }); ok.textContent = "OK";
//             const rm = createElement("button", "wh-editor__button wh-editor__button--ghost", { type: "button" }); rm.textContent = "Удалить";
//             actions.append(ok, rm); form.append(url, file, actions); menu.appendChild(form);
//             triggerButton.addEventListener("click", () => { this.savedSelectionRange = saveSelectionRange(); this.toggleMenu(menu); });
//             const insertImg = (src) => { this.closeAllMenus(); this.contentElement.focus(); restoreSelectionRange(this.savedSelectionRange); executeCommand("insertHTML", `<img src="${src}">`); this.emitChange(); this.syncActiveStates(); };
//             ok.addEventListener("click", () => { const src = url.value.trim(); if (src) { insertImg(src); return; } const f = file.files && file.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => insertImg(r.result); r.readAsDataURL(f); });
//             rm.addEventListener("click", () => { this.closeAllMenus(); this.contentElement.focus(); restoreSelectionRange(this.savedSelectionRange); const sel = window.getSelection(); let n = sel && sel.anchorNode; if (n && n.nodeType === 3) n = n.parentNode; const img = n ? n.closest("img") : null; if (img) img.remove(); this.emitChange(); this.syncActiveStates(); });
//             wrapperElement.appendChild(menu);
//             return wrapperElement;
//         }

//         toggleMenu(menu) {
//             this.closeAllMenus(menu);
//             menu.classList.toggle("wh-hidden");
//             const onOutside = (e) => { if (!menu.contains(e.target)) { this.closeAllMenus(); document.removeEventListener("mousedown", onOutside, true); } };
//             document.addEventListener("mousedown", onOutside, true);
//         }
//         closeAllMenus(except) { Array.from(this.editorContainerElement.querySelectorAll(".wh-editor__menu")).forEach((m) => { if (m !== except) m.classList.add("wh-hidden"); }); }

//         bindEvents() {
//             this.contentElement.addEventListener("input", () => {
//                 this.emitChange();
//                 this.syncActiveStates();
//                 if (isSelectionInside("pre")) {
//                     this.highlightActiveCodeBlockLive();
//                     this.updateSuggestion();
//                     this.updateCodeControls();
//                 } else {
//                     this.hideSuggestion();
//                 }
//             });

//             this.contentElement.addEventListener("paste", (e) => {
//                 if (!isSelectionInside("pre")) return;
//                 e.preventDefault();
//                 const code = getActiveCodeElement();
//                 if (!code) return;
//                 const text = (e.clipboardData || window.clipboardData).getData("text/plain");
//                 const offset = getCaretOffsetWithin(code);
//                 const posAfter = replaceTextInCode(code, offset, offset, text);
//                 this.highlightActiveCodeBlockLive();
//                 setCaretOffsetWithin(code, posAfter);
//                 this.emitChange();
//             });

//             this.contentElement.addEventListener("keydown", (e) => {
//                 const key = e.key.toLowerCase();
//                 const withCmd = e.ctrlKey || e.metaKey;

//                 if (isSelectionInside("pre")) {
//                     if (withCmd && key === "enter") { e.preventDefault(); this.finishCodeBlock(); this.applySyntaxHighlightingInEditor(); return; }
//                     if (!withCmd) {
//                         if (key === "tab") { e.preventDefault(); if (this.currentSuggestion) this.acceptSuggestion(); else this.insertIndent(); return; }
//                         if (key === "enter") { e.preventDefault(); this.insertNewlineInPreWithIndent(); return; } // не выходим из кода
//                         const pairs = { "(":")", "{":"}", "[":"]", "\"":"\"", "'":"'", "`":"`" };
//                         if (pairs[e.key]) { e.preventDefault(); this.insertBracketPair(e.key, pairs[e.key]); return; }
//                     }
//                 }

//                 if (withCmd && key === "b") { e.preventDefault(); executeCommand("bold"); this.emitChange(); this.syncActiveStates(); }
//                 if (withCmd && key === "i") { e.preventDefault(); executeCommand("italic"); this.emitChange(); this.syncActiveStates(); }
//                 if (withCmd && key === "u") { e.preventDefault(); executeCommand("underline"); this.emitChange(); this.syncActiveStates(); }
//                 if (withCmd && key === "z" && !e.shiftKey) { e.preventDefault(); executeCommand("undo"); this.emitChange(); this.syncActiveStates(); }
//                 if ((withCmd && key === "y") || (withCmd && e.shiftKey && key === "z")) { e.preventDefault(); executeCommand("redo"); this.emitChange(); this.syncActiveStates(); }
//                 if (key === "escape") { this.hideSuggestion(); }
//             });

//             ["mouseup", "keyup"].forEach((ev) => this.contentElement.addEventListener(ev, () => {
//                 this.syncActiveStates();
//                 if (isSelectionInside("pre")) { this.updateSuggestion(); this.updateCodeControls(); } else { this.hideSuggestion(); this.updateCodeControls(true); }
//             }));

//             document.addEventListener("selectionchange", () => {
//                 const sel = window.getSelection();
//                 if (!sel || sel.rangeCount === 0) return;
//                 const node = sel.anchorNode && sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentNode : sel.anchorNode;
//                 if (node && this.contentElement.contains(node)) {
//                     this.syncActiveStates();
//                     if (isSelectionInside("pre")) { this.updateSuggestion(); this.updateCodeControls(); } else { this.updateCodeControls(true); this.hideSuggestion(); }
//                 } else {
//                     this.updateCodeControls(true);
//                     this.hideSuggestion();
//                 }
//             });
//         }

//         emitChange() { if (typeof this.options.onChange === "function") this.options.onChange(this.getHTML()); }

//         syncActiveStates() {
//             if (this.trackedButtonsMap.bold) this.trackedButtonsMap.bold.setAttribute("aria-pressed", String(document.queryCommandState("bold")));
//             if (this.trackedButtonsMap.italic) this.trackedButtonsMap.italic.setAttribute("aria-pressed", String(document.queryCommandState("italic")));
//             if (this.trackedButtonsMap.underline) this.trackedButtonsMap.underline.setAttribute("aria-pressed", String(document.queryCommandState("underline")));
//             if (this.trackedButtonsMap.strikeThrough) this.trackedButtonsMap.strikeThrough.setAttribute("aria-pressed", String(document.queryCommandState("strikeThrough")));
//             if (this.trackedButtonsMap.pre) this.trackedButtonsMap.pre.setAttribute("aria-pressed", String(isSelectionInside("pre")));
//             if (this.trackedButtonsMap.unorderedList) this.trackedButtonsMap.unorderedList.setAttribute("aria-pressed", String(document.queryCommandState("insertUnorderedList")));
//             if (this.trackedButtonsMap.orderedList) this.trackedButtonsMap.orderedList.setAttribute("aria-pressed", String(document.queryCommandState("insertOrderedList")));
//             if (this.trackedButtonsMap.alignLeft) this.trackedButtonsMap.alignLeft.setAttribute("aria-pressed", String(document.queryCommandState("justifyLeft")));
//             if (this.trackedButtonsMap.alignCenter) this.trackedButtonsMap.alignCenter.setAttribute("aria-pressed", String(document.queryCommandState("justifyCenter")));
//             if (this.trackedButtonsMap.alignRight) this.trackedButtonsMap.alignRight.setAttribute("aria-pressed", String(document.queryCommandState("justifyRight")));
//         }

//         getHTML() { return this.contentElement.innerHTML.trim(); }
//         setHTML(html) { this.contentElement.innerHTML = html || ""; this.applySyntaxHighlightingInEditor(); this.syncActiveStates(); }

//         addAction(cfg) {
//             const btn = this.createToolbarButton(cfg.iconClass, cfg.title, () => cfg.onClick(this), cfg.trackActive || false, cfg.trackKey || null);
//             if (cfg.group === "start") this.toolbarElement.prepend(btn); else this.toolbarElement.appendChild(btn);
//             return btn;
//         }

//         applyColorAndClose(hex) {
//             this.closeAllMenus();
//             this.contentElement.focus();
//             restoreSelectionRange(this.savedSelectionRange);
//             document.execCommand("foreColor", false, hex);
//             this.emitChange();
//             this.syncActiveStates();
//         }

//         selectSwatch(sw, b) { Array.from(sw.querySelectorAll(".wh-editor__swatch")).forEach(x => x.removeAttribute("aria-selected")); b.setAttribute("aria-selected","true"); }
//         highlightSwatch(sw, hex) {
//             let found = false;
//             Array.from(sw.querySelectorAll(".wh-editor__swatch")).forEach(btn => {
//                 if (btn.getAttribute("data-color").toLowerCase() === hex.toLowerCase()) { btn.setAttribute("aria-selected","true"); found = true; } else { btn.removeAttribute("aria-selected"); }
//             });
//             return found;
//         }

//         applySyntaxHighlightingInEditor() {
//             if (!window.hljs) return;
//             Array.from(this.contentElement.querySelectorAll("pre code")).forEach(node => {
//                 highlightCodeElement(node);
//             });
//         }

//         highlightActiveCodeBlockLive() {
//             const code = getActiveCodeElement();
//             if (!code) return;
//             const offset = getCaretOffsetWithin(code);
//             highlightCodeElement(code); // принудительно и сразу
//             setCaretOffsetWithin(code, Math.min(offset, code.textContent.length));
//         }

//         insertNewlineInPreWithIndent() {
//             const code = getActiveCodeElement();
//             if (!code) return;
//             const offset = getCaretOffsetWithin(code);
//             const text = code.textContent;
//             const lineStart = text.lastIndexOf("\n", offset - 1) + 1;
//             const before = text.slice(0, offset);
//             const after = text.slice(offset);
//             const currentLine = text.slice(lineStart, offset);
//             const indentMatch = currentLine.match(/^[\t ]*/);
//             let indent = indentMatch ? indentMatch[0] : "";
//             if (currentLine.trimEnd().endsWith("{")) indent += "    ";
//             const insertText = "\n" + indent;
//             code.textContent = before + insertText + after;
//             this.highlightActiveCodeBlockLive();
//             setCaretOffsetWithin(code, offset + insertText.length);
//         }

//         insertIndent() {
//             const code = getActiveCodeElement();
//             if (!code) return;
//             const offset = getCaretOffsetWithin(code);
//             const text = code.textContent;
//             const before = text.slice(0, offset);
//             const after = text.slice(offset);
//             code.textContent = before + "    " + after;
//             this.highlightActiveCodeBlockLive();
//             setCaretOffsetWithin(code, offset + 4);
//         }

//         insertBracketPair(openChar, closeChar) {
//             const code = getActiveCodeElement();
//             if (!code) return;
//             const offset = getCaretOffsetWithin(code);
//             const text = code.textContent;
//             const before = text.slice(0, offset);
//             const after = text.slice(offset);
//             code.textContent = before + openChar + closeChar + after;
//             this.highlightActiveCodeBlockLive();
//             setCaretOffsetWithin(code, offset + 1);
//         }

//         toggleCodeBlockEnhanced() {
//             const sel = window.getSelection();
//             if (!sel || sel.rangeCount === 0) return;
//             let node = sel.anchorNode;
//             if (node && node.nodeType === 3) node = node.parentNode;
//             const existing = node ? node.closest("pre") : null;
//             if (existing) {
//                 const p = document.createElement("p");
//                 p.innerHTML = "<br>";
//                 existing.after(p);
//                 const range = document.createRange();
//                 range.setStart(p, 0);
//                 range.collapse(true);
//                 sel.removeAllRanges();
//                 sel.addRange(range);
//                 this.updateCodeControls(true);
//                 this.hideSuggestion();
//             } else {
//                 const range = sel.getRangeAt(0);
//                 const text = range.toString() || "";
//                 const pre = document.createElement("pre");
//                 const code = document.createElement("code");
//                 code.textContent = text;
//                 pre.appendChild(code);
//                 range.deleteContents();
//                 range.insertNode(pre);

//                 // фокус внутрь и подсветка сразу
//                 sel.removeAllRanges();
//                 const after = document.createRange();
//                 after.selectNodeContents(code);
//                 after.collapse(false);
//                 sel.addRange(after);
//                 highlightCodeElement(code); // сразу, даже в авто

//                 this.updateCodeControls();
//             }
//         }

//         insertNewlineInPre() {
//             const sel = window.getSelection();
//             if (!sel || sel.rangeCount === 0) return;
//             const range = sel.getRangeAt(0);
//             range.deleteContents();
//             const n = document.createTextNode("\n");
//             range.insertNode(n);
//             range.setStartAfter(n);
//             range.collapse(true);
//             sel.removeAllRanges();
//             sel.addRange(range);
//         }

//         finishCodeBlock() {
//             const sel = window.getSelection();
//             if (!sel || sel.rangeCount === 0) return;
//             let node = sel.anchorNode;
//             if (node && node.nodeType === 3) node = node.parentNode;
//             const pre = node ? node.closest("pre") : null;
//             if (!pre) return;
//             const p = document.createElement("p");
//             p.innerHTML = "<br>";
//             pre.after(p);
//             const range = document.createRange();
//             range.setStart(p, 0);
//             range.collapse(true);
//             sel.removeAllRanges();
//             sel.addRange(range);
//             this.updateCodeControls(true);
//             this.hideSuggestion();
//         }

//         updateCodeControls(forceHide) {
//             if (forceHide) { this.codeControls.style.display = "none"; return; }
//             const sel = window.getSelection();
//             if (!sel || sel.rangeCount === 0) { this.codeControls.style.display = "none"; return; }
//             let node = sel.anchorNode;
//             if (node && node.nodeType === 3) node = node.parentNode;
//             const pre = node ? node.closest("pre") : null;
//             if (!pre) { this.codeControls.style.display = "none"; return; }

//             // синхронизируем выбранный язык
//             const code = pre.querySelector("code") || pre;
//             const lang = getCodeLanguage(code);
//             this.langSelect.value = LANG_OPTIONS.some(l => l.value === lang) ? lang : "auto";

//             // позиционирование — правый верх pre
//             const preRect = pre.getBoundingClientRect();
//             const hostRect = this.editorContainerElement.getBoundingClientRect();

//             const ctrls = this.codeControls;
//             const prevDisplay = ctrls.style.display;
//             const prevVis = ctrls.style.visibility;
//             ctrls.style.visibility = "hidden";
//             ctrls.style.display = "inline-flex";
//             const width = ctrls.offsetWidth || 200;
//             ctrls.style.display = prevDisplay || "inline-flex";
//             ctrls.style.visibility = prevVis || "visible";

//             const top = preRect.top - hostRect.top + 8;
//             const left = preRect.right - hostRect.left - width - 8;
//             ctrls.style.top = `${Math.max(8, top)}px`;
//             ctrls.style.left = `${Math.max(8, left)}px`;
//             ctrls.style.display = "inline-flex";
//         }

//         updateSuggestion() {
//             const code = getActiveCodeElement();
//             if (!code) { this.hideSuggestion(); return; }
//             const offset = getCaretOffsetWithin(code);
//             const text = code.textContent;
//             const lineStart = text.lastIndexOf("\n", offset - 1) + 1;
//             const line = text.slice(lineStart, offset);
//             const map = [
//                 { prefix: "cl", full: "console.log()", move: -1 },
//                 { prefix: "fn", full: "function name() {\n    \n}", move: -3 },
//                 { prefix: "fori", full: "for (let i = 0; i < length; i++) {\n    \n}", move: -3 },
//                 { prefix: "imp", full: "import  from \"\"", move: -1 },
//                 { prefix: "if", full: "if () {\n    \n}", move: -3 }
//             ];
//             let pick = null;
//             for (let i = 0; i < map.length; i++) { const p = map[i]; if (line.endsWith(p.prefix)) { pick = p; break; } }
//             if (!pick) { this.hideSuggestion(); return; }
//             const tail = pick.full.slice(pick.prefix.length);
//             const sel = window.getSelection();
//             if (!sel || sel.rangeCount === 0) { this.hideSuggestion(); return; }
//             const range = sel.getRangeAt(0);
//             const rects = range.getClientRects();
//             const rect = rects.length ? rects[rects.length - 1] : null;
//             if (!rect) { this.hideSuggestion(); return; }
//             const hostRect = this.editorContainerElement.getBoundingClientRect();
//             this.suggestionElement.style.left = `${rect.left - hostRect.left + 1}px`;
//             this.suggestionElement.style.top = `${rect.top - hostRect.top - 1}px`;
//             this.suggestionElement.textContent = tail;
//             this.suggestionElement.style.display = tail ? "block" : "none";
//             this.currentSuggestion = { start: offset - pick.prefix.length, end: offset, full: pick.full, caretMove: pick.move };
//         }

//         acceptSuggestion() {
//             const code = getActiveCodeElement();
//             if (!code || !this.currentSuggestion) return;
//             const posAfter = replaceTextInCode(code, this.currentSuggestion.start, this.currentSuggestion.end, this.currentSuggestion.full);
//             this.highlightActiveCodeBlockLive();
//             setCaretOffsetWithin(code, posAfter + this.currentSuggestion.caretMove);
//             this.hideSuggestion();
//         }

//         hideSuggestion() {
//             this.currentSuggestion = null;
//             this.suggestionElement.style.display = "none";
//             this.suggestionElement.textContent = "";
//         }
//     }

//     window.WebHackerEditor = WebHackerEditor;
// })();
