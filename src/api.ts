import { config } from "../package.json";

async function deinflect(word: string) {
  // return await this.postMessage("Deinflect", { word });
  return new Promise((resolve, reject) =>
    resolve(Zotero[config.addonInstance].data.bg.api_Deinflect(word)),
  );
}

async function fetch(url: string) {
  // return await this.postMessage("Fetch", { url });
}

async function getBuiltin(dict: string, word: string) {
  // return await this.postMessage("getBuiltin", { dict, word });
  return new Promise((resolve, reject) =>
    resolve(Zotero[config.addonInstance].data.bg.api_getBuiltin(dict, word)),
  );
}

async function getCollins(word: string) {
  // return await this.postMessage("getCollins", { word });
}

async function getOxford(word: string) {
  // return await this.postMessage("getOxford", { word });
}

async function locale() {
  // return await this.postMessage("getLocale", {});
}

export default {
  deinflect,
  fetch,
  getBuiltin,
  getCollins,
  getOxford,
  locale,
};
