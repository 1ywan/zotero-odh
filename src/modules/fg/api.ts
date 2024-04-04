async function sendtoBackend(request: any) {
  // return new Promise((resolve, reject) => {
  //   chrome.runtime.sendMessage(request, (result) => {
  //     resolve(result);
  //   });
  // });
}

export async function isConnected() {
  const result = await Zotero.ZODH.data.bg.api_isConnected();

  return result;
}

export async function getTranslation(expression: string): Promise<any> {
  const result = await Zotero.ZODH.data.bg.api_getTranslation(expression);

  return result;
}

export async function addNote(notedef: any) {
  const bg = addon.data.bg;
  const response = await bg?.api_addNote(notedef);
  return response;
}

export async function playAudio(url: string) {
  await Zotero.ZODH.data.bg.api_playAudio(url);
}
