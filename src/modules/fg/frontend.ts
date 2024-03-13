/* global Popup, rangeFromPoint, TextSourceRange, selectedText, isEmpty, getSentence, isConnected, addNote, getTranslation, playAudio, isValidElement*/
import { isEmpty, isValidElement, selectedText, getSentence } from "./text";
import { rangeFromPoint, TextSourceRange } from "./range";
import { isConnected, getTranslation, addNote, playAudio } from "./api";
import { Popup } from "./popup";

export class ZODHFront {
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
  enabled: boolean;
  mouseselection: boolean;
  activateKey: number;
  exitKey: number;
  maxContext: number;
  services: string;
  popup: Popup;
  timeout: NodeJS.Timeout | null;
  mousemoved: boolean;
  _window: Window | null;
  _document: Document | null;
  [key: string]: any;

  constructor() {
    this.options = null;
    this.point = null;
    this.notes = null;
    this.sentence = null;
    this.audio = null;
    this.enabled = true;
    this.mouseselection = true;
    this.activateKey = 16; // shift 16, ctl 17, alt 18
    this.exitKey = 27; // esc 27
    this.maxContext = 1; //max context sentence #
    this.services = "none";
    this.popup = new Popup();
    this.timeout = null;
    this.mousemoved = false;
    this._window = null;
    this._document = null;

    window.addEventListener("mousemove", (e: MouseEvent) =>
      this.onMouseMove(e),
    );
    window.addEventListener("mousedown", (e: MouseEvent) =>
      this.onMouseDown(e),
    );
    window.addEventListener("dblclick", (e: MouseEvent) =>
      this.onDoubleClick(e),
    );
    window.addEventListener("keydown", (e: KeyboardEvent) => this.onKeyDown(e));

    // chrome.runtime.onMessage.addListener(this.onBgMessage.bind(this));
    // window.addEventListener('message', e => this.onFrameMessage(e));
    // document.addEventListener('selectionchange', e => this.userSelectionChanged(e));
    //window.addEventListener('selectionend', e => this.onSelectionEnd(e));
  }

  isValidZoteroTab() {
    if (Zotero_Tabs.selectedType != "reader") return false;

    // const _document = Zotero?.Reader?.getByTabID(
    //   Zotero_Tabs.selectedID,
    // )._iframe.contentDocument.querySelector("iframe").contentDocument;
    const activeTab = Zotero.Reader.getByTabID(Zotero_Tabs.selectedID);

    this._document =
      activeTab._iframe?.contentDocument.querySelector(
        "iframe",
      ).contentDocument;
    this._window =
      activeTab._iframe?.contentDocument.querySelector("iframe").contentWindow;

    this.popup._document = this._document;
    this.popup._window = this._window;

    return true;
  }

  onKeyDown(e: KeyboardEvent) {
    ztoolkit.log("keydown" + e.code);

    if (!this.isValidZoteroTab()) return;

    if (!this.activateKey) return;

    if (!isValidElement(this._document!)) return;

    if (
      this.enabled &&
      this.point !== null &&
      (e.keyCode === this.activateKey || e.charCode === this.activateKey)
    ) {
      const range = rangeFromPoint(this._document!, this.point);

      if (range == null) return;
      const textSource = new TextSourceRange(range);
      textSource.selectText(this._window!);
      this.mousemoved = false;
      this.onSelectionEnd(e);
    }

    // if (e.keyCode === this.exitKey || e.charCode === this.exitKey)
    //   this.popup.hide();
  }

  onDoubleClick(e: MouseEvent) {
    if (Zotero_Tabs.selectedType === "reader") {
      ztoolkit.log("mouse@" + e.x + "," + e.y);
    }
    // if (!this.mouseselection) return;

    // if (!isValidElement()) return;

    // if (this.timeout) clearTimeout(this.timeout);
    // this.mousemoved = false;
    // this.onSelectionEnd(e);
  }

  onMouseDown(e: MouseEvent) {
    if (Zotero_Tabs.selectedType === "reader") {
      ztoolkit.log("mose down@" + e.x + "," + e.y);
    }
    // this.popup.hide();
  }

  onMouseMove(e: MouseEvent) {
    this.mousemoved = true;
    this.point = {
      x: e.clientX,
      y: e.clientY,
    };
  }

  userSelectionChanged(e: any) {
    if (!this.enabled || !this.mousemoved || !this.mouseselection) return;

    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    // wait 500 ms after the last selection change event
    this.timeout = setTimeout(() => {
      this.onSelectionEnd(e);
      //var selEndEvent = new CustomEvent('selectionend');
      //window.dispatchEvent(selEndEvent);
    }, 500);
  }

  async onSelectionEnd(e: MouseEvent | KeyboardEvent) {
    if (!this.enabled) return;

    if (!this._document) return;
    if (!isValidElement(this._document)) return;

    // reset selection timeout
    this.timeout = null;
    if (!this._window) return;
    const expression = selectedText(this._window);
    if (isEmpty(expression)) return;

    const result = await getTranslation(expression);
    if (result == null || result.length == 0) return;
    this.notes = this.buildNote(result);
    this.popup.showNextTo(
      { x: this.point!.x, y: this.point!.y },
      await this.renderPopup(this.notes),
    );
  }

  onBgMessage(
    request: { action: any; params: any },
    sender: any,
    callback: () => void,
  ) {
    const { action, params } = request;
    const method = this["api_" + action];

    if (typeof method === "function") {
      params.callback = callback;
      method.call(this, params);
    }

    callback();
  }

