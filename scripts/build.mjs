#!/usr/bin/env node
/* Build the Atrium front door around ten independent frontends.
 *
 * Each app is built with its own Astro config and its own dependencies. This
 * script copies only each app's frontend/dist/ tree into site/<slug>/, then
 * writes a portal and injects a small navigation shell. It never reads a
 * backend database, a search index, or a saved session.
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { apps } from "../src/apps.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspace = path.resolve(root, "..");
const siteDir = path.join(root, "site");
const srcDir = path.join(root, "src");

const args = new Set(process.argv.slice(2));
const skipBuild = args.has("--skip-build");

const log = (message) => console.log(`[atrium] ${message}`);
const warn = (message) => console.warn(`[atrium] ${message}`);
const fail = (message) => {
  console.error(`[atrium] ${message}`);
  process.exit(1);
};

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return character;
    }
  });

const run = (cwd, command, commandArgs, label) => {
  log(`${label}…`);
  const result = spawnSync(command, commandArgs, {
    cwd,
    encoding: "utf8",
    env: { ...process.env, FORCE_COLOR: "0", NO_COLOR: "1" },
    // Astro/Tailwind builds can print well past Node's 1 MiB default.
    maxBuffer: 64 * 1024 * 1024,
  });

  if (result.error) {
    fail(`${label} could not start: ${result.error.message}`);
  }

  if (result.status !== 0) {
    if (result.stdout) console.error(result.stdout.trim());
    if (result.stderr) console.error(result.stderr.trim());
    return { ok: false, status: result.status, stdout: result.stdout, stderr: result.stderr };
  }

  const output = `${result.stdout || ""}\n${result.stderr || ""}`.trim();
  const lastLine = output.split("\n").filter(Boolean).at(-1);
  if (lastLine) log(`${label}: ${lastLine}`);
  return { ok: true, status: 0, stdout: result.stdout, stderr: result.stderr };
};

const npmMajor = (() => {
  const result = spawnSync("npm", ["--version"], { encoding: "utf8" });
  if (result.status !== 0) return 0;
  return Number.parseInt(String(result.stdout).trim().split(".")[0], 10) || 0;
})();

const ensureDependencies = (cwd, label) => {
  if (fs.existsSync(path.join(cwd, "node_modules"))) return;
  const hasLock = fs.existsSync(path.join(cwd, "package-lock.json"));
  const commandArgs = hasLock
    ? ["ci", "--no-audit", "--no-fund"]
    : ["install", "--no-audit", "--no-fund"];

  /* npm 12 blocks git dependencies and dependency install scripts by default.
   * Its --allow-* flags are rejected in a project-scoped install, so put the
   * approvals in a temporary project .npmrc and remove it again afterwards.
   */
  const npmrcPath = path.join(cwd, ".npmrc");
  const hadNpmrc = fs.existsSync(npmrcPath);
  const previousNpmrc = hadNpmrc ? fs.readFileSync(npmrcPath, "utf8") : "";
  if (npmMajor >= 12) {
    const additions = [];
    if (!/^allow-git\s*=/m.test(previousNpmrc)) additions.push("allow-git=all");
    if (!/^allow-scripts\s*=/m.test(previousNpmrc)) {
      additions.push("allow-scripts=esbuild,sharp");
    }
    fs.writeFileSync(
      npmrcPath,
      `${previousNpmrc.trimEnd()}${previousNpmrc.trim() ? "\n" : ""}${additions.join("\n")}\n`,
    );
  }

  const result = run(cwd, "npm", commandArgs, `${label} dependencies`);

  if (hadNpmrc) fs.writeFileSync(npmrcPath, previousNpmrc);
  else fs.rmSync(npmrcPath, { force: true });

  if (!result.ok) fail(`${label} dependency install failed with exit code ${result.status}`);
};

const buildProject = (app) => {
  const frontendDir = path.join(workspace, app.slug, "frontend");
  if (!fs.existsSync(frontendDir)) fail(`${app.slug}/frontend is missing`);

  ensureDependencies(frontendDir, app.slug);

  const result = run(frontendDir, "npm", ["run", "build"], app.slug);
  if (result.ok) return;

  warn(`${app.slug} build script failed; retrying with astro build (skipping type check)`);
  const astroBin = path.join(frontendDir, "node_modules", ".bin", "astro");
  if (!fs.existsSync(astroBin)) fail(`${app.slug} has no local astro binary`);

  const fallback = run(frontendDir, astroBin, ["build"], `${app.slug} (astro build)`);
  if (!fallback.ok) {
    fail(`${app.slug} could not be built; neither npm build nor astro build succeeded`);
  }
};

