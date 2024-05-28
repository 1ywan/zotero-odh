import { ColumnOptions } from "zotero-plugin-toolkit/dist/helpers/virtualizedTable";
import { DialogHelper } from "zotero-plugin-toolkit/dist/helpers/dialog";
import hooks from "./hooks";
import { createZToolkit } from "./utils/ztoolkit";
import { Translation } from "./modules/frontend";
import { Ankiconnect } from "./modules/ankiconnect";
import { Ankiweb } from "./modules/ankiweb";
import { optionsLoad } from "./utils/prefs";
import { Deinflector } from "./modules/deinflector";
import { Builtin } from "./modules/builtin";
import { config } from "../package.json";
import { getString } from "./utils/locale";

export class Addon {
  public data: {
    alive: boolean;
    // Env type, see build.js
    env: "development" | "production";
    ztoolkit: ZToolkit;
    locale?: {
      current: any;
    };

    dicts: { [key: string]: any };
    current: string | null;
    dictSelected: any;
    dictNamelist: any;
    audios: { [key: string]: any };
    fg: Translation | null;
  };
  // Lifecycle hooks
  public hooks: typeof hooks;
  // // APIs
  // public api: typeof api;
  public ankiconnect: Ankiconnect | null;
  public ankiweb: Ankiweb | null;
  public target: Ankiconnect | Ankiweb | null;

  public deinflector: Deinflector | null;
  public builtin: Builtin | null;

  private addedElements: [{ [key: string]: string }?] = [];

  static registerPrefs() {
    const prefOptions = {
      pluginID: config.addonID,
      src: rootURI + "chrome/content/preferences.xhtml",
      label: getString("prefs-title"),
      image: `chrome://${config.addonRef}/content/icons/favicon.png`,
      defaultXUL: true,
    };
    ztoolkit.PreferencePane.register(prefOptions);
  }

  constructor() {
    this.data = {
      alive: true,
      env: __env__,
      ztoolkit: createZToolkit(),
      dicts: {},
      current: null,
      dictSelected: null,
      dictNamelist: [],
      audios: [],
      fg: null,
    };
    this.hooks = hooks;

    this.ankiconnect = null;
    this.ankiweb = null;
    this.target = null;
    this.deinflector = null;
    this.builtin = null;
    // this.api = api;
  }

  async init() {
    this.ankiconnect = new Ankiconnect();
    this.ankiweb = new Ankiweb();
    this.target = this.ankiconnect;

    this.deinflector = new Deinflector();
    this.deinflector.loadData();

    this.builtin = new Builtin();
    this.builtin.loadData();

    const options = optionsLoad();
    await this.opt_optionsChanged(options);
  }

  async opt_getDeckNames() {
    return this.target ? await this.target.getDeckNames() : null;
  }

  async opt_getModelNames() {
    return this.target ? await this.target.getModelNames() : null;
  }

  async opt_getModelFieldNames(modelName: string) {
    return this.target ? await this.target.getModelFieldNames(modelName) : null;
  }

  async opt_getVersion() {
    return this.target ? await this.target.getVersion() : null;
  }

  async opt_optionsChanged(options: { [key: string]: any }) {
    // this.setFrontendOptions(options);

    switch (options.services) {
      case "none":
        this.target = null;
        break;
      case "ankiconnect":
        this.target = this.ankiconnect;
        break;
      case "ankiweb":
        this.target = this.ankiweb;
        break;
      default:
        this.target = null;
    }

    const defaultscripts = ["builtin_encn_Collins"];
    const newscripts = `${options.sysscripts},${options.udfscripts}`;
    let loadresults = null;
    // if (
    //   !this.options ||
    //   `${this.options.sysscripts},${this.options.udfscripts}` != newscripts
    // )
    const currentscripts = this.data.dictNamelist.map((x: any) => x.objectname);
    if (currentscripts.join() != newscripts) {
      const scriptsset = Array.from(
        new Set(
          defaultscripts.concat(
            newscripts
              .split(",")
              .filter((x) => x)
              .map((x) => x.trim()),
          ),
        ),
      );
      loadresults = await this.loadScripts(scriptsset);
    }

    // this.options = options;
    if (loadresults) {
      const namelist = loadresults.map((x: any) => x.result.objectname);
      this.data.dictSelected = namelist.includes(options.dictSelected)
        ? options.dictSelected
        : namelist[0];
      this.data.dictNamelist = loadresults.map((x: any) => x.result);
    }
    this.setScriptsOptions(options);
    // optionsSave(this.options);
    // return this.options;
  }

  setScriptsOptions(options: any) {
    for (const dictionary of Object.values(this.data.dicts)) {
      if (typeof dictionary.setOptions === "function")
        dictionary.setOptions(options);
    }

    const selected = this.data.dictSelected;
    if (this.data.dicts[selected]) {
      this.data.current = selected;
      return;
    }
  }

  async api_Deinflect(word: string) {
    return this.deinflector?.deinflect(word);
  }

