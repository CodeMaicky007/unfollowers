#!/usr/bin/env node
/**
 * Builds dist/instagram-unfollowers.js from:
 *   src/base/app.bundle.js          original minified app (never edit by hand)
 *   src/styles/theme.css            full stylesheet (replaces the bundle's CSS)
 *   src/patches/ui-patches.js       text patches for markup / behaviour
 *   src/patches/unfollow-verified.js verified unfollow function (inlined)
 *   src/patches/enhancements.js     UI features, inlined as the global IUE
 *
 * Usage: node scripts/build.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const p = (...x) => path.join(ROOT, ...x);

let out = fs.readFileSync(p('src/base/app.bundle.js'), 'utf8');

// ---------- 1. Stylesheet ----------
function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Prefix every ".iu" selector with "html " so it wins over Instagram's own CSS.
    .replace(/(^|[,}{])(\s*)\.iu\b/g, '$1$2html .iu')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{};,])\s*/g, '$1')
    .trim();
}
const css = minifyCss(fs.readFileSync(p('src/styles/theme.css'), 'utf8'));
const CSS_START = "o.push([e.id,'";
const CSS_END = "',\"\"]);const l=o}";
const s = out.indexOf(CSS_START);
const e = out.indexOf(CSS_END, s);
if (s < 0 || e < 0) throw new Error('Could not find the CSS module in the base bundle');
out = out.slice(0, s) + 'o.push([e.id,' + JSON.stringify(css) + ',""]);const l=o}' + out.slice(e + CSS_END.length);
console.log('ok   stylesheet (' + css.length + ' chars)');

// ---------- 2. Patches ----------
function moduleSource(file) {
  const src = fs.readFileSync(p(file), 'utf8');
  return src.slice(src.indexOf('module.exports = ') + 'module.exports = '.length).trim().replace(/;$/, '');
}
function apply({ label, from, to }) {
  const count = out.split(from).length - 1;
  if (count === 0) throw new Error('Patch not applied (text not found): ' + label);
  if (count > 1) throw new Error('Patch ambiguous (' + count + ' matches): ' + label);
  out = out.split(from).join(to);
  console.log('ok   ' + label);
}
// Enhancements module, available to every bundle module as the variable IUE.
apply({
  label: 'Enhancements module (IUE)',
  from: '(()=>{"use strict";',
  to: '(()=>{"use strict";var IUE=(' + moduleSource('src/patches/enhancements.js') + ')();\n',
});
require(p('src/patches/ui-patches.js')).forEach(apply);

// ---------- 3. Verified unfollow ----------
const helperFile = fs.readFileSync(p('src/patches/unfollow-verified.js'), 'utf8');
const helperSrc = helperFile
  .slice(helperFile.indexOf('module.exports = ') + 'module.exports = '.length)
  .trim()
  .replace(/;$/, '')
  .replace(/\n\s*/g, '');
apply({
  label: 'Verified unfollow: define helper',
  from: 't.unfollowUserUrlGenerator=function(e){return"https://www.instagram.com/web/friendships/".concat(e,"/unfollow/")},',
  to: 't.unfollowUserUrlGenerator=function(e){return"https://www.instagram.com/web/friendships/".concat(e,"/unfollow/")},t.iuUnfollowVerified=' + helperSrc + ',',
});
apply({
  label: 'Verified unfollow: use helper',
  from: 'fetch((0,b.unfollowUserUrlGenerator)(i.id),{headers:{"content-type":"application/x-www-form-urlencoded","x-csrftoken":e,"x-ig-app-id":_.INSTAGRAM_WEB_APP_ID,"x-asbd-id":_.INSTAGRAM_ASBD_ID,"x-requested-with":"XMLHttpRequest"},method:"POST",credentials:"same-origin"})',
  to: '(0,b.iuUnfollowVerified)(i.id,e)',
});

// ---------- 4. Output ----------
fs.mkdirSync(p('dist'), { recursive: true });
fs.writeFileSync(p('dist/instagram-unfollowers.js'), out);
console.log('\nBuilt dist/instagram-unfollowers.js (' + (out.length / 1024).toFixed(1) + ' KB)');

// ---------- 5. Mobile: userscript + bookmarklet ----------
const pkg = require(p('package.json'));
const launcher = fs.readFileSync(p('src/mobile/launcher.js'), 'utf8')
  .replace('/*__APP__*/', () => out);
const userscript = `// ==UserScript==
// @name         Unfollowers
// @namespace    https://github.com/davidarroyo1234/InstagramUnfollowers
// @version      ${pkg.version}
// @description  Descubre quién no te sigue en Instagram y deja de seguir solo a quien tú elijas. Añade un botón "Unfollowers" en instagram.com.
// @match        https://www.instagram.com/*
// @grant        none
// @run-at       document-idle
// @noframes
// ==/UserScript==

${launcher}
`;
fs.writeFileSync(p('dist/instagram-unfollowers.user.js'), userscript);
console.log('Built dist/instagram-unfollowers.user.js (' + (userscript.length / 1024).toFixed(1) + ' KB)');

// Bookmarklet: runs the app directly (no launcher button).
// Minimal escaping keeps it much smaller than encodeURIComponent: the browser decodes %XX once.
const bookmarklet = 'javascript:' + ('(function(){' + out + '\n})();void 0')
  .replace(/%/g, '%25').replace(/\r?\n/g, '%0A').replace(/#/g, '%23');
fs.writeFileSync(p('dist/bookmarklet.txt'), bookmarklet);
console.log('Built dist/bookmarklet.txt (' + (bookmarklet.length / 1024).toFixed(1) + ' KB)');
