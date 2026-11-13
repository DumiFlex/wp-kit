/**
 * A small word, line or tag diff for DiffView: the longest common subsequence
 * of the two token lists, then the runs that are the same, added or removed.
 * Inputs past `limit` tokens on either side fall back to "all removed, all
 * added", which keeps the table (n × m) small.
 *
 * `tags` splits on commas (a prompt's tag list) and matches a tag by its text
 * without the comma and edge spaces, so `((silver hair)),` → `(silver
 * hair:1.21),` reads as one tag out and one tag in, and a tag whose spacing
 * changed still counts as the same tag. A `same` part then carries `after`,
 * the after side's spelling, when it differs from `text` (the before side's).
 *
 * Marks colour ranges of the BEFORE text (what a change hinged on: the tag a
 * duplicate repeats, the word a blocklist matched). `applyMarks` splits the
 * parts at mark edges; `markColor` turns a tone into a colour.
 */
export type DiffBy = "words" | "lines" | "tags";
export type DiffPart = {
  kind: "same" | "add" | "del";
  text: string;
  /** On a `same` part: the after side's text, when it is spelled differently. */
  after?: string | undefined;
};

/** A range of the before text to colour. `tone` is a preset or any CSS colour. */
export interface DiffMark {
  start: number;
  end: number;
  /** Shown on hover and read to screen readers. */
  label?: string | undefined;
  tone?: DiffMarkTone | (string & {}) | undefined;
}
export type DiffMarkTone = "info" | "accent" | "success" | "warn" | "danger";
export const DIFF_MARK_TONES: readonly DiffMarkTone[] = ["info", "accent", "success", "warn", "danger"];

export type MarkedPart = DiffPart & { mark?: DiffMark | undefined };

/** Words with the spaces after them (tags with their comma and spaces), so
 *  joining the parts gives the text back. */
export function tokenize(text: string, by: DiffBy): string[] {
  if (!text) return [];
  if (by === "lines") return text.split(/(?<=\n)/);
  if (by === "tags") return text.match(/[^,]+,?\s*|,\s*/g) ?? [];
  return text.match(/\s+|[^\s]+/g) ?? [];
}

/** A tag's text without its comma and edge spaces. */
export function tagKey(token: string): string {
  return token.replace(/,?\s*$/, "").trim();
}

export function diffTokens(
  a: string[],
  b: string[],
  limit = 2000,
  key: (t: string) => string = (t) => t,
): DiffPart[] {
  if (a.length > limit || b.length > limit) {
    return merge([...a.map((t) => ({ kind: "del" as const, text: t })), ...b.map((t) => ({ kind: "add" as const, text: t }))]);
  }
  const ka = a.map(key);
  const kb = b.map(key);
  const n = a.length; const m = b.length;
  const lcs: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = ka[i] === kb[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }
  const out: DiffPart[] = [];
  let i = 0; let j = 0;
  while (i < n && j < m) {
    if (ka[i] === kb[j]) {
      out.push(a[i] === b[j] ? { kind: "same", text: a[i] } : { kind: "same", text: a[i], after: b[j] });
      i++; j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) { out.push({ kind: "del", text: a[i] }); i++; }
    else { out.push({ kind: "add", text: b[j] }); j++; }
  }
  while (i < n) out.push({ kind: "del", text: a[i++] });
  while (j < m) out.push({ kind: "add", text: b[j++] });
  return merge(out);
}

/** Join neighbours of one kind into one part. A `same` part spelled
 *  differently after stays on its own, so marks can still split the rest. */
function merge(parts: DiffPart[]): DiffPart[] {
  const out: DiffPart[] = [];
  for (const p of parts) {
    const last = out[out.length - 1];
    if (last && last.kind === p.kind && last.after === undefined && p.after === undefined) last.text += p.text;
    else out.push({ ...p });
  }
  return out;
}

export function diffText(before: string, after: string, by: DiffBy = "words"): DiffPart[] {
  return diffTokens(tokenize(before, by), tokenize(after, by), 2000, by === "tags" ? tagKey : undefined);
}

/**
 * Split parts at mark edges so each piece is wholly inside or outside a mark.
 * Marks are ranges in the before text, which `same` and `del` parts walk
 * through (an `add` part takes none). A `same` part spelled differently on
 * the after side is marked whole rather than split, so its `after` stays
 * true.
 */
export function applyMarks(parts: DiffPart[], marks: readonly DiffMark[]): MarkedPart[] {
  if (!marks.length) return parts;
  const out: MarkedPart[] = [];
  let pos = 0;
  for (const p of parts) {
    if (p.kind === "add") { out.push(p); continue; }
    const end = pos + p.text.length;
    if (p.after !== undefined) {
      const m = marks.find((k) => k.start < end && k.end > pos);
      out.push(m ? { ...p, mark: m } : p);
      pos = end;
      continue;
    }
    const edges = [...new Set(marks.flatMap((k) => [k.start, k.end]))]
      .filter((e) => e > pos && e < end)
      .sort((x, y) => x - y);
    let from = pos;
    for (const to of [...edges, end]) {
      const m = marks.find((k) => from >= k.start && from < k.end);
      const piece: MarkedPart = { kind: p.kind, text: p.text.slice(from - pos, to - pos) };
      if (m) piece.mark = m;
      out.push(piece);
      from = to;
    }
    pos = end;
  }
  return out;
}

/** A mark's colour: a preset tone's token, or the CSS colour as given. */
export function markColor(tone: DiffMark["tone"]): string {
  const t = tone ?? "info";
  return (DIFF_MARK_TONES as readonly string[]).includes(t) ? `var(--wp-${t})` : t;
}
