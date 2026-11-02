// npm shows the package's README.md, which is for people installing the kit;
// the repository README is for working on it. The release job runs this just
// before it checks and stages the package: it puts docs/npm-readme.md in
// place as README.md and checks it reads right on npm.
// Run: `node scripts/npm-readme.mjs` (writes) or `--check` (only checks).
import { copyFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const SOURCE = `${root}docs/npm-readme.md`;

/** Problems that would show on the npm page. */
export function checkNpmReadme(text) {
  const problems = [];
  if (!text.includes("npm install @dumiflex/wp-kit")) problems.push("no install line");
  if (!text.includes("https://dumiflex.github.io/wp-kit/")) problems.push("no link to the live components");
  // npm doesn't serve the repository, so a relative link is a dead link there.
  for (const m of text.matchAll(/\]\(([^)]+)\)/g)) {
    const href = m[1] ?? "";
    if (!/^(https?:|mailto:|#)/.test(href)) problems.push(`relative link ${href}`);
  }
  return problems;
}

function main() {
  const text = readFileSync(SOURCE, "utf8");
  const problems = checkNpmReadme(text);
  if (problems.length) {
    console.error(`docs/npm-readme.md would read wrong on npm:\n  ${problems.join("\n  ")}`);
    process.exit(1);
  }
  if (process.argv.includes("--check")) {
    console.log("docs/npm-readme.md: OK.");
    return;
  }
  copyFileSync(SOURCE, `${root}README.md`);
  console.log("README.md is now the npm README (docs/npm-readme.md).");
}

if (import.meta.url === `file://${process.argv[1]}`) main();
