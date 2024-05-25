import { config } from "../package.json";
import { initLocale } from "./utils/locale";
import { createZToolkit } from "./utils/ztoolkit";
import { registerReaderInitializer } from "./modules/reader";
import { onReady } from "./modules/options";
import { injectStyle, onReaderOpened, readerOpenHook } from "./modules/inject";
import { Addon } from "./addon";

async function onStartup() {
  await Promise.all([
    Zotero.initializationPromise,
    Zotero.unlockPromise,
    Zotero.uiReadyPromise,
  ]);
  initLocale();

  Addon.registerPrefs();

  // const obj = new builtin_encn_Collins();

  await addon.init();

  registerReaderInitializer();

  await onMainWindowLoad(window);
}

async function onMainWindowLoad(win: Window): Promise<void> {
  await new Promise((resolve) => {
    if (win.document.readyState !== "complete") {
      win.document.addEventListener("readystatechange", () => {
        if (win.document.readyState === "complete") {
          resolve(void 0);
        }
      });
    }
    resolve(void 0);
  });

  injectStyle(win);
  const callback = {
    notify: async (
      event: string,
      type: string,
      ids: number[] | string[],
      extraData: { [key: string]: any },
    ) => {
      await onNotify(event, type, ids, extraData);
    },
  };
  Zotero.Notifier.registerObserver(callback, ["tab"]);

  // Create ztoolkit for every window
  addon.data.ztoolkit = createZToolkit();
  addon.preLoadIcons();

  // await readerOpenHook();
  // Zotero.Reader._readers.forEach(async (reader) => {
  //   await onReaderOpened(reader);
  // });
}

async function onMainWindowUnload(win: Window): Promise<void> {
  ztoolkit.unregisterAll();
}

function onShutdown(): void {
  ztoolkit.unregisterAll();
  // Remove addon object
  addon.data.alive = false;
  delete Zotero[config.addonInstance];
}

/**
 * This function is just an example of dispatcher for Notify events.
 * Any operations should be placed in a function to keep this funcion clear.
 */
async function onNotify(
  event: string,
  type: string,
  ids: Array<string | number>,
  extraData: { [key: string]: any },
) {
  // You can add your code to the corresponding notify type
  ztoolkit.log("notify", event, type, ids, extraData);
  if (event == "add" && type == "tab") {
    let reader = null;
    try {
      reader = Zotero.Reader.getByTabID(ids[0] as string);
    } catch (e) {
      return;
    }
    await onReaderOpened(reader);
  } else {
    return;
  }
}

/**
 * This function is just an example of dispatcher for Preference UI events.
 * Any operations should be placed in a function to keep this funcion clear.
 * @param type event type
 * @param data event data
 */
async function onPrefsEvent(type: string, data: { [key: string]: any }) {
  switch (type) {
    case "load":
      await onReady(data.window.document);
      break;
    default:
      return;
  }
}

function onShortcuts(type: string) {}

function onDialogEvents(type: string) {}

// Add your hooks here. For element click, etc.
// Keep in mind hooks only do dispatch. Don't add code that does real jobs in hooks.
// Otherwise the code would be hard to read and maintian.

export default {
  onStartup,
  onShutdown,
  onMainWindowLoad,
  onMainWindowUnload,
  onNotify,
  onPrefsEvent,
  onShortcuts,
  onDialogEvents,
};
