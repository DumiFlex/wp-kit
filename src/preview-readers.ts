/**
 * Defensive readers + parsers for published payloads. Pure (no Vue), shared
 * by the per-type previews, the post header's feature pills and the bundle
 * summary. A published payload is untrusted JSON, so every read tolerates a
 * missing or mistyped field.
 */
import { tokenizeRich, type RichToken } from "./rich-tokenize";

export type Obj = Record<string, unknown>;

export function readString(obj: unknown, key: string): string | null {
  if (!obj || typeof obj !== "object") return null;
  const v = (obj as Obj)[key];
  return typeof v === "string" ? v : null;
}
export function readNumber(obj: unknown, key: string): number | null {
  if (!obj || typeof obj !== "object") return null;
  const v = (obj as Obj)[key];
  return typeof v === "number" ? v : null;
}
export function readArray(obj: unknown, key: string): unknown[] {
  if (!obj || typeof obj !== "object") return [];
  const v = (obj as Obj)[key];
  return Array.isArray(v) ? v : [];
}
export function readObject(obj: unknown, key: string): Obj | null {
  if (!obj || typeof obj !== "object") return null;
  const v = (obj as Obj)[key];
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  return v as Obj;
}
export function readStrings(obj: unknown, key: string): string[] {
  return readArray(obj, key).filter((s): s is string => typeof s === "string");
}
/** Coerce a payload field into an axis map (`{axis: tag[]}`), keeping only
 *  string members. Null when absent or empty. */
export function readGroups(obj: unknown, key: string): Record<string, string[]> | null {
  const raw = readObject(obj, key);
  if (!raw) return null;
  const out: Record<string, string[]> = {};
  for (const [axis, members] of Object.entries(raw)) {
    if (Array.isArray(members)) {
      const tags = members.filter((m): m is string => typeof m === "string");
      if (tags.length) out[axis] = tags;
    }
  }
  return Object.keys(out).length ? out : null;
}

/** Engine rows nest type fields under `payload`; older flat seeds don't. */
export function innerOf(payload: unknown): Obj | null {
  return readObject(payload, "payload") ?? (payload && typeof payload === "object" ? (payload as Obj) : null);
}

/** Module type, or "bundle" for a bundle row (no `type`, has `children`). */
export function payloadKind(payload: unknown): string | null {
  return readString(payload, "type") ?? (readArray(payload, "children").length ? "bundle" : null);
}

// ─────────── grammar scanning ───────────

/** Every token in `text`, brace/multi arms included (depth-first). */
function allTokens(text: string): RichToken[] {
  const out: RichToken[] = [];
  const walk = (s: string): void => {
    for (const t of tokenizeRich(s)) {
      out.push(t);
      for (const b of t.meta?.branches ?? []) walk(b);
    }
  };
  walk(text);
  return out;
}
export interface TextScan {
  vars: string[];
  negVars: string[];
  refs: number;
  picks: number;
}
export function scanText(text: string): TextScan {
  const vars: string[] = [];
  const negVars: string[] = [];
  let refs = 0;
  let picks = 0;
  for (const t of allTokens(text)) {
    if (t.kind === "var" && t.meta?.name) {
      (t.meta.neg ? negVars : vars).push(t.meta.name);
    } else if (t.kind === "ref") refs++;
    else if (t.kind === "dp-brace" || t.kind === "dp-multi") picks++;
  }
  return { vars, negVars, refs, picks };
}

// ─────────── wildcard ───────────

export interface WildcardOption {
  value: string;
  weight: number;
  /** Plural tag list (a legacy singular `sub_category` folds in). */
  tags: string[];
  negative: string;
  /** Schema v9: rolls normally, and is also used when nothing else is left to pick. */
  fallback: boolean;
}
export interface WildcardAxis {
  name: string;
  tags: string[];
}
export function wildcardOptions(inner: unknown): WildcardOption[] {
  return readArray(inner, "options")
    .map((r) => {
      const tags = readStrings(r, "sub_categories");
      const singular = readString(r, "sub_category");
      return {
        value: readString(r, "value") ?? "",
        weight: readNumber(r, "weight") ?? 1,
        tags: tags.length ? tags : singular ? [singular] : [],
        negative: readString(r, "negative") ?? "",
        fallback: !!r && typeof r === "object" && (r as Obj).fallback === true,
      };
    })
    .filter((o) => o.value);
}
/** Axes from `tag_groups`; without them, one flat axis over the
 *  `sub_categories` registry (or none at all). */
export function wildcardAxes(inner: unknown): WildcardAxis[] {
  const groups = readGroups(inner, "tag_groups");
  if (groups) return Object.entries(groups).map(([name, tags]) => ({ name, tags }));
  const flat = readStrings(inner, "sub_categories");
  return flat.length ? [{ name: "tag", tags: flat }] : [];
}

