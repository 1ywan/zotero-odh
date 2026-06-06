import { spell } from "./spell";

function registerAddNoteLinks(doc: Document) {
  for (const link of doc.getElementsByClassName("odh-addnote")) {
    link.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      const ds = (e.currentTarget as HTMLImageElement).dataset;

      addon.data.currentTranslation?.api_addNote({
        nindex: ds.nindex,
        dindex: ds.dindex,
        context: doc.querySelector(".spell-content")?.innerHTML,
        extrainfo: doc.querySelector(".odh-extra")?.innerHTML,
      });
    });
  }
}

function registerAudioLinks(doc: Document) {
  for (const link of doc.getElementsByClassName("odh-playaudio")) {
    link.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (e.currentTarget == null) return;
      const ds = (e.currentTarget as HTMLDivElement).dataset;
      const fg = addon.data.currentTranslation;
      if (ds.nindex === undefined || ds.dindex === undefined) return;
      const url = fg?.notes[ds.nindex].audios[ds.dindex];
      for (const key in fg?.audios) {
        addon.data.audios[key].pause();
      }

      try {
        const audio = addon.data.audios[url] || document.createElement("audio");
        audio.src = url;
        audio.currentTime = 0;
        audio.play();
        addon.data.audios[url] = audio;
      } catch (err) {
        console.error(err);
      }
    });
  }
}

function initSpellnTranslation(doc: Document) {
  doc.querySelector("#odh-container")?.appendChild(spell(doc));
  // Copy the captured sentence into the spell-content editor.
  // Append a <br> so the cursor has a stable block boundary at end-of-content;
  // otherwise trailing whitespace from PDF text causes Enter to collapse instead of newline.
  // Replace \n with spaces so words that cross line boundaries in multiline
  // captured text are properly separated instead of being joined without a space.
  const contextHTML = doc.querySelector("#context")!.innerHTML.trimEnd();
  doc.querySelector(".spell-content")!.innerHTML = contextHTML
    ? contextHTML.replace(/\n/g, " ") + "<br>"
    : "<br>";
  if (
    (doc.querySelector("#monolingual") as HTMLSelectElement)!.innerText == "1"
  )
    hideTranslation();
}

function hideTranslation() {
  const className =
    "span.chn_dis, span.chn_tran, span.chn_sent, span.tgt_tran, span.tgt_sent"; // to add your bilingual translation div class name here.
  for (const div of document.querySelectorAll(className)) {
    div.classList.toggle("hidden");
  }
}

export function onDomContentLoaded(doc: Document) {
  registerAddNoteLinks(doc);
  registerAudioLinks(doc);
  initSpellnTranslation(doc);
}

