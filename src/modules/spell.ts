export function spell(doc: Document) {
  const exec = (command, value = null) =>
    doc.execCommand(command, false, value);
  const ensureHTTP = (url: string) =>
    /^https?:\//.test(url) ? url : `https://${url}`;
  // const $ = (tag, props, children = [], elm = document.createElement(tag)) =>
  //   children.map((child) => child && elm.appendChild(child)) &&
  //   Object.assign(elm, props);

  const colorPicker = (_: any) => {
    const input = doc.createElement("input");
    input.type = "color";
    return input;
  };
  const select = (options: any) => {
    const select = doc.createElement("select");

    options.map((o: any) => {
      const option = doc.createElement("option");
      option.textContent = o;
    });
  };

  const buttons = {};
  const queryState = (_: any) => {
    for (const cmd in buttons)
      buttons[cmd].classList.toggle(
        "selected",
        document.queryCommandState(cmd),
      );
  };

  const actions = [
    [["bold"], ["italic"], ["underline"]],
    [
      ["paragraph", "<p>"],
      ["quote", "<blockquote>"],
      ["code", "<pre>"],
    ].map(([title, format]) => [
      title,
      (_: any) => exec("formatBlock", format),
    ]),
    [["insertOrderedList"], ["insertUnorderedList"], ["insertHorizontalRule"]],
    [["removeFormat"], ["unlink"]],
    [
      ["createLink", "link", ensureHTTP],
      ["insertImage", "image", ensureHTTP],
    ].map(([cmd, type, t]) => [
      type,
      (url: string) =>
        (url = prompt(`Enter the ${type} URL`)) && exec(cmd, t(url)),
    ]),
    [["undo"], ["redo"]],
  ];

  const spell = doc.createElement("div");
  spell.className = "spell";

  const spellbar = doc.createElement("div");
  spellbar.className = "spell-bar";
  actions.map((bar: string[]) => {
    const spellzone = doc.createElement("div");
    spellzone.className = "spell-zone";
    bar.map(([cmd, onclick = (_: any) => exec(cmd), control]) => {
      const button = doc.createElement("button");
      button.className = "spell-icon";
      button.title = cmd.replace(/([^a-z])/g, " $1").toLowerCase();
      button.addEventListener("click", onclick);
      buttons[cmd] = button;
      const i = doc.createElement("i");
      i.className = `icon-${cmd.toLowerCase()}`;
      i.addEventListener("click", control);
      button.append(i);
      // [$("i", { className: "icon-" + cmd.toLowerCase() }), control],
      spellzone.append(button);
    });
    spellbar.append(spellzone);
  });

  const spellcontent = doc.createElement("div");
  spellcontent.className = "spell-content";
  spellcontent.contentEditable = "true";
  spellcontent.addEventListener("keydown", (event) => event.which != 9);
  spellcontent.addEventListener("keyup", queryState);
  spellcontent.addEventListener("mouseup", queryState);

  spell.append(spellbar);
  spell.append(spellcontent);

  return spell;
}
