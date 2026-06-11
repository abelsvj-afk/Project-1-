import "./instrument.js";
import { createServer } from "node:http";
import { readFile, readdir } from "node:fs/promises";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const DIST_DIR = join(__dirname, "dist");

const MIME_TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".wav": "audio/wav",
  ".mp4": "video/mp4",
  ".woff": "application/font-woff",
  ".ttf": "application/font-ttf",
  ".eot": "application/vnd.ms-fontobject",
  ".otf": "application/font-otf",
  ".wasm": "application/wasm",
};

async function listFiles(dir, prefix = "") {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      await listFiles(fullPath, join(prefix, entry.name));
    } else {
      console.log(`[FILE]: ${join(prefix, entry.name)}`);
    }
  }
}

console.log("Starting server...");
try {
  console.log("Listing dist directory contents:");
  await listFiles(DIST_DIR);
} catch (err) {
  console.error("Error listing dist directory:", err.message);
}

const server = createServer(async (req, res) => {
  const host = req.headers.host || "localhost";
  const url = new URL(req.url, `http://${host}`);
  let pathname = url.pathname;
  
  console.log(`[REQ]: ${req.method} ${pathname}`);

  if (pathname === "/") pathname = "/index.html";
  
  const filePath = join(DIST_DIR, pathname);
  const ext = extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  try {
    const content = await readFile(filePath);
    res.writeHead(200, { 
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable"
    });
    res.end(content, "utf-8");
  } catch (error) {
    if (error.code === 'ENOENT') {
      // If it's a request for an asset that's missing, return 404, don't fallback to index.html
      if (pathname.startsWith("/assets/")) {
        console.warn(`[404]: Asset not found: ${pathname}`);
        res.writeHead(404);
        res.end("Asset Not Found");
        return;
      }

      // SPA fallback: serve index.html for non-asset paths
      try {
        const content = await readFile(join(DIST_DIR, "index.html"));
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(content, "utf-8");
      } catch (err) {
        console.error(`[500]: Critical error serving index.html: ${err.message}`);
        res.writeHead(500);
        res.end("Internal Server Error");
      }
    } else {
      console.error(`[500]: Error reading ${filePath}: ${error.message}`);
      res.writeHead(500);
      res.end(`Server Error: ${error.code}`);
    }
  }
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running at http://0.0.0.0:${PORT}/`);
});