export function api_setActionState(
  doc: Document,
  result: { response: any; params: any },
) {
  const { response, params } = result;
  const { nindex, dindex } = params;

  const match = doc.querySelector(
    `.odh-addnote[data-nindex="${nindex}"].odh-addnote[data-dindex="${dindex}"]`,
  ) as HTMLElement;
  if (match == null) return;
  if (response) {
    match.style.backgroundImage =
      "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACcUlEQVQ4jZVR30tTcRw99/u9P5x36s1fA5d1lZWYpTdfCtRtiQmbmflWgTF78qnsL7D9BfPFBymSwEgjKE3QCKYPRmWml0TIDF1mc0NzVzc3NnW3hzBERul5/HDO+ZzP+TA4CrohE4Z08JSXBcr7eMrdY48glghDRq/JTtksFmB5y4+Pa1MyOayeMrT9krlGtpmrYUwzwH68Bpl8uv1QCbgHrCJyYodTrsf32AIAQGeSAAgOlYAlrOdW6XXwHIuoHkFZdjk+rargCNf5X4P0RwZXaXaJvdKk4GdiCeXZlQhEg5j5NeujhLr/nNAFBQQKGKhog7onzugxSoQhHlfZTYSTGnINeRA5I57NvQBL2NbJJlUj6ILHIhVNO07W9eSkHZtGNzz7ivM0WZxSrpiDLYRRnHEK71cmEN2Jdk42qWMAwIJB++2yFhg4AZflWvTO9bfPPvwiiZzhcX56nuuqpQGBnWVYMkrgj6xgKqj6KEPde0sIGMDIi1hLrGJzN4Q759tgL6xyUUJHW8+1YIckIPIiOMJj6NswKKHN7xontb8p0QgplNAu2s1WxPUY4noMtkIbiiUZFaaz2MA6ThiK4PWNYUHzud9emejbXzLFEF77awPy5vamYjNbEUcca7tBVORUIIwN5KeZ4A8HMPR1WB1v+HDj4JcoAOiv9IFQvSZHtiNKdUEVCGWwmgwik8+CgYjo/fwU28mEw/fkRyClAQDEXyYGYo6YPB+aV6zmGmQJmcgTTPAujmFBW3R7HeN9B8Upceb56R7nmzp9cL1f717q1OtGrNP/4jOphhcGK+8LVLgrUF6jhDaP1HvVVDwA+A0rr9F+/wY4EQAAAABJRU5ErkJggg==)";
    setTimeout(() => {
      match.style.backgroundImage =
        "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAJvSURBVDjLpZPrS5NhGIf9W7YvBYOkhlkoqCklWChv2WyKik7blnNris72bi6dus0DLZ0TDxW1odtopDs4D8MDZuLU0kXq61CijSIIasOvv94VTUfLiB74fXngup7nvrnvJABJ/5PfLnTTdcwOj4RsdYmo5glBWP6iOtzwvIKSWstI0Wgx80SBblpKtE9KQs/We7EaWoT/8wbWP61gMmCH0lMDvokT4j25TiQU/ITFkek9Ow6+7WH2gwsmahCPdwyw75uw9HEO2gUZSkfyI9zBPCJOoJ2SMmg46N61YO/rNoa39Xi41oFuXysMfh36/Fp0b7bAfWAH6RGi0HglWNCbzYgJaFjRv6zGuy+b9It96N3SQvNKiV9HvSaDfFEIxXItnPs23BzJQd6DDEVM0OKsoVwBG/1VMzpXVWhbkUM2K4oJBDYuGmbKIJ0qxsAbHfRLzbjcnUbFBIpx/qH3vQv9b3U03IQ/HfFkERTzfFj8w8jSpR7GBE123uFEYAzaDRIqX/2JAtJbDat/COkd7CNBva2cMvq0MGxp0PRSCPF8BXjWG3FgNHc9XPT71Ojy3sMFdfJRCeKxEsVtKwFHwALZfCUk3tIfNR8XiJwc1LmL4dg141JPKtj3WUdNFJqLGFVPC4OkR4BxajTWsChY64wmCnMxsWPCHcutKBxMVp5mxA1S+aMComToaqTRUQknLTH62kHOVEE+VQnjahscNCy0cMBWsSI0TCQcZc5ALkEYckL5A5noWSBhfm2AecMAjbcRWV0pUTh0HE64TNf0mczcnnQyu/MilaFJCae1nw2fbz1DnVOxyGTlKeZft/Ff8x1BRssfACjTwQAAAABJRU5ErkJggg==)";
    }, 1000);
  } else {
    setTimeout(() => {
      match.style.backgroundImage =
        "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAJvSURBVDjLpZPrS5NhGIf9W7YvBYOkhlkoqCklWChv2WyKik7blnNris72bi6dus0DLZ0TDxW1odtopDs4D8MDZuLU0kXq61CijSIIasOvv94VTUfLiB74fXngup7nvrnvJABJ/5PfLnTTdcwOj4RsdYmo5glBWP6iOtzwvIKSWstI0Wgx80SBblpKtE9KQs/We7EaWoT/8wbWP61gMmCH0lMDvokT4j25TiQU/ITFkek9Ow6+7WH2gwsmahCPdwyw75uw9HEO2gUZSkfyI9zBPCJOoJ2SMmg46N61YO/rNoa39Xi41oFuXysMfh36/Fp0b7bAfWAH6RGi0HglWNCbzYgJaFjRv6zGuy+b9It96N3SQvNKiV9HvSaDfFEIxXItnPs23BzJQd6DDEVM0OKsoVwBG/1VMzpXVWhbkUM2K4oJBDYuGmbKIJ0qxsAbHfRLzbjcnUbFBIpx/qH3vQv9b3U03IQ/HfFkERTzfFj8w8jSpR7GBE123uFEYAzaDRIqX/2JAtJbDat/COkd7CNBva2cMvq0MGxp0PRSCPF8BXjWG3FgNHc9XPT71Ojy3sMFdfJRCeKxEsVtKwFHwALZfCUk3tIfNR8XiJwc1LmL4dg141JPKtj3WUdNFJqLGFVPC4OkR4BxajTWsChY64wmCnMxsWPCHcutKBxMVp5mxA1S+aMComToaqTRUQknLTH62kHOVEE+VQnjahscNCy0cMBWsSI0TCQcZc5ALkEYckL5A5noWSBhfm2AecMAjbcRWV0pUTh0HE64TNf0mczcnnQyu/MilaFJCae1nw2fbz1DnVOxyGTlKeZft/Ff8x1BRssfACjTwQAAAABJRU5ErkJggg==)";
    }, 1000);
  }
}
