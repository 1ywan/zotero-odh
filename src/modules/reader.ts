import { config } from "../../package.json";
import { isConnected } from "../addon";
import { getPref, Option, optionsLoad } from "../utils/prefs";
import { api_setActionState, onDomContentLoaded } from "./frame";
import { getSentence } from "./text";

const READER_CSS_ID = "zodh-reader-css";

/**
 * Inject all ODH popup styles as an inline <style> element.
 *
 * We CANNOT use a <link> to chrome:// because the reader page is served from
 * resource://zotero and Firefox blocks cross-protocol stylesheet loads.
 * Inline <style> is allowed and is the standard approach for Zotero reader plugins.
 */
function ensureReaderStylesheet(doc: Document) {
  if (doc.getElementById(READER_CSS_ID)) {
    return;
  }

  const style = doc.createElement("style");
  style.id = READER_CSS_ID;
  style.textContent = `
    #odh-popup {
      all: initial;
      background-color: #fff;
      border: 1px solid #666;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
      height: 300px;
      resize: both;
      width: 400px;
      z-index: 2147483647;
      overflow-y: scroll;
      display: block;
      visibility: hidden;
      max-height: 70vh;
    }

    #odh-popup .odh-notes {
      font-family: "Open Sans", Helvetica, Arial, "Microsoft Yahei", sans-serif;
      font-size: 14px;
      text-align: left;
      color: #1d2129;
      line-height: 1.5em;
      min-height: 1.5em;
      overflow-y: auto;
      margin: 8px;
      border-radius: 3px;
      box-sizing: border-box;
    }

    #odh-popup .odh-note {
      margin: 5px 0;
      padding: 0px;
    }

    #odh-popup .odh-headsection {
      margin: 3px 0;
      padding: 0 3px 3px;
      border-bottom: 2px #666 solid;
    }

    #odh-popup .odh-expression {
      font-size: 1.2em;
      font-weight: bold;
      margin-right: 4px;
      letter-spacing: 0.01em;
    }

    #odh-popup .odh-reading {
      font-family: Arial, Helvetica, sans-serif;
      margin-right: 4px;
      font-size: 0.9em;
      display: inline-block;
    }

    #odh-popup .odh-extra {
      margin-right: 4px;
      display: inline-block;
    }

    #odh-popup .odh-definition {
      display: block;
      background-color: #fefefe;
      border: 1px solid;
      border-color: #e5e6e9 #dfe0e4 #d0d1d5;
      border-radius: 6px;
      padding: 5px;
      margin-top: 5px;
      word-wrap: break-word;
      overflow: auto;
    }

    #odh-popup .odh-definition:hover {
      background-color: #f7fafc;
    }

    #odh-popup .odh-sentence {
      display: block;
      background-color: #fefefe;
      border: 2px dashed #d0d1d5;
      border-radius: 3px;
      padding: 0;
      margin-top: 5px;
      word-wrap: break-word;
      overflow: auto;
    }

    #odh-popup .odh-context {
      font-family: "Open Sans", Helvetica, Arial, "Microsoft Yahei", sans-serif;
      background: #fffff4;
      margin: 0;
      width: 96%;
      height: 100px;
    }

    #odh-popup .odh-addnote {
      margin: 3px;
      cursor: pointer;
      position: relative;
      float: right;
      width: 16px;
      height: 16px;
    }

    #odh-popup .odh-addnote-disabled {
      margin: 3px;
      cursor: not-allowed;
      position: relative;
      float: right;
      width: 16px;
      height: 16px;
      opacity: 0.5;
    }

    #odh-popup .odh-addnote-plus {
      background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAJvSURBVDjLpZPrS5NhGIf9W7YvBYOkhlkoqCklWChv2WyKik7blnNris72bi6dus0DLZ0TDxW1odtopDs4D8MDZuLU0kXq61CijSIIasOvv94VTUfLiB74fXngup7nvrnvJABJ/5PfLnTTdcwOj4RsdYmo5glBWP6iOtzwvIKSWstI0Wgx80SBblpKtE9KQs/We7EaWoT/8wbWP61gMmCH0lMDvokT4j25TiQU/ITFkek9Ow6+7WH2gwsmahCPdwyw75uw9HEO2gUZSkfyI9zBPCJOoJ2SMmg46N61YO/rNoa39Xi41oFuXysMfh36/Fp0b7bAfWAH6RGi0HglWNCbzYgJaFjRv6zGuy+b9It96N3SQvNKiV9HvSaDfFEIxXItnPs23BzJQd6DDEVM0OKsoVwBG/1VMzpXVWhbkUM2K4oJBDYuGmbKIJ0qxsAbHfRLzbjcnUbFBIpx/qH3vQv9b3U03IQ/HfFkERTzfFj8w8jSpR7GBE123uFEYAzaDRIqX/2JAtJbDat/COkd7CNBva2cMvq0MGxp0PRSCPF8BXjWG3FgNHc9XPT71Ojy3sMFdfJRCeKxEsVtKwFHwALZfCUk3tIfNR8XiJwc1LmL4dg141JPKtj3WUdNFJqLGFVPC4OkR4BxajTWsChY64wmCnMxsWPCHcutKBxMVp5mxA1S+aMComToaqTRUQknLTH62kHOVEE+VQnjahscNCy0cMBWsSI0TCQcZc5ALkEYckL5A5noWSBhfm2AecMAjbcRWV0pUTh0HE64TNf0mczcnnQyu/MilaFJCae1nw2fbz1DnVOxyGTlKeZft/Ff8x1BRssfACjTwQAAAABJRU5ErkJggg==) no-repeat;
    }

    #odh-popup .odh-addnote-cloud {
      background: url("chrome://zodh/content/fg/img/cloud.png") no-repeat;
    }

    #odh-popup .odh-addnote-load {
      background: url("chrome://zodh/content/fg/img/load.gif") no-repeat;
    }

    #odh-popup .odh-addnote-good {
      background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACcUlEQVQ4jZVR30tTcRw99/u9P5x36s1fA5d1lZWYpTdfCtRtiQmbmflWgTF78qnsL7D9BfPFBymSwEgjKE3QCKYPRmWml0TIDF1mc0NzVzc3NnW3hzBERul5/HDO+ZzP+TA4CrohE4Z08JSXBcr7eMrdY48glghDRq/JTtksFmB5y4+Pa1MyOayeMrT9krlGtpmrYUwzwH68Bpl8uv1QCbgHrCJyYodTrsf32AIAQGeSAAgOlYAlrOdW6XXwHIuoHkFZdjk+rargCNf5X4P0RwZXaXaJvdKk4GdiCeXZlQhEg5j5NeujhLr/nNAFBQQKGKhog7onzugxSoQhHlfZTYSTGnINeRA5I57NvQBL2NbJJlUj6ILHIhVNO07W9eSkHZtGNzz7ivM0WZxSrpiDLYRRnHEK71cmEN2Jdk42qWMAwIJB++2yFhg4AZflWvTO9bfPPvwiiZzhcX56nuuqpQGBnWVYMkrgj6xgKqj6KEPde0sIGMDIi1hLrGJzN4Q759tgL6xyUUJHW8+1YIckIPIiOMJj6NswKKHN7xontb8p0QgplNAu2s1WxPUY4noMtkIbiiUZFaaz2MA6ThiK4PWNYUHzud9emejbXzLFEF77awPy5vamYjNbEUcca7tBVORUIIwN5KeZ4A8HMPR1WB1v+HDj4JcoAOiv9IFQvSZHtiNKdUEVCGWwmgwik8+CgYjo/fwU28mEw/fkRyClAQDEXyYGYo6YPB+aV6zmGmQJmcgTTPAujmFBW3R7HeN9B8Upceb56R7nmzp9cL1f717q1OtGrNP/4jOphhcGK+8LVLgrUF6jhDaP1HvVVDwA+A0rr9F+/wY4EQAAAABJRU5ErkJggg==) no-repeat;
    }

    #odh-popup .odh-addnote-fail {
      background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACpElEQVR4nHWTTU8TQRzGn5n/rNtXuxVoWbSmJcYXwGQuFBNP+w0w8AEkPXHDT4LfoF7lAL6QXiDZIF4IlyXeCVEogqFu6Yvbmtnx4LIRo//jJL/fMzPPDEM0Xq22OvT9cvPjx6X5szMf/5gN27bsubm6Gg6PnjYaLwCAA8Cn5eV6YXZ2hTM2nxoddd+Mj1v/gV3r3r153WqtbD16VAcA5tVqq4XZ2ZXm1haGrRa0Uuien3v9dtt5dnrqA8D6xIRlV6tufnJSXuzsQisFAOj3ei/F0PfLze3tGIZSSOfzEmHorgMOGINdrbr5SkVe7OwASoFFuwqVKrO3xaKVHB110yMjEkpBhyGgFBCG6LbbXm5qCrcqFXnx4cPvda3BAFz2+16333cYALwZH7eSluWm83l5BbMwBMIQt548gb+3FyczreH3+143CJyFkxOf/XlJqWzWTd+8Ka9gpjX0YAAdBGBRclcI7zIInMWTEx9AfBwAwLptW6lMxs0kk1J9/w7VboMD4JyDiNAxDK8rhLN4fBzXLK51xRiylQpSponW4SEoAokIxDk4EfRf9fI/0wszM27asuTFzk6cSkQQRBBCoEgkRzh310ol65pgI4IzuZz81miAhyE4Y7FECAHDMGAIgdumKYuGEUvYhm1bY1HyeaMBrnWc2DNNj4hQIJJXAkMIEBE+B4F3HASOGJuerqdyOfl1cxNcazAiMMbQNQyvJ4SjARBj7p1IciMSPUgkJO906uJnp3N0urt7De6ZpvfDMOLbXiuVHKGUO0kkb0QSzjmSQXDEAOBdNls3BoPnRIRhOu0NTNNZiHq+mrVSybqTSrkP83mZTCTwpdd7dX9/fyl+B+9zuVUQlYeJxNJCs/nP7/z67l2rnMnUU4Zx9Pjg4AUA/ALA8B6CbeY2WQAAAABJRU5ErkJggg==) no-repeat;
    }

    #odh-popup .odh-audios {
      margin: 3px;
      position: relative;
      float: right;
    }

    #odh-popup .odh-playaudio {
      vertical-align: text-bottom;
      margin: 0 3px;
      height: 16px;
      width: 16px;
      background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAH0SURBVDjLxdPPS9tgGAfwgH/ATmPD0w5jMFa3IXOMFImsOKnbmCUTacW1WZM2Mf1ho6OBrohkIdJfWm9aLKhM6GF4Lz3No/+AMC/PYQXBXL1+95oxh1jGhsgOX/LywvN5n/fN+3IAuKuEuzagVFoO27b1/Z+BcrnUx4otx7FPLWsJvYpIM2SS9H4PqNWqfK1W8VKplHlW/G1zs4G9vS9YXPx4CaDkXOFES4Om4gceUK2WsbZWR72+gtXVFezsbKHVamF7ewtm/sMFgBJZhd6pvm4kDndaAo2KOmt5Gfv7X9HpdNBut9FsNmFZFgPrMHKZc4DkjHyi6KC3MZNehTOuGAH5Xx5ybK/Y3f0Mx3Fg2zaKxSIMw2DjT0inNQ84nogcUUQJHIfZquNT3hzx46DBALizg2o01qEoCqLRKERRRDAYhKYlWRK/AJdCMwH2BY28+Qk8fg667wdXKJjY2FiHaeaRzWYQCk1AEASGzSCZjP/ewtik5r6eBD0dM+nRSMb1j4LuPDnkFhZymJ/PsmLdazmV0jxEkqKsK+niIQ69mKUBwdd9OAx3SADdHtC53FyK12dVXlVlPpF4zytK7OgMyucNyHLs8m+8+2zJHRwG3fId9LxIbNU+OR6zWU57AR5y84FKN+71//EqM2iapfv/HtPf5gcdtKR8VW88PgAAAABJRU5ErkJggg==) no-repeat;
      display: inline-block;
      opacity: 0.85;
    }

    #odh-popup .odh-playaudio:hover {
      opacity: 1;
    }

    #odh-popup hr {
      border: 1px;
      margin: 5px 0;
      border-top: 1px solid #d5d5d5;
    }

    #odh-popup .hidden {
      display: none;
    }

    #odh-popup .hightlight {
      font-size: 0.9em;
      border-radius: 4px;
      color: #fff;
      padding: 1px 2px;
      margin-right: 3px;
      text-decoration: none;
      text-align: center;
    }

    #odh-popup .spell {
      border-radius: 5px;
      box-shadow: 0 1px 3px rgba(10, 10, 10, 0.25);
      box-sizing: border-box;
      width: 100%;
    }

    #odh-popup .spell-content {
      box-sizing: border-box;
      min-height: 100px;
      resize: vertical;
      outline: 0;
      overflow-y: auto;
      padding: 0.5em;
      width: 100%;
    }

    #odh-popup .spell-bar {
      display: table;
      width: 100%;
      height: 28px;
      background-color: #f6f6f6;
      box-shadow: inset 0 -1px 2px rgba(10, 10, 10, 0.1);
      border: none;
      border-top-left-radius: 5px;
      border-top-right-radius: 5px;
    }

    #odh-popup .spell-zone {
      display: table-cell;
      text-align: center;
      counter-reset: btn;
    }

    #odh-popup .spell-icon {
      display: inline-block;
      position: relative;
      background-color: transparent;
      border: none;
      cursor: pointer;
      height: 22px;
      width: 22px;
      outline: 0;
      font-size: 10px;
      line-height: 0;
    }
  `;

  (doc.head || doc.documentElement).appendChild(style);
}

