/* global Ankiconnect, Ankiweb, Deinflector, Builtin, Agent, optionsLoad, optionsSave */
import { config } from "../../../package.json";
import { Ankiconnect } from "./ankiconnect";
import { Ankiweb } from "./ankiweb";
import { sanitizeOptions } from "./utils";
import { Deinflector } from "./deinflector";
import { Builtin } from "./builtin";

export class ODHBack {
  [x: string]: any;
  options: any | null;
  dicts: any;
  current: string | null;
  agent: any;
  target: Ankiconnect | Ankiweb | null;
  ankiconnect: Ankiconnect;
  ankiweb: Ankiweb;
  deinflector: Deinflector;

  constructor() {
    this.audios = {};
    this.options = null;

    this.dicts = {};
    this.current = null;

    this.ankiconnect = new Ankiconnect();
    this.ankiweb = new Ankiweb();
    this.target = null;

    // const defaultscripts = ["builtin_encn_Collins", "encn_Baicizhan"];
    // this.loadScripts(defaultscripts);
    this.current = "builtin_encn_Collins";
    //setup lemmatizer
    this.deinflector = new Deinflector();
    this.deinflector.loadData();

    //Setup builtin dictionary data
    this.builtin = new Builtin();
    this.builtin.loadData();

    // this.agent = new Agent(document.getElementById('sandbox').contentWindow);

    // chrome.runtime.onMessage.addListener(this.onMessage.bind(this));
    // window.addEventListener('message', e => this.onSandboxMessage(e));
    // chrome.runtime.onInstalled.addListener(this.onInstalled.bind(this));
    // chrome.tabs.onCreated.addListener((tab) => this.onTabReady(tab.id));
    // chrome.tabs.onUpdated.addListener(this.onTabReady.bind(this));
    // chrome.commands.onCommand.addListener((command) => this.onCommand(command));
  }

  //   onCommand(command) {
  //     if (command != "enabled") return;
  //     this.options.enabled = !this.options.enabled;
  //     this.setFrontendOptions(this.options);
  //     optionsSave(this.options);
  //   }

  //   onInstalled(details) {
  //     if (details.reason === "install") {
  //       chrome.tabs.create({ url: chrome.extension.getURL("bg/guide.html") });
  //       return;
  //     }
  //     if (details.reason === "update") {
  //       chrome.tabs.create({ url: chrome.extension.getURL("bg/update.html") });
  //       return;
  //     }
  //   }

  //   onTabReady(tabId) {
  //     this.tabInvoke(tabId, "setFrontendOptions", { options: this.options });
  //   }

  //   setFrontendOptions(options) {
  //     switch (options.enabled) {
  //       case false:
  //         chrome.browserAction.setBadgeText({ text: "off" });
  //         break;
  //       case true:
  //         chrome.browserAction.setBadgeText({ text: "" });
  //         break;
  //     }
  //     this.tabInvokeAll("setFrontendOptions", {
  //       options,
  //     });
  //   }

  //   checkLastError() {
  //     // NOP
  //   }

  //   tabInvokeAll(action, params) {
  //     chrome.tabs.query({}, (tabs) => {
  //       for (const tab of tabs) {
  //         this.tabInvoke(tab.id, action, params);
  //       }
  //     });
  //   }

  //   tabInvoke(tabId, action, params) {
  //     const callback = () => this.checkLastError(chrome.runtime.lastError);
  //     chrome.tabs.sendMessage(tabId, { action, params }, callback);
  //   }

