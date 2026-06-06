import { Option, optionsLoad } from "../utils/prefs";

/* global odhback, localizeHtmlPage, utilAsync, optionsLoad, optionsSave */
async function populateAnkiDeckAndModel(doc: Document) {
  let names = [];
  doc.querySelector("#deckname")?.replaceChildren();

  names = await addon.opt_getDeckNames();
  if (names !== null) {
    names.forEach((name: string) => {
      const opt = doc.createXULElement("menuitem") as XUL.MenuItem;
      opt.label = name;
      opt.value = name;
      doc.querySelector("#deckname")!.append(opt);
    });
  }

  (doc.querySelector("#deckname") as HTMLSelectElement)!.value =
    Zotero.Prefs.get("zodh.deckname") as string;

  doc.querySelector("#typename")?.replaceChildren();
  names = await addon.opt_getModelNames();
  if (names !== null) {
    names.forEach((name: string) => {
      const opt = doc.createXULElement("menuitem") as XUL.MenuItem;
      opt.label = name;
      opt.value = name;
      doc.querySelector("#typename")!.append(opt);
    });
  }
  (doc.querySelector("#typename") as HTMLSelectElement).value =
    Zotero.Prefs.get("zodh.typename") as string;
}

async function populateAnkiFields(doc: Document, modelName: string | null) {
  if (modelName === null) {
    modelName =
      (doc.querySelector("#typename") as HTMLSelectElement)!.value ||
      (Zotero.Prefs.get("zodh.typename") as string);
  }

  const names = await addon.opt_getModelFieldNames(modelName);
  if (names == null) return;

  const fields = [
    "expression",
    "reading",
    "extrainfo",
    "definition",
    "definitions",
    "sentence",
    "url",
    "audio",
  ];
  fields.forEach((field) => {
    const select = doc.querySelector(`#${field}`) as HTMLSelectElement;
    select?.replaceChildren();
    const opt = doc.createXULElement("menuitem") as XUL.MenuItem;
    opt.label = "";
    opt.value = "";
    select?.append(opt);
    names.forEach((name: string) => {
      const opt1 = doc.createXULElement("menuitem") as XUL.MenuItem;
      opt1.label = name;
      opt1.value = name;
      select?.append(opt1);
    });
    select!.value = Zotero.Prefs.get(`zodh.${field}`) as string;
  });
}

async function updateAnkiStatus(doc: Document, options?: Option) {
  const element = doc.querySelector("#services-status") as HTMLLabelElement;
  doc.l10n?.setAttributes(element, "zodh-msgConnecting");
  (doc.querySelector("#anki-options") as HTMLElement)!.style.visibility =
    "hidden";

  if (Zotero.Prefs.get("zodh.services") == "ankiweb")
    (doc.querySelector("#anki-options") as HTMLElement)!.style.visibility =
      "visible";
  else {
    (doc.querySelector("#anki-options") as HTMLElement)!.style.visibility =
      "hidden";
  }

  const version = await addon.opt_getVersion();
  if (version === null) {
    doc.l10n?.setAttributes(element, "zodh-msgFailed");
  } else {
    populateAnkiDeckAndModel(doc);
    populateAnkiFields(doc, null);
    doc.l10n?.setAttributes(element, "zodh-msgSuccess", { Version: version });
    (doc.querySelector("#anki-options") as HTMLElement)!.style.visibility =
      "visible";
    if (Zotero.Prefs.get("zodh.services") == "ankiconnect")
      (doc.querySelector(
        "#duplicate-option",
      ) as HTMLElement)!.style.visibility = "visible";
    else {
      (doc.querySelector(
        "#duplicate-option",
      ) as HTMLElement)!.style.visibility = "hidden";
    }
  }
}

function populateDictionary(
  doc: Document,
  dicts: [{ objectname: any; displayname: string }],
) {
  const dict = doc.querySelector("#dict");
  dict?.replaceChildren();
  if (dicts == undefined) return;
  dicts.forEach((item) => {
    const ele = doc.createXULElement("menuitem") as XUL.MenuItem;
    ele.value = item.objectname;
    ele.label = item.displayname;
    dict!.append(ele);
  });
}

