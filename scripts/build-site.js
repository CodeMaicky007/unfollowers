#!/usr/bin/env node
/**
 * Builds the landing page into deploy/ so it can be published as a static site (Vercel, Netlify, GitHub Pages…).
 *   - wraps site/index.html in a full HTML document (the file itself has no <html>/<head>)
 *   - copies site/img/ and the built script dist/instagram-unfollowers.js
 *   - writes vercel.json with cache headers
 *
 * Usage: node scripts/build-site.js   (run `npm run build` first, or use `npm run site`)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = path.join(ROOT, 'site');
const OUT = path.join(ROOT, 'deploy');
const DIST = path.join(ROOT, 'dist', 'instagram-unfollowers.js');

if (!fs.existsSync(DIST)) {
  console.error('dist/instagram-unfollowers.js not found. Run: npm run build');
  process.exit(1);
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'img'), { recursive: true });

let body = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8');
// Move the page's own <title>, <meta> and <link> tags (top of the file) into <head>.
const headTags = [];
body = body.replace(/^\s*(<(title|meta|link)\b[^>]*>(?:[^<]*<\/title>)?\s*)+/, (m) => { headTags.push(m.trim()); return ''; });
const description = 'Descubre quién no te sigue en Instagram y deja de seguir solo a quien tú elijas. Gratis, sin contraseña y desde tu navegador.';
const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="${description}">
<meta name="theme-color" content="#0b2bff">
<meta property="og:title" content="Unfollowers">
<meta property="og:description" content="${description}">
<meta property="og:type" content="website">
<meta property="og:image" content="img/resumen.webp">
${headTags.join('\n')}
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='18' fill='%230b2bff'/%3E%3Ccircle cx='32' cy='32' r='14' fill='%23d6ff1a'/%3E%3C/svg%3E">
</head>
<body>
${body}
</body>
</html>
`;
fs.writeFileSync(path.join(OUT, 'index.html'), html);

for (const f of fs.readdirSync(path.join(SITE, 'img'))) {
  fs.copyFileSync(path.join(SITE, 'img', f), path.join(OUT, 'img', f));
}
fs.copyFileSync(DIST, path.join(OUT, 'instagram-unfollowers.js'));
// Mobile: userscript + bookmarklet, and the installable-app files
for (const f of ['instagram-unfollowers.user.js', 'bookmarklet.txt']) {
  fs.copyFileSync(path.join(ROOT, 'dist', f), path.join(OUT, f));
}
for (const f of ['manifest.webmanifest', 'sw.js']) {
  fs.copyFileSync(path.join(SITE, f), path.join(OUT, f));
}

fs.writeFileSync(path.join(OUT, 'vercel.json'), JSON.stringify({
  cleanUrls: true,
  headers: [
    { source: '/img/(.*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
    { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }] },
    { source: '/manifest.webmanifest', headers: [{ key: 'Content-Type', value: 'application/manifest+json' }] },
    { source: '/instagram-unfollowers.user.js', headers: [
      { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
      { key: 'Content-Type', value: 'text/javascript; charset=utf-8' },
    ] },
    { source: '/bookmarklet.txt', headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }] },
    { source: '/instagram-unfollowers.js', headers: [
      { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
      { key: 'Content-Type', value: 'text/plain; charset=utf-8' },
    ] },
  ],
}, null, 2) + '\n');

const size = (p) => (fs.statSync(p).size / 1024).toFixed(0) + ' KB';
console.log('Built deploy/');
for (const f of ['index.html', 'instagram-unfollowers.js', 'instagram-unfollowers.user.js', 'bookmarklet.txt', 'manifest.webmanifest', 'sw.js', 'vercel.json', 'img/peeps.webp']) {
  console.log('  ' + f.padEnd(28) + size(path.join(OUT, f)));
}
