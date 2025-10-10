import { ensureSafeUrl, normalizeCssColorToHex } from "./utils.js";
import { sanitizeStyleAttributeForElement } from "./styles.js";
import { TABLE_ALLOWED_CLASS_LIST } from "../constants/allowedTags.js";

export function sanitizeElementAttributes(element, options = {}) {
    [...element.attributes]
        .filter(attribute => /^on/i.test(attribute.name))
        .forEach(attribute => element.removeAttribute(attribute.name));

    const tagName = element.tagName.toLowerCase();
    element.removeAttribute("id");

    switch (tagName) {
        case "a": {
            const hrefValue = ensureSafeUrl(element.getAttribute("href") || "");
            element.setAttribute("href", hrefValue);
            element.setAttribute("target", "_blank");
            element.setAttribute("rel", "noopener noreferrer");
            [...element.attributes].forEach(attribute => {
                if (!["href", "target", "rel", "style"].includes(attribute.name))
                    element.removeAttribute(attribute.name);
            });
            sanitizeStyleAttributeForElement(element, options);
            break;
        }
        case "img": {
            const srcValue = ensureSafeUrl(element.getAttribute("src") || "");
            const isDataImage = /^data:image\//i.test(srcValue);
            const isHttpImage =
                /^https?:\/\//i.test(srcValue) && /\.(png|jpe?g|gif|webp|svg)$/i.test(srcValue);
            if (!(isDataImage || isHttpImage)) {
                element.remove();
                break;
            }
            element.setAttribute("src", srcValue);
            const altValue = element.getAttribute("alt") || "";
            element.setAttribute("alt", altValue);
            [...element.attributes].forEach(attribute => {
                if (!["src", "alt"].includes(attribute.name))
                    element.removeAttribute(attribute.name);
            });
            break;
        }
        case "span": {
            sanitizeStyleAttributeForElement(element, options);
            [...element.attributes].forEach(attribute => {
                if (!["style"].includes(attribute.name)) element.removeAttribute(attribute.name);
            });
            break;
        }
        case "font": {
            const hexColor = options.stripColors
                ? null
                : normalizeCssColorToHex(element.getAttribute("color"));
            if (hexColor) element.setAttribute("color", hexColor);
            else element.removeAttribute("color");
            [...element.attributes].forEach(attribute => {
                if (!["color"].includes(attribute.name)) element.removeAttribute(attribute.name);
            });
            break;
        }
        case "table": {
            const filteredClassList = (element.getAttribute("class") || "")
                .split(/\s+/)
                .filter(className => TABLE_ALLOWED_CLASS_LIST.includes(className));
            if (filteredClassList.length)
                element.setAttribute("class", filteredClassList.join(" "));
            else element.removeAttribute("class");
            [...element.attributes].forEach(attribute => {
                if (!["class"].includes(attribute.name)) element.removeAttribute(attribute.name);
            });
            break;
        }
        case "td":
        case "th": {
            const filteredCellClassList = (element.getAttribute("class") || "")
                .split(/\s+/)
                .filter(className => className === "is-numeric");
            if (filteredCellClassList.length)
                element.setAttribute("class", filteredCellClassList.join(" "));
            else element.removeAttribute("class");
            const colspanValue = element.getAttribute("colspan");
            const rowspanValue = element.getAttribute("rowspan");
            [...element.attributes].forEach(attribute => {
                if (!["class", "colspan", "rowspan", "style"].includes(attribute.name))
                    element.removeAttribute(attribute.name);
            });
            if (colspanValue && !/^\d+$/.test(colspanValue)) element.removeAttribute("colspan");
            if (rowspanValue && !/^\d+$/.test(rowspanValue)) element.removeAttribute("rowspan");

            sanitizeStyleAttributeForElement(element, options);
            break;
        }
        default: {
            sanitizeStyleAttributeForElement(element, options);
            [...element.attributes].forEach(attribute => {
                if (!["style"].includes(attribute.name)) element.removeAttribute(attribute.name);
            });
        }
    }
}
