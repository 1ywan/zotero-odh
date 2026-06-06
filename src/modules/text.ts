const HtmlTagsToReplace = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
};

export function replaceHtmlTag(tag: string) {
  return tag;
}

export function escapeHtmlTag(string: string) {
  return string.replace(/[&<>]/g, replaceHtmlTag);
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

String.prototype.replaceAll = function (search, replacement) {
  search = escapeRegExp(search);
  return this.replace(new RegExp(search, "g"), replacement);
};

String.prototype.searchAll = function (search: string) {
  search = escapeRegExp(search);
  const regex = new RegExp(search, "gi");
  let result = null;
  const indices: number[] = [];
  while ((result = regex.exec(this.valueOf())) && result != null) {
    indices.push(result.index);
  }
  return indices;
};

function isPDFJSPage() {
  return document.querySelectorAll("div#viewer.pdfViewer").length > 0;
}

export function isEmpty(word: any) {
  return !word;
}

export function isShortandNum(word: string) {
  const numReg = /\d/;
  return word.length < 3 || numReg.test(word);
}

export function isChinese(word: string) {
  const cnReg = /[\u4e00-\u9fa5]+/gi;
  return cnReg.test(word);
}


/**
 * Split text by words that start with a capital letter and only the first
 * letter is capitalized (e.g. "Hello" but not "HTML" or "NASA").
 * This helps detect sentence boundaries when punctuation is missing.
 */
function splitByCapitalizedWords(text: string): string[] {
  // Match a word boundary followed by [A-Z][a-z] (capitalized, not all-caps)
  // Split before each such word, but not at the very start of the text
  const parts = text.split(/(?=\b[A-Z][a-z])/g);
  // Re-join fragments that don't start with the pattern (e.g. leading spaces/punctuation)
  const result: string[] = [];
  for (const part of parts) {
    if (result.length > 0 && !/^[A-Z][a-z]/.test(part)) {
      result[result.length - 1] += part;
    } else {
      result.push(part);
    }
  }
  return result.length > 1 ? result : [text];
}

function cutSentence(
  word: string,
  offset: number,
  sentence: string,
  sentenceNum: number,
) {
  if (sentenceNum > 0) {
    let arr = sentence.match(
      /((?![.!?;:。！？]['"’”]?\s).|\n)*[.!?;:。！？]['"’”]?(\s|.*$)/g,
    );
    let filtered = null;
    if (arr && arr.length > 1) {
      arr = arr.reduceRight(
        (accumulation, current: string) => {
          if (current.search(/\.\w{0,3}\.\s$/g) != -1) {
            accumulation[0] = current + accumulation[0];
          } else {
            accumulation.unshift(current);
          }
          return accumulation;
        },
        [""],
      );
      filtered = arr.filter((x) => x.length);
    } else {
      // Fallback: try splitting by capitalized words when punctuation split fails
      filtered = splitByCapitalizedWords(sentence);
    }

    if (filtered === null) return;
    let index = filtered.findIndex((ele) => {
      //try to exactly match to word based on offset.
      if (ele.indexOf(word) !== -1 && ele.searchAll(word).indexOf(offset) != -1)
        return true;
      else offset -= ele.length;
    });

    if (index == -1)
      // fallback if can not exactly find word.
      index = filtered.findIndex((ele) => ele.indexOf(word) !== -1);

    const left = Math.ceil((sentenceNum - 1) / 2);
    let start = index - left;
    let end = index + (sentenceNum - 1 - left);

    if (start < 0) {
      start = 0;
      end = sentenceNum - 1;
    } else if (end > filtered.length - 1) {
      end = filtered.length - 1;

      if (end - (sentenceNum - 1) < 0) {
        start = 0;
      } else {
        start = end - (sentenceNum - 1);
      }
    }

    return filtered
      .slice(start, end + 1)
      .join("")
      .replaceAll(word, word.replace(/[^\s]+/g, "<b>$&</b>"));
  } else {
    return sentence.replace(word, word.replace(/[^\s]+/g, "<b>$&</b>"));
  }
}

function getPDFNode(_window: Window, node: any) {
  let backwardindex = 0;
  do {
    node = node.parentNode;
  } while (
    node.name &&
    node.nodeName.toUpperCase() != "SPAN" &&
    node.nodeName.toUpperCase() != "DIV"
  );
  const currentspan = node;

  let sentenceNodes = [currentspan];
  let previous = null;
  while ((previous = node.previousSibling)) {
    sentenceNodes.unshift(previous);
    backwardindex += 1;
    if (previous.textContent.search(/[.!?;:。！？]['"’”]?(\s|.*$)/g) != -1)
      break;
    else node = previous;
  }

  node = currentspan;
  let next = null;
  while ((next = node.nextSibling)) {
    sentenceNodes.push(next);
    if (
      node.nextSibling.textContent.search(/[.!?;:。！？]['"’”]?(\s|.*$)/g) != -1
    )
      break;
    else node = next;
  }

  let sentence = "";
  let offset = 0;
  sentenceNodes = sentenceNodes.filter(
    (x) => x.textContent != "" && x.textContent != "-",
  );
  for (const node of sentenceNodes) {
    const selection = _window.getSelection();
    if (backwardindex == 0 && selection != null)
      offset = sentence.length + selection.getRangeAt(0).startOffset;
    backwardindex -= 1;
    const nodetext = node.textContent;
    if (nodetext == "-") sentence = sentence.slice(0, sentence.length - 1);
    else
      sentence +=
        nodetext[nodetext.length - 1] == "-"
          ? nodetext.slice(0, nodetext.length - 1)
          : nodetext + " ";
  }

  return { sentence, offset };
}

export function getSentence(_window: Window, word: string, sentenceNum: any) {
  let sentence = "";
  let offset = 0;
  const upNum = 4;

  const selection = _window.getSelection();

  if (selection!.rangeCount < 1) return;

  const node = selection!.getRangeAt(0).commonAncestorContainer as HTMLElement;

  if (["INPUT", "TEXTAREA"].indexOf(node.tagName) !== -1) {
    return;
  }

  const pdfcontext = getPDFNode(_window, node);
  sentence = escapeHtmlTag(pdfcontext.sentence);
  offset = pdfcontext.offset;

  return cutSentence(word, offset, sentence, sentenceNum);
}

export function selectedText(_window: Window) {
  const selection = _window.getSelection();
  return (selection?.toString() || "").trim();
}

export function isValidElement(_document: Document) {
  const invalidTags = ["INPUT", "TEXTAREA"];
  if (_document.activeElement === null) {
    return false;
  }
  const nodeName = _document.activeElement.nodeName.toUpperCase();
  if (invalidTags.includes(nodeName)) {
    return false;
  } else {
    return true;
  }
}
