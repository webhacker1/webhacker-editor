import WebHackerEditor from "./WebHackerEditor.js";
import { createElement } from "../ui/elements.js";
import { executeRichCommand } from "./commands.js";
import { DEFAULT_TEXT_PRESET_COLORS } from "../constants/colors.js";
import { escapeHtml, ensureSafeUrl } from "../sanitize/utils.js";
import ru from "../translations/ru.yml";
import en from "../translations/en.yml";

const translations = { ru, en };

WebHackerEditor.prototype.setupMenuKeyboardNav = function(menuElement, options = {}) {
    const { items, onSelect, onClose, focusFirst = true, grid = null } = options;
    if (!menuElement || !items?.length) return;
    
    let idx = 0;
    const isGrid = !!grid;
    const cols = grid?.cols || 1;
    
    const focus = (index) => {
        index = (index + items.length) % items.length;
        idx = index;
        items.forEach((item, i) => {
            item.tabIndex = i === index ? 0 : -1;
            item.classList.toggle('is-focused', i === index);
        });
        items[idx]?.focus();
        if (isGrid && grid?.onHover) {
            const { row, col } = items[idx].dataset;
            grid.onHover(+row, +col);
        }
    };
    
    const close = () => {
        menuElement.classList.add('webhacker-menu--hidden');
        items.forEach(item => { item.tabIndex = -1; item.classList.remove('is-focused'); });
        onClose?.();
        menuElement.closest('.webhacker-dropdown')?.querySelector('.webhacker-button')?.focus();
        menuElement.closest('.webhacker-dropdown')?.dispatchEvent(new Event('dropdownClosed'));
    };
    
    items.forEach((item, i) => {
        item.addEventListener('keydown', (e) => {
            const key = e.key;
            if (key.startsWith('Arrow') || key === 'Tab') e.preventDefault();
            
            if (isGrid) {
                if (key === 'ArrowRight') focus(idx + 1);
                if (key === 'ArrowLeft') focus(idx - 1);
                if (key === 'ArrowDown') focus(idx + cols);
                if (key === 'ArrowUp') focus(idx - cols);
                if (key === 'Tab') focus(idx + (e.shiftKey ? -1 : 1));
            } else {
                if (key === 'ArrowRight' || key === 'ArrowDown') focus(idx + 1);
                if (key === 'ArrowLeft' || key === 'ArrowUp') focus(idx - 1);
                if (key === 'Tab') focus(idx + (e.shiftKey ? -1 : 1));
            }
            
            if (key === 'Enter' || key === ' ') {
                e.preventDefault();
                onSelect?.(items[idx]);
                close();
            }
            if (key === 'Escape') close();
        });
        
        item.addEventListener('mouseenter', () => focus(i));
        item.addEventListener('click', () => {
            focus(i);
            onSelect?.(item);
            close();
        });
    });
    
    const trigger = menuElement.closest('.webhacker-dropdown')?.querySelector('.webhacker-button');
    trigger?.addEventListener('click', () => {
        if (focusFirst) setTimeout(() => {
            if (!menuElement.classList.contains('webhacker-menu--hidden')) focus(0);
        }, 50);
    });
    
    menuElement.closest('.webhacker-dropdown')?.addEventListener('dropdownClosed', () => {
        idx = 0;
        items.forEach(item => { item.tabIndex = -1; item.classList.remove('is-focused'); });
        onClose?.();
    });
    
    return { focus, close };
};

WebHackerEditor.prototype.createTableDropdown = function () {
    const { dropdownWrapperElement, dropdownMenuElement } = this.createDropdown("fa-solid fa-table", translations[this.editorOptions.language || "ru"].table);
    const picker = createElement("div", "webhacker-tablepick");
    const label = createElement("div", "webhacker-tablepick__label");
    label.textContent = "0×0";
    const grid = createElement("div", "webhacker-tablepick__grid");
    
    let rows = 0, cols = 0;
    const cells = [];
    
    for (let r = 1; r <= 10; r++) for (let c = 1; c <= 10; c++) {
        const cell = createElement("button", "webhacker-tablepick__cell", {
            type: "button", "data-row": r, "data-col": c, "aria-label": `${r}×${c}`, tabindex: "-1"
        });
        cell.addEventListener("click", this.createMenuAction(() => this.insertMinimalTable(rows, cols)));
        grid.appendChild(cell);
        cells.push(cell);
    }
    
    picker.append(label, grid);
    dropdownMenuElement.appendChild(picker);
    
    this.setupMenuKeyboardNav(dropdownMenuElement, {
        items: cells,
        grid: { cols: 10, onHover: (r, c) => {
            rows = r; cols = c;
            label.textContent = `${r}×${c}`;
            cells.forEach(cell => {
                const { row, col } = cell.dataset;
                cell.classList.toggle("is-selected", +row <= r && +col <= c);
            });
        }},
        onSelect: () => this.insertMinimalTable(rows, cols),
        onClose: () => {
            rows = cols = 0;
            label.textContent = "0×0";
            cells.forEach(cell => cell.classList.remove('is-selected'));
        }
    });
    
    return dropdownWrapperElement;
};

