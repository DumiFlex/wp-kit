/**
 * Syntax colours for CodeBlock: a small lexer per language, no dependency.
 * It splits code into tokens of a few kinds; CodeBlock draws each kind in a
 * shared colour token, so a block wears the colours of the side it is on.
 *
 *   highlight('{"a": 1}', "json")  →  [{ kind: "punct", text: "{" }, { kind: "key", text: '"a"' }, …]
 *
 * Languages: json, ts (also js), html (also vue, xml), css, sh (also bash,
 * shell, Modelfile), prompt (the Wildcard Pipeline template grammar: `$var`,
 * `@{ref}`, `{a|b}`, `{2$$a|b}`, `$$` / `@@` escapes, `(word:1.2)` weights). Anything
 * else comes back as one plain token. Every character of the input is in
 * exactly one token, in order, so joining the tokens gives the input back.
 */
import { tokenizeRich } from "./rich-tokenize";

export type HighlightKind =
  | "plain" | "keyword" | "string" | "number" | "comment" | "punct"
  | "key" | "tag" | "attr" | "fn" | "var" | "ref" | "brace" | "escape";

export interface HighlightToken {
  kind: HighlightKind;
  text: string;
}

export type HighlightLanguage = "json" | "ts" | "html" | "css" | "sh" | "prompt";

const ALIASES: Record<string, HighlightLanguage> = {
  json: "json",
  ts: "ts", typescript: "ts", js: "ts", javascript: "ts", tsx: "ts", jsx: "ts",
  html: "html", vue: "html", xml: "html", svg: "html",
  css: "css",
  sh: "sh", bash: "sh", shell: "sh", zsh: "sh", console: "sh", modelfile: "sh", dockerfile: "sh",
  prompt: "prompt", template: "prompt", wildcard: "prompt",
};

/** The grammar for a language name ("JSON", "Vue", "bash" …), or null. */
export function highlightLanguage(name: string | null | undefined): HighlightLanguage | null {
  if (!name) return null;
  return ALIASES[name.trim().toLowerCase()] ?? null;
}

type Rule = [HighlightKind, RegExp];

const TS_KEYWORDS = /^(?:import|from|export|default|const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|class|extends|interface|type|enum|as|in|of|typeof|instanceof|async|await|try|catch|finally|throw|void|this|null|undefined|true|false|readonly|public|private|protected|static|satisfies|keyof)$/;

