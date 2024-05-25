export async function readerOpenHook() {
  Zotero.log("readerOpenHook");
  Zotero.Reader.open = new Proxy(Zotero.Reader.open, {
    apply: async (target, thisArg, argumentsList: any) => {
      Zotero.log("target ready");
      const readerPromise = target.apply(thisArg, argumentsList);
      readerPromise.then(async (reader) => {
        if (reader == null) return;
        Zotero.log("target done");

        if (!reader) return;

        // await onReaderOpened(reader);
        Zotero.log("apply done");
        return reader;
      });
      //   await onReaderOpened(reader);
      //   return reader;
      //   return new Promise((resolve, reject) => {
      //     resolve(reader);
      //   });
      //   await addon.waitForReaderInjection();
    },
  });
}

export function injectStyle(window: Window) {
  const doc = window.document;
  const link = doc.createElement("link");
  link.rel = "stylesheet";
  link.type = "text/css";
  link.href = "chrome://zodh/content/frame.css";
  doc.documentElement.appendChild(link);
}

export async function onReaderOpened(reader: _ZoteroTypes.ReaderInstance) {
  await reader._waitForReader();
  Zotero.log(Zotero.Reader._readers);
  Zotero.log(reader._iframeWindow);

  const doc = reader._iframe?.contentDocument as Document;
  const head = doc.head;
  Zotero.log("client-style write in");
  const clientStyle = doc.createElement("style");
  clientStyle.id = "client-style";

  let response = await fetch("chrome://zodh/content/client.css");
  if (response.ok) {
    const content = await response.text();
    clientStyle.innerHTML = content;
  } else {
    return;
  }
  head.append(clientStyle);

  //   Zotero.log("frame-style write in");
  const frameStyle = doc.createElement("style");
  frameStyle.id = "frame-style";
  response = await fetch("chrome://zodh/content/frame.css");

  if (response.ok) {
    const content = await response.text();
    frameStyle.innerHTML = content;
  }
  head.appendChild(frameStyle);

  //   Zotero.log("spell-style write in");
  const spellStyle = doc.createElement("style");
  spellStyle.id = "spell-style";
  response = await fetch("chrome://zodh/content/spell.css");
  if (response.ok) {
    const content = await response.text();
    spellStyle.innerHTML = content;
  }
  head.appendChild(spellStyle);

  //   link = doc.createElement("link");
  //   link.rel = "stylesheet";
  //   link.type = "text/css";
  //   link.href = "chrome://zodh/content/spell.css";
  //   head.appendChild(link);
}
