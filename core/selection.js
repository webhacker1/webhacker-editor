export function collectNodesInRange(range) {
    const ancestor = range.commonAncestorContainer;
    const root = ancestor.nodeType === 3 ? ancestor.parentNode : ancestor;

    const textNodes = [];
    const preNodes = [];

    const walkNodes = (node) => {
        if (node.nodeName === "PRE") {
            const nodeRange = document.createRange();
            nodeRange.selectNode(node);
            if (
                range.compareBoundaryPoints(Range.END_TO_START, nodeRange) < 0 &&
                range.compareBoundaryPoints(Range.START_TO_END, nodeRange) > 0
            ) {
                preNodes.push(node);
            }
            return;
        }
        if (node.nodeType === 1 && node.classList?.contains("webhacker-math")) {
            return;
        }
        if (node.nodeType === 3) {
            const nodeRange = document.createRange();
            nodeRange.selectNode(node);
            if (
                range.compareBoundaryPoints(Range.END_TO_START, nodeRange) < 0 &&
                range.compareBoundaryPoints(Range.START_TO_END, nodeRange) > 0
            ) {
                textNodes.push(node);
            }
            return;
        }
        node.childNodes.forEach(walkNodes);
    };

    walkNodes(root);
    return { textNodes, preNodes };
}

export function executeFormattingCommand(commandName, commandValue = null) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.getRangeAt(0).collapsed) {
        document.execCommand(commandName, false, commandValue);
        return;
    }
    const range = selection.getRangeAt(0);
    const { preNodes } = collectNodesInRange(range);

    const applyCommand = () => {
        preNodes.forEach(pre => pre.setAttribute("contenteditable", "false"));
        document.execCommand(commandName, false, commandValue);
        preNodes.forEach(pre => pre.removeAttribute("contenteditable"));
    };
    if (!range.cloneContents().querySelector("td, th")) {
        applyCommand();
        return;
    }
    const startMarker = document.createElement("span");
    const endMarker = document.createElement("span");
    const endRange = range.cloneRange();
    endRange.collapse(false);
    endRange.insertNode(endMarker);
    range.insertNode(startMarker);
    const { textNodes } = collectNodesInRange(range);
    
    const segmentRanges = [
        ...textNodes
            .filter(node => !node.parentNode?.closest("table"))
            .map(node => {
                const segmentRange = document.createRange();
                segmentRange.setStart(node, node === range.startContainer ? range.startOffset : 0);
                segmentRange.setEnd(node, node === range.endContainer ? range.endOffset : node.length);
                return segmentRange;
            }),
        ...[...(range.commonAncestorContainer.querySelectorAll?.("td, th") ?? [])]
            .filter(cell => range.intersectsNode(cell))
            .map(cell => {
                const cellRange = document.createRange();
                cellRange.selectNodeContents(cell);
                return cellRange;
            }),
    ];

    const segmentStates = segmentRanges.map(segmentRange => {
        selection.removeAllRanges();
        selection.addRange(segmentRange);
        return document.queryCommandState(commandName);
    });

    const allActive = segmentStates.every(Boolean);

    segmentRanges.forEach((segmentRange, index) => {
        if (allActive === segmentStates[index]) {
            selection.removeAllRanges();
            selection.addRange(segmentRange);
            applyCommand();
        }
    });

    const restoredRange = document.createRange();
    restoredRange.setStartAfter(startMarker);
    restoredRange.setEndBefore(endMarker);
    selection.removeAllRanges();
    selection.addRange(restoredRange);
    startMarker.remove();
    endMarker.remove();
}
