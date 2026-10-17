/**
 * Builds the project and checks the output is valid JavaScript with every patch in place.
 */
const test = require('node:test');
const assert = require('node:assert');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist', 'instagram-unfollowers.js');

test('build runs and produces valid JavaScript', () => {
  execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'build.js')], { stdio: 'pipe' });
  assert.ok(fs.existsSync(DIST));
  execFileSync(process.execPath, ['--check', DIST], { stdio: 'pipe' });
});

test('output contains every patch', () => {
  const out = fs.readFileSync(DIST, 'utf8');
  for (const marker of [
    'html .iu{--blue:',              // new stylesheet
    'className:"empty-state"',
    'className:"selected-counter"',
    'className:"sidebar-progress"',
    'type:"button",className:"btn btn-export"',
    't.iuUnfollowVerified=async function',
    '(0,b.iuUnfollowVerified)(i.id,e)',
    'var IUE=(function createEnhancements',
    'IUE.confirmUnfollow(n.selectedResults',
    'return IUE.sortUsers(i)',
    'className:"sort-select"',
    'className:"icon-button theme-toggle"',
    'IUE.autoSummary(t.unfollowLog',
    'html[data-iu-theme=\\"dark\\"]', // quotes are escaped inside the CSS string
    'function createRadarCore()',
    'IUE.radar.begin(),t=0,',
    '(0,b.addFollowerToIndex)(e,s),IUE.radar.addFollower(s)',
    'IUE.radar.addFollowing(s),(0,b.isUserInFollowerIndex)(e,s)',
    '((h=p)&&IUE.radar.commit(I),h||d.length>0)',
    'className:"icon-button radar-button"',
    '.iue-radar',
    'className:"glow-horizon"',
  ]) {
    assert.ok(out.includes(marker), 'missing: ' + marker);
  }
  assert.ok(!out.includes('fetch((0,b.unfollowUserUrlGenerator)'), 'old unverified unfollow call is still present');
  assert.ok(!out.includes('confirm((0,c.t)(g,"unfollowConfirm"))'), 'native confirm() still used before unfollowing');
  assert.ok(!out.includes('className:"signal-card'), 'old floating cards still in the launch screen');
});

test('mobile builds: userscript and bookmarklet are valid', () => {
  const us = fs.readFileSync(path.join(ROOT, 'dist', 'instagram-unfollowers.user.js'), 'utf8');
  assert.ok(us.startsWith('// ==UserScript=='), 'userscript header');
  assert.ok(us.includes('// @match        https://www.instagram.com/*'));
  assert.ok(us.includes('t.iuUnfollowVerified=async function'), 'app embedded in userscript');
  execFileSync(process.execPath, ['--check', path.join(ROOT, 'dist', 'instagram-unfollowers.user.js')], { stdio: 'pipe' });
  const bm = fs.readFileSync(path.join(ROOT, 'dist', 'bookmarklet.txt'), 'utf8');
  assert.ok(bm.startsWith('javascript:'));
  assert.ok(!/[\n#]/.test(bm), 'bookmarklet must be one line without raw #');
  new Function(decodeURIComponent(bm.slice('javascript:'.length))); // parses
});

