export function rangeFromPoint(
  _document: Document,
  point: { x: number; y: number },
) {
  const position = _document.caretPositionFromPoint(point.x, point.y);
  if (position && position.offsetNode && position.offsetNode.nodeType === 3) {
    const range = _document.createRange();
    range.setStart(position.offsetNode, position.offset);
    range.setEnd(position.offsetNode, position.offset);
    return range;
  }
  return null;
}

export class TextSourceRange {
  rng: any;
  constructor(range: object) {
    this.rng = range;
  }

  text() {
    return this.rng.toString();
  }

  setWordRange() {
    const backwardcount = 1;
    const forwardcount = 1;
    if (this.rng.startContainer.data) {
      this.setStartOffset(backwardcount);
      this.setEndOffset(forwardcount);
    }
    return null;
  }

  isAlpha(char: string) {
    return /[\u002D|\u0041-\u005A|\u0061-\u007A|\u00A0-\u024F]/.test(char);
  }

  getStartPos(backwardcount: number) {
    const clone = this.rng.cloneRange();
    let pos = this.rng.startOffset;
    let count = 0;
    let rangeText = "";

    while (pos >= 1) {
      clone.setStart(this.rng.startContainer, --pos);
      rangeText = clone.toString();
      count += this.isAlpha(rangeText.charAt(0)) ? 0 : 1;
      if (count == backwardcount) {
        break;
      }
    }
    return pos;
  }

  getEndPos(forwardcount: number) {
    const clone = this.rng.cloneRange();
    let pos = this.rng.endOffset;
    let count = 0;
    let rangeText = "";

    while (pos < this.rng.endContainer.data.length) {
      clone.setEnd(this.rng.endContainer, ++pos);
      rangeText = clone.toString();
      count += this.isAlpha(rangeText.charAt(rangeText.length - 1)) ? 0 : 1;
      if (count == forwardcount) {
        break;
      }
    }
    return pos;
  }

  setStartOffset(backwardcount: number) {
    let startPos = this.getStartPos(backwardcount);
    if (startPos != 0) startPos++;
    this.rng.setStart(this.rng.startContainer, startPos);
  }

  setEndOffset(forwardcount: number) {
    let endPos = this.getEndPos(forwardcount);
    if (endPos != this.rng.endContainer.data.length) endPos--;
    this.rng.setEnd(this.rng.endContainer, endPos);
  }

  selectText(_window: Window) {
    this.setWordRange();
    const selection = _window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(this.rng);
  }

  deselect(_window: Window) {
    const selection = _window.getSelection();
    selection?.removeAllRanges();
  }
}
