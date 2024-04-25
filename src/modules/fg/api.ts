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

export async function addNote(notedef: any) {
  const response = await addon.api_addNote(notedef);
  return response;
}