// import { SVGIcon } from "../utils/config";
// import { addTranslateAnnotationTask } from "../utils/task";

export function registerReaderInitializer() {
  Zotero.Reader.registerEventListener(
    "renderTextSelectionPopup",
    (event) => {
      ensureReaderStylesheet(event.doc);

      const enabled = getPref("enabled");
      if (!enabled) {
        return;
      }

      const { reader, doc, params, append } = event;
      const expression = params.annotation.text.trim();
      const nrofWords = expression.split(" ").length;
      if (nrofWords > 1 && getPref("singlewordmode")) {
        return;
      }

      const popup = doc.createElement("div");
      popup.id = "odh-popup";
      popup.className = "label-popup";
      popup.addEventListener("mousedown", (e: Event) => e.stopPropagation());
      popup.addEventListener("scroll", (e: Event) => e.stopPropagation());
      // popup.addEventListener("keydown", (e: KeyboardEvent) => {
      //   e.stopPropagation();
      // });

      // popup.append("Loading…");
      append(popup);

      const ele = doc.querySelector(".selection-popup") as HTMLDivElement;
      ele.style.maxWidth = "none";

      addon
        .api_getTranslation(expression)
        .then((result: any) => {
          const translation = new Translation(optionsLoad());
          translation._document = reader._iframe!.contentDocument;
          // translation._window = reader._iframe;
          addon.data.currentTranslation = translation;
          addon.data.currentTranslation.notes = result;
          // const expression = params.annotation.text.trim();
          const notes = addon.data.currentTranslation.buildNote(
            reader._iframeWindow![0],
            expression,
            result,
          );
          return addon.data.currentTranslation.renderPopup(notes);
        })
        .then((content: any) => {
          popup.innerHTML = content;
          // Styles are injected as inline <style> (chrome:// blocked by CSP)
          popup.style.visibility = "visible";
          onDomContentLoaded(doc);
        });
    },
    config.addonID,
  );
}

