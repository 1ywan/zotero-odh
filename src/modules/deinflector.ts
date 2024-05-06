interface Wordform {
  [key: string]: string;
}

export class Deinflector {
  path: string;
  wordforms: Wordform | null;
  constructor() {
    this.path = "data/wordforms.json";
    this.wordforms = null;
  }

  async loadData() {
    this.wordforms = await Deinflector.loadData(rootURI + this.path);
  }

  deinflect(term: string): string | null {
    if (!this.wordforms) return null;
    return this.wordforms[term] ? this.wordforms[term] : null;
  }

  static async loadData(path: string): Promise<Wordform> {
    const data = (await fetch(path).then((response) => {
      if (response.ok) {
        return response.json();
      }
    })) as Wordform;
    return new Promise((resolve, reject) => {
      resolve(data);
    });
  }
}