  async api_getBuiltin(dict: string, word: string) {
    // const { dict, word, callbackId } = params;
    return new Promise((resolve, reject) =>
      resolve(this.builtin?.findTerm(dict, word)),
    );
  }
  async api_addNote(notedef: any) {
    const note = this.formatNote(notedef);
    return new Promise((resolve, reject) => {
      this.target?.addNote(note).then((result) => resolve(result));
    });
  }

  async api_getTranslation(expression: string) {
    // Fix https://github.com/ninja33/ODH/issues/97
    if (expression.endsWith(".")) {
      expression = expression.slice(0, -1);
    }

    const result = await this.findTerm(expression);
    return result;
  }

  formatNote(notedef: any) {
    const options = optionsLoad();

    if (!options.deckname || !options.typename || !options.expression)
      return null;

    const note = {
      deckName: options.deckname,
      modelName: options.typename,
      options: { allowDuplicate: options.duplicate == "1" ? true : false },
      fields: {},
      tags: [],
    };

    const fieldnames = [
      "expression",
      "reading",
      "extrainfo",
      "definition",
      "definitions",
      "sentence",
      "url",
    ];
    for (const fieldname of fieldnames) {
      if (!options[fieldname]) continue;
      note.fields[options[fieldname] as string] = notedef[fieldname];
    }

    const tags = options.tags.trim();
    if (tags.length > 0) note.tags = tags.split(" ");

    if (options.audio && notedef.audios.length > 0) {
      note.fields[options.audio] = "";
      let audionumber = Number(options.preferredaudio);
      audionumber =
        audionumber && notedef.audios[audionumber] ? audionumber : 0;
      const audiofile = notedef.audios[audionumber];
      note.audio = {
        url: audiofile,
        filename: `ODH_${options.dictSelected}_${encodeURIComponent(
          notedef.expression,
        )}_${audionumber}.mp3`,
        fields: [options.audio],
      };
    }

    return note;
  }

  async loadScripts(list: string[]) {
    const promises = list.map((name) => this.loadScript(name));
    const results = await Promise.all(promises);
    return results.filter((x: any) => {
      if (x.result) return x.result;
    });
  }

  async loadScript(name: string) {
    try {
      Services.scriptloader.loadSubScript(
        this.buildScriptURL(name),
        _globalThis,
      );
    } catch (error) {
      Zotero.debug(error);
    }

    let result: { objectname: string; displayname: string } | null = null;
    try {
      const SCRIPT = eval(`${name}`);
      if (SCRIPT.name && typeof SCRIPT === "function") {
        const script = new SCRIPT();
        //if (!this.dicts[SCRIPT.name])
        this.data.dicts[SCRIPT.name] = script;
        if (typeof script.displayName === "function") {
          const displayname = await script.displayName();
          result = { objectname: SCRIPT.name, displayname };
        } else {
          const displayname = SCRIPT.name;
          result = { objectname: SCRIPT.name, displayname };
        }
      }
    } catch (err) {
      result = null;
    }
    return new Promise((resolve, reject) => {
      resolve({
        name,
        result: result,
      });
    });
  }

  buildScriptURL(name: string) {
    const gitbase =
      "https://raw.githubusercontent.com/ninja33/ODH/master/src/dict/";
    let url = name;

    if (url.indexOf("://") == -1) {
      url = rootURI + "/dict/" + url;
    } else {
      //build remote script url with gitbase(https://) if prefix lib:// existing.
      url =
        url.indexOf("lib://") != -1 ? gitbase + url.replace("lib://", "") : url;
    }

    //add .js suffix if missing.
    url = url.indexOf(".js") == -1 ? url + ".js" : url;
    return url;
  }

  async findTerm(expression: string): Promise<string | null> {
    if (
      this.data.dicts[this.data.current!] &&
      typeof this.data.dicts[this.data.current!].findTerm === "function"
    ) {
      const notes =
        await this.data.dicts[this.data.current!].findTerm(expression);
      return notes;
    } else {
      return null;
    }
  }

  preLoadIcons() {
    const plus = document.createElement("img");
    plus.src = "chrome://zodh/content/fg/img/plus.png";

    const load = document.createElement("img");
    load.src = "chrome://zodh/content/fg/img/load.gif";

    const good = document.createElement("img");
    good.src = "chrome://zodh/content/fg/img/good.png";

    const fail = document.createElement("img");
    fail.src = "chrome://zodh/content/fg/img/fail.png";

    const play = document.createElement("img");
    play.src = "chrome://zodh/content/fg/img/play.png";
  }

  storeAddedElementIDs(tabID: string, id: string) {
    this.addedElements.push({ tabID: tabID, elementID: id });
  }

  removeFromWindow(window: Window) {
    for (const element of this.addedElements) {
      const reader = Zotero.Reader.getByTabID(element!.tabID);
      if (reader == null) continue;
      reader._iframeWindow?.document.getElementById(element!.id)?.remove();
    }
  }
}

export default Addon;
