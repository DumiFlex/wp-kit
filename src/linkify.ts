/**
 * Dependency-free, pure rich-text segmenter for prose (post descriptions).
 *
 * Splits a plain-text string into an ordered list of {@link RichSeg}s so the
 * renderer (`RichText.vue`) can paint each piece as a Vue node, never via
 * `v-html`. Because every segment is interpolated as a text node
 * or a plain `<a>`/`<code>` with attribute-bound values, the output is
 * XSS-safe by construction: a `<script>` in the input is just text.
 *
 * A single left-to-right scan recognises, in priority order:
 *   1. `@{...}`        wildcard-ref code token (e.g. `@{color:cool and dark}`)
 *   2. `$name(.field)` var/accessor code token (e.g. `$color`, `$color.2`)
 *   3. `https?://…`    explicit URL
 *   4. bare URL        a `domain.tld/path` or `www.…` (must carry a `/path`)
 * Everything else accumulates as literal text. Adjacent text runs collapse
 * into one `text` segment.
 *
 * URL handling:
 *   - Trailing punctuation `.,;:!?)` is peeled off the match and pushed back
 *     as text, so `(see https://x.com).` doesn't swallow the `).`.
 *   - http(s) matches keep their scheme as the href; bare/`www.` matches are
 *     prefixed with `https://`.
 *   - A `link` segment is emitted ONLY when the resulting href starts with
 *     `http://` or `https://`; anything else degrades to text.
 *
 * Lossless invariant: concatenating every `.text` reproduces the input.
 *
 * Why not rich-tokenize.ts: that is the wildcard GRAMMAR lexer (picks,
 * escapes, `@{8hex}` refs only), and a description is prose: `{a|b}` must
 * stay text, `$$` is just two dollars, and a mention like `@{color:cool}`
 * names a wildcard in words. This scanner only marks mentions and links.
 */

export type RichSeg = {
  kind: "text" | "link" | "code";
  text: string;
  /** Present only on `link` segments — always an `http(s)://` absolute URL. */
  href?: string;
};

// Code token: `@{...}` (ref). Non-greedy body, no nested `}`.
const RE_REF = /^@\{[^}]*\}/;
// Code token: `$name` with an optional single `.field` accessor.
const RE_VAR = /^\$[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z0-9_]+)?/;
// Explicit URL with scheme — runs to the next whitespace.
const RE_URL = /^https?:\/\/[^\s]+/;
// Bare URL: either a `www.` host, OR a `domain.tld/` (a dotted host directly
// followed by a `/path`). Requires the `/` so prose like `e.g.` or `node.com`
// without a path is NOT linkified (kept conservative on purpose).
const RE_BARE = /^(?:www\.|[a-z0-9-]+(?:\.[a-z0-9-]+)+\/)[^\s]+/i;

/** Trailing punctuation peeled off a matched URL and returned as text. */
const TRAILING = new Set([".", ",", ";", ":", "!", "?", ")"]);

/**
 * Segment `input` into ordered text / link / code runs. Returns an empty
 * array for empty input; the caller decides what to render for `[]`.
 */
export function parseRichText(input: string): RichSeg[] {
  if (!input) return [];

  const segs: RichSeg[] = [];
  let buf = "";

  /** Flush the pending literal-text run (if any) as one `text` segment. */
  const flush = (): void => {
    if (buf) {
      segs.push({ kind: "text", text: buf });
      buf = "";
    }
  };

  let i = 0;
  const n = input.length;
  while (i < n) {
    const rest = input.slice(i);
    const ch = input[i];

    // 1. @{...} ref code token.
    if (ch === "@") {
      const m = rest.match(RE_REF);
      if (m) {
        flush();
        segs.push({ kind: "code", text: m[0] });
        i += m[0].length;
        continue;
      }
    }

    // 2. $var code token.
    if (ch === "$") {
      const m = rest.match(RE_VAR);
      if (m) {
        flush();
        segs.push({ kind: "code", text: m[0] });
        i += m[0].length;
        continue;
      }
    }

    // 3 + 4. URLs — explicit scheme first, then bare/`www.`.
    //
    // A bare match is only attempted at a word boundary (start of input or
    // after whitespace) so we don't linkify the tail of a longer token.
    const atBoundary = i === 0 || /\s/.test(input[i - 1] ?? "");
    const urlMatch =
      rest.match(RE_URL) ?? (atBoundary ? rest.match(RE_BARE) : null);
    if (urlMatch) {
      let raw = urlMatch[0];
      // Peel trailing punctuation back into the text stream.
      let trailer = "";
      let last = raw.slice(-1);
      while (last && TRAILING.has(last)) {
        trailer = last + trailer;
        raw = raw.slice(0, -1);
        last = raw.slice(-1);
      }
      if (raw.length > 0) {
        const href = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
        // Only emit a link when the href is genuinely http(s); otherwise the
        // whole match degrades to text (defensive — the prefix above always
        // satisfies this, but keeps the contract explicit).
        if (/^https?:\/\//i.test(href)) {
          flush();
          segs.push({ kind: "link", text: raw, href });
        } else {
          buf += raw;
        }
        if (trailer) buf += trailer;
        i += raw.length + trailer.length;
        continue;
      }
    }

    // Default: accumulate one literal character.
    buf += ch;
    i += 1;
  }

  flush();
  return segs;
}
