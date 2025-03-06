export class BadWord {
  private text: string;
  private canonicalForms: string[];
  private categories: string[];
  private severity: number;
  private severityDescription: BadWordSeverity;

  constructor(text: string, canonicalForms: string[], categories: string[], severity: number, severityDescription: BadWordSeverity) {
    this.text = text;
    this.canonicalForms = canonicalForms;
    this.categories = categories;
    this.severity = severity;
    this.severityDescription = severityDescription;
  }

  public static BadWordFactory(input): BadWord {
    if (input !== undefined &&
        input.text !== undefined &&
        input.severity_rating !== undefined &&
        input.severity_description !== undefined
    ) {
      return new BadWord(
        input.text.toLowerCase(),
        BadWord.getStringArrWithoutEmptyStrings(input.canonical_form_1, input.canonical_form_2, input.canonical_form_3),
        BadWord.getStringArrWithoutEmptyStrings(input.category_1, input.category_2, input.category_3),
        parseFloat(input.severity_rating),
        input.severity_description as BadWordSeverity
      );
    }
    return undefined;
  }

  public getText(): string {
    return this.text;
  }

  public getCanonicalForms(): string[] {
    return this.canonicalForms;
  }

  public getCategories(): string[] {
    return this.categories;
  }

  public getSeverity(): number {
    return this.severity;
  }

  public getSeverityDescription(): BadWordSeverity {
    return this.severityDescription;
  }

  public toString(): string {
    return `text:"${this.text}" canonicalForms:[${this.canonicalForms}] categories:[${this.categories}] severity:${this.severity} severityDescription:"${this.severityDescription}"`;
  }

  private static getStringArrWithoutEmptyStrings(...inputs: string[]): string[] {
    const strArr: string[] = [];

    for (const str of inputs) {
      if (str !== undefined) {
        const trimmedStr = str.trim();
        if (trimmedStr.length != 0) {
          strArr.push(trimmedStr);
        }
      }
    }

    return strArr;
  }
}

export enum BadWordSeverity {
  Mild = "Mild",
  Strong = "Strong",
  Severe = "Severe",
}