// ─────────── fixed values / combine ───────────

export interface FixedValue {
  name: string;
  value: string;
  negative: string;
}
export function fixedValues(inner: unknown): FixedValue[] {
  // Engine shape is `values: [{id, name, value}]`; `entries/variable_name`
  // was a stale community guess kept only for old published data.
  const rows = readArray(inner, "values").length ? readArray(inner, "values") : readArray(inner, "entries");
  return rows.map((r) => ({
    name: readString(r, "name") ?? readString(r, "variable_name") ?? "",
    value: readString(r, "value") ?? "",
    negative: readString(r, "negative") ?? "",
  }));
}

// ─────────── derivation ───────────

export type ActionOp = "set" | "append" | "prepend" | "neg_add" | "neg_replace" | "other";
export interface DerivationAction {
  target: string;
  op: ActionOp;
  /** Raw mode string, shown when the op is unknown. */
  mode: string;
  value: string;
}
export interface CondTest {
  kind: "test";
  var: string;
  op: string;
  value: string | null;
}
export interface CondGroup {
  kind: "group";
  match: "all" | "any";
  conditions: Condition[];
}
export type Condition = CondTest | CondGroup;
export interface DerivationBranch {
  condition: Condition | null;
  actions: DerivationAction[];
}
export interface DerivationRule {
  branches: DerivationBranch[];
  fallback: DerivationAction[] | null;
}
/** Presence checks carry no value. */
const VALUELESS_OPS = new Set(["exists", "not_exists", "is_empty", "is_not_empty"]);

export function parseCondition(cond: unknown): Condition | null {
  if (!cond || typeof cond !== "object") return null;
  if ("conditions" in cond) {
    const kids = readArray(cond, "conditions")
      .map(parseCondition)
      .filter((c): c is Condition => c !== null);
    if (!kids.length) return null;
    return { kind: "group", match: readString(cond, "match") === "any" ? "any" : "all", conditions: kids };
  }
  const op = readString(cond, "op") ?? "?";
  const raw = (cond as Obj)["value"];
  return {
    kind: "test",
    var: readString(cond, "var") ?? "?",
    op,
    value: VALUELESS_OPS.has(op) ? null : typeof raw === "string" ? raw : JSON.stringify(raw ?? ""),
  };
}
function parseAction(action: unknown): DerivationAction {
  const mode = readString(action, "mode") ?? "?";
  const raw = (action as Obj | null)?.["value"];
  const op: ActionOp =
    mode === "replace"
      ? "set"
      : mode === "append"
        ? "append"
        : mode === "prepend"
          ? "prepend"
          : mode === "negative"
            ? "neg_add"
            : mode === "negative_replace"
              ? "neg_replace"
              : "other";
  return {
    target: readString(action, "target_var") ?? "?",
    op,
    mode,
    value: typeof raw === "string" ? raw : JSON.stringify(raw ?? ""),
  };
}
/** `action` then every `extra_actions` entry, in order (schema v8). Mirrors
 *  the engine's `clause_actions`; never read `.action` alone. */
export function clauseActions(clause: unknown): DerivationAction[] {
  const out: DerivationAction[] = [];
  const first = readObject(clause, "action");
  if (first) out.push(parseAction(first));
  for (const extra of readArray(clause, "extra_actions")) {
    if (extra && typeof extra === "object") out.push(parseAction(extra));
  }
  return out;
}
export function derivationRules(inner: unknown): DerivationRule[] {
  return readArray(inner, "rules").map((rule) => {
    const elseClause = readObject(rule, "else");
    return {
      branches: readArray(rule, "branches").map((b) => ({
        condition: parseCondition(readObject(b, "condition")),
        actions: clauseActions(b),
      })),
      fallback: elseClause ? clauseActions(elseClause) : null,
    };
  });
}
export function conditionVars(c: Condition | null, out: string[] = []): string[] {
  if (!c) return out;
  if (c.kind === "test") out.push(c.var);
  else for (const k of c.conditions) conditionVars(k, out);
  return out;
}
export function hasGroups(c: Condition | null): boolean {
  return c?.kind === "group";
}

// ─────────── variables in / out ───────────