export class Translation {
  options?: Option;
  notes: any;
  sentence: null;
  maxContext: number;
  [key: string]: any;
  // _window?: Window;
  _document?: Document;

  constructor(options: Option) {
    this.options = options;
    this.notes = null;
    this.sentence = null;
    this.maxContext = 1; //max context sentence #
  }

  async api_addNote(params: {
    nindex: any;
    dindex: any;
    context: any;
    extrainfo: any;
  }) {
    const { nindex, dindex, context, extrainfo } = params;

    const notedef = Object.assign({}, this.notes[nindex]);
    notedef.definition =
      this.notes[nindex].css + this.notes[nindex].definitions[dindex];
    notedef.definitions =
      this.notes[nindex].css + this.notes[nindex].definitions.join("<hr/>");
    notedef.sentence = context;
    notedef.url = window.location.href;
    notedef.extrainfo = extrainfo;
    const response = await addon.api_addNote(notedef);

    if (this._document == null) return;
    api_setActionState(this._document, { response, params });
  }

  buildNote(_window: Window, expression: string, result: ConcatArray<never>) {
    //get 1 sentence around the expression.
    // const expression = selectedText(_window!);
    const sentence = getSentence(_window, expression, this.maxContext);
    this.sentence = sentence;
    const tmpl: { [key: string]: any } = {
      css: "",
      expression,
      reading: "",
      extrainfo: "",
      definitions: "",
      sentence,
      url: "",
      audios: [],
    };

    type Tmpl = {
      [K: string]: string;
    };

    //if 'result' is array with notes.
    if (Array.isArray(result)) {
      for (const item of result) {
        for (const key in tmpl) {
          item[key] = item[key] ? item[key] : tmpl[key];
        }
      }
      return result;
    } else {
      // if 'result' is simple string, then return standard template.
      tmpl["definitions"] = [].concat(result);
      return [tmpl];
    }
  }