function populateSysScriptsList(doc: Document, dictLibrary: string) {
  const optionscripts = Array.from(
    new Set(
      dictLibrary
        .split(",")
        .filter((x) => x)
        .map((x) => x.trim()),
    ),
  );
  const systemscripts = [
    "builtin_encn_Collins",
    "general_Makenotes", //default & builtin script
    "cncn_Zdic", //cn-cn dictionary
    "encn_Collins",
    "encn_Cambridge",
    "encn_Cambridge_tc",
    "encn_Oxford",
    "encn_Youdao",
    "encn_Baicizhan", //en-cn dictionaries
    "enen_Collins",
    "enen_LDOCE6MDX",
    "enen_UrbanDict", //en-en dictionaries
    "enfr_Cambridge",
    "enfr_Collins", //en-fr dictionaries
    "fren_Cambridge",
    "fren_Collins", //fr-cn dictionaries
    "esen_Spanishdict",
    "decn_Eudict",
    "escn_Eudict",
    "frcn_Eudict",
    "frcn_Youdao",
    "rucn_Qianyi", //msci dictionaries
  ];
  const scriptslistbody = doc.querySelector("#scriptslistbody");
  scriptslistbody?.replaceChildren();
  systemscripts.forEach((script) => {
    const row = doc.createElementNS("http://www.w3.org/1999/xhtml", "div");
    row.classList.add("sl-row");

    const col_onoff = doc.createElementNS(
      "http://www.w3.org/1999/xhtml",
      "input",
    ) as HTMLInputElement;
    col_onoff.className = "sl-col sl-col-onoff";
    col_onoff.type = "checkbox";
    col_onoff.checked =
      optionscripts.includes(script) ||
      optionscripts.includes("lib://" + script)
        ? true
        : false;

    const col_cloud = doc.createElementNS(
      "http://www.w3.org/1999/xhtml",
      "input",
    ) as HTMLInputElement;
    col_cloud.className = "sl-col sl-col-cloud";
    col_cloud.type = "checkbox";
    col_cloud.checked = optionscripts.includes("lib://" + script)
      ? true
      : false;

    const col_name = doc.createElementNS(
      "http://www.w3.org/1999/xhtml",
      "span",
    ) as HTMLSpanElement;
    col_name.className = "sl-col sl-col-description";
    col_name.innerText = script;

    const col_description = doc.createElementNS(
      "http://www.w3.org/1999/xhtml",
      "span",
    ) as HTMLSpanElement;
    col_description.className = "sl-col sl-col-name";
    col_description.innerText = script;
    row.append(col_onoff, col_cloud, col_name, col_description);

    scriptslistbody!.append(row);
  });

  (doc
    .querySelector(".sl-row:nth-child(1)")
    ?.querySelector(".sl-col-onoff") as HTMLInputElement)!.checked = true; // make default script(first row) always active.
  (doc
    .querySelector(".sl-row:nth-child(1)")
    ?.querySelector(".sl-col-cloud") as HTMLInputElement)!.checked = false; // make default script(first row) as local script.
  (doc
    .querySelector(".sl-row:nth-child(1)")
    ?.querySelector(".sl-col-cloud") as HTMLElement)!.style.visibility =
    "hidden"; //make default sys script untouch
  (doc
    .querySelector(".sl-row:nth-child(1)")
    ?.querySelector(".sl-col-onoff") as HTMLElement)!.style.visibility =
    "hidden";
}

function onScriptListChange(doc: Document) {
  const dictLibrary: string[] = [];
  doc.querySelectorAll(".sl-row")!.forEach((row) => {
    if (row == null) return;
    if (
      (row.querySelector(".sl-col-onoff") as HTMLInputElement)!.checked == true
    )
      dictLibrary.push(
        (row.querySelector(".sl-col-cloud") as HTMLInputElement)!.checked
          ? "lib://" +
              (row.querySelector(".sl-col-name") as HTMLElement).innerHTML
          : (row.querySelector(".sl-col-name") as HTMLElement).innerHTML,
      );
  });
  Zotero.Prefs.set("zodh.sysscripts", dictLibrary.join());
}

function onHiddenClicked(doc: Document) {
  doc
    .querySelectorAll(".sl-col-cloud")
    ?.forEach((col) => col.classList.toggle("hidden"));
}

async function onAnkiTypeChanged(e: any, doc: Document) {
  const modelName = e.target.value;
  populateAnkiFields(doc, modelName);
}

async function onLoginClicked(e: any, doc: Document) {
  await addon.ankiweb?.initConnection({}, true); // set param forceLogout = true

  const options = optionsLoad();
  const newOptions = await addon.opt_optionsChanged(options);

  updateAnkiStatus(doc, newOptions);
}

async function onServicesChanged(e: any, doc: Document) {
  const options = optionsLoad();
  options.services = e.target.value;
  const newOptions = await addon.opt_optionsChanged(options);

  updateAnkiStatus(doc, newOptions);
}

async function onSaveClicked(e: any, doc: Document) {
  const options = optionsLoad();
  await addon.opt_optionsChanged(options);

  populateDictionary(doc, addon.data.dictNamelist as any);
  (doc.querySelector("#dict") as HTMLSelectElement)!.value = addon.data
    .dictSelected as string;
}

async function onEnabledClicked(e: any, doc: Document) {
  const checkbox = doc.querySelector("#enabled") as HTMLInputElement;
  checkbox.checked = !checkbox.checked;
  Zotero.Prefs.set("zodh.enabled", checkbox.checked);
}

