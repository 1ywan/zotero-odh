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
  try {
    return await sendtoBackend({ action: "addNote", params: { notedef } });
  } catch (err) {
    return null;
  }
}

export async function playAudio(url: any) {
  try {
    return await sendtoBackend({ action: "playAudio", params: { url } });
  } catch (err) {
    return null;
  }
}