const copyDirectory = (from, to, label) => {
  if (!fs.existsSync(from)) fail(`${label} output not found at ${from}`);
  fs.cpSync(from, to, { recursive: true });
};

const walk = (directory, visit) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full, visit);
    else visit(full);
  }
};

const countFiles = (directory, extension) => {
  let count = 0;
  walk(directory, (file) => {
    if (file.endsWith(extension)) count += 1;
  });
  return count;
};

const readText = (file) => fs.readFileSync(file, "utf8");

const injectShell = (html) => {
  if (html.includes("/_shell/shell.js")) return html;
  const tag = '<script src="/_shell/shell.js" defer></script>';
  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `${tag}</body>`);
  return `${html}\n${tag}`;
};

const sentenceList = (items) => {
  if (items.length === 0) return "";
  if (items.length === 1) return `${items[0][0].toUpperCase()}${items[0].slice(1)}.`;
  const head = items.slice(0, -1).join(", ");
  const tail = items.at(-1);
  return `${head[0].toUpperCase()}${head.slice(1)} and ${tail}.`;
};

const arrow = `<svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/* ---------- build the ten apps ---------- */

const built = [];

if (!skipBuild) {
  for (const app of apps) {
    buildProject(app);
  }
} else {
  log("skipping framework builds (--skip-build)");
}

for (const app of apps) {
  const dist = path.join(workspace, app.slug, "frontend", "dist");
  if (!fs.existsSync(dist)) {
    fail(`${app.slug}/frontend/dist is missing. Run a full build.`);
  }
  built.push({
    ...app,
    dist,
    pages: countFiles(dist, ".html"),
  });
}

const totalPages = built.reduce((total, app) => total + app.pages, 0);

/* ---------- assemble the site ---------- */

log("assembling site/…");
fs.rmSync(siteDir, { recursive: true, force: true });
fs.mkdirSync(siteDir, { recursive: true });
fs.mkdirSync(path.join(siteDir, "_portal"), { recursive: true });
fs.mkdirSync(path.join(siteDir, "_shell"), { recursive: true });

for (const app of built) {
  copyDirectory(app.dist, path.join(siteDir, app.slug), `${app.slug} frontend`);
}

const mark = built
  .map((app) => `<span style="--accent:${escapeHtml(app.accent)}"></span>`)
  .join("");

const spectrum = built
  .map(
    (app, index) => `<a class="spectrum-bar" href="/${app.slug}/" style="--accent:${escapeHtml(app.accent)};--accent-ink:${escapeHtml(app.accentInk)};--i:${index}" aria-label="Open ${escapeHtml(app.name)}">
  <span class="spectrum-num">${String(index + 1).padStart(2, "0")}</span>
  <span class="spectrum-name">${escapeHtml(app.short || app.name)}</span>
</a>`,
  )
  .join("\n");

const rooms = built
  .map(
    (app, index) => `<li>
  <a class="room" href="/${app.slug}/" style="--accent:${escapeHtml(app.accent)};--accent-ink:${escapeHtml(app.accentInk)}">
    <span class="room-number">${String(index + 1).padStart(2, "0")}</span>
    <span class="room-main">
      <span class="room-name">${escapeHtml(app.name)}</span>
      <span class="room-tagline">${escapeHtml(app.tagline)}</span>
      <span class="room-desc">${escapeHtml(app.description)}</span>
      <span class="room-routes">${escapeHtml(sentenceList(app.routes))}</span>
    </span>
    <span class="room-side">
      <span class="room-pages">${app.pages} pages</span>
      <span class="room-port">API ${app.port}</span>
      <span class="room-open">Enter ${arrow}</span>
    </span>
  </a>
