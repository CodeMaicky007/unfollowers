/**
 * Radar core: compares complete scans of the user's OWN followers/following.
 * Pure logic, no DOM. The build inlines this factory into enhancements.js (see build.js),
 * and tests/radar.test.js requires it directly.
 *
 * Storage (any object with getItem/setItem/removeItem, i.e. localStorage):
 *   iu_radar-snapshot  { t, followers: [U], following: [U] }   U = { id, u, n, p, v, pr }
 *   iu_radar-history   [{ t, followers, following, mutual, lost: [L], gained: [L] }]   L = { id, u, n }
 */
module.exports = function createRadarCore() {
  var KEYS = { snapshot: 'iu_radar-snapshot', history: 'iu_radar-history' };
  var HISTORY_LIMIT = 200;

  function compactUser(r) {
    var id = r.pk_id != null ? r.pk_id : r.pk != null ? r.pk : r.id;
    return { id: String(id), u: String(r.username || ''), n: String(r.full_name || ''), p: String(r.profile_pic_url || ''), v: r.is_verified ? 1 : 0, pr: r.is_private ? 1 : 0 };
  }
  function brief(u) { return { id: u.id, u: u.u, n: u.n }; }
  function uniq(list) {
    var seen = {}, out = [];
    for (var i = 0; i < list.length; i++) { var u = list[i]; if (u && !seen[u.id]) { seen[u.id] = 1; out.push(u); } }
    return out;
  }
  function idSet(list) { var s = {}; for (var i = 0; i < list.length; i++) s[list[i].id] = 1; return s; }
  function minus(a, bSet) { return a.filter(function (u) { return !bSet[u.id]; }); }

  function readJson(store, key) { try { var v = store.getItem(key); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  function write(store, key, value) { try { store.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; } }

  function loadSnapshot(store) {
    var s = readJson(store, KEYS.snapshot);
    return s && Array.isArray(s.followers) && Array.isArray(s.following) ? s : null;
  }
  function loadHistory(store) {
    var h = readJson(store, KEYS.history);
    return Array.isArray(h) ? h : [];
  }
  function fansOf(followers, following) { return minus(followers, idSet(following)); }

  // Saves a complete scan and returns what changed since the previous complete scan.
  function commitScan(store, followers, following, now) {
    followers = uniq(followers); following = uniq(following);
    var prev = loadSnapshot(store);
    var curSet = idSet(followers);
    var lost = prev ? minus(uniq(prev.followers), curSet) : [];
    var gained = prev ? minus(followers, idSet(prev.followers)) : [];
    var fans = fansOf(followers, following);
    var entry = {
      t: now, followers: followers.length, following: following.length,
      mutual: following.filter(function (u) { return curSet[u.id]; }).length,
      lost: lost.map(brief), gained: gained.map(brief)
    };

    // History first: it is small and is what the user cares about most.
    var history = loadHistory(store).concat([entry]).slice(-HISTORY_LIMIT);
    if (!write(store, KEYS.history, history)) write(store, KEYS.history, history.slice(-20));

    var saved = 'full';
    if (!write(store, KEYS.snapshot, { t: now, followers: followers, following: following })) {
      var noPic = function (u) { return { id: u.id, u: u.u, n: u.n, p: '', v: u.v, pr: u.pr }; };
      saved = 'nopics';
      if (!write(store, KEYS.snapshot, { t: now, followers: followers.map(noPic), following: following.map(noPic) })) {
        // A stale snapshot would report wrong changes next time, so drop it.
        saved = 'history';
        try { store.removeItem(KEYS.snapshot); } catch (e) {}
      }
    }
    return { first: !prev, lost: lost, gained: gained, fans: fans, entry: entry, saved: saved };
  }

  // Every lost / gained event across the history, newest first, each with its scan time.
  function eventLog(history, field) {
    var out = [];
    for (var i = history.length - 1; i >= 0; i--) {
      var e = history[i], list = e[field] || [];
      for (var j = 0; j < list.length; j++) out.push({ id: list[j].id, u: list[j].u, n: list[j].n, t: e.t });
    }
    return out;
  }
  function lostLog(history) { return eventLog(history, 'lost'); }
  function gainedLog(history) { return eventLog(history, 'gained'); }

  // Semicolon CSV with BOM so Excel (Spanish locale) opens it in columns with accents intact.
  function csvCell(v) {
    var s = v == null ? '' : String(v);
    if (/^[=+\-@]/.test(s)) s = "'" + s; // keep spreadsheets from running it as a formula
    return /[;"\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function toCsv(header, rows) {
    return '﻿' + [header].concat(rows).map(function (r) { return r.map(csvCell).join(';'); }).join('\r\n') + '\r\n';
  }

  return {
    KEYS: KEYS, HISTORY_LIMIT: HISTORY_LIMIT,
    compactUser: compactUser, commitScan: commitScan, loadSnapshot: loadSnapshot, loadHistory: loadHistory,
    fansOf: fansOf, lostLog: lostLog, gainedLog: gainedLog, toCsv: toCsv
  };
};
