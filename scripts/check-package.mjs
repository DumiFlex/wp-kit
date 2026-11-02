// Checks what `npm pack` would put in the published package: the files the
// apps import are there, and nothing that only belongs in the repository
// (tests, the site, scripts, local files, secrets) slipped in. The kit ships
// its source: no build step, so src/ is the package.
// Run: `pnpm check-package` (CI and the release job run it before staging).
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

/** Files the apps can't work without. */
export const REQUIRED = [
  "package.json",
  "README.md",
  "LICENSE",
  "src/Button.vue",
  "src/tokens.ts",
  "src/theme/tokens.css",
  "src/theme/palettes.css",
  "src/theme/looks.css",
  "src/button.css",
];

/** Paths that must never ship. */
const FORBIDDEN = [
  { pattern: /(^|\/)__tests__\//, why: "tests" },
  { pattern: /\.test\.ts$/, why: "a test" },
  { pattern: /^(site|scripts|docs|coverage|node_modules|\.github)\//, why: "repository-only folder" },
  { pattern: /(^|\/)\.env(\..*)?$/, why: "environment file" },
  { pattern: /(^|\/)\.npmrc$/, why: "npm settings, can hold a token" },
  { pattern: /\.(tgz|zip|pem|key|log)$/, why: "archive, key or log file" },
];

/** Upper bound on the unpacked size (sources, the theme and its fonts). */
export const MAX_UNPACKED_BYTES = 6 * 1024 * 1024;

export function checkPackage(files) {
  const problems = [];
  const paths = new Set(files.map((f) => f.path));
  for (const file of REQUIRED) if (!paths.has(file)) problems.push(`missing ${file}`);
  for (const file of files) {
    const hit = FORBIDDEN.find((rule) => rule.pattern.test(file.path));
    if (hit) problems.push(`${file.path} should not ship (${hit.why})`);
  }
  const total = files.reduce((sum, f) => sum + f.size, 0);
  if (total > MAX_UNPACKED_BYTES) problems.push(`unpacked size ${(total / 1024 / 1024).toFixed(1)} MB is over ${MAX_UNPACKED_BYTES / 1024 / 1024} MB`);
  return problems;
}

function main() {
  const cwd = fileURLToPath(new URL("..", import.meta.url));
  const out = execFileSync("npm", ["pack", "--dry-run", "--json"], { cwd, encoding: "utf8", shell: process.platform === "win32" });
  const [pack] = JSON.parse(out);
  if (!pack) throw new Error("npm pack printed nothing");
  const problems = checkPackage(pack.files);
  if (problems.length) {
    console.error(`${pack.name}@${pack.version} would ship wrong:\n  ${problems.join("\n  ")}`);
    process.exit(1);
  }
  const kb = (pack.files.reduce((s, f) => s + f.size, 0) / 1024).toFixed(0);
  console.log(`${pack.name}@${pack.version}: ${pack.files.length} files, ${kb} KB unpacked. OK.`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
