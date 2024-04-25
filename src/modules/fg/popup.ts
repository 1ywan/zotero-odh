/* global rangeFromPoint */
import { rangeFromPoint } from "./range";

export class Popup {
  popup: any | null;
  offset: number;
  _document: Document | null;
  _window: Window | null;
  constructor() {
    this.popup = null;
    this.offset = 5;
    this._document = null;
    this._window = null;
  }

  showAt(pos: { x: number; y: number }, content: any) {
    this.inject();

    this.popup.style.left = pos.x + "px";
    this.popup.style.top = pos.y + "px";
    this.popup.style.visibility = "visible";

    this.setContent(content);
  }

  showNextTo(point: { x: number; y: number }, content: any) {
    this.inject();
    const elementRect = this.getRangeRect(point);
    const popupRect = this.popup.getBoundingClientRect();

    if (elementRect === undefined) return;

    let posX = elementRect.left;
    if (posX + popupRect.width >= window.innerWidth) {
      posX = window.innerWidth - popupRect.width;
    }

    let posY = elementRect.bottom + this.offset;
    if (posY + popupRect.height >= window.innerHeight) {
      posY = elementRect.top - popupRect.height - this.offset;
    }

    posX = posX < 0 ? 0 : posX;
    posY = posY < 0 ? 0 : posY;

    this.showAt({ x: posX, y: posY }, content);
  }

  hide() {
    if (this.popup !== null) {
      this.popup.style.visibility = "hidden";
    }
  }

  setContent(content: string) {
    if (this.popup === null) {
      return;
    }

    // this.popup.contentWindow.scrollTo(0, 0);

    const doc = this.popup;
    // doc.srcdoc = content;
  }

  getRangeRect(point: { x: number; y: number }) {
    if (this._document === null) return;
    return rangeFromPoint(this._document, point)!.getBoundingClientRect();
  }

  sendMessage(action, params, callback) {
    if (this.popup !== null) {
      this.popup.contentWindow.postMessage({ action, params }, "*");
    }
  }

  inject() {
    if (this.popup !== null) {
      return;
    }

    if (this._document === null) return;

    this.popup = ztoolkit.UI.createElement(this._document, "div", {
      id: "odh-popup",
      children: [{ tag: "h1", properties: { innerText: "Hello World!" } }],
    });
    // this.popup = this._document.createElement("iframe");
    this.popup.id = "odh-popup";
    this.popup.addEventListener("mousedown", (e: Event) => e.stopPropagation());
    this.popup.addEventListener("scroll", (e: Event) => e.stopPropagation());

    const root = this._document.body;
    root.appendChild(this.popup);
  }
}

export async function renderPopup(notes: any[]) {
  let content = "";
  // const services = this.options ? this.options.services : "";
  const services = "";
  const image = "";
  const imageclass = "";
  // if (services != "none") {
  //   image = services == "ankiconnect" ? "plus.png" : "cloud.png";
  //   imageclass = (await isConnected())
  //     ? 'class="odh-addnote"'
  //     : 'class="odh-addnote-disabled"';
  // }

  for (const [nindex, note] of notes.entries()) {
    content += note.css + '<div class="odh-note">';
    let audiosegment = "";
    if (note.audios) {
      for (const [dindex, audio] of note.audios.entries()) {
        if (audio)
          audiosegment += `<img class="odh-playaudio" data-nindex="${nindex}" data-dindex="${dindex}" src="${
            rootURI + "fg/img/play.png"
          }"/>`;
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
  return content;
}
