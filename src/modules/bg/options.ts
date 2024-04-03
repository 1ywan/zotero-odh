/* global odhback, localizeHtmlPage, utilAsync, optionsLoad, optionsSave */
async function populateAnkiDeckAndModel(doc:Document) {
    const bg = addon.data.bg;
    let names = [];
    doc.querySelector('#deckname')?.replaceChildren();

    if (bg==null) return;
    names = await bg.opt_getDeckNames();
    if (names !== null) {
        names.forEach((name:string) => {
            const opt = doc.createElement("option");
            opt.value = name;
            opt.text = name;
            doc.querySelector('#deckname')!.append(opt);
        });
   }

    (doc.querySelector('#deckname') as HTMLSelectElement)!.value = (Zotero.Prefs.get('zodh.deckname') as string);

    doc.querySelector('#typename')?.replaceChildren();
    names = await bg.opt_getModelNames();
    if (names !== null) {
        names.forEach((name:string) => {
            const opt = doc.createElement("option");
            opt.value = name;
            opt.text = name;
            doc.querySelector('#typename')!.append(opt);
        });
    }
    (doc.querySelector('#typename') as HTMLSelectElement).value = (Zotero.Prefs.get('zodh.typename') as string);
}

async function populateAnkiFields(doc: Document) {
    const bg = addon.data.bg;    

    const modelName = (doc.querySelector('#typename')as HTMLSelectElement)!.value || Zotero.Prefs.get('zodh.typename');
    if (modelName === null) return;

    if (bg==null) return;
    const names = await bg.opt_getModelFieldNames(modelName);
    if (names == null) return;

    const fields = ['expression', 'reading', 'extrainfo', 'definition', 'definitions', 'sentence', 'url', 'audio'];
    fields.forEach(field => {
        const select = doc.querySelector(`#${field}`) as HTMLSelectElement;
        select?.replaceChildren();
        const opt = doc.createElement("option");
        opt.value = "";
        opt.text = ""
        select?.append(opt);
        names.forEach((name:string) => {
            const opt1 = doc.createElement("option");
            opt1.value = name;
            opt1.text = name;
            select?.append(opt1);
        });
        select!.value = (Zotero.Prefs.get(`zodh.${field}`) as string);
    });
}

async function updateAnkiStatus(doc:Document) {
    const bg = addon.data.bg;
    (doc.querySelector('#services-status') as HTMLLabelElement).innerText = 'msgConnecting';
    (doc.querySelector('#anki-options') as HTMLElement)!.style.visibility = 'hidden';
    if (Zotero.Prefs.get("zodh.services") == 'ankiweb')
        (doc.querySelector('#anki-options') as HTMLElement)!.style.visibility = 'visible'
    else {
        (doc.querySelector('#anki-options') as HTMLElement)!.style.visibility = 'hidden'
    }

    if (bg==null) return;
    const version = await bg.opt_getVersion();
    if (version === null) {
        (doc.querySelector('#services-status') as HTMLLabelElement).innerText = 'msgFailed';
    } else {
        populateAnkiDeckAndModel(doc);
        populateAnkiFields(doc);
        (doc.querySelector('#services-status') as HTMLLabelElement).innerText = 'msgSuccess'+[version];
        (doc.querySelector('#anki-options') as HTMLElement)!.style.visibility = 'visible'
        if (Zotero.Prefs.get("zodh.services") == 'ankiconnect')
            (doc.querySelector('#duplicate-option') as HTMLElement)!.style.visibility = 'visible'
        else {
            (doc.querySelector('#duplicate-option') as HTMLElement)!.style.visibility = 'hidden'
    }

    }
}

function populateDictionary(doc: Document, dicts: [{"objectname": any, "displayname": string}]) {

    const dict = doc.querySelector('#dict');
    dict?.replaceChildren();
    dicts.forEach(item => {
        const ele = document.createElementNS("html", "option") as HTMLOptionElement;
        ele.value = item.objectname;
        ele.text = item.displayname;
        dict!.append(ele)
    });
}

