import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

const root = resolve(process.cwd(), process.env.STATIC_DIR || "out");
const port = Number(process.env.PORT || 3100);

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

async function resolveFile(pathname) {
  const clean = pathname === "/" ? "/index.html" : pathname;
  const candidates = [
    join(root, clean),
    join(root, `${clean}.html`),
    join(root, clean, "index.html"),
  ];

  for (const candidate of candidates) {
    if (!candidate.startsWith(root)) continue;
    try {
      const info = await stat(candidate);
      if (info.isFile()) return candidate;
    } catch {
      continue;
    }
  }
  return null;
}

createServer(async (req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  const file = await resolveFile(pathname);

  if (!file) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("not found");
    return;
  }

  const body = await readFile(file);
  res.writeHead(200, {
    "content-type": types[extname(file)] || "application/octet-stream",
    "cache-control": "no-cache",
  });
  res.end(body);
}).listen(port, "127.0.0.1", () => {
  console.log(`static export served at http://127.0.0.1:${port}`);
});