WebHackerEditor.prototype.createHeadingDropdown = function () {
    const t = translations[this.editorOptions.language || "ru"];
    const { dropdownWrapperElement, dropdownMenuElement } = this.createDropdown("fa-solid fa-heading", t.headings);
    
    const headings = [
        { label: t.paragraph, tag: "p" },
        { label: "H1", tag: "h1" },
        { label: "H2", tag: "h2" },
        { label: "H3", tag: "h3" }
    ];
    
    const items = headings.map(({ label, tag }) => {
        const item = createElement("div", "webhacker-menu__item");
        item.textContent = label;
        item.tabIndex = "-1";
        item.addEventListener("mousedown", e => e.preventDefault());
        item.addEventListener("click", this.createMenuAction(() => executeRichCommand("formatBlock", tag.toUpperCase())));
        dropdownMenuElement.appendChild(item);
        return item;
    });
    
    this.setupMenuKeyboardNav(dropdownMenuElement, {
        items,
        onSelect: (item) => executeRichCommand("formatBlock", headings[items.indexOf(item)].tag.toUpperCase())
    });
    
    return dropdownWrapperElement;
};

WebHackerEditor.prototype.createColorDropdown = function () {
    const t = translations[this.editorOptions.language || "ru"];
    const { dropdownWrapperElement, dropdownMenuElement } = this.createDropdown("fa-solid fa-palette", t.color);
    
    const container = createElement("div", "webhacker-color");
    const swatchesContainer = createElement("div", "webhacker-color__swatches");
    
    const swatches = DEFAULT_TEXT_PRESET_COLORS.map(hex => {
        const swatch = createElement("button", "webhacker-swatch", {
            type: "button", "data-color": hex, title: hex, tabindex: "-1"
        });
        swatch.style.background = hex;
        swatch.addEventListener("click", this.createMenuAction(() => executeRichCommand("foreColor", hex)));
        swatchesContainer.appendChild(swatch);
        return swatch;
    });
    
    const clearBtn = createElement("button", "webhacker-button webhacker-button--ghost", {
        type: "button", "data-tooltip": t.clearColor, tabindex: "-1"
    });
    clearBtn.innerHTML = `<i class="fa-solid fa-eraser"></i>`;
    clearBtn.addEventListener("click", this.createMenuAction(() => {
        executeRichCommand("foreColor", getComputedStyle(this.editorRootElement).getPropertyValue('--text-color').trim());
    }));
    
    container.append(swatchesContainer, clearBtn);
    dropdownMenuElement.appendChild(container);
    
    const allItems = [...swatches, clearBtn];
    
    this.setupMenuKeyboardNav(dropdownMenuElement, {
        items: allItems,
        onSelect: (item) => {
            if (item === clearBtn) {
                executeRichCommand("foreColor", getComputedStyle(this.editorRootElement).getPropertyValue('--text-color').trim());
            } else {
                executeRichCommand("foreColor", item.dataset.color);
            }
        }
    });
    
    return dropdownWrapperElement;
};

WebHackerEditor.prototype.createLinkDropdown = function () {
    const lang = this.editorOptions.language || "ru";
    const t = translations[lang];
    const { dropdownWrapperElement, dropdownMenuElement } = this.createDropdown(
        "fa-solid fa-link",
        t.link
    );
    const linkFormElement = createElement("div", "webhacker-form");
    const linkUrlInputElement = createElement("input", "webhacker-input", {
        type: "text",
        placeholder: t.linkPlaceholder
    });
    const linkTextInputElement = createElement("input", "webhacker-input", {
        type: "text",
        placeholder: t.linkTextPlaceholder
    });
    const linkActionsRowElement = createElement("div", "webhacker-actions");
    const linkConfirmButtonElement = createElement(
        "button",
        "webhacker-button webhacker-button--primary",
        { type: "button" }
    );
    linkConfirmButtonElement.textContent = t.ok;
    const linkRemoveButtonElement = createElement(
        "button",
        "webhacker-button webhacker-button--ghost",
        { type: "button" }
    );
    linkRemoveButtonElement.textContent = t.remove;
    linkActionsRowElement.append(linkConfirmButtonElement, linkRemoveButtonElement);
    linkFormElement.append(linkUrlInputElement, linkTextInputElement, linkActionsRowElement);
    dropdownMenuElement.appendChild(linkFormElement);

    const linkTriggerBtn = dropdownWrapperElement.querySelector(".webhacker-button");
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

    linkConfirmButtonElement.addEventListener("click", this.createMenuAction(() => {
        let hrefValue = linkUrlInputElement.value.trim();
        const labelValue = linkTextInputElement.value.trim();
        if (!hrefValue) return;
        hrefValue = ensureSafeUrl(hrefValue);
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        const visibleText = selection.isCollapsed ? hrefValue : selection.toString();
        const linkHtml = `<a href="${hrefValue}" target="_blank" rel="noopener noreferrer">${escapeHtml(
            labelValue || visibleText
        )}</a>`;
        executeRichCommand("insertHTML", linkHtml);
    }));
    linkRemoveButtonElement.addEventListener("click", this.createMenuAction(() => {
        executeRichCommand("unlink");
        linkUrlInputElement.value = "";
        linkTextInputElement.value = "";
    }));

    return dropdownWrapperElement;
};
