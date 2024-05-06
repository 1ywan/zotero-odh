const HtmlTagsToReplace = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
};

export function replaceHtmlTag(tag: string) {
  //   return HtmlTagsToReplace[tag] || tag;
  return tag;
}

export function escapeHtmlTag(string: string) {
  return string.replace(/[&<>]/g, replaceHtmlTag);
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

String.prototype.replaceAll = function (search, replacement) {
  const target = this;
  search = escapeRegExp(search);
  return target.replace(new RegExp(search, "g"), replacement);
};

String.prototype.searchAll = function (search: string) {
  const target = this;
  search = escapeRegExp(search);
  const regex = new RegExp(search, "gi");
  let result = 0;
  const indices: number[] = [];
  while ((result = regex.exec(target)) && result != "") {
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

// function isInvalid(word) {
//   if (isChinese(word)) return false;
//   return (isChinese(word) && isEmpty(word)) || isShortandNum(word);
// }

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
      arr = arr.filter((x) => x.length);
    } else {
      arr = [sentence];
    }

    let index = arr.findIndex((ele) => {
      //try to exactly match to word based on offset.
      if (ele.indexOf(word) !== -1 && ele.searchAll(word).indexOf(offset) != -1)
        return true;
      else offset -= ele.length;
    });

    if (index == -1)
      // fallback if can not exactly find word.
      index = arr.findIndex((ele) => ele.indexOf(word) !== -1);

    const left = Math.ceil((sentenceNum - 1) / 2);
    let start = index - left;
    let end = index + (sentenceNum - 1 - left);

    if (start < 0) {
      start = 0;
      end = sentenceNum - 1;
    } else if (end > arr.length - 1) {
      end = arr.length - 1;

      if (end - (sentenceNum - 1) < 0) {
        start = 0;
      } else {
        start = end - (sentenceNum - 1);
      }
    }

    return arr
      .slice(start, end + 1)
      .join("")
      .replaceAll(word, word.replace(/[^\s]+/g, "<b>$&</b>"));
  } else {
    return sentence.replace(word, word.replace(/[^\s]+/g, "<b>$&</b>"));
  }
}

// function getSelectionOffset(node) {
//   const range = window.getSelection().getRangeAt(0);
//   const clone = range.cloneRange();
//   clone.selectNodeContents(node);
//   clone.setEnd(range.startContainer, range.startOffset);
//   const start = clone.toString().length;
//   clone.setEnd(range.endContainer, range.endOffset);
//   const end = clone.toString().length;
//   return { start, end };
// }

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
    (x) => x.textContent != "" || x.textContent != "-",
  );
  for (const node of sentenceNodes) {
    if (backwardindex == 0)
      offset =
        sentence.length + _window.getSelection().getRangeAt(0).startOffset;
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

export function getSentence(_window: Window, sentenceNum: any) {
  let sentence = "";
  let offset = 0;
  const upNum = 4;

  const selection = _window.getSelection();
  const word = (selection!.toString() || "").trim();

  if (selection!.rangeCount < 1) return;

  const node = selection!.getRangeAt(0).commonAncestorContainer;

  if (["INPUT", "TEXTAREA"].indexOf(node.tagName) !== -1) {
    return;
  }

  const pdfcontext = getPDFNode(_window, node);
  sentence = escapeHtmlTag(pdfcontext.sentence);
  offset = pdfcontext.offset;

  return cutSentence(word, offset, sentence, sentenceNum);
}

// function getWebNode(node, deep) {
//   const blockTags = ["LI", "P", "DIV", "BODY"];
//   const nodeName = node.nodeName.toUpperCase();
//   if (blockTags.includes(nodeName) || deep === 0) {
//     return node;
//   } else {
//     return getWebNode(node.parentElement, deep - 1);
//   }
// }

export function selectedText(_window: Window) {
  const selection = _window.getSelection();
  return (selection?.toString() || "").trim();
}

export function isValidElement(_document: Document) {
  // if (document.activeElement.getAttribute('contenteditable'))
  //     return false;

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
