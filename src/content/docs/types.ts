/** Inline text supports **bold**, `code` and [links](/path). */
export type DocBlock =
  | { type: "p"; text: string }
  | { type: "h2"; id: string; text: string }
  | { type: "list"; items: string[] }
  | { type: "steps"; items: { title: string; text: string }[] }
  | {
      type: "callout";
      tone: "info" | "warning" | "success";
      title?: string;
      text: string;
    }
  | { type: "table"; head: string[]; rows: string[][] }
  | { type: "faq"; items: { q: string; a: string }[] }
  | { type: "code"; lang?: string; text: string }
  | { type: "flow"; items: { title: string; text: string }[] };

export interface DocPage {
  slug: string;
  group: string;
  title: string;
  summary: string;
  icon: string;
  blocks: DocBlock[];
}
