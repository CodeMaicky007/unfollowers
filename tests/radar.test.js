/**
 * Tests for src/patches/radar.js: snapshot diffing, history, storage fallback and CSV.
 */
const test = require('node:test');
const assert = require('node:assert');
const R = require('../src/patches/radar.js')();

// In-memory localStorage; throws like a full browser storage when a value exceeds `quota` chars.
function store(quota = Infinity) {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { if (String(v).length > quota) { const e = new Error('full'); e.name = 'QuotaExceededError'; throw e; } m.set(k, String(v)); },
    removeItem: (k) => m.delete(k),
    raw: m,
  };
}
const raw = (id, username, extra = {}) => ({ pk: id, username, full_name: username.toUpperCase(), profile_pic_url: 'https://cdn/' + username + '.jpg', is_verified: false, is_private: false, ...extra });
const C = (id, name) => R.compactUser(raw(id, name));
const ids = (list) => list.map((u) => u.id).sort();

test('compactUser keeps id, username, name, picture and flags', () => {
  assert.deepStrictEqual(R.compactUser(raw(42, 'ana', { is_verified: true })), { id: '42', u: 'ana', n: 'ANA', p: 'https://cdn/ana.jpg', v: 1, pr: 0 });
  assert.strictEqual(R.compactUser({ pk_id: '7', username: 'x' }).id, '7');
  assert.strictEqual(R.compactUser({ id: 9, username: 'y' }).n, '');
});

test('first scan: no lost/gained, fans computed, history starts', () => {
  const s = store();
  const r = R.commitScan(s, [C(1, 'a'), C(2, 'b'), C(3, 'c')], [C(1, 'a'), C(9, 'z')], 1000);
  assert.strictEqual(r.first, true);
  assert.deepStrictEqual([r.lost.length, r.gained.length], [0, 0]);
  assert.deepStrictEqual(ids(r.fans), ['2', '3']);
  const h = R.loadHistory(s);
  assert.strictEqual(h.length, 1);
  assert.deepStrictEqual({ t: h[0].t, followers: h[0].followers, following: h[0].following, mutual: h[0].mutual }, { t: 1000, followers: 3, following: 2, mutual: 1 });
  assert.strictEqual(R.loadSnapshot(s).followers.length, 3);
});

test('second scan: who left and who arrived', () => {
  const s = store();
  R.commitScan(s, [C(1, 'a'), C(2, 'b'), C(3, 'c')], [C(1, 'a')], 1000);
  const r = R.commitScan(s, [C(1, 'a'), C(3, 'c'), C(4, 'd')], [C(1, 'a'), C(4, 'd')], 2000);
  assert.strictEqual(r.first, false);
  assert.deepStrictEqual(ids(r.lost), ['2']);
  assert.deepStrictEqual(ids(r.gained), ['4']);
  assert.deepStrictEqual(ids(r.fans), ['3']);
  const h = R.loadHistory(s);
  assert.strictEqual(h.length, 2);
  assert.deepStrictEqual(h[1].lost, [{ id: '2', u: 'b', n: 'B' }]);
  assert.deepStrictEqual(h[1].gained, [{ id: '4', u: 'd', n: 'D' }]);
});

test('matching is by id, so a renamed account is not reported as lost', () => {
  const s = store();
  R.commitScan(s, [C(1, 'old_name')], [], 1);
  const r = R.commitScan(s, [C(1, 'new_name')], [], 2);
  assert.deepStrictEqual([r.lost.length, r.gained.length], [0, 0]);
});

test('duplicates inside one scan are counted once', () => {
  const r = R.commitScan(store(), [C(1, 'a'), C(1, 'a')], [C(1, 'a')], 1);
  assert.strictEqual(r.entry.followers, 1);
  assert.strictEqual(r.entry.mutual, 1);
});

test('history keeps only the latest HISTORY_LIMIT entries', () => {
  const s = store();
  for (let i = 0; i < R.HISTORY_LIMIT + 5; i++) R.commitScan(s, [C(1, 'a')], [], i);
  const h = R.loadHistory(s);
  assert.strictEqual(h.length, R.HISTORY_LIMIT);
  assert.strictEqual(h[0].t, 5);
});

test('storage full: snapshot is saved without pictures', () => {
  const followers = Array.from({ length: 50 }, (_, i) => C(i, 'user' + i));
  const withPics = JSON.stringify({ t: 1, followers, following: [] }).length;
  const s = store(withPics - 1); // pictures do not fit, the rest does
  const r = R.commitScan(s, followers, [], 1);
  assert.strictEqual(r.saved, 'nopics');
  const snap = R.loadSnapshot(s);
  assert.strictEqual(snap.followers.length, 50);
  assert.strictEqual(snap.followers[0].p, '');
  assert.strictEqual(R.loadHistory(s).length, 1);
});

test('storage very full: history is still saved, next scan is treated as first', () => {
  const s = store(400);
  const followers = Array.from({ length: 50 }, (_, i) => C(i, 'user' + i));
  const r = R.commitScan(s, followers, [], 1);
  assert.strictEqual(r.saved, 'history');
  assert.strictEqual(R.loadSnapshot(s), null);
  assert.strictEqual(R.loadHistory(s).length, 1);
});

test('corrupt storage is ignored', () => {
  const s = store();
  s.setItem(R.KEYS.snapshot, '{nope');
  s.setItem(R.KEYS.history, '"not an array"');
  assert.strictEqual(R.loadSnapshot(s), null);
  assert.deepStrictEqual(R.loadHistory(s), []);
  assert.strictEqual(R.commitScan(s, [C(1, 'a')], [], 1).first, true);
});

test('lostLog / gainedLog list every event with its date, newest first', () => {
  const s = store();
  R.commitScan(s, [C(1, 'a'), C(2, 'b'), C(3, 'c')], [], 1000);
  R.commitScan(s, [C(1, 'a'), C(3, 'c')], [], 2000);
  R.commitScan(s, [C(1, 'a'), C(5, 'e')], [], 3000);
  assert.deepStrictEqual(R.lostLog(R.loadHistory(s)).map((x) => [x.u, x.t]), [['c', 3000], ['b', 2000]]);
  assert.deepStrictEqual(R.gainedLog(R.loadHistory(s)).map((x) => [x.u, x.t]), [['e', 3000]]);
});

test('toCsv: BOM, semicolons, quoting and formula guard', () => {
  const csv = R.toCsv(['user', 'name'], [['ana', 'Ana; "la mejor"'], ['=cmd', '+1'], ['x', null]]);
  assert.ok(csv.startsWith('﻿'));
  const lines = csv.slice(1).split('\r\n');
  assert.deepStrictEqual(lines, ['user;name', 'ana;"Ana; ""la mejor"""', "'=cmd;'+1", 'x;', '']);
});
