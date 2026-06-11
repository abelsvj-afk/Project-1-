import "./instrument.js";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

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

const server = createServer(async (req, res) => {
  console.log(`${req.method} ${req.url}`);

  let filePath = join(__dirname, "dist", req.url === "/" ? "index.html" : req.url);
  const ext = extname(filePath).toLowerCase();
  let contentType = MIME_TYPES[ext] || "application/octet-stream";

  try {
    const content = await readFile(filePath);
    res.writeHead(200, { "Content-Type": contentType });
    res.end(content, "utf-8");
  } catch (error) {
    if (error.code === 'ENOENT') {
      // SPA fallback: serve index.html for unknown paths
      try {
        const content = await readFile(join(__dirname, "dist", "index.html"));
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(content, "utf-8");
      } catch (err) {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(500);
      res.end(`Server Error: ${error.code}`);
    }
  }
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running at http://0.0.0.0:${PORT}/`);
});
