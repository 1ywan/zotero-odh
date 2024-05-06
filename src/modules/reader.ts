import { config } from "../../package.json";
import { rangeFromPoint, TextSourceRange } from "./range";
import { onDomContentLoaded } from "./frame";
import { Translation } from "./frontend";

// import { SVGIcon } from "../utils/config";
// import { addTranslateAnnotationTask } from "../utils/task";

export function registerReaderInitializer() {
  Zotero.Reader.registerEventListener(
    "renderTextSelectionPopup",
    (event) => {
      const { reader, doc, params, append } = event;
      let link = doc.createElement("link");
      link.rel = "stylesheet";
      link.type = "text/css";
      link.href = "chrome://zodh/content/client.css";
      doc.head.append(link);

      link = doc.createElement("link");
      link.rel = "stylesheet";
      link.type = "text/css";
      link.href = "chrome://zodh/content/frame.css";
      doc.head.append(link);

      link = doc.createElement("link");
      link.rel = "stylesheet";
      link.type = "text/css";
      link.href = "chrome://zodh/content/spell.css";
      doc.head.append(link);

      const popup = doc.createElement("div");
      popup.id = "odh-popup";
      popup.addEventListener("mousedown", (e: Event) => e.stopPropagation());
      popup.addEventListener("scroll", (e: Event) => e.stopPropagation());

      // popup.append("Loading…");
      append(popup);

      const lastView = reader._internalReader._lastViewPrimary
        ? reader._internalReader._primaryView
        : reader._internalReader._secondaryView;
      const lastContainer = reader._internalReader._lastViewPrimary
        ? reader._internalReader._primaryViewContainer
        : reader._internalReader._secondaryViewContainer;
      const contextDoc = (lastContainer.childNodes[0] as HTMLIFrameElement)
        .contentDocument;

      addon
        .api_getTranslation(params.annotation.text.trim())
        .then((result: any) => {
          const translation = new Translation();
          translation._document = contextDoc;
          translation._window = contextDoc?.defaultView as Window;
          addon.data.fg = translation;
          addon.data.fg.notes = result;
          const notes = addon.data.fg.buildNote(
            contextDoc!.defaultView,
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
