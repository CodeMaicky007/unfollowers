/**
 * Tests for src/patches/unfollow-verified.js against simulated Instagram responses.
 * `decide` reproduces the app's own success/block logic so we test the real end result.
 */
const test = require('node:test');
const assert = require('node:assert');
const helper = require('../src/patches/unfollow-verified.js');
global.setTimeout = (f) => f(); // instant waits
console.info = () => {};

function res(status, body, opts = {}) {
  return { ok: status >= 200 && status < 300, status, json: async () => { if (body === undefined) throw new Error('not json'); return body; }, ...opts };
}
// original decision logic copied from the bundle
async function decide(s) {
  const d = await s.json().catch(() => null);
  const p = 429 === s.status || 400 === s.status || 'fail' === d?.status || true === d?.spam || /feedback_required|checkpoint|action_blocked|block/i.test(d?.message ?? '');
  const h = s.ok && 'fail' !== d?.status && !p;
  return { success: h, blockStop: p };
}
const scenarios = {
  'legacy ok + verified unfollowed':       { legacy: res(200, { status: 'ok' }), show: [res(200, { following: false })], expect: [true, false], posts: 1 },
  'legacy 200 HTML (login page)':          { legacy: res(200, undefined), show: [res(200, { following: true }), res(200, { following: false })], v1: res(200, { status: 'ok', friendship_status: { following: false } }), expect: [true, false], posts: 2 },
  'legacy redirect (manual)':              { legacy: res(0, undefined, { type: 'opaqueredirect' }), show: [res(200, { following: true }), res(200, { following: true })], v1: res(200, { status: 'ok' }), expect: [false, false], posts: 2 },
  'legacy ok but still following, v1 ok':  { legacy: res(200, { status: 'ok' }), show: [res(200, { following: true }), res(200, { following: false })], v1: res(200, { status: 'ok' }), expect: [true, false], posts: 2 },
  'rate limited 429':                      { legacy: res(429, { message: 'Please wait a few minutes' }), show: [], expect: [false, true], posts: 1 },
  'feedback_required':                     { legacy: res(200, { status: 'fail', message: 'feedback_required', spam: true }), show: [], expect: [false, true], posts: 1 },
  'show unavailable, legacy clean ok':     { legacy: res(200, { status: 'ok' }), show: [res(500, undefined)], expect: [true, false], posts: 1 },
  'show unavailable, legacy junk, v1 junk':{ legacy: res(200, undefined), show: [res(500, undefined), res(500, undefined)], v1: res(500, undefined), expect: [false, false], posts: 2 },
  'network error on show':                 { legacy: res(200, { status: 'ok' }), show: ['throw'], expect: [true, false], posts: 1 },
};
for (const [name, sc] of Object.entries(scenarios)) {
  test(name, async () => {
    let posts = 0; const shows = [...sc.show];
    global.fetch = async (url, o) => {
      if (url.includes('/friendships/show/')) { const r = shows.shift(); if (r === 'throw' || !r) throw new Error('net'); return r; }
      posts++;
      assert.strictEqual(o.method, 'POST');
      assert.strictEqual(o.redirect, 'manual', 'must not follow redirects');
      return url.includes('/web/friendships/') ? sc.legacy : sc.v1;
    };
    const r = await decide(await helper('123', 'tok'));
    assert.deepStrictEqual([r.success, r.blockStop], sc.expect);
    assert.strictEqual(posts, sc.posts, 'number of unfollow requests');
  });
}