  async renderPopup(notes: any[]) {
    let content = "";
    const services = this.options ? this.options.services : "none";
    // const services = "ankiconnect";
    let image = "";
    let imageclass = "";
    // TODO: make options sanity
    if (services != "none") {
      image = services == "ankiconnect" ? "plus.png" : "cloud.png";
      imageclass = (await isConnected())
        ? 'class="odh-addnote odh-addnote-plus"'
        : 'class="odh-addnote-disabled odh-addnote-plus"';
    }

    for (const [nindex, note] of notes.entries()) {
      content += note.css + '<div class="odh-note">';
      let audiosegment = "";
      if (note.audios) {
        for (const [dindex, audio] of note.audios.entries()) {
          if (audio)
            // audiosegment += `<img class="odh-playaudio" data-nindex="${nindex}" data-dindex="${dindex}" src="${
            //   rootURI + "fg/img/play.png"
            // }"/>`;
            audiosegment += `<div class="odh-playaudio" data-nindex="${nindex}" data-dindex="${dindex}"></div>`;
        }
      }
      content += `
                  <div class="odh-headsection">
                      <span class="odh-audios">${audiosegment}</span>
                      <span class="odh-expression">${note.expression}</span>
                      <span class="odh-reading">${note.reading}</span>
                      <span class="odh-extra">${note.extrainfo}</span>
                  </div>`;
      for (const [dindex, definition] of note.definitions.entries()) {
        const button =
          services == "none" || services == ""
            ? ""
            : `<div ${imageclass} data-nindex="${nindex}" data-dindex="${dindex}"></div>`;
        content += `<div class="odh-definition">${button}${definition}</div>`;
      }
      content += "</div>";
    }
    // content += `<textarea id="odh-context" class="odh-sentence">${this.sentence}</textarea>`;
    content += `<div id="odh-container" class="odh-sentence"></div>`;
    // content += `<div id="odh-container" class="odh-sentence">${this.sentence}</div>`;
    // return this.popupHeader() + content + this.popupFooter();
    return `<div class="odh-notes">` + content + this.popupIcons();
    // return `<div class="odh-notes">` + content;
  }
  popupIcons() {
    const root = rootURI;
    const services = this.options ? this.options.services : "";
    const image = services == "ankiconnect" ? "plus.png" : "cloud.png";
    // const button = chrome.runtime.getURL("fg/img/" + image);
    const button = "chrome://zodh/content/fg/img/" + image;
    const monolingual = this.options
      ? this.options.monolingual == "1"
        ? 1
        : 0
      : 0;

    return `
              <div class="icons hidden" style="display: none;">
                  <div id="context">${this.sentence}</div>
                  <div id="monolingual">${monolingual}</div>
              </div>
            `;
  }

  popupHeader() {
    // const root = chrome.runtime.getURL("/");
    const root = rootURI;
    return `
          <html lang="en">
              <head><meta charset="UTF-8"><title></title>
                  <link rel="stylesheet" href="${root + "fg/css/spell.css"}">
              </head>
              <body style="margin:0px;">
              <div class="odh-notes">`;
  }
}
