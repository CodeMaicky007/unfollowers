#!/usr/bin/env node
/**
 * Serves the built script on http://localhost:8765 so you can see the UI without Instagram.
 * On localhost the app runs in DEMO mode with sample accounts and never calls Instagram.
 *
 *   http://localhost:8765/                 start screen
 *   http://localhost:8765/?preview=scanning results screen with demo data
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 8765;
const DIST = path.join(__dirname, '..', 'dist', 'instagram-unfollowers.js');

const page = `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Preview</title></head>
<body><script src="/app.js"></script></body></html>`;

http.createServer((req, res) => {
  if (req.url.startsWith('/app.js')) {
    if (!fs.existsSync(DIST)) {
      res.writeHead(500, { 'content-type': 'text/plain' });
      return res.end('dist/instagram-unfollowers.js not found. Run: npm run build');
    }
    res.writeHead(200, { 'content-type': 'application/javascript; charset=utf-8', 'cache-control': 'no-store' });
    return res.end(fs.readFileSync(DIST));
  }
  if (req.url === '/' || req.url.startsWith('/?')) {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    return res.end(page);
  }
  res.writeHead(404);
  res.end();
}).listen(PORT, () => {
  console.log(`Preview: http://localhost:${PORT}/`);
  console.log(`Results: http://localhost:${PORT}/?preview=scanning`);
});