const RULES: Record<Exclude<HighlightLanguage, "prompt" | "html">, Rule[]> = {
  json: [
    ["key", /"(?:[^"\\\n]|\\.)*"(?=\s*:)/y],
    ["string", /"(?:[^"\\\n]|\\.)*"/y],
    ["number", /-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/y],
    ["keyword", /\b(?:true|false|null)\b/y],
    ["punct", /[{}[\],:]/y],
  ],
  ts: [
    ["comment", /\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$)/y],
    ["string", /"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`/y],
    ["number", /\b\d+(?:\.\d+)?\b/y],
    ["fn", /[A-Za-z_$][\w$]*(?=\s*\()/y],
    ["plain", /[A-Za-z_$][\w$]*/y],
    ["punct", /[{}()[\];,.<>=!&|?:+\-*/%]+/y],
  ],
  css: [
    ["comment", /\/\*[\s\S]*?(?:\*\/|$)/y],
    ["string", /"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/y],
    ["key", /[\w-]+(?=\s*:[^:{]*[;}\n])/y],
    ["var", /--[\w-]+/y],
    ["number", /#[\da-fA-F]{3,8}\b|-?\d*\.?\d+(?:px|em|rem|%|vh|vw|s|ms|deg|fr)?\b/y],
    ["fn", /[\w-]+(?=\()/y],
    ["tag", /[.#]?[\w-]+(?::{1,2}[\w-]+)*(?=[^{};]*\{)/y],
    ["punct", /[{}();:,>+~*]/y],
  ],
  sh: [
    ["comment", /#[^\n]*/y],
    ["string", /"(?:[^"\\\n]|\\.)*"|'[^'\n]*'/y],
    ["var", /\$\{?[\w]+\}?/y],
    ["attr", /(?<=\s)--?[\w-]+/y],
    ["fn", /(?<=^|\n|[|;&]\s*)[A-Za-z_][\w.-]*/y],
    ["punct", /[|&;<>()]+/y],
  ],
};

function lex(code: string, rules: Rule[]): HighlightToken[] {
  const out: HighlightToken[] = [];
  let plain = "";
  let i = 0;
  const flush = (): void => { if (plain) { out.push({ kind: "plain", text: plain }); plain = ""; } };
  outer: while (i < code.length) {
    for (const [kind, re] of rules) {
      re.lastIndex = i;
      const m = re.exec(code);
      if (m && m[0].length > 0) {
        let k = kind;
        if (rules === RULES.ts && kind === "plain" && TS_KEYWORDS.test(m[0])) k = "keyword";
        if (k === "plain") plain += m[0];
        else { flush(); out.push({ kind: k, text: m[0] }); }
        i += m[0].length;
        continue outer;
      }
    }
    plain += code[i];
    i += 1;
  }
  flush();
  return out;
}

/** HTML and Vue templates: tags, attributes, their values, `{{ }}` as TS. */
function lexHtml(code: string): HighlightToken[] {
  const out: HighlightToken[] = [];
  const re = /<!--[\s\S]*?(?:-->|$)|<\/?[A-Za-z][\w.:-]*|\/?>|\{\{[\s\S]*?(?:\}\}|$)/g;
  let at = 0;
  let inTag = false;
  const text = (s: string): void => {
    if (!s) return;
    if (!inTag) { out.push({ kind: "plain", text: s }); return; }
    // Attributes inside a tag: name, =, "value".
    const attr = /("[^"]*"|'[^']*')|([:@#]?[\w.:@#-]+)|(=)|(\s+)|([^\s"'=]+)/g;
    for (const m of s.matchAll(attr)) {
      if (m[1]) out.push({ kind: "string", text: m[1] });
      else if (m[2]) out.push({ kind: "attr", text: m[2] });
      else if (m[3]) out.push({ kind: "punct", text: m[3] });
      else out.push({ kind: "plain", text: m[0] });
    }
  };
  for (const m of code.matchAll(re)) {
    const idx = m.index ?? 0;
    text(code.slice(at, idx));
    const t = m[0];
    if (t.startsWith("<!--")) out.push({ kind: "comment", text: t });
    else if (t.startsWith("{{") && !inTag) {
      out.push({ kind: "punct", text: "{{" });
      const inner = t.slice(2, t.endsWith("}}") ? -2 : undefined);
      out.push(...lex(inner, RULES.ts));
      if (t.endsWith("}}")) out.push({ kind: "punct", text: "}}" });
    } else if (t.startsWith("<")) {
      out.push({ kind: "punct", text: t.startsWith("</") ? "</" : "<" });
      out.push({ kind: "tag", text: t.replace(/^<\/?/, "") });
      inTag = true;
    } else if (t.endsWith(">")) {
      out.push({ kind: "punct", text: t });
      inTag = false;
    } else {
      text(t);
    }
    at = idx + t.length;
  }
  text(code.slice(at));
  return out;
}

/** The template grammar, through the kit's own tokenizer; `(word:1.2)` weights too. */
function lexPrompt(code: string): HighlightToken[] {
  const out: HighlightToken[] = [];
  const plain = (text: string): void => {
    // Plain text: pick out `:1.2)` weights.
    let at = 0;
    for (const m of text.matchAll(/:(-?\d+(?:\.\d+)?)(?=\))/g)) {
      const idx = (m.index ?? 0) + 1;
      if (idx > at) out.push({ kind: "plain", text: text.slice(at, idx) });
      out.push({ kind: "number", text: m[1] ?? "" });
      at = idx + (m[1]?.length ?? 0);
    }
    if (at < text.length) out.push({ kind: "plain", text: text.slice(at) });
  };
  let at = 0;
  for (const t of tokenizeRich(code)) {
    // The tokenizer may leave gaps (it reports what it recognises); keep them as text.
    if (t.start > at) plain(code.slice(at, t.start));
    const text = code.slice(t.start, t.end);
    if (t.kind === "var") out.push({ kind: "var", text });
    else if (t.kind === "ref") out.push({ kind: "ref", text });
    else if (t.kind === "dp-brace" || t.kind === "dp-multi") out.push({ kind: "brace", text });
    else if (t.kind === "escape") out.push({ kind: "escape", text });
    else plain(text);
    at = Math.max(at, t.end);
  }
  if (at < code.length) plain(code.slice(at));
  return out;
}

export function highlight(code: string, language: HighlightLanguage | null): HighlightToken[] {
  if (!language || !code) return [{ kind: "plain", text: code }];
  if (language === "html") return lexHtml(code);
  if (language === "prompt") return lexPrompt(code);
  return lex(code, RULES[language]);
}

/** Tokens cut at line breaks, for numbered lines. */
export function highlightLines(tokens: HighlightToken[]): HighlightToken[][] {
  const lines: HighlightToken[][] = [[]];
  for (const t of tokens) {
    const parts = t.text.split("\n");
    parts.forEach((p, i) => {
      if (i > 0) lines.push([]);
      if (p) lines[lines.length - 1]?.push({ kind: t.kind, text: p });
    });
  }
  return lines;
}
