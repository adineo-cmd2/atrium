#!/usr/bin/env node
/* Zero-dependency static server for the assembled Atrium site.
 * It serves files from site/ only. There is no API and no proxy: each app
 * keeps its own backend on its own port.
 */

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const site = path.join(root, "site");
const port = Number(process.env.PORT || 4400);
const host = process.env.HOST || "localhost";

if (!fs.existsSync(path.join(site, "index.html"))) {
  console.error("[atrium] site/ is missing. Run `npm run build` first.");
  process.exit(1);
}

const build = JSON.parse(fs.readFileSync(path.join(site, "_portal", "build.json"), "utf8"));
const apps = build.apps;

const types = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".ico", "image/x-icon"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
  [".bin", "application/octet-stream"],
  [".txt", "text/plain; charset=utf-8"],
  [".xml", "application/xml; charset=utf-8"],
]);

const inside = (candidate) => {
  const relative = path.relative(site, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
};

const resolveFile = (urlPath) => {
  const clean = decodeURIComponent(urlPath.split("?")[0].split("#")[0]);
  const safePath = path.normalize(clean).replace(/^(\.\.[/\\])+/, "");
  let candidate = path.join(site, safePath);

  if (!inside(candidate)) return null;

  if (clean.endsWith("/")) {
    candidate = path.join(candidate, "index.html");
    return fs.existsSync(candidate) && fs.statSync(candidate).isFile() ? candidate : null;
  }

  if (fs.existsSync(candidate)) {
    const stat = fs.statSync(candidate);
    if (stat.isFile()) return candidate;
    if (stat.isDirectory()) {
      const index = path.join(candidate, "index.html");
      return fs.existsSync(index) ? index : null;
    }
  }

  const directoryIndex = path.join(candidate, "index.html");
  if (fs.existsSync(directoryIndex)) return directoryIndex;

  if (!path.extname(candidate)) {
    const html = `${candidate}.html`;
    if (fs.existsSync(html)) return html;
  }

  return null;
};

const notFound = (res) => {
  const rooms = apps
    .map(
      (app) =>
        `<li><a href="/${app.slug}/"><span style="background:${app.accent}"></span>${app.name}</a></li>`,
    )
    .join("");
  const body = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Not found — Atrium</title>
<style>
  body{margin:0;min-height:100vh;display:grid;place-items:center;background:#edf1ec;color:#14211e;font:17px/1.55 "Instrument Sans",system-ui,sans-serif}
  main{width:min(42rem,calc(100vw - 3rem));padding:2rem 0}
  p.k{color:#5b6b65;font-size:14px}
  h1{font-family:"Bricolage Grotesque",system-ui,sans-serif;font-size:clamp(2.5rem,7vw,4.5rem);line-height:.95;letter-spacing:-.04em;font-weight:500;margin:.4rem 0 1rem}
  a{color:inherit;text-underline-offset:3px}
  ul{list-style:none;margin:1.6rem 0 0;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(14rem,1fr));gap:.35rem 1.5rem;border-top:1px solid #c6d0c9;padding-top:1.2rem}
  li a{display:flex;align-items:center;gap:.6rem;text-decoration:none;padding:.35rem 0;font-size:14px}
  li span{width:3px;height:12px;border-radius:1px;flex:none}
  li a:hover{text-decoration:underline}
</style></head>
<body><main>
<p class="k">Atrium</p>
<h1>This page is off the map.</h1>
<p>The address does not belong to one of the ten rooms. Try the <a href="/">front door</a>, or pick a room:</p>
<ul>${rooms}</ul>
</main></body></html>`;
  res.writeHead(404, {
    "Content-Type": "text/html; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
  });
  res.end(body);
};

const server = http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" });
    res.end("Method not allowed");
    return;
  }

  const urlPath = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`).pathname;

  if (apps.some((app) => urlPath === `/${app.slug}`)) {
    res.writeHead(301, { Location: `${urlPath}/` });
    res.end();
    return;
  }

  const file = resolveFile(urlPath);
  if (!file) {
    notFound(res);
    return;
  }

  const extension = path.extname(file).toLowerCase();
  const contentType = types.get(extension) || "application/octet-stream";
  const stat = fs.statSync(file);
  const headers = {
    "Content-Type": contentType,
    "Content-Length": stat.size,
    "Cache-Control": extension === ".html" ? "no-store" : "public, max-age=3600",
    "X-Content-Type-Options": "nosniff",
  };

  res.writeHead(200, headers);
  if (req.method === "HEAD") {
    res.end();
    return;
  }

  fs.createReadStream(file)
    .on("error", () => {
      res.destroy();
    })
    .pipe(res);
});

server.listen(port, host, () => {
  console.log(`[atrium] serving site/ at http://${host}:${port}`);
  console.log("[atrium] /  front door");
  for (const app of apps) {
    console.log(`[atrium] /${app.slug}/  ${app.name}  (API ${app.port})`);
  }
});
