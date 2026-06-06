export class Ankiconnect {
  version: number;
  constructor() {
    this.version = 6;
  }

  async ankiInvoke(action: string, params = {}, timeout = 3000) {
    const version = this.version;
    const request = { action, version, params };
    try {
      const raw_response = await Zotero.HTTP.request(
        "POST",
        "http://127.0.0.1:8765",
        {
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
          responseType: "json",
        },
      );
      const response = raw_response.response;
      return new Promise((resolve, reject) => {
        try {
          if (Object.getOwnPropertyNames(response).length != 2) {
            throw "response has an unexpected number of fields";
          }
          if (!Object.prototype.hasOwnProperty.call(response, "error")) {
            throw "response is missing required error field";
          }
          if (!Object.prototype.hasOwnProperty.call(response, "result")) {
            throw "response is missing required result field";
          }
          if (response.error) {
            throw response.error;
          }
          resolve(response.result);
        } catch (e) {
          reject(e);
        }
      });
    } catch (e: unknown) {
      return null;
    }
  }

  async addNote(note: any) {
    if (note) return await this.ankiInvoke("addNote", { note });
    else return Promise.resolve(null);
  }

  async getDeckNames() {
    return await this.ankiInvoke("deckNames");
  }

  async getModelNames() {
    return await this.ankiInvoke("modelNames");
  }

  async getModelFieldNames(modelName: string) {
    return await this.ankiInvoke("modelFieldNames", { modelName });
  }

  async getVersion() {
    const version = await this.ankiInvoke("version", {}, 100);
    return version ? "ver:" + version : null;
  }
}
