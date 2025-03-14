import { config } from "../../package.json";

export type Option = {
  [key: string]: boolean | string;
  enabled: boolean;
  mouseselection: boolean;
  hotkey: string;
  maxcontext: string;
  maxexample: string;
  monolingual: string;
  preferredaudio: string;
  services: string;
  id: string;
  password: string;
  duplicate: string;
  tags: string;
  deckname: string;
  typename: string;
  expression: string;
  reading: string;
  extrainfo: string;
  definition: string;
  definitions: string;
  sentence: string;
  url: string;
  audio: string;
  sysscripts: string;
  udfscripts: string;
  dictSelected: string;
};

/**
 * Get preference value.
 * Wrapper of `Zotero.Prefs.get`.
 * @param key
 */
export function getPref(key: string) {
  return Zotero.Prefs.get(`${config.prefsPrefix}.${key}`, true);
}

/**
 * Set preference value.
 * Wrapper of `Zotero.Prefs.set`.
 * @param key
 * @param value
 */
export function setPref(key: string, value: string | number | boolean) {
  return Zotero.Prefs.set(`${config.prefsPrefix}.${key}`, value, true);
}

/**
 * Clear preference value.
 * Wrapper of `Zotero.Prefs.clear`.
 * @param key
 */
export function clearPref(key: string) {
  return Zotero.Prefs.clear(`${config.prefsPrefix}.${key}`, true);
}

export function optionsLoad(): Option {
  return {
    enabled: getPref("enabled") as boolean,
    mouseselection: getPref("mouseselection") as boolean,
    hotkey: getPref("hotkey") as string,
    maxcontext: getPref("maxcontext") as string,
    maxexample: getPref("maxexample") as string,
    monolingual: getPref("monolingual") as string,
    preferredaudio: getPref("preferredaudio") as string,
    services: getPref("services") as string,
    id: getPref("id") as string,
    password: getPref("password") as string,
    duplicate: getPref("duplicate") as string,
    tags: getPref("tags") as string,
    deckname: getPref("deckname") as string,
    typename: getPref("typename") as string,
    expression: getPref("expression") as string,
    reading: getPref("reading") as string,
    extrainfo: getPref("extrainfo") as string,
    definition: getPref("definition") as string,
    definitions: getPref("definitions") as string,
    sentence: getPref("sentence") as string,
    url: getPref("url") as string,
    audio: getPref("audio") as string,
    sysscripts: getPref("sysscripts") as string,
    udfscripts: getPref("udfscripts") as string,
    dictSelected: getPref("dictSelected") as string,
    // dictNameList: getPref("dictNameList") as string[],
  };
}

export function optionsSave(options: Option) {
  setPref("enabled", options.enabled);
  setPref("mouseselection", options.mouseselection);
  setPref("hotkey", options.hotkey);
  setPref("maxcontext", options.maxcontext);
  setPref("maxexample", options.maxexample);
  setPref("monolingual", options.monolingual);
  setPref("preferredaudio", options.preferredaudio);
  setPref("services", options.services);
  setPref("id", options.id);
  setPref("password", options.password);
  setPref("duplicate", options.duplicate);
  setPref("tags", options.tags);
  setPref("deckname", options.deckname);
  setPref("typename", options.typename);
  setPref("expression", options.expression);
  setPref("reading", options.reading);
  setPref("extrainfo", options.extrainfo);
  setPref("definition", options.definition);
  setPref("definitions", options.definitions);
  setPref("sentence", options.sentence);
  setPref("url", options.url);
  setPref("audio", options.audio);
  setPref("sysscripts", options.sysscripts);
  setPref("udfscripts", options.udfscripts);
  setPref("dictSelected", options.dictSelected);
}
