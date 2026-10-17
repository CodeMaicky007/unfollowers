/**
 * Userscript launcher (mobile + desktop).
 * Adds a floating "Unfollowers" button on instagram.com. Tapping it starts the app.
 * The build replaces the APP placeholder below with dist/instagram-unfollowers.js.
 * Nothing runs until the button is tapped, so Instagram keeps working normally.
 */
(function () {
  'use strict';
  if (window.__iuLauncher) return;
  window.__iuLauncher = true;

  function start() {
    var b = document.getElementById('iu-launch');
    if (b) b.remove();
    /*__APP__*/
  }

  function addButton() {
    if (document.getElementById('iu-launch') || document.querySelector('.iu')) return;
    var b = document.createElement('button');
    b.id = 'iu-launch';
    b.type = 'button';
    b.setAttribute('aria-label', 'Abrir Unfollowers');
    b.innerHTML = '<span style="display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:#0a0a0f;color:#d6ff1a;font-size:16px;line-height:1">↗</span><span>Unfollowers</span>';
    b.style.cssText = [
      'position:fixed', 'z-index:2147483646',
      'right:max(14px, env(safe-area-inset-right, 0px))',
      'bottom:calc(76px + env(safe-area-inset-bottom, 0px))',
      'display:flex', 'align-items:center', 'gap:10px',
      'height:50px', 'padding:0 18px 0 10px', 'border:0', 'border-radius:999px',
      'background:#d6ff1a', 'color:#0a0a0f',
      'font:900 15px/1 "Arial Black", Arial, sans-serif', 'letter-spacing:.02em', 'text-transform:uppercase',
      'box-shadow:0 5px 0 #0a0a0f, 0 10px 30px rgba(0,0,0,.25)', 'cursor:pointer',
      '-webkit-tap-highlight-color:transparent'
    ].join(';');
    b.addEventListener('click', start);
    document.body.appendChild(b);
  }

  if (document.body) addButton();
  else document.addEventListener('DOMContentLoaded', addButton);
  // Instagram is a single-page app: re-add the button if it gets removed while navigating.
  setInterval(addButton, 2000);
})();