export async function onReady(doc: Document) {
  (doc.querySelector("#enabled") as HTMLInputElement)!.checked =
    Zotero.Prefs.get("zodh.enabled") as boolean;
  (doc.querySelector("#mouseselection") as HTMLInputElement)!.checked =
    Zotero.Prefs.get("zodh.mouseselection") as boolean;
  (doc.querySelector("#hotkey") as HTMLSelectElement).value = Zotero.Prefs.get(
    "zodh.hotkey",
  ) as string;

  populateDictionary(doc, addon.data.dictNamelist);
  (doc.querySelector("#dict") as HTMLSelectElement).value =
    addon.data.dictSelected;
  (doc.querySelector("#monolingual") as HTMLSelectElement).value =
    Zotero.Prefs.get("zodh.monolingual") as string;

  doc.l10n
    // @ts-ignore
    ?.formatValue("zodh-selBilingual")
    .then(
      (lbl: string) =>
        ((doc.querySelector(".selBilingual") as XUL.MenuItem).label = lbl),
    );
  doc.l10n
    // @ts-ignore
    ?.formatValue("zodh-selMonolingual")
    .then(
      (lbl: string) =>
        ((doc.querySelector(".selMonolingual") as XUL.MenuItem).label = lbl),
    );

  (doc.querySelector("#anki-preferred-audio") as HTMLSelectElement).value =
    Zotero.Prefs.get("zodh.preferredaudio") as string;
  doc.l10n
    // @ts-ignore
    ?.formatValue("zodh-lblAudioPref0")
    .then(
      (lbl: string) =>
        ((doc.querySelector(".lblAudioPref0") as XUL.MenuItem).label = lbl),
    );

  doc.l10n
    // @ts-ignore
    ?.formatValue("zodh-lblAudioPref1")
    .then(
      (lbl: string) =>
        ((doc.querySelector(".lblAudioPref1") as XUL.MenuItem).label = lbl),
    );

  (doc.querySelector("#maxcontext") as HTMLSelectElement).value =
    Zotero.Prefs.get("zodh.maxcontext") as string;
  (doc.querySelector("#maxexample") as HTMLSelectElement).value =
    Zotero.Prefs.get("zodh.maxexample") as string;

  (doc.querySelector("#services") as HTMLSelectElement).value =
    Zotero.Prefs.get("zodh.services") as string;
  (doc.querySelector("#id") as HTMLSelectElement).value = Zotero.Prefs.get(
    "zodh.id",
  ) as string;
  (doc.querySelector("#password") as HTMLSelectElement).value =
    Zotero.Prefs.get("zodh.password") as string;

  (doc.querySelector("#tags") as HTMLSelectElement).value = Zotero.Prefs.get(
    "zodh.tags",
  ) as string;
  (doc.querySelector("#duplicate") as HTMLSelectElement).value =
    Zotero.Prefs.get("zodh.duplicate") as string;

  const fields = [
    "deckname",
    "typename",
    "expression",
    "reading",
    "extrainfo",
    "definition",
    "definitions",
    "sentence",
    "url",
    "audio",
  ];
  fields.forEach((field) => {
    (doc.querySelector(`#${field}`) as HTMLSelectElement).value =
      Zotero.Prefs.get(`zodh.${field}`) as string;
  });

  (doc.querySelector("#sysscripts") as HTMLSelectElement).value =
    Zotero.Prefs.get("zodh.sysscripts") as string;
  (doc.querySelector("#udfscripts") as HTMLSelectElement).value =
    Zotero.Prefs.get("zodh.udfscripts") as string;
  populateSysScriptsList(doc, Zotero.Prefs.get("zodh.sysscripts") as string);
  onHiddenClicked(doc);

  doc
    .querySelector(".enabled")
    ?.addEventListener("click", (e) => onEnabledClicked(e, doc));

  doc
    .querySelector("#login")
    ?.addEventListener("click", (e) => onLoginClicked(e, doc));
  doc
    .querySelector("#saveload")
    ?.addEventListener("click", (e) => onSaveClicked(e, doc));

  doc.querySelectorAll(".sl-col-onoff").forEach((ele) => {
    ele.addEventListener("click", () => onScriptListChange(doc));
  });
  doc.querySelectorAll(".sl-col-cloud").forEach((ele) => {
    ele.addEventListener("click", () => onScriptListChange(doc));
  });
  doc
    .querySelector("#hidden")
    ?.addEventListener("click", () => onHiddenClicked(doc));
  doc
    .querySelector("#typename")
    ?.addEventListener("command", (e) => onAnkiTypeChanged(e, doc));
  doc
    .querySelector("#services")
    ?.addEventListener("command", (e) => onServicesChanged(e, doc));

  updateAnkiStatus(doc);
}
