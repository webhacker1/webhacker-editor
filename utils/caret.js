export function getCaretOffsetWithin(root) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return 0;
  const range = sel.getRangeAt(0);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  let offset = 0;
  while (walker.nextNode()) {
    const n = walker.currentNode;
    if (n === range.startContainer) {
      offset += range.startOffset;
      break;
    } else {
      offset += n.nodeValue.length;
    }
  }
  return offset;
}

export function setCaretOffsetWithin(root, offset) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  let acc = 0,
    target = null,
    local = 0,
    n;
  while ((n = walker.nextNode())) {
    const len = n.nodeValue.length;
    if (acc + len >= offset) {
      target = n;
      local = offset - acc;
      break;
    }
    acc += len;
  }
  if (!target) {
    target = root;
    local =
      root.firstChild && root.firstChild.nodeType === 3
        ? root.firstChild.length
        : 0;
  }
  const range = document.createRange();
  range.setStart(target, local);
  range.collapse(true);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}
