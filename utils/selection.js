export function saveSelectionRange() {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  return sel.getRangeAt(0).cloneRange();
}

export function restoreSelectionRange(range) {
  if (!range) return;
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

export function isSelectionInside(selector) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return false;
  let node = sel.anchorNode;
  if (node && node.nodeType === 3) node = node.parentNode;
  return !!(node && node.closest(selector));
}
