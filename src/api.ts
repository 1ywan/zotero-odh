import { config } from "../package.json";

async function deinflect(word: string) {
  return new Promise((resolve, reject) => resolve(addon.api_Deinflect(word)));
}

async function fetch(url: string) {
  const response = await window.fetch(url);
  const context = await response.text();
  return context;
}

async function getBuiltin(dict: string, word: string) {
  return new Promise((resolve, reject) =>
    resolve(addon.api_getBuiltin(dict, word)),
  );
}

async function getCollins(word: string) {
  // return await this.postMessage("getCollins", { word });
}

async function getOxford(word: string) {
  // return await this.postMessage("getOxford", { word });
}

async function locale() {
  return Zotero.locale;
}

export default {
  deinflect,
  fetch,
  getBuiltin,
  getCollins,
  getOxford,
  locale,
};