  formatNote(notedef: any) {
    const options = this.options;
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
      note.fields[options[fieldname]] = notedef[fieldname];
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

  // Message Hub and Handler start from here ...
  // onMessage(request: { action: any; params: any }, sender: any, callback: any) {
  //   const { action, params } = request;
  //   const method = this["api_" + action];

  //   if (typeof method === "function") {
  //     params.callback = callback;
  //     method.call(this, params);
  //   }
  //   return true;
  // }

  //   onSandboxMessage(e) {
  //     const { action, params } = e.data;
  //     const method = this["api_" + action];
  //     if (typeof method === "function") method.call(this, params);
  //   }

  async api_initBackend() {
    // const options = await optionsLoad();
    const options = sanitizeOptions(null);

    // this.ankiweb.initConnection(options);
    options.services = "ankiconnect";
    this.opt_optionsChanged(options);
  }

  async api_Fetch(url: string): Promise<string | null> {
    // const { url, callbackId } = params;

    const response = await fetch(url);

    if (response.ok) {
      return response.text();
    } else {
      return null;
    }
  }

  async api_Deinflect(word: string) {
    return await this.deinflector.deinflect(word);
  }

  async api_getBuiltin(dict: string, word: string) {
    // const { dict, word, callbackId } = params;
    return new Promise((resolve, reject) =>
      resolve(this.builtin.findTerm(dict, word)),
    );
  }

  //   async api_getLocale(params) {
  //     const { callbackId } = params;
  //     this.callback(chrome.i18n.getUILanguage(), callbackId);
  //   }

  async api_getTranslation(expression: string) {
    // Fix https://github.com/ninja33/ODH/issues/97
    if (expression.endsWith(".")) {
      expression = expression.slice(0, -1);
    }

    const result = await this.findTerm(expression);
    return result;
  }

  async api_addNote(notedef: any) {
    const note = this.formatNote(notedef);
    return new Promise((resolve, reject) => {
      this.target?.addNote(note).then((result) => resolve(result));
    });
  }

  // async api_playAudio(url: string) {
  //   // const { url, callback } = params;

  //   for (const key in this.audios) {
  //     this.audios[key].pause();
  //   }

  //   try {
  //     const audio = this.audios[url] || new Audio(url);
  //     audio.currentTime = 0;
  //     audio.play();
  //     this.audios[url] = audio;
  //   } catch (err) {
  //     console.error(err);
  //   }
  // }

  // Option page and Brower Action page requests handlers.
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
    if (
      !this.options ||
      `${this.options.sysscripts},${this.options.udfscripts}` != newscripts
    ) {
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

    this.options = options;
    if (loadresults) {
      const namelist = loadresults.map((x: any) => x.result.objectname);
      this.options.dictSelected = namelist.includes(options.dictSelected)
        ? options.dictSelected
        : namelist[0];
      this.options.dictNamelist = loadresults.map((x: any) => x.result);
    }
    // await this.setScriptsOptions(this.options);
    // optionsSave(this.options);
    return this.options;
  }

  // Sandbox communication start here
  async loadScripts(list: string[]) {
    const promises = list.map((name) => this.loadScript(name));
    const results = await Promise.all(promises);
    return results.filter((x: any) => {
      if (x.result) return x.result;
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

  async loadScript(name: string) {
    // const ctx = { api: { name: "test" } };
    // Services.scriptloader.loadSubScript(this.buildScriptURL(name), ctx);
    // Services.scriptloader.loadSubScript(this.buildScriptURL(name), this);
    Services.scriptloader.loadSubScript(this.buildScriptURL(name), _globalThis);
    // Components.utils.import(
    //   this.buildScriptURL(name),
    //   Zotero[config.addonInstance],
    // );
    let result: { objectname: string; displayname: string } | null = null;
    try {
      const SCRIPT = eval(`${name}`);
      if (SCRIPT.name && typeof SCRIPT === "function") {
        const script = new SCRIPT();
        //if (!this.dicts[SCRIPT.name])
        this.dicts[SCRIPT.name] = script;
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

  //   async setScriptsOptions(options) {
  //     return new Promise((resolve, reject) => {
  //       this.agent.postMessage("setScriptsOptions", { options }, (result) =>
  //         resolve(result),
  //       );
  //     });
  //   }

  async findTerm(expression: string): Promise<string | null> {
    if (
      this.dicts[this.current!] &&
      typeof this.dicts[this.current!].findTerm === "function"
    ) {
      const notes = await this.dicts[this.current!].findTerm(expression);
      return notes;
    } else {
      return null;
    }
  }

  //   callback(data, callbackId) {
  //     this.agent.postMessage("callback", { data, callbackId });
  //   }
}

// window.odhback = new ODHBack();
