import { config } from "../../package.json";
import { renderPopup } from "./fg/popup";
import { rangeFromPoint, TextSourceRange } from "./fg/range";
import { onDomContentLoaded } from "./frame";

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
      const point = {
        x: params.annotation.position.rects[0][0],
        y: params.annotation.position.rects[0][1],
      };

      // const range = rangeFromPoint(contextDoc!, point);

      // if (range == null) return;
      // const textSource = new TextSourceRange(range);
      // textSource.selectText(contextDoc!.defaultView!);

      Zotero.ZODH.data.bg
        .api_getTranslation(params.annotation.text.trim())
        .then((result: any) => {
          Zotero.ZODH.data.fg.notes = result;
          const notes = Zotero.ZODH.data.fg.buildNote(
            contextDoc!.defaultView,
            result,
          );
          return Zotero.ZODH.data.fg.renderPopup(notes);

          // return renderPopup(result);
        })
        .then((content: any) => {
          popup.style.visibility = "visible";
          // popup.contentWindow!.scrollTo(0, 0);
          // popup.srcdoc = content;
          // popup.src = "chrome://zodh/content/popup.html";
          popup.innerHTML = content;

          onDomContentLoaded(doc);
        });

      // setTimeout(
      //   () =>
      //     container.replaceChildren(
      //       "Translated text: " + params.annotation.text,
      //     ),
      //   1000,
      // );
    },
    config.addonID,
  );
}
