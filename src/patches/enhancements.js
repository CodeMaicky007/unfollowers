/**
 * UI enhancements. The build inlines this factory at the top of the bundle as:
 *   var IUE = (createEnhancements)();
 * so every module in the bundle can call IUE.* (see ui-patches.js).
 *
 * Self-contained: no imports, browser APIs only. Everything it draws lives in
 * elements with the `iue-` prefix, appended to <body> outside the Preact tree.
 *
 * Features:
 *   - confirmUnfollow()  confirmation modal with avatars, total and time estimate
 *   - autoSummary() / showSummary()  end-of-run summary card + downloadable PNG
 *   - sortUsers() / setSort()  sorting for the results list
 *   - shift+click range selection on result rows
 *   - keyboard shortcuts ( / ← → T ? Esc )
 *   - light / dark theme
 *   - tx()  ES/EN strings for texts that were hard-coded in English
 */
module.exports = function createEnhancements() {
  var doc = document;

  /* ---------------- storage + language ---------------- */
  function lsGet(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function lsJson(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function curLang(l) { if (l === 'es' || l === 'en') return l; var s = lsGet('iu_language', ''); return s === 'en' ? 'en' : 'es'; }

  var TX = {
    es: {
      theme: 'Cambiar tema claro/oscuro',
      sort: 'Ordenar', sort_az: 'A → Z', sort_za: 'Z → A', sort_recent: 'Seguidos recientemente', sort_oldest: 'Seguidos hace más tiempo',
      sort_verified: 'Verificados primero', sort_nopic: 'Sin foto primero', sort_private: 'Privadas primero',
      confirmTitle: '¿Dejar de seguir?', confirmLead: 'Vas a dejar de seguir a %s cuentas.', confirmOne: 'Vas a dejar de seguir a 1 cuenta.',
      estimate: 'Tiempo estimado', confirmGo: 'Sí, dejar de seguir', cancel: 'Cancelar', more: '+%s más',
      confirmNote: 'No cierres esta pestaña mientras trabaja. Si Instagram bloquea la acción, se detendrá solo.',
      summaryTitle: 'Resumen', done: 'Hecho', unfollowed: 'dejadas de seguir', failed: 'fallidas', of: 'de %s seleccionadas',
      rate: 'Éxito', duration: 'Duración', failedList: 'No se pudieron dejar de seguir', download: 'Descargar imagen', copyText: 'Copiar resumen',
      copied: '¡Copiado!', close: 'Cerrar', seeSummary: 'Ver resumen', stopped: 'Detenido antes de terminar',
      shareLine: 'He dejado de seguir a %s cuentas que no me seguían 🧹',
      help: 'Atajos de teclado', k_search: 'Buscar', k_pages: 'Página anterior / siguiente', k_theme: 'Tema claro / oscuro', k_help: 'Mostrar esta ayuda',
      k_esc: 'Cerrar ventana', k_shift: 'Seleccionar un rango de cuentas',
      filterReset: 'Cambiar los filtros quitará la selección actual. ¿Continuar?',
      onlyIg: 'Este script solo funciona en www.instagram.com',
      noWlExport: 'No hay usuarios en la lista blanca para exportar',
      wlReplaced: 'Lista blanca sustituida: %s usuarios', wlAdded: 'Añadidos %s usuarios nuevos',
      min: 'min', sec: 's', h: 'h'
    },
    en: {
      theme: 'Toggle light/dark theme',
      sort: 'Sort', sort_az: 'A → Z', sort_za: 'Z → A', sort_recent: 'Recently followed', sort_oldest: 'Followed longest ago',
      sort_verified: 'Verified first', sort_nopic: 'No picture first', sort_private: 'Private first',
      confirmTitle: 'Unfollow?', confirmLead: 'You are about to unfollow %s accounts.', confirmOne: 'You are about to unfollow 1 account.',
      estimate: 'Estimated time', confirmGo: 'Yes, unfollow', cancel: 'Cancel', more: '+%s more',
      confirmNote: 'Keep this tab open while it works. If Instagram blocks the action it will stop by itself.',
      summaryTitle: 'Summary', done: 'Done', unfollowed: 'unfollowed', failed: 'failed', of: 'of %s selected',
      rate: 'Success', duration: 'Duration', failedList: 'Could not unfollow', download: 'Download image', copyText: 'Copy summary',
      copied: 'Copied!', close: 'Close', seeSummary: 'See summary', stopped: 'Stopped before finishing',
      shareLine: 'I unfollowed %s accounts that did not follow me back 🧹',
      help: 'Keyboard shortcuts', k_search: 'Search', k_pages: 'Previous / next page', k_theme: 'Light / dark theme', k_help: 'Show this help',
      k_esc: 'Close window', k_shift: 'Select a range of accounts',
      filterReset: 'Changing filter options will clear selected users. Continue?',
      onlyIg: 'Can be used only on www.instagram.com',
      noWlExport: 'No users in whitelist to export',
      wlReplaced: 'Replaced whitelist with %s users', wlAdded: 'Added %s new users',
      min: 'min', sec: 's', h: 'h'
    }
  };
  function tx(l, k, a) { var d = TX[curLang(l)]; var s = d[k] != null ? d[k] : (TX.en[k] || k); return a == null ? s : String(s).replace('%s', a); }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmtDuration(ms, l) {
    var s = Math.max(0, Math.round(ms / 1000));
    if (s < 60) return s + ' ' + tx(l, 'sec');
    var m = Math.round(s / 60);
    if (m < 60) return m + ' ' + tx(l, 'min');
    return Math.floor(m / 60) + ' ' + tx(l, 'h') + ' ' + (m % 60) + ' ' + tx(l, 'min');
  }

  /* ---------------- theme ---------------- */
  function applyTheme(t) { doc.documentElement.setAttribute('data-iu-theme', t === 'dark' ? 'dark' : 'light'); }
  function toggleTheme() {
    var next = doc.documentElement.getAttribute('data-iu-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next); lsSet('iu_theme', next);
  }
  applyTheme(lsGet('iu_theme', 'light'));

  /* ---------------- sorting ---------------- */
  var SORTS = ['az', 'za', 'recent', 'oldest', 'verified', 'nopic', 'private'];
  var DEFAULT_PIC = /44884218_345707102882519_2446069589734326272_n|anonymous|default_profile/i;
  function getSort() { var s = lsGet('iu_sort', 'az'); return SORTS.indexOf(s) >= 0 ? s : 'az'; }
  function setSort(s) { if (SORTS.indexOf(s) >= 0) lsSet('iu_sort', s); }
  function byName(a, b) { return String(a.username).localeCompare(String(b.username)); }
  function flagFirst(f) { return function (a, b) { return (f(b) ? 1 : 0) - (f(a) ? 1 : 0) || byName(a, b); }; }
  function sortUsers(list) {
    var mode = getSort();
    if (mode === 'recent') return list;
    var out = list.slice();
    switch (mode) {
      case 'oldest': return out.reverse();
      case 'za': return out.sort(function (a, b) { return byName(b, a); });
      case 'verified': return out.sort(flagFirst(function (u) { return u.is_verified; }));
      case 'nopic': return out.sort(flagFirst(function (u) { return !u.profile_pic_url || DEFAULT_PIC.test(u.profile_pic_url); }));
      case 'private': return out.sort(flagFirst(function (u) { return u.is_private; }));
      default: return out.sort(byName);
    }
  }
  function sortOptions(l) { return SORTS.map(function (s) { return { value: s, label: tx(l, 'sort_' + s) }; }); }
  function showLetters() { var s = getSort(); return s === 'az' || s === 'za'; }

  /* ---------------- modal helper ---------------- */
  var openModal = null;
  function closeModal() { if (openModal) { openModal.remove(); openModal = null; } }
  function modal(html, cls) {
    closeModal();
    var root = doc.createElement('div');
    root.className = 'iue-root iue-backdrop';
    root.innerHTML = '<div class="iue-modal ' + (cls || '') + '" role="dialog" aria-modal="true">' + html + '</div>';
    root.addEventListener('mousedown', function (e) { if (e.target === root) closeModal(); });
    doc.body.appendChild(root);
    openModal = root;
    return root;
  }
  var FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23e8eaf1'/%3E%3Ccircle cx='32' cy='24' r='11' fill='%23b9bdcc'/%3E%3Cpath d='M10 60c2-14 12-20 22-20s20 6 22 20z' fill='%23b9bdcc'/%3E%3C/svg%3E";
  function wireAvatars(root) {
    root.querySelectorAll('img.iue-av').forEach(function (img) {
      img.addEventListener('error', function () { if (img.src !== FALLBACK) img.src = FALLBACK; });
    });
  }

  /* ---------------- confirmation ---------------- */
  var runStartedAt = 0;
  function estimateMs(n) {
    var t = lsJson('iu_timings', {}) || {};
    var between = typeof t.timeBetweenUnfollows === 'number' ? t.timeBetweenUnfollows : 4000;
    var longWait = typeof t.timeToWaitAfterFiveUnfollows === 'number' ? t.timeToWaitAfterFiveUnfollows : 300000;
    // per account: request + verification (~1.5 s) + random wait between `between` and 1.2 × `between`
    return n * (1500 + between * 1.1) + Math.floor(Math.max(0, n - 1) / 5) * longWait;
  }
  function confirmUnfollow(selected, l, proceed) {
    var n = selected.length;
    var shown = selected.slice(0, 18);
    var grid = shown.map(function (u) {
      return '<figure><img class="iue-av" alt="" referrerpolicy="no-referrer" src="' + esc(u.profile_pic_url || FALLBACK) + '"><figcaption>@' + esc(u.username) + '</figcaption></figure>';
    }).join('') + (n > shown.length ? '<figure class="iue-more"><span>' + esc(tx(l, 'more', n - shown.length)) + '</span></figure>' : '');
    var root = modal(
      '<h2>' + esc(tx(l, 'confirmTitle')) + '</h2>' +
      '<p class="iue-lead">' + esc(n === 1 ? tx(l, 'confirmOne') : tx(l, 'confirmLead', n)) + '</p>' +
      '<div class="iue-chips"><span>' + esc(tx(l, 'estimate')) + ': <b>~' + esc(fmtDuration(estimateMs(n), l)) + '</b></span></div>' +
      '<div class="iue-grid">' + grid + '</div>' +
      '<p class="iue-note">' + esc(tx(l, 'confirmNote')) + '</p>' +
      '<div class="iue-actions"><button type="button" data-a="cancel" class="iue-btn">' + esc(tx(l, 'cancel')) + '</button>' +
      '<button type="button" data-a="go" class="iue-btn iue-danger">' + esc(tx(l, 'confirmGo')) + ' (' + n + ')</button></div>',
      'iue-confirm');
    wireAvatars(root);
    root.querySelector('[data-a=cancel]').addEventListener('click', closeModal);
    root.querySelector('[data-a=go]').addEventListener('click', function () {
      closeModal();
      runStartedAt = Date.now();
      proceed();
    });
    root.querySelector('[data-a=cancel]').focus();
  }

  /* ---------------- summary ---------------- */
  var summarized = typeof WeakSet === 'function' ? new WeakSet() : { has: function () { return false; }, add: function () {} };
  function autoSummary(log, total, l) {
    if (log && total > 0 && log.length === total && !summarized.has(log)) {
      summarized.add(log);
      var end = Date.now();
      setTimeout(function () { showSummary(log, total, l, end); }, 700);
    }
    return null;
  }
  function stats(log, total, end) {
    var ok = log.filter(function (x) { return x.unfollowedSuccessfully; });
    var bad = log.filter(function (x) { return !x.unfollowedSuccessfully; });
    return {
      ok: ok.length, bad: bad.length, total: total, finished: log.length === total,
      rate: log.length ? Math.round(ok.length / log.length * 100) : 0,
      ms: runStartedAt ? (end || Date.now()) - runStartedAt : 0,
      okUsers: ok.map(function (x) { return x.user; }), badUsers: bad.map(function (x) { return x.user; })
    };
  }
  function showSummary(log, total, l, end) {
    var s = stats(log || [], total, end);
    var faces = s.okUsers.slice(0, 7).map(function (u) {
      return '<img class="iue-av" alt="" referrerpolicy="no-referrer" src="' + esc(u.profile_pic_url || FALLBACK) + '">';
    }).join('');
    var failed = s.badUsers.length
      ? '<details class="iue-failed"><summary>' + esc(tx(l, 'failedList')) + ' (' + s.badUsers.length + ')</summary><p>' +
        s.badUsers.map(function (u) { return '@' + esc(u.username); }).join(', ') + '</p></details>'
      : '';
    var root = modal(
      '<div class="iue-card">' +
        '<span class="iue-tag">' + esc(s.finished ? tx(l, 'done') : tx(l, 'stopped')) + '</span>' +
        '<div class="iue-big">' + s.ok + '</div>' +
        '<div class="iue-big-label">' + esc(tx(l, 'unfollowed')) + '</div>' +
        '<div class="iue-faces">' + faces + '</div>' +
        '<div class="iue-stats">' +
          '<div><b>' + s.bad + '</b><span>' + esc(tx(l, 'failed')) + '</span></div>' +
          '<div><b>' + s.rate + '%</b><span>' + esc(tx(l, 'rate')) + '</span></div>' +
          '<div><b>' + (s.ms ? esc(fmtDuration(s.ms, l)) : '—') + '</b><span>' + esc(tx(l, 'duration')) + '</span></div>' +
        '</div>' +
        '<p class="iue-of">' + esc(tx(l, 'of', s.total)) + '</p>' +
      '</div>' + failed +
      '<div class="iue-actions"><button type="button" data-a="copy" class="iue-btn">' + esc(tx(l, 'copyText')) + '</button>' +
      '<button type="button" data-a="png" class="iue-btn">' + esc(tx(l, 'download')) + '</button>' +
      '<button type="button" data-a="close" class="iue-btn iue-primary">' + esc(tx(l, 'close')) + '</button></div>',
      'iue-summary');
    wireAvatars(root);
    root.querySelector('[data-a=close]').addEventListener('click', closeModal);
    root.querySelector('[data-a=copy]').addEventListener('click', function (e) {
      var text = tx(l, 'shareLine', s.ok) + '\n' + s.rate + '% · ' + (s.ms ? fmtDuration(s.ms, l) : '');
      var btn = e.currentTarget;
      var done = function () { btn.textContent = tx(l, 'copied'); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () {});
    });
    root.querySelector('[data-a=png]').addEventListener('click', function () { downloadPng(s, l); });
  }
  function downloadPng(s, l) {
    var W = 1080, H = 1350, c = doc.createElement('canvas');
    c.width = W; c.height = H;
    var g = c.getContext('2d');
    var DISPLAY = '"Archivo Black","Arial Black",Impact,sans-serif', BODY = 'system-ui,"Segoe UI",Arial,sans-serif';
    g.fillStyle = '#0b2bff'; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 2;
    for (var x = 0; x <= W; x += 90) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
    for (var y = 0; y <= H; y += 90) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    function pill(x, y, text, bg, fg) {
      g.font = '900 34px ' + DISPLAY; var w = g.measureText(text).width + 56;
      g.fillStyle = bg; g.beginPath(); g.roundRect ? g.roundRect(x, y, w, 70, 35) : g.rect(x, y, w, 70); g.fill();
      g.fillStyle = fg; g.textBaseline = 'middle'; g.fillText(text, x + 28, y + 37); return w;
    }
    var w1 = pill(90, 90, 'INSTAGRAM', '#0a0a0f', '#ffffff'); pill(90 + w1 + 12, 90, 'UNFOLLOWERS', '#d6ff1a', '#0a0a0f');
    g.textBaseline = 'alphabetic';
    g.font = '900 360px ' + DISPLAY; g.fillStyle = '#001594'; g.fillText(String(s.ok), 104, 640);
    g.fillStyle = '#ffffff'; g.fillText(String(s.ok), 90, 626);
    g.font = '900 72px ' + DISPLAY; g.fillStyle = '#d6ff1a'; g.fillText(tx(l, 'unfollowed').toUpperCase(), 90, 740);
    var boxes = [[String(s.bad), tx(l, 'failed')], [s.rate + '%', tx(l, 'rate')], [s.ms ? fmtDuration(s.ms, l) : '—', tx(l, 'duration')]];
    boxes.forEach(function (b, i) {
      var bx = 90 + i * 310, by = 860;
      g.fillStyle = '#001594'; g.beginPath(); g.roundRect ? g.roundRect(bx + 8, by + 10, 280, 220, 36) : g.rect(bx + 8, by + 10, 280, 220); g.fill();
      g.fillStyle = '#ffffff'; g.beginPath(); g.roundRect ? g.roundRect(bx, by, 280, 220, 36) : g.rect(bx, by, 280, 220); g.fill();
      g.fillStyle = '#0a0a0f'; g.font = '900 64px ' + DISPLAY; g.fillText(b[0], bx + 32, by + 110, 220);
      g.fillStyle = '#5d6172'; g.font = '700 30px ' + BODY; g.fillText(b[1].toUpperCase(), bx + 32, by + 170, 220);
    });
    g.fillStyle = 'rgba(255,255,255,0.75)'; g.font = '600 34px ' + BODY;
    g.fillText(tx(l, 'of', s.total), 90, 1200);
    c.toBlob(function (blob) {
      if (!blob) return;
      var a = doc.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'resumen-unfollowers.png';
      doc.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
    }, 'image/png');
  }

  /* ---------------- help ---------------- */
  function showHelp() {
    var l = curLang();
    var rows = [['/', 'k_search'], ['← →', 'k_pages'], ['Shift + clic', 'k_shift'], ['T', 'k_theme'], ['?', 'k_help'], ['Esc', 'k_esc']];
    var root = modal('<h2>' + esc(tx(l, 'help')) + '</h2><dl class="iue-keys">' +
      rows.map(function (r) { return '<dt><kbd>' + esc(r[0]) + '</kbd></dt><dd>' + esc(tx(l, r[1])) + '</dd>'; }).join('') +
      '</dl><div class="iue-actions"><button type="button" class="iue-btn iue-primary" data-a="close">' + esc(tx(l, 'close')) + '</button></div>', 'iue-help');
    root.querySelector('[data-a=close]').addEventListener('click', closeModal);
  }

  /* ---------------- keyboard ---------------- */
  function typing(el) {
    if (!el) return false;
    if (el.isContentEditable || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') return true;
    return el.tagName === 'INPUT' && !/^(checkbox|radio|button|submit|reset|range|color|file)$/i.test(el.type);
  }
  function appVisible() { return !!doc.querySelector('.iu'); }
  doc.addEventListener('keydown', function (e) {
    if (!appVisible()) return;
    if (e.key === 'Escape' && openModal) { closeModal(); e.preventDefault(); return; }
    if (e.key === 'Escape' && typing(doc.activeElement)) { doc.activeElement.blur(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey || typing(e.target) || openModal) return;
    if (doc.querySelector('.iu .backdrop')) return; // settings modal open
    var pager = doc.querySelectorAll('.iu .pagination-controls a');
    if (e.key === '/') { var s = doc.querySelector('.iu .search-bar'); if (s && !s.disabled) { e.preventDefault(); s.focus(); s.select(); } }
    else if (e.key === 'ArrowLeft' && pager[0]) { e.preventDefault(); pager[0].click(); scrollTop(); }
    else if (e.key === 'ArrowRight' && pager[1]) { e.preventDefault(); pager[1].click(); scrollTop(); }
    else if (e.key === 't' || e.key === 'T') { toggleTheme(); }
    else if (e.key === '?') { showHelp(); }
  });
  function scrollTop() { setTimeout(function () { var r = doc.querySelector('.iu .results-container'); if (r) window.scrollTo({ top: 0, behavior: 'smooth' }); }, 30); }

  /* ---------------- shift + click range selection ---------------- */
  var lastName = null, busy = false;
  function rowName(row) { var a = row.querySelector('a.fs-xlarge'); return a ? a.textContent.trim() : null; }
  function isRowTarget(e) {
    if (!e.target || !e.target.closest) return null;
    if (e.target.closest('a,.avatar-container')) return null;
    return e.target.closest('.iu .result-item');
  }
  doc.addEventListener('mousedown', function (e) { if (e.shiftKey && isRowTarget(e)) e.preventDefault(); }, true);
  doc.addEventListener('click', function (e) {
    var row = isRowTarget(e);
    if (!row) return;
    if (!e.shiftKey || lastName == null) {
      // remember the anchor after the normal click went through
      lastName = rowName(row);
      return;
    }
    e.preventDefault(); e.stopPropagation();
    if (busy) return;
    var rows = Array.prototype.slice.call(doc.querySelectorAll('.iu .result-item'));
    var names = rows.map(rowName);
    var from = names.indexOf(lastName), to = rows.indexOf(row);
    if (from < 0) { lastName = rowName(row); return; }
    var cb = row.querySelector('.account-checkbox');
    if (!cb || cb.disabled) return;
    var target = !cb.checked;
    var lo = Math.min(from, to), hi = Math.max(from, to);
    var queue = [];
    for (var i = lo; i <= hi; i++) queue.push(names[i]);
    busy = true;
    (function next() {
      if (!queue.length) { busy = false; lastName = rowName(row); return; }
      var name = queue.shift();
      var r = Array.prototype.slice.call(doc.querySelectorAll('.iu .result-item')).filter(function (x) { return rowName(x) === name; })[0];
      var box = r && r.querySelector('.account-checkbox');
      if (box && !box.disabled && box.checked !== target) box.click();
      setTimeout(next, 16); // let Preact re-render before the next toggle
    })();
  }, true);

  return {
    tx: tx, toggleTheme: toggleTheme,
    sortUsers: sortUsers, setSort: setSort, getSort: getSort, sortOptions: sortOptions, showLetters: showLetters,
    confirmUnfollow: confirmUnfollow, autoSummary: autoSummary, showSummary: showSummary, showHelp: showHelp
  };
};
