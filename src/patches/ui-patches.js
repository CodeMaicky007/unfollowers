/**
 * UI / behaviour patches applied to the base bundle (src/base/app.bundle.js).
 *
 * Each patch is an exact text replacement on the minified bundle:
 *   - `from` must appear EXACTLY ONCE in the bundle (the build fails otherwise).
 *   - `to` is what replaces it.
 * Variable names (o, c, g, n, l, a, t, b, _ ...) are the minifier's names in that exact
 * spot of the bundle. Before adding a patch, search the bundle and check which names are in scope.
 *
 * Patches run in order, so a later patch can match text produced by an earlier one.
 */

// Grey placeholder avatar used when a profile picture fails to load (no external request).
const FALLBACK_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%231f1f2b'/%3E%3Ccircle cx='32' cy='24' r='11' fill='%2345455a'/%3E%3Cpath d='M10 60c2-14 12-20 22-20s20 6 22 20z' fill='%2345455a'/%3E%3C/svg%3E";

module.exports = [
  {
    label: 'Empty state when no users match the filters',
    from: ',(0,l.getCurrentPageUnfollowers)(_,n.page).map((function(e){var t=e.username',
    to: ',0===_.length&&!n.isScanningActive&&o.default.createElement("div",{className:"empty-state"},(0,c.t)(g,"noUsersFound")),(0,l.getCurrentPageUnfollowers)(_,n.page).map((function(e){var t=e.username',
  },
  {
    label: 'Avatar: lazy loading + fallback image',
    from: 'o.default.createElement("img",{className:"avatar",alt:e.username,src:e.profile_pic_url})',
    to: 'o.default.createElement("img",{className:"avatar",alt:e.username,src:e.profile_pic_url,loading:"lazy",decoding:"async",onError:function(ev){var im=ev.currentTarget;im.onerror=null;im.src="' + FALLBACK_AVATAR + '"}})',
  },
  {
    label: 'Avatar tooltip (add/remove whitelist)',
    from: 'o.default.createElement("div",{className:"avatar-container",onClick:',
    to: 'o.default.createElement("div",{className:"avatar-container",title:"non_whitelisted"===n.currentTab?(0,c.t)(g,"addToWhitelist"):(0,c.t)(g,"removeFromWhitelist"),onClick:',
  },
  {
    label: '"Selected" counter in the sidebar metrics',
    from: ',o.default.createElement("p",{className:"whitelist-counter"}',
    to: ',o.default.createElement("p",{className:"selected-counter"},o.default.createElement("span",null,(0,c.t)(g,"selected")),o.default.createElement("strong",null,n.selectedResults.length)),o.default.createElement("p",{className:"whitelist-counter"}',
  },
  {
    label: 'Progress bar in the scanner sidebar',
    from: ',o.default.createElement("menu",{className:"sidebar-filters-grid"}',
    to: ',o.default.createElement("div",{className:"sidebar-progress",role:"progressbar","aria-valuemin":0,"aria-valuemax":100,"aria-valuenow":n.percentage},o.default.createElement("i",{style:{width:n.percentage+"%"}})),o.default.createElement("menu",{className:"sidebar-filters-grid"}',
  },
  {
    label: 'Progress bar in the unfollow sidebar',
    from: 'a.default.createElement("menu",{className:"flex column grow m-clear p-clear"}',
    to: 'a.default.createElement("div",{className:"sidebar-progress",role:"progressbar","aria-valuemin":0,"aria-valuemax":100,"aria-valuenow":t.percentage},a.default.createElement("i",{style:{width:t.percentage+"%"}})),a.default.createElement("menu",{className:"flex column grow m-clear p-clear"}',
  },
  // Bug fix: these buttons live inside the settings <form>; without type="button" they submitted it and closed the modal.
  { label: 'Fix: export button type', from: 'className:"btn btn-export"', to: 'type:"button",className:"btn btn-export"' },
  { label: 'Fix: import button type', from: 'className:"btn btn-import"', to: 'type:"button",className:"btn btn-import"' },
  { label: 'Fix: clear button type', from: 'className:"btn btn-clear"', to: 'type:"button",className:"btn btn-clear"' },
  {
    label: 'i18n EN: "selected"',
    from: 'loadedFromCache:"Loaded %s accounts from cache!",',
    to: 'loadedFromCache:"Loaded %s accounts from cache!",selected:"Selected",',
  },
  {
    label: 'i18n ES: "selected"',
    from: 'loadedFromCache:"¡Se cargaron %s cuentas del historial!",',
    to: 'loadedFromCache:"¡Se cargaron %s cuentas del historial!",selected:"Seleccionados",',
  },

  /* ------------------------------------------------------------------
   * v4 — features backed by src/patches/enhancements.js (global IUE)
   * ------------------------------------------------------------------ */
  {
    label: 'Spanish by default when no language was chosen',
    from: '}catch(e){}return"en"},t.saveLanguage',
    to: '}catch(e){}return"es"},t.saveLanguage',
  },
  {
    label: 'Confirmation modal before unfollowing (open)',
    from: 'confirm((0,c.t)(g,"unfollowConfirm"))&&i((function(e){',
    to: 'IUE.confirmUnfollow(n.selectedResults,g,function(){i((function(e){',
  },
  {
    label: 'Confirmation modal before unfollowing (close)',
    from: 'filter:{showSucceeded:!0,showFailed:!0}})}))}},(0,c.t)(g,"unfollowCount"',
    to: 'filter:{showSucceeded:!0,showFailed:!0}})}))})}},(0,c.t)(g,"unfollowCount"',
  },
  {
    label: 'Summary: auto-open at the end + "See summary" button',
    from: 'a.default.createElement("article",{className:"unfollow-log-container"},',
    to: 'a.default.createElement("article",{className:"unfollow-log-container"},IUE.autoSummary(t.unfollowLog,t.selectedResults.length,r),t.unfollowLog.length>0&&a.default.createElement("button",{type:"button",className:"summary-cta",onClick:function(){IUE.showSummary(t.unfollowLog,t.selectedResults.length,r)}},IUE.tx(r,"seeSummary")),',
  },
  {
    label: 'Sorting applied wherever the visible list is computed',
    from: 'o(s[l]);return i},t.getUnfollowLogForDisplay',
    to: 'o(s[l]);return IUE.sortUsers(i)},t.getUnfollowLogForDisplay',
  },
  {
    label: 'Sort selector in the scanner sidebar',
    from: '(0,c.t)(g,"noPic"))),o.default.createElement("div",{className:"sidebar-buttons-grid"',
    to: '(0,c.t)(g,"noPic"))),o.default.createElement("label",{className:"sort-select"},o.default.createElement("span",null,IUE.tx(g,"sort")),o.default.createElement("select",{value:IUE.getSort(),onChange:function(e){IUE.setSort(e.currentTarget.value),i(r(r({},n),{page:1}))}},IUE.sortOptions(g).map((function(x){return o.default.createElement("option",{key:x.value,value:x.value},x.label)})))),o.default.createElement("div",{className:"sidebar-buttons-grid"',
  },
  {
    label: 'Letter headers only when sorted alphabetically',
    from: 't!==b&&function(e){return b=e,',
    to: 'IUE.showLetters()&&t!==b&&function(e){return b=e,',
  },
  {
    label: 'Theme toggle button in the header',
    from: 's.default.createElement("button",{className:"icon-button",type:"button",title:(0,f.t)(v,"settings")',
    to: 's.default.createElement("button",{className:"icon-button theme-toggle",type:"button",title:IUE.tx(v,"theme"),"aria-label":IUE.tx(v,"theme"),onClick:function(){IUE.toggleTheme()}},s.default.createElement("span",{className:"tt-moon"},"☾"),s.default.createElement("span",{className:"tt-sun"},"☀")),s.default.createElement("button",{className:"icon-button",type:"button",title:(0,f.t)(v,"settings")',
  },
  // Texts that were hard-coded in English
  { label: 'i18n: filter change confirm', from: 'confirm("Changing filter options will clear selected users")', to: 'confirm(IUE.tx(null,"filterReset"))' },
  { label: 'i18n: only on Instagram', from: 'alert("Can be used only on Instagram routes")', to: 'alert(IUE.tx(null,"onlyIg"))' },
  { label: 'i18n: empty whitelist export', from: 'alert("No users in whitelist to export")', to: 'alert(IUE.tx(null,"noWlExport"))' },
  {
    label: 'i18n: whitelist merged message',
    from: 'text:"Merged successfully! Added ".concat(a," new users (").concat(e.length," imported, ").concat(e.length-a," duplicates skipped)")',
    to: 'text:IUE.tx(null,"wlAdded",a)',
  },
  { label: 'i18n: whitelist replaced message', from: 'text:"Replaced whitelist with ".concat(e.length," users")', to: 'text:IUE.tx(null,"wlReplaced",e.length)' },
  {
    // The settings button already asks (translated); this second English confirm made users confirm twice.
    label: 'Fix: double confirmation when clearing the whitelist',
    from: 't.clearWhitelist=function(){confirm("Are you sure you want to clear the entire whitelist? This action cannot be undone.")&&localStorage.removeItem(',
    to: 't.clearWhitelist=function(){localStorage.removeItem(',
  },
  {
    // Pagination re-sorted A-Z and undid the chosen order; the list now arrives already sorted by IUE.sortUsers.
    label: 'Pagination keeps the chosen sort order',
    from: 'var n=l([],e,!0).sort((function(e,t){return e.username>t.username?1:-1})),r=s.UNFOLLOWERS_PER_PAGE*(t-1)',
    to: 'var n=e,r=s.UNFOLLOWERS_PER_PAGE*(t-1)',
  },

  /* ------------------------------------------------------------------
   * Launch screen — glow horizon instead of the orbit + floating cards
   * (pure-CSS take on GlowHorizon; styles in theme.css "Launch screen")
   * ------------------------------------------------------------------ */
  {
    label: 'Launch screen: glow horizon replaces the decorative panel',
    from: 'a.default.createElement("div",{className:"launch-panel","aria-hidden":"true"},a.default.createElement("div",{className:"scan-orbit"},a.default.createElement("span",null),a.default.createElement("span",null),a.default.createElement("span",null)),a.default.createElement("div",{className:"signal-card primary"},a.default.createElement("span",null,(0,i.t)(n,"ready")),a.default.createElement("strong",null,r?"".concat(r.results.length):"0%")),a.default.createElement("div",{className:"signal-card"},a.default.createElement("span",null,(0,i.t)(n,"protected")),a.default.createElement("strong",null,(0,i.t)(n,"whitelist"))),a.default.createElement("div",{className:"signal-card accent"},a.default.createElement("span",null,(0,i.t)(n,"review")),a.default.createElement("strong",null,(0,i.t)(n,"selectFirst"))))',
    to: 'a.default.createElement("div",{className:"glow-horizon","aria-hidden":"true"},a.default.createElement("i",{className:"gh-rim"}),a.default.createElement("i",{className:"gh-lime"}),a.default.createElement("i",{className:"gh-blue"}),a.default.createElement("i",{className:"gh-shade"}))',
  },
  { label: 'Launch copy EN: eyebrow', from: 'localAccountAudit:"Local account audit"', to: 'localAccountAudit:"Free · no password"' },
  { label: 'Launch copy EN: title', from: 'launchTitle:"Find the follows that do not follow back."', to: 'launchTitle:"Who doesn\'t follow you back?"' },
  {
    label: 'Launch copy EN: description',
    from: 'launchDescription:"Scan your Instagram follows, review risk signals, protect whitelisted accounts, and act only on the users you select."',
    to: 'launchDescription:"Scan your account, review the list and unfollow only the people you choose."',
  },
  { label: 'Launch copy EN: note', from: 'runsInBrowserOnly:"Runs in this browser session only"', to: 'runsInBrowserOnly:"Nothing leaves your browser"' },
  { label: 'Launch copy ES: eyebrow', from: 'localAccountAudit:"Auditoría local de cuenta"', to: 'localAccountAudit:"Gratis · sin contraseña"' },
  { label: 'Launch copy ES: title', from: 'launchTitle:"Encuentra a quienes sigues pero no te siguen de vuelta."', to: 'launchTitle:"¿Quién no te sigue de vuelta?"' },
  {
    label: 'Launch copy ES: description',
    from: 'launchDescription:"Escanea tus seguidos de Instagram, analiza señales de riesgo, protege cuentas en lista blanca y actúa solo sobre los usuarios seleccionados."',
    to: 'launchDescription:"Escanea tu cuenta, revisa la lista y deja de seguir solo a quien tú elijas."',
  },
  { label: 'Launch copy ES: note', from: 'runsInBrowserOnly:"Se ejecuta solo en esta sesión del navegador"', to: 'runsInBrowserOnly:"Nada sale de tu navegador"' },

  /* ------------------------------------------------------------------
   * Radar — records the scan the app already does (no extra requests)
   * ------------------------------------------------------------------ */
  {
    label: 'Radar: start recording when the followers scan starts',
    from: 'e=(0,b.createFollowerIndex)(),t=0,',
    to: 'e=(0,b.createFollowerIndex)(),IUE.radar.begin(),t=0,',
  },
  {
    label: 'Radar: record each follower',
    from: 's=o[i],(0,b.addFollowerToIndex)(e,s),t++;',
    to: 's=o[i],(0,b.addFollowerToIndex)(e,s),IUE.radar.addFollower(s),t++;',
  },
  {
    label: 'Radar: record each followed account',
    from: 's=o[i],(0,b.isUserInFollowerIndex)(e,s)||',
    to: 's=o[i],IUE.radar.addFollowing(s),(0,b.isUserInFollowerIndex)(e,s)||',
  },
  {
    // h is true only when both lists were read to the end; partial scans are never compared.
    label: 'Radar: save and compare only complete scans',
    from: '((h=p)||d.length>0)&&((0,E.saveCachedScanResults)(d)',
    to: '((h=p)&&IUE.radar.commit(I),h||d.length>0)&&((0,E.saveCachedScanResults)(d)',
  },
  {
    label: 'Radar button in the header',
    from: 's.default.createElement("button",{className:"icon-button theme-toggle"',
    to: 's.default.createElement("button",{className:"icon-button radar-button",type:"button",title:IUE.tx(v,"radar"),"aria-label":IUE.tx(v,"radar"),onClick:function(){IUE.openRadar(v)}},s.default.createElement("span",{"aria-hidden":"true"},"◎")),s.default.createElement("button",{className:"icon-button theme-toggle"',
  },
];
