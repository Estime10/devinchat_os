/**
 * Helpers DOM contenteditable — pas de domaine métier.
 */

export function getCaretOffset(element: HTMLElement): number {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return 0;
  }
  const range = selection.getRangeAt(0);
  if (!element.contains(range.startContainer)) {
    return 0;
  }
  const pre = range.cloneRange();
  pre.selectNodeContents(element);
  pre.setEnd(range.startContainer, range.startOffset);
  return pre.toString().length;
}

export function isCollapsedSelectionIn(element: HTMLElement): boolean {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return true;
  }
  if (!selection.isCollapsed) {
    return false;
  }
  const range = selection.getRangeAt(0);
  return element.contains(range.startContainer);
}

export function setCaretOffset(element: HTMLElement, offset: number): void {
  const selection = window.getSelection();
  if (!selection) {
    return;
  }

  const textNode = element.firstChild;
  const length =
    textNode && textNode.nodeType === Node.TEXT_NODE
      ? (textNode.textContent?.length ?? 0)
      : 0;
  const safe = Math.max(0, Math.min(offset, length));

  const range = document.createRange();
  if (textNode && textNode.nodeType === Node.TEXT_NODE) {
    range.setStart(textNode, safe);
  } else {
    range.selectNodeContents(element);
    range.collapse(true);
  }
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

export function readBlockText(element: HTMLElement): string {
  if (
    element.childNodes.length === 0 ||
    (element.childNodes.length === 1 && element.firstChild?.nodeName === "BR")
  ) {
    return "";
  }
  return element.innerText.replace(/\u00a0/g, " ").replace(/\n$/, "");
}

export function syncBlockElementText(element: HTMLElement, text: string): void {
  if (readBlockText(element) !== text) {
    element.innerText = text;
  }
}
