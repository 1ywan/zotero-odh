import { ColumnOptions } from "zotero-plugin-toolkit/dist/helpers/virtualizedTable";
import { DialogHelper } from "zotero-plugin-toolkit/dist/helpers/dialog";
import hooks from "./hooks";
import { createZToolkit } from "./utils/ztoolkit";
import { ZODHFront } from "./modules/fg/frontend";
import { ODHBack } from "./modules/bg/backend";
import { Ankiconnect } from "./modules/bg/ankiconnect";
import { Ankiweb } from "./modules/bg/ankiweb";

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
}

export default Addon;