  api_setFrontendOptions(params: { options: any; callback: any }) {
    const { options, callback } = params;
    this.options = options;
    this.enabled = options.enabled;
    this.mouseselection = options.mouseselection;
    this.activateKey = Number(this.options?.hotkey);
    this.maxContext = Number(this.options?.maxcontext);
    this.services = options.services;
    callback();
  }

  onFrameMessage(e: { data: { action: any; params: any } }) {
    const { action, params } = e.data;
    const method = this["api_" + action];
    if (typeof method === "function") {
      method.call(this, params);
    }
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
    this.popup.sendMessage("setActionState", { response, params });
  }

  async api_playAudio(params: { nindex: any; dindex: any }) {
    const { nindex, dindex } = params;
    const url = this.notes[nindex].audios[dindex];
    const response = await playAudio(url);
  }

  api_playSound(params: { sound: any }) {
    const url = params.sound;

    for (const key in this.audio) {
      this.audio[key].pause();
    }

    const audio = this.audio![url] || new Audio(url);
    audio.currentTime = 0;
    audio.play();

    this.audio![url] = audio;
  }

  buildNote(result: ConcatArray<never>) {
    //get 1 sentence around the expression.
    const expression = selectedText(this._window!);
    const sentence = getSentence(this._window!, this.maxContext);
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
    const services = this.options ? this.options.services : "";
    let image = "";
    let imageclass = "";
    if (services != "none") {
      image = services == "ankiconnect" ? "plus.png" : "cloud.png";
      imageclass = (await isConnected())
        ? 'class="odh-addnote"'
        : 'class="odh-addnote-disabled"';
    }

    for (const [nindex, note] of notes.entries()) {
      // content +=
      //   note.css +
      //   `<style>
      //     .odh-notes {
      //       font-family: 'Open Sans', Helvetica, Arial, 'Microsoft Yahei', Sans-serif;
      //       /*font-family: 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande', 'Lucida Sans Unicode', Geneva, Verdana, 'Microsoft Yahei', sans-serif;*/
      //       font-size: 14px;
      //       text-align: left;
      //       color: #1d2129;
      //       line-height: 1.5em;
      //       min-height: 1.5em;
      //       overflow-y: auto;
      //       margin: 8px;
      //       border-radius: 3px;
      //       box-sizing: border-box;
      //       ;
      //     }

      //     .odh-note {
      //       margin: 5px 0;
      //       padding: 0px;
      //       /*border: 1px dashed red;*/
      //     }

      //     .odh-headsection {
      //       margin: 3px 0;
      //       padding: 0 3px 3px;
      //       border-bottom: 2px #666 solid;
      //     }

      //     .odh-expression {
      //       font-size: 1.2em;
      //       font-weight: bold;
      //       margin-right: 4px;
      //     }

      //     .odh-reading {
      //       font-family: Arial, Helvetica, sans-serif;
      //       margin-right: 4px;
      //       font-size: 0.9em;
      //       display: inline-block;
      //     }

      //     .odh-extra {
      //       margin-right: 4px;
      //       display: inline-block;
      //     }

      //     .odh-definition,
      //     .odh-sentence {
      //       display: block;
      //       background-color: #fefefe;
      //       border: 1px solid;
      //       border-color: #e5e6e9 #dfe0e4 #d0d1d5;
      //       border-radius: 3px;
      //       padding: 5px;
      //       margin-top: 5px;
      //       word-wrap: break-word;
      //       overflow: auto;
      //     }
      //     #odh-context{
      //       font-family: 'Open Sans', Helvetica, Arial, 'Microsoft Yahei', Sans-serif;
      //       background:#fffff4;
      //       margin:0;
      //       width: 96%;
      //       height: 100px;
      //     }
      //     .odh-sentence {
      //       border: 2px dashed #d0d1d5;
      //       padding:0;
      //     }

      //     .odh-addnote-disabled,
      //     .odh-addnote {
      //       margin: 3px;
      //       cursor: pointer;
      //       position: relative;
      //       float: right;
      //     }

      //     .odh-addnote-disabled{
      //       cursor: not-allowed;
      //       opacity:0.5;
      //     }

      //     .odh-audios {
      //       margin: 3px;
      //       position: relative;
      //       float: right;
      //     }

      //     .odh-playaudio {
      //       cursor: pointer;
      //       margin: 0 3px;
      //     }

      //     .odh-playsound {
      //       vertical-align: text-bottom;
      //       margin: 0 3px;
      //     }

      //     hr {
      //       border: 1px;
      //       margin: 5px 0;
      //       border-top: 1px solid #d5d5d5;
      //     }

      //     .hidden {
      //       display: none;
      //     }

      //     .highlight {
      //       /*font-weight       : bold;*/
      //       font-size: 0.9em;
      //       border-radius: 4px;
      //       color: #fff;
      //       padding: 1px 2px;
      //       margin-right: 3px;
      //       text-decoration: none;
      //       text-align: center;
      //     }
      // </style>` +
      //   '<div class="odh-note">';

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
            : `<img ${imageclass} data-nindex="${nindex}" data-dindex="${dindex}" src="${
                rootURI + "fg/img/" + image
              }" />`;
        content += `<div class="odh-definition">${button}${definition}</div>`;
      }
      content += "</div>";
    }
    //content += `<textarea id="odh-context" class="odh-sentence">${this.sentence}</textarea>`;
    content += '<div id="odh-container" class="odh-sentence"></div>';
    // return this.popupHeader() + content + this.popupFooter();
    return `<div class="odh-notes">` + content;
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
