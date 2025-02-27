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

  public static BadWordFactory(input: any[]): BadWord {
    if (input.length === 9) {
      return new BadWord(input[0], [], [], parseFloat(input[7]), input[8] as BadWordSeverity);
    }
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
    return `text:"${this.text}" canonicalForms:[${this.canonicalForms}] categories:[${this.categories}] severity:[${this.severity}] severityDescription:"${this.severityDescription}"`;
  }
}

export enum BadWordSeverity {
  Mild = "Mild",
  Strong = "Strong",
  Severe = "Severe",
}