function populateSysScriptsList(doc:Document, dictLibrary:string) {
    const optionscripts = Array.from(new Set(dictLibrary.split(',').filter(x => x).map(x => x.trim())));
    const systemscripts = [
        'builtin_encn_Collins', 'general_Makenotes',//default & builtin script
        'cncn_Zdic', //cn-cn dictionary
        'encn_Collins', 'encn_Cambridge', 'encn_Cambridge_tc', 'encn_Oxford', 'encn_Youdao', 'encn_Baicizhan', //en-cn dictionaries
        'enen_Collins', 'enen_LDOCE6MDX', 'enen_UrbanDict', //en-en dictionaries
        'enfr_Cambridge', 'enfr_Collins', //en-fr dictionaries
        'fren_Cambridge', 'fren_Collins', //fr-cn dictionaries
        'esen_Spanishdict', 'decn_Eudict', 'escn_Eudict', 'frcn_Eudict', 'frcn_Youdao', 'rucn_Qianyi' //msci dictionaries
    ];
    const scriptslistbody = doc.querySelector('#scriptslistbody');
    scriptslistbody?.replaceChildren();
    systemscripts.forEach(script => {
        let row = '';
        row += `<input class="sl-col sl-col-onoff" type="checkbox" ${optionscripts.includes(script) || optionscripts.includes('lib://'+script)?'checked':''}>`;
        row += `<input class="sl-col sl-col-cloud" type="checkbox" ${optionscripts.includes('lib://'+script)?'checked':''}>`;
        row += `<span class="sl-col sl-col-name">${script}</span>`;
        row += `<span class="sl-col sl-col-description">${script}</span>`;
        const rowEl = doc.createElement("div");
        rowEl.classList.add("sl-row");
        rowEl.innerHTML = row;
        scriptslistbody!.append(rowEl);
    });

    (doc.querySelector('.sl-col-onoff.sl-row:nth-child(1)') as HTMLInputElement)!.checked = true; // make default script(first row) always active.
    (doc.querySelector('.sl-col-cloud.sl-row:nth-child(1)') as HTMLInputElement)!.checked = false; // make default script(first row) as local script.
    (doc.querySelector('.sl-col-cloud.sl-col-onoff.sl-row:nth-child(1)') as HTMLElement)!.style.visibility = 'hidden'; //make default sys script untouch
}

function onScriptListChange(doc: Document) {
    const dictLibrary:string[] = [];
    doc.querySelectorAll('.sl-row')!.forEach((row) => {
        if (row==null) return;
        if ((row.querySelector('.sl-col-onoff') as HTMLInputElement)!.checked == true)
            dictLibrary.push((row.querySelector('.sl-col-cloud') as HTMLInputElement)!.checked ? 'lib://' + (row.querySelector('.sl-col-name') as HTMLElement).innerText : (row.querySelector('.sl-col-name') as HTMLElement).innerText);
    });
    (doc.querySelector('#sysscripts') as HTMLSelectElement).value = (dictLibrary.join());
}

function onHiddenClicked(doc:Document) {
    doc.querySelector('.sl-col-cloud')?.classList.toggle('hidden');
}

async function onAnkiTypeChanged(e: any, doc:Document) {
    if (e.originalEvent) {
        populateAnkiFields(doc);
    }
}

async function onLoginClicked(e:any, doc:Document) {
    if (e.originalEvent) {
        const bg = addon.data.bg;
        // const options = await optionsLoad();
        // options.id = $('#id').val();
        // options.password = $('#password').val();

        (doc.querySelector('#services-status') as HTMLElement)!.innerText = 'msgConnecting';
        await bg!.ankiweb.initConnection({}, true); // set param forceLogout = true

        // const newOptions = await odhback().opt_optionsChanged(options);
        updateAnkiStatus(doc);
    }
}

async function onServicesChanged(e: any, doc:Document) {
    if (e.originalEvent) {
        // const options = await optionsLoad();
        // const bg = addon.data.bg;
        // options.services = (doc.querySelector('#services') as HTMLSelectElement)?.value;
        // const newOptions = await bg?.opt_optionsChanged(options);
        updateAnkiStatus(doc);
    }
}

