async function sendtoBackend(request: any) {
  // return new Promise((resolve, reject) => {
  //   chrome.runtime.sendMessage(request, (result) => {
  //     resolve(result);
  //   });
  // });
}

export async function isConnected() {
  const result = await addon.opt_getVersion();
  return result;
}

export async function getTranslation(expression: string): Promise<any> {
  const result = await addon.api_getTranslation(expression);

  return result;
}

export async function addNote(notedef: any) {
  const response = await addon.api_addNote(notedef);
  return response;
}

export async function playAudio(url: string) {
  await Zotero.ZODH.data.bg.api_playAudio(url);
}
