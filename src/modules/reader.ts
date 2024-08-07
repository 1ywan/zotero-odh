import { config } from "../../package.json";
import { optionsLoad } from "../utils/prefs";
import { onDomContentLoaded } from "./frame";
import { Translation } from "./frontend";

// import { SVGIcon } from "../utils/config";
// import { addTranslateAnnotationTask } from "../utils/task";

export function registerReaderInitializer() {
  Zotero.Reader.registerEventListener(
    "renderTextSelectionPopup",
    (event) => {
      const { reader, doc, params, append } = event;
      const popup = doc.createElement("div");
      popup.id = "odh-popup";
      popup.addEventListener("mousedown", (e: Event) => e.stopPropagation());
      popup.addEventListener("scroll", (e: Event) => e.stopPropagation());

      // popup.append("Loading…");
      append(popup);

      const ele = doc.querySelector(".selection-popup") as HTMLDivElement;
      ele.style.maxWidth = "none";

      addon
        .api_getTranslation(params.annotation.text.trim())
        .then((result: any) => {
          const translation = new Translation(optionsLoad());
          translation._document = reader._iframe!.contentDocument;
          // translation._window = reader._iframe;
          addon.data.fg = translation;
          addon.data.fg.notes = result;
          const expression = params.annotation.text.trim();
          const notes = addon.data.fg.buildNote(
            reader._iframeWindow![0],
            expression,
            result,
          );
          return addon.data.fg.renderPopup(notes);
        })
        .then((content: any) => {
          popup.style.visibility = "visible";
          // popup.contentWindow!.scrollTo(0, 0);
          // popup.srcdoc = content;
          // popup.src = "chrome://zodh/content/popup.html";
          popup.innerHTML = content;
          onDomContentLoaded(doc);
        });
    },
    config.addonID,
  );
}