export interface VarFlow {
  /** Variables this payload sets (value writes). */
  sets: string[];
  /** Variables it reads. */
  reads: string[];
  /** Variables whose negatives it touches. */
  negatives: string[];
}
function uniq(xs: string[]): string[] {
  return [...new Set(xs.filter(Boolean))];
}
/** What one module sets / reads. Bundles fold their children. */
export function varFlow(payload: unknown): VarFlow {
  const kind = payloadKind(payload);
  if (kind === "bundle") {
    const flows = readArray(payload, "children")
      .filter((c) => (c as Obj | null)?.["enabled"] !== false)
      .map(varFlow);
    return {
      sets: uniq(flows.flatMap((f) => f.sets)),
      reads: uniq(flows.flatMap((f) => f.reads)),
      negatives: uniq(flows.flatMap((f) => f.negatives)),
    };
  }
  const inner = innerOf(payload);
  const sets: string[] = [];
  const reads: string[] = [];
  const negatives: string[] = [];
  const readText = (t: string): void => {
    const s = scanText(t);
    reads.push(...s.vars, ...s.negVars);
  };
  if (kind === "wildcard") {
    const b = readString(inner, "var_binding");
    if (b) sets.push(b);
    for (const o of wildcardOptions(inner)) {
      readText(o.value);
      if (o.negative) {
        readText(o.negative);
        if (b) negatives.push(b);
      }
    }
  } else if (kind === "fixed_values") {
    for (const v of fixedValues(inner)) {
      sets.push(v.name);
      readText(v.value);
      if (v.negative) negatives.push(v.name);
    }
  } else if (kind === "combine") {
    const out = readString(inner, "output_var");
    if (out) sets.push(out);
    reads.push(...readStrings(inner, "input_vars"));
    readText(readString(inner, "template") ?? "");
    const neg = readString(inner, "negative") ?? "";
    if (neg) {
      readText(neg);
      if (out) negatives.push(out);
    }
  } else if (kind === "derivation") {
    for (const r of derivationRules(inner)) {
      const clauses = [...r.branches.map((b) => b.actions), ...(r.fallback ? [r.fallback] : [])];
      for (const b of r.branches) reads.push(...conditionVars(b.condition));
      for (const a of clauses.flat()) {
        readText(a.value);
        if (a.op === "neg_add" || a.op === "neg_replace") negatives.push(a.target);
        else sets.push(a.target);
      }
    }
  }
  return { sets: uniq(sets), reads: uniq(reads), negatives: uniq(negatives) };
}

// ─────────── feature pills ───────────

/** Short labels for the notable features a payload uses, shown as pills in
 *  the post header. Order is stable (most notable first). */
export function payloadFeatures(payload: unknown): string[] {
  const kind = payloadKind(payload);
  const found = new Set<string>();
  const addText = (t: string): void => {
    const s = scanText(t);
    if (s.refs) found.add("@refs");
    if (s.picks) found.add("picks");
    if (s.negVars.length) found.add("$var.neg");
  };
  const visit = (p: unknown): void => {
    const k = payloadKind(p);
    const inner = innerOf(p);
    if (k === "wildcard") {
      if (readGroups(inner, "tag_groups")) found.add("tag axes");
      for (const o of wildcardOptions(inner)) {
        addText(o.value);
        if (o.weight !== 1) found.add("weights");
        if (o.negative) {
          found.add("negatives");
          addText(o.negative);
        }
      }
    } else if (k === "fixed_values") {
      for (const v of fixedValues(inner)) {
        addText(v.value);
        if (v.negative) found.add("negatives");
      }
    } else if (k === "combine") {
      addText(readString(inner, "template") ?? "");
      const neg = readString(inner, "negative");
      if (neg) {
        found.add("negatives");
        addText(neg);
      }
    } else if (k === "derivation") {
      for (const r of derivationRules(inner)) {
        const clauses = [...r.branches.map((b) => b.actions), ...(r.fallback ? [r.fallback] : [])];
        if (r.branches.some((b) => hasGroups(b.condition))) found.add("AND / OR");
        if (clauses.some((c) => c.length > 1)) found.add("multi-action");
        for (const a of clauses.flat()) {
          addText(a.value);
          if (a.op === "neg_add" || a.op === "neg_replace") found.add("negatives");
        }
      }
    } else if (k === "constraint") {
      const matrix = readObject(inner, "matrix") ?? {};
      const onlyUsed =
        Object.values(matrix).some((row) =>
          Object.values((row as Obj) ?? {}).some((c) => readString(c, "mode") === "only"),
        ) || readArray(inner, "exceptions").some((e) => readString(e, "mode") === "only");
      if (onlyUsed) found.add("only rule");
      const sel = readObject(inner, "target_select");
      const mode = readString(sel, "mode");
      if (mode && mode !== "all") {
        const count = readNumber(sel, "count");
        found.add(`reach: ${mode}${count !== null ? ` ${count}` : ""}`);
      }
    } else if (k === "bundle") {
      for (const c of readArray(p, "children")) visit(c);
    }
  };
  visit(payload);
  const order = ["tag axes", "weights", "negatives", "$var.neg", "AND / OR", "multi-action", "only rule", "@refs", "picks"];
  const sorted = order.filter((f) => found.has(f));
  for (const f of found) if (!order.includes(f)) sorted.push(f);
  return kind ? sorted : [];
}
