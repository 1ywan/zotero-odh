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

// 不再需要 populateAnkiFields，因为使用模板系统
// 保留函数以避免其他地方调用时报错
async function populateAnkiFields(doc: Document, modelName: string | null) {
  // 模板系统不需要字段映射，此函数保留为空以避免兼容性问题
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
    // 不再需要 populateAnkiFields，因为使用模板系统
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

    // row += `<span class="sl-col sl-col-name">${script}</span>`;
    // row.innerHTML = row;
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
  // (doc.querySelector("#sysscripts") as HTMLSelectElement).value =
  //   dictLibrary.join();
  Zotero.Prefs.set("zodh.sysscripts", dictLibrary.join());
}

function onHiddenClicked(doc: Document) {
  doc
    .querySelectorAll(".sl-col-cloud")
    ?.forEach((col) => col.classList.toggle("hidden"));
}

async function onAnkiTypeChanged(e: any, doc: Document) {
  // 模板系统不需要根据类型变化更新字段映射
  // 保留函数以避免事件监听器报错
}

async function onLoginClicked(e: any, doc: Document) {
  // (doc.querySelector("#services-status") as HTMLElement)!.innerHTML =
  //   "msgConnecting";
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
  // (doc.querySelector("#gif-load") as HTMLElement).style.display = "";
  // (doc.querySelector(".gif") as HTMLImageElement).style.display = "none";

  // (doc.querySelector("#gif-good") as HTMLImageElement).style.display = "";
  // setTimeout(() => {
  //   (doc.querySelector(".gif") as HTMLImageElement).style.display = "none";
  // }, 1000);

  // 手动保存模板字段（因为 preference 绑定可能不会立即生效）
  const frontTemplateEl = doc.querySelector("#frontTemplate") as HTMLTextAreaElement;
  const backTemplateEl = doc.querySelector("#backTemplate") as HTMLTextAreaElement;
  if (frontTemplateEl) {
    Zotero.Prefs.set("zodh.frontTemplate", frontTemplateEl.value, true);
  }
  if (backTemplateEl) {
    Zotero.Prefs.set("zodh.backTemplate", backTemplateEl.value, true);
  }

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
  // localizeHtmlPage();
  // const options = await optionsLoad();
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

  // 加载模板字段
  const frontTemplateEl = doc.querySelector("#frontTemplate") as HTMLTextAreaElement;
  const backTemplateEl = doc.querySelector("#backTemplate") as HTMLTextAreaElement;
  if (frontTemplateEl) {
    const frontValue = (Zotero.Prefs.get("zodh.frontTemplate") as string) || "{{Expression}}";
    frontTemplateEl.value = frontValue;
  }
  if (backTemplateEl) {
    const backValue = (Zotero.Prefs.get("zodh.backTemplate") as string) || "{{Reading}}\n\n{{Definition}}";
    backTemplateEl.value = backValue;
  }

  // 保留其他字段的加载（用于兼容性）
  const fields = [
    "deckname",
    "typename",
    "tags",
  ];
  fields.forEach((field) => {
    const element = doc.querySelector(`#${field}`) as HTMLInputElement | HTMLSelectElement;
    if (element) {
      element.value = Zotero.Prefs.get(`zodh.${field}`) as string;
    }
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
  // (doc.querySelector(".gif") as HTMLSpanElement)!.style.display = "none";

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

// $(document).ready(utilAsync(onReady));
