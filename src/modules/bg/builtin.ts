export class Builtin {
  dicts: any;
  constructor() {
    this.dicts = {};
  }

  async loadData() {
    this.dicts["collins"] = await Builtin.loadData(
      rootURI + "data/collins.json",
    );
  }

  findTerm(dictname: string, term: string) {
    const dict = this.dicts[dictname];
    return dict[term] ? JSON.stringify(dict[term]) : null;
  }

  static async loadData(path: string) {
    const data = await fetch(path).then((response) => {
      if (response.ok) {
        return response.json();
      }
    });
    return new Promise((resolve, reject) => {
      resolve(data);
    });
  }
}