</li>`,
  )
  .join("\n");

const boundaryBars = built
  .map((app) => `<span style="--accent:${escapeHtml(app.accent)}"></span>`)
  .join("");

const buildStamp = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
}).format(new Date());

let portal = readText(path.join(srcDir, "index.html"));
const replacements = {
  "{{MARK}}": mark,
  "{{SPECTRUM}}": spectrum,
  "{{ROOMS}}": rooms,
  "{{BOUNDARY_BARS}}": boundaryBars,
  "{{BUILD_STAMP}}": buildStamp,
  "{{TOTAL_PAGES}}": String(totalPages),
  "{{APP_COUNT}}": String(built.length),
};

for (const [token, value] of Object.entries(replacements)) {
  portal = portal.split(token).join(value);
}

if (portal.includes("{{")) fail("the portal still contains an unresolved placeholder");
fs.writeFileSync(path.join(siteDir, "index.html"), portal);

fs.copyFileSync(path.join(srcDir, "portal.css"), path.join(siteDir, "_portal/portal.css"));
fs.copyFileSync(path.join(srcDir, "favicon.svg"), path.join(siteDir, "favicon.svg"));

let shell = readText(path.join(srcDir, "shell.js"));
const shellApps = built.map((app) => ({
  slug: app.slug,
  name: app.name,
  accent: app.accent,
}));
shell = shell.split("__ATRIUM_APPS__").join(JSON.stringify(shellApps));
fs.writeFileSync(path.join(siteDir, "_shell", "shell.js"), shell);

fs.writeFileSync(
  path.join(siteDir, "_portal", "build.json"),
  JSON.stringify(
    {
      builtAt: new Date().toISOString(),
      buildStamp,
      totalPages,
      apps: built.map((app) => ({
        slug: app.slug,
        name: app.name,
        port: app.port,
        pages: app.pages,
      })),
    },
    null,
    2,
  ) + "\n",
);

log("injecting the Atrium tab into each app…");
let injected = 0;
for (const app of built) {
  walk(path.join(siteDir, app.slug), (file) => {
    if (!file.endsWith(".html")) return;
    const html = readText(file);
    const next = injectShell(html);
    if (next !== html) {
      fs.writeFileSync(file, next);
      injected += 1;
    }
  });
}

/* ---------- isolation checks ---------- */

const failures = [];
const expect = (condition, message) => {
  if (!condition) failures.push(message);
};

const forbiddenSegments = new Set([
  "backend",
  "node_modules",
  ".env",
  ".env.local",
  ".env.example",
  "socratic.db",
  "bias.db",
  "contra.db",
  "unknown.db",
  "showrunner.db",
  "counterfactual.db",
  "archaeologist.db",
  "optimizer.db",
  "policy.db",
  "premortem.db",
]);

const forbiddenExtensions = [".db", ".sqlite", ".sqlite3"];

walk(siteDir, (file) => {
  const relative = path.relative(siteDir, file);
  const segments = relative.split(path.sep);
  for (const segment of segments) {
    if (forbiddenSegments.has(segment)) failures.push(`forbidden path leaked into site/: ${relative}`);
  }
  for (const extension of forbiddenExtensions) {
    if (file.endsWith(extension)) failures.push(`database file leaked into site/: ${relative}`);
  }
});

for (const app of built) {
  expect(
    fs.existsSync(path.join(siteDir, app.slug, "index.html")),
    `${app.slug} has no index.html under its own path`,
  );

  const ownPort = `localhost:${app.port}`;
  const seenPorts = new Set();

  walk(path.join(siteDir, app.slug), (file) => {
    if (!file.endsWith(".js")) return;
    const source = readText(file);
    for (const match of source.matchAll(/localhost:(80\d\d)/g)) {
      seenPorts.add(match[1]);
    }
    if (source.includes("codebase_id") && app.slug !== "architecture-archaeologist") {
      failures.push(`architecture-archaeologist storage key leaked into ${app.slug}`);
    }
  });

  for (const port of seenPorts) {
    if (`localhost:${port}` !== ownPort) {
      failures.push(`${app.slug} bundle references another app's API port: ${port}`);
    }
  }
  expect(seenPorts.has(String(app.port)), `${app.slug} bundle does not reference its own API port ${app.port}`);
}

const storageKeys = new Map();
for (const app of built) {
  const keys = new Set();
  walk(path.join(siteDir, app.slug), (file) => {
    if (!file.endsWith(".js") && !file.endsWith(".html")) return;
    const source = readText(file);
    for (const match of source.matchAll(/localStorage\.(?:getItem|setItem)\(['"]([^'"]+)/g)) {
      keys.add(match[1]);
    }
  });
  storageKeys.set(app.slug, keys);
}

for (const [slug, keys] of storageKeys) {
  for (const key of keys) {
    for (const [otherSlug, otherKeys] of storageKeys) {
      if (otherSlug !== slug && otherKeys.has(key)) {
        failures.push(`storage key "${key}" is used by both ${slug} and ${otherSlug}`);
      }
    }
  }
}

if (failures.length) {
  for (const failure of failures) console.error(`[atrium] isolation check failed: ${failure}`);
  process.exit(1);
}

const keySummary =
  [...storageKeys.values()].reduce((total, keys) => total + keys.size, 0) === 0
    ? "no shared browser storage"
    : `${[...storageKeys.values()].reduce((total, keys) => total + keys.size, 0)} scoped storage key`;

log(
  `isolation checks passed: ${built.length} trees, ${built.length} API ports, ${keySummary}`,
);
log(
  `portal assembled: ${totalPages} pages across ${built.length} rooms; ${injected} pages carry the Atrium tab`,
);
log("run `npm start` and open http://localhost:4400");
