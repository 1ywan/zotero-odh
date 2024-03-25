import { spell } from "./spell";

function getImageSource(id: string) {
  return document.querySelector(`#${id}`).src;
}

function registerAddNoteLinks() {
  for (const link of document.getElementsByClassName("odh-addnote")) {
    link.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      const ds = e.currentTarget.dataset;
      e.currentTarget.src = getImageSource("load");
      window.parent.postMessage(
        {
          action: "addNote",
          params: {
            nindex: ds.nindex,
            dindex: ds.dindex,
            context: document.querySelector(".spell-content").innerHTML,
          },
        },
        "*",
      );
    });
  }
}

export function registerAudioLinks(doc: Document) {
  for (const link of doc.getElementsByClassName("odh-playaudio")) {
    link.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (e.currentTarget == null) return;
      const ds = (e.currentTarget as HTMLDivElement).dataset;
      Zotero.ZODH.data.fg.api_playAudio({
        nindex: ds.nindex,
        dindex: ds.dindex,
      });
    });
  }
}

function registerSoundLinks() {
  for (const link of document.getElementsByClassName("odh-playsound")) {
    link.setAttribute("src", getImageSource("play"));
    link.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      const ds = e.currentTarget.dataset;
      window.parent.postMessage(
        {
          action: "playSound",
          params: {
            sound: ds.sound,
          },
        },
        "*",
      );
    });
  }
}

function initSpellnTranslation() {
  document.querySelector("#odh-container").appendChild(spell());
  document.querySelector(".spell-content").innerHTML =
    document.querySelector("#context").innerHTML;
  if (document.querySelector("#monolingual").innerText == "1")
    hideTranslation();
}

function registerHiddenClass() {
  for (const div of document.getElementsByClassName("odh-definition")) {
    div.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      hideTranslation();
    });
  }
}

function hideTranslation() {
  const className =
    "span.chn_dis, span.chn_tran, span.chn_sent, span.tgt_tran, span.tgt_sent"; // to add your bilingual translation div class name here.
  for (const div of document.querySelectorAll(className)) {
    div.classList.toggle("hidden");
  }
}

function onDomContentLoaded() {
  registerAddNoteLinks();
  registerAudioLinks();
  registerSoundLinks();
  registerHiddenClass();
  initSpellnTranslation();
}

function onMessage(e) {
  const { action, params } = e.data;
  const method = window["api_" + action];
  if (typeof method === "function") {
    method(params);
  }
}

function api_setActionState(result) {
  const { response, params } = result;
  const { nindex, dindex } = params;

  const match = document.querySelector(
    `.odh-addnote[data-nindex="${nindex}"].odh-addnote[data-dindex="${dindex}"]`,
  );
  if (response) match.src = getImageSource("good");
  else match.src = getImageSource("fail");

  setTimeout(() => {
    match.src = getImageSource("plus");
  }, 1000);
}

function onMouseWheel(e) {
  document.querySelector("html").scrollTop -= e.wheelDeltaY / 3;
  document.querySelector("body").scrollTop -= e.wheelDeltaY / 3;
  e.preventDefault();
}

// document.addEventListener("DOMContentLoaded", onDomContentLoaded, false);
// window.addEventListener("message", onMessage);
// window.addEventListener("wheel", onMouseWheel, { passive: false });
