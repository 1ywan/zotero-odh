import { ColumnOptions } from "zotero-plugin-toolkit/dist/helpers/virtualizedTable";
import { DialogHelper } from "zotero-plugin-toolkit/dist/helpers/dialog";
import hooks from "./hooks";
import { createZToolkit } from "./utils/ztoolkit";
import { ZODHFront } from "./modules/fg/frontend";
import { ODHBack } from "./modules/bg/backend";
import { Ankiconnect } from "./modules/bg/ankiconnect";
import { Ankiweb } from "./modules/bg/ankiweb";
import { optionsLoad } from "./utils/prefs";

class Addon {
  public data: {
    alive: boolean;
    // Env type, see build.js
    env: "development" | "production";
    ztoolkit: ZToolkit;
    locale?: {
      current: any;
    };
    prefs?: {
      window: Window;
      columns: Array<ColumnOptions>;
      rows: Array<{ [dataKey: string]: string }>;
    };
    dialog?: DialogHelper;
    bg: ODHBack | null;
    fg: ZODHFront | null;
  };
  // Lifecycle hooks
  public hooks: typeof hooks;
  // // APIs
  // public api: typeof api;
  public ankiconnect: Ankiconnect | null;
  public ankiweb: Ankiweb | null;
  public target: Ankiconnect | Ankiweb | null;

  constructor() {
    this.data = {
      alive: true,
      env: __env__,
      ztoolkit: createZToolkit(),
      bg: null,
      fg: null,
    };
    this.hooks = hooks;

    this.ankiconnect = null;
    this.ankiweb = null;
    this.target = null;

    // this.api = api;
  }

  init() {
    this.ankiconnect = new Ankiconnect();
    this.ankiweb = new Ankiweb();
    this.target = this.ankiconnect;
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

  async api_addNote(notedef: any) {
    const note = this.formatNote(notedef);
    return new Promise((resolve, reject) => {
      this.target?.addNote(note).then((result) => resolve(result));
    });
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
}

export default Addon;