async function onSaveClicked(e: any, doc: Document) {
    if (!e.originalEvent) return;

    const bg = addon.data.bg;

    (doc.querySelector('#gif-load') as HTMLElement).style.display = '';
    // const newOptions = await bg?.opt_optionsChanged(options);
    (doc.querySelector('.gif') as HTMLImageElement).style.display = "none";

    ((doc.querySelector('#gif-good') as HTMLImageElement).style.display ='');
    setTimeout(() => {(doc.querySelector('.gif') as HTMLImageElement).style.display="none"},1000);

    populateDictionary(doc, Zotero.Prefs.get("zodh.dictNamelist") as any);
    (doc.querySelector('#dict') as HTMLSelectElement)!.value = (Zotero.Prefs.get("zodh.dictSelected") as string);

}

async function onReady(doc: Document) {
    // localizeHtmlPage();
    // const options = await optionsLoad();
    (doc.querySelector('#enabled') as HTMLInputElement)!.checked = Zotero.Prefs.get("zodh.enabled") as boolean;
    (doc.querySelector('#mouseselection') as HTMLInputElement)!.checked = Zotero.Prefs.get("zodh.mouseselection") as boolean;
    (doc.querySelector('#hotkey') as HTMLSelectElement).value = (Zotero.Prefs.get("zodh.hotkey") as string);

    populateDictionary(doc, Zotero.Prefs.get("zodh.dictNamelist") as any);
    (doc.querySelector('#dict') as HTMLSelectElement).value = (Zotero.Prefs.get("zodh.dictSelected") as string);

    (doc.querySelector('#monolingual') as HTMLSelectElement).value = (Zotero.Prefs.get("zodh.monolingual") as string);
    (doc.querySelector('#anki-preferred-audio') as HTMLSelectElement).value = (Zotero.Prefs.get("zodh.preferredaudio") as string);
    (doc.querySelector('#maxcontext') as HTMLSelectElement).value = (Zotero.Prefs.get("zodh.maxcontext") as string);
    (doc.querySelector('#maxexample') as HTMLSelectElement).value = (Zotero.Prefs.get("zodh.maxexample") as string);

    (doc.querySelector('#services') as HTMLSelectElement).value = (Zotero.Prefs.get("zodh.services") as string);
    (doc.querySelector('#id') as HTMLSelectElement).value = (Zotero.Prefs.get("zodh.id") as string);
    (doc.querySelector('#password') as HTMLSelectElement).value = (Zotero.Prefs.get("zodh.password") as string);

    (doc.querySelector('#tags') as HTMLSelectElement).value = (Zotero.Prefs.get("zodh.tags") as string);
    (doc.querySelector('#duplicate') as HTMLSelectElement).value = (Zotero.Prefs.get("zodh.duplicate") as string);

    const fields = ['deckname', 'typename', 'expression', 'reading', 'extrainfo', 'definition', 'definitions', 'sentence', 'url', 'audio'];
    fields.forEach(field => {
        (doc.querySelector(`#doc.querySelector{field}`) as HTMLSelectElement).value = (Zotero.Prefs.get(`zodh.doc.querySelector{field}`) as string);
    });

    (doc.querySelector('#sysscripts') as HTMLSelectElement).value = (Zotero.Prefs.get("zodh.sysscripts") as string);
    (doc.querySelector('#udfscripts') as HTMLSelectElement).value = (Zotero.Prefs.get("zodh.udfscripts") as string);
    populateSysScriptsList(doc, Zotero.Prefs.get("zodh.sysscripts") as string);
    onHiddenClicked(doc);

    doc.querySelector('#login')?.addEventListener("click", (e)=>onLoginClicked(e, doc));
    doc.querySelector('#saveload')?.addEventListener("click", (e) => onSaveClicked(e, doc));
    (doc.querySelector('.gif') as HTMLSpanElement)!.style.display="none";

    doc.querySelector('.sl-col-onoff, .sl-col-cloud')?.addEventListener("click", () => onScriptListChange(doc));
    doc.querySelector('#hidden')?.addEventListener("click", () => onHiddenClicked(doc));
    doc.querySelector('#typename')?.addEventListener("change", (e)=>onAnkiTypeChanged(e, doc));
    doc.querySelector('#services')?.addEventListener("change", (e)=>onServicesChanged(e, doc));

    updateAnkiStatus(doc);
}

// $(document).ready(utilAsync(onReady));