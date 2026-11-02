/**
 * `virtual:kit-api`: the props, events, slots and exposed members of every
 * `src/*.vue`, read from the components' own types by vue-component-meta (the
 * same language core as vue-tsc), so the site's API tables can't drift from
 * the code. Built once per process (about 5 s for the whole kit) and again in
 * dev when a component changes. Used by the site build and by Vitest.
 */
import { readdirSync } from "node:fs";
import { join, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createChecker, type ComponentMeta } from "vue-component-meta";
import type { Plugin } from "vite";
import type { KitApi, KitApiTable } from "./src/kit-api-types";

const ID = "virtual:kit-api";
const RESOLVED = `\0${ID}`;
// No trailing slash: the checker matches files by exact path, and "//src" is not one.
const ROOT = fileURLToPath(new URL("..", import.meta.url)).replace(/[\\/]$/, "");

/** "boolean | undefined" → "boolean": every optional prop may be undefined, so it says nothing. */
function cleanType(t: string): string {
  return t.replace(/\s*\|\s*undefined$/, "").replace(/^undefined\s*\|\s*/, "");
}

function table(meta: ComponentMeta): KitApiTable {
  const props = meta.props.filter((p) => !p.global);
  const propNames = new Set(props.map((p) => p.name));
  return {
    props: props.map((p) => ({
      name: p.name,
      type: cleanType(p.type),
      required: p.required,
      // withDefaults writes `undefined` for "no default"; that is not one.
      ...(p.default !== undefined && p.default !== "undefined" ? { default: p.default } : {}),
      description: p.description,
    })),
    events: meta.events.map((e) => ({ name: e.name, type: e.type, description: e.description })),
    slots: meta.slots.map((s) => ({ name: s.name, type: s.type, description: s.description })),
    // vue-component-meta lists props and their on* handlers as exposed too; keep defineExpose's own.
    exposed: meta.exposed
      .filter((x) => !x.name.startsWith("$") && !propNames.has(x.name) && !/^on[A-Z]/.test(x.name))
      .map((x) => ({ name: x.name, type: x.type, description: x.description })),
  };
}

export function buildKitApi(root = ROOT): KitApi {
  const checker = createChecker(join(root, "tsconfig.json"), { schema: false, forceUseTs: true, printer: { newLine: 1 } });
  const out: KitApi = {};
  for (const f of readdirSync(join(root, "src")).filter((x) => x.endsWith(".vue")).sort()) {
    out[`src/${f}`] = table(checker.getComponentMeta(join(root, "src", f)));
  }
  return out;
}

export function kitApi(): Plugin {
  let cached: string | null = null;
  return {
    name: "wp-kit-api",
    resolveId: (id) => (id === ID ? RESOLVED : null),
    load(id) {
      if (id !== RESOLVED) return null;
      cached ??= `export default ${JSON.stringify(buildKitApi())};`;
      return cached;
    },
    handleHotUpdate({ file, server }) {
      if (!file.startsWith(join(ROOT, "src") + sep) && !file.startsWith(`${ROOT}/src/`)) return;
      if (!file.endsWith(".vue")) return;
      cached = null;
      const mod = server.moduleGraph.getModuleById(RESOLVED);
      if (mod) server.moduleGraph.invalidateModule(mod);
    },
  };
}
