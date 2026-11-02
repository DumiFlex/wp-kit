/**
 * The site's search: finds pieces and sections by what you type. Pure, so
 * the ranking is tested without a page (`search.test.ts`).
 *
 * Every word you type must match somewhere in an item. A word in the name
 * counts most (whole name, then start of the name, then start of a word in
 * it, then anywhere in it), then its id, file and group, then the text that
 * says when to use it. Results keep page order when they tie.
 */
import { KIT_ENTRIES, KIT_GROUPS } from "./registry";

export interface SearchItem {
  /** The element id it jumps to (without `#`). */
  target: string;
  kind: "section" | "piece";
  name: string;
  /** Group label for a piece, "Section" for a section. */
  where: string;
  /** Id, file, group: words that find it but aren't shown. */
  keys: string;
  /** When to use it: searched, and shown as the result's second line. */
  body: string;
}

/** A run of text, marked when it matched a word of the query. */
export interface Segment { text: string; hit: boolean }

export interface SearchResult {
  item: SearchItem;
  score: number;
  name: Segment[];
  snippet: Segment[];
}

const SECTION = "Section";

/** Everything the search can find, in page order. */
export function searchItems(): SearchItem[] {
  const items: SearchItem[] = [
    {
      target: "kit-tokens", kind: "section", name: "Tokens", where: SECTION,
      keys: "tokens colours colors type spacing corners radius surfaces accent status",
      body: "Colours, type and spacing. Use a token, never a raw colour or size.",
    },
    {
      target: "kit-motion", kind: "section", name: "Animations", where: SECTION,
      keys: "motion animations speed pause transitions entrances",
      body: "Every animation in the kit side by side, with a speed switch and Pause.",
    },
  ];
  for (const g of KIT_GROUPS) {
    items.push({ target: `kit-group-${g.id}`, kind: "section", name: g.label, where: SECTION, keys: g.id, body: g.blurb });
    for (const e of KIT_ENTRIES.filter((x) => x.group === g.id)) {
      items.push({
        target: `kit-${e.id}`, kind: "piece", name: e.name, where: g.label,
        keys: `${e.id} ${e.file} ${g.label} ${e.surfaces.join(" ")}`,
        body: e.instead ? `${e.use} Instead of: ${e.instead}` : e.use,
      });
    }
  }
  return items;
}

export function queryWords(query: string): string[] {
  return query.toLowerCase().split(/\s+/).filter(Boolean);
}

/** Does `word` start a word inside `text` (both lower case)? */
function startsWord(text: string, word: string): boolean {
  let i = text.indexOf(word);
  while (i >= 0) {
    if (i === 0 || !/[a-z0-9]/.test(text.charAt(i - 1))) return true;
    i = text.indexOf(word, i + 1);
  }
  return false;
}

function wordScore(item: SearchItem, word: string): number {
  const name = item.name.toLowerCase();
  if (name === word) return 100;
  if (name.startsWith(word)) return 60;
  if (startsWord(name, word)) return 40;
  if (name.includes(word)) return 30;
  const keys = item.keys.toLowerCase();
  if (startsWord(keys, word)) return 15;
  if (keys.includes(word)) return 10;
  const body = item.body.toLowerCase();
  if (startsWord(body, word)) return 5;
  if (body.includes(word)) return 2;
  return 0;
}

/** Splits `text` into runs, marking every place a query word matches. */
export function mark(text: string, words: string[]): Segment[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  const on = new Array<boolean>(text.length).fill(false);
  for (const w of words) {
    let i = lower.indexOf(w);
    while (i >= 0) {
      for (let k = i; k < i + w.length; k++) on[k] = true;
      i = lower.indexOf(w, i + w.length);
    }
  }
  const out: Segment[] = [];
  for (let i = 0; i < text.length; i++) {
    const last = out.at(-1);
    if (last && last.hit === on[i]) last.text += text.charAt(i);
    else out.push({ text: text.charAt(i), hit: on[i] });
  }
  return out;
}

const SNIPPET = 110;

/** The line under a result: the start of its text, or the part around the
 *  first word that matched there when the name didn't match. */
export function snippet(body: string, words: string[]): string {
  const lower = body.toLowerCase();
  const at = Math.min(...words.map((w) => lower.indexOf(w)).filter((i) => i >= 0));
  if (!Number.isFinite(at) || at < SNIPPET - 30) {
    return body.length > SNIPPET ? `${body.slice(0, SNIPPET).trimEnd()}…` : body;
  }
  const from = body.lastIndexOf(" ", at - 30) + 1;
  const part = body.slice(from, from + SNIPPET);
  return `…${part.trimEnd()}${from + SNIPPET < body.length ? "…" : ""}`;
}

/** The items that match every word of `query`, best first. */
export function search(query: string, items: SearchItem[], limit = 12): SearchResult[] {
  const words = queryWords(query);
  if (!words.length) return [];
  const found: { item: SearchItem; score: number; order: number }[] = [];
  items.forEach((item, order) => {
    let score = 0;
    for (const w of words) {
      const s = wordScore(item, w);
      if (!s) return;
      score += s;
    }
    found.push({ item, score, order });
  });
  found.sort((a, b) => b.score - a.score || a.order - b.order);
  return found.slice(0, limit).map(({ item, score }) => {
    const nameHit = words.some((w) => item.name.toLowerCase().includes(w));
    return {
      item,
      score,
      name: mark(item.name, words),
      snippet: mark(nameHit ? snippet(item.body, []) : snippet(item.body, words), words),
    };
  });
}
