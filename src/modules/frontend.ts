/* global Popup, rangeFromPoint, TextSourceRange, selectedText, isEmpty, getSentence, isConnected, addNote, getTranslation, playAudio, isValidElement*/
import { isEmpty, isValidElement, selectedText, getSentence } from "./text";
import { api_setActionState } from "./frame";

export class Translation {
  options: {
    hotkey: number;
    maxcontext: number;
    services: string;
    monolingual: string;
  } | null;
  point: { x: number; y: number } | null;
  notes: any;
  sentence: null;
  audio: { [key: string]: any } | null;
  activateKey: number;
  exitKey: number;
  maxContext: number;
  services: string;
  [key: string]: any;
  _window: Window | null;
  _document: Document | null;

  constructor() {
    this.options = null;
    this.point = null;
    this.notes = null;
    this.sentence = null;
    this.audio = null;
    this.activateKey = 16; // shift 16, ctl 17, alt 18
    this.exitKey = 27; // esc 27
    this.maxContext = 1; //max context sentence #
    this.services = "none";
    this._window = null;
    this._document = null;
  }

  async api_addNote(params: { nindex: any; dindex: any; context: any }) {
    const { nindex, dindex, context } = params;

    const notedef = Object.assign({}, this.notes[nindex]);
    notedef.definition =
      this.notes[nindex].css + this.notes[nindex].definitions[dindex];
    notedef.definitions =
      this.notes[nindex].css + this.notes[nindex].definitions.join("<hr>");
    notedef.sentence = context;
    notedef.url = window.location.href;
    const response = await addNote(notedef);

    api_setActionState({ response, params });
  }

  buildNote(_window: Window, result: ConcatArray<never>) {
    //get 1 sentence around the expression.
    const expression = selectedText(_window!);
    const sentence = getSentence(_window!, this.maxContext);
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
    // const services = this.options ? this.options.services : "";
    const services = "ankiconnect";

    let image = "";
    let imageclass = "";
    if (services != "none") {
      image = services == "ankiconnect" ? "plus.png" : "cloud.png";
      imageclass = (await isConnected())
        ? 'class="odh-addnote"'
        : 'class="odh-addnote-disabled"';
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
            audiosegment += `<img class="odh-playaudio" data-nindex="${nindex}" data-dindex="${dindex}"/>`;
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
            : `<img ${imageclass} data-nindex="${nindex}" data-dindex="${dindex}"/>`;
        content += `<div class="odh-definition">${button}${definition}</div>`;
      }
      content += "</div>";
    }
    // content += `<textarea id="odh-context" class="odh-sentence">${this.sentence}</textarea>`;
    content += '<div id="odh-container" class="odh-sentence"></div>';
    // return this.popupHeader() + content + this.popupFooter();
    return `<div class="odh-notes">` + content + this.popupIcons();
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
              <div class="icons hidden"">
                  <img id="plus" src="${button}"/>
                  <img id="load" src="chrome://zodh/content/fg/img/load.gif"/>
                  <img id="good" src="chrome://zodh/content/fg/img/good.png"/>
                  <img id="fail" src="chrome://zodh/content/fg/img/fail.png"/>
                  <img id="play" src="chrome://zodh/content/fg/img/play.png"/>
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

  popupFooter() {
    const root = rootURI;
    const services = this.options ? this.options.services : "";
    const image = services == "ankiconnect" ? "plus.png" : "cloud.png";
    // const button = chrome.runtime.getURL("fg/img/" + image);
    const button = rootURI + "fg/img/" + image;
    const monolingual = this.options
      ? this.options.monolingual == "1"
        ? 1
        : 0
      : 0;

    return `
              </div>
              <div class="icons hidden"">
                  <img id="plus" src="${button}"/>
                  <img id="load" src="${root + "fg/img/load.gif"}"/>
                  <img id="good" src="${root + "fg/img/good.png"}"/>
                  <img id="fail" src="${root + "fg/img/fail.png"}"/>
                  <img id="play" src="${root + "fg/img/play.png"}"/>
                  <div id="context">${this.sentence}</div>
                  <div id="monolingual">${monolingual}</div>
                  </div>
              <script src="${root + "fg/js/spell.js"}"></script>
              <script src="${root + "fg/js/frame.js"}"></script>
              </body>
          </html>`;
  }
}
// window.odhfront = new ODHFront();

async function isConnected() {
  const result = await addon.opt_getVersion();
  return result;
}

async function addNote(notedef: any) {
  const response = await addon.api_addNote(notedef);
  return response;
}
