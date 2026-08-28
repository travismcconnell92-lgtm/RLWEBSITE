/* ==========================================================================
   READY LEGAL — shared behaviour
   Everything here is progressive enhancement: with JavaScript off the page
   still shows all of its content, it just does not collapse.
   The breakpoint is 960px, which is the same one the stylesheet uses.
   ========================================================================== */
(function () {
  'use strict';

  var MOBILE = window.matchMedia('(max-width: 960px)');
  var uid = 0;

  /* ---- 1. Tap-to-expand cards -------------------------------------------
     A .rl-expand card collapses to a single row on phones: icon, title and a
     chevron. Built as a real <button> inside the heading, which is the
     accessible disclosure pattern, so it works with a keyboard and announces
     its state to a screen reader. Untouched on desktop. */

  function buildCard(card) {
    if (card.dataset.rlBuilt) return;
    var h = card.querySelector('h3');
    if (!h || !h.nextElementSibling) return;

    var icon = card.firstElementChild;
    if (icon && icon !== h && icon.tagName === 'DIV') icon.classList.add('rl-icon');

    /* Wrap everything after the heading in one element. A card can hold more
       than a paragraph — the lien card also carries a Start My Lien button —
       and two elements sharing one grid area would sit on top of each other.
       The wrapper is display:contents on desktop, so it changes nothing there. */
    var body = document.createElement('div');
    body.className = 'rl-body';
    while (h.nextSibling) body.appendChild(h.nextSibling);
    card.appendChild(body);

    uid += 1;
    body.id = 'rl-body-' + uid;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'rl-toggle';
    btn.setAttribute('aria-controls', body.id);
    while (h.firstChild) btn.appendChild(h.firstChild);
    h.appendChild(btn);

    function toggle() {
      var open = card.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    btn.addEventListener('click', function (e) { e.stopPropagation(); toggle(); });

    /* The button is only as wide as the heading text, so tapping the icon or
       the chevron did nothing. Make the whole collapsed row a target, while
       leaving anything inside the body (links, buttons) alone. */
    card.addEventListener('click', function (e) {
      if (!MOBILE.matches) return;
      if (e.target.closest('.rl-body')) return;
      if (e.target.closest('a, button')) return;
      toggle();
    });

    card.dataset.rlBuilt = '1';
  }

  function syncCard(card) {
    var btn = card.querySelector('.rl-toggle');
    if (!btn) return;
    if (MOBILE.matches) {
      card.classList.add('rl-ready');
      btn.setAttribute('aria-expanded', card.classList.contains('open') ? 'true' : 'false');
      btn.removeAttribute('tabindex');
    } else {
      /* on desktop the card is not a disclosure at all */
      card.classList.remove('rl-ready', 'open');
      btn.removeAttribute('aria-expanded');
      btn.setAttribute('tabindex', '-1');
    }
  }

  /* ---- 2. Long lists truncated to four ----------------------------------
     Only fires when it actually hides two or more items. A "See 1 more"
     button is worse than just showing the item. The label counts what is
     hidden rather than hardcoding a number. */

  function buildList(list) {
    if (list.dataset.rlBuilt) return;
    var items = Array.prototype.slice.call(list.children);
    var hidden = items.slice(3);            /* show three, hide the rest */
    if (hidden.length < 1) { list.dataset.rlBuilt = 'skip'; return; }

    hidden.forEach(function (li) { li.classList.add('rl-extra'); });

    uid += 1;
    list.id = list.id || ('rl-list-' + uid);

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'rl-more';
    btn.setAttribute('aria-controls', list.id);
    btn.textContent = 'See ' + hidden.length + ' more';
    list.insertAdjacentElement('afterend', btn);

    btn.addEventListener('click', function () {
      var open = list.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.textContent = open ? 'Show less' : 'See ' + hidden.length + ' more';
    });

    list.dataset.rlBuilt = '1';
    list._rlBtn = btn;
    list._rlHidden = hidden.length;
  }

  function syncList(list) {
    var btn = list._rlBtn;
    if (!btn) return;
    if (MOBILE.matches) {
      list.classList.add('rl-ready');
      btn.hidden = false;
      btn.setAttribute('aria-expanded', list.classList.contains('open') ? 'true' : 'false');
    } else {
      list.classList.remove('rl-ready', 'open');
      btn.hidden = true;
      btn.removeAttribute('aria-expanded');
    }
  }


  /* ---- 3. Hero video ----------------------------------------------------
     Two <video> elements with one hidden by CSS makes the browser download
     both. Ship one empty element and append the right <source> at runtime:
     a 1600px file on a laptop, a cropped tall file on a phone. The poster
     swaps to match, so the hero is never a black box while the video loads.
     There is deliberately no poster attribute in the markup: the browser
     starts fetching a poster the instant it parses the tag, so a hardcoded
     one means a phone downloads the desktop poster and then the mobile one.
     With JavaScript off the hero simply shows its navy background, which is
     what the overlay gradient is designed to sit on anyway.

     The inline style on the element is deliberate belt-and-braces. If the
     stylesheet is stale in a phone's cache the video still positions itself
     instead of rendering as a full-width block that shoves the hero off
     screen, which is a failure that has actually happened on this site. */

  function heroVideo() {
    document.querySelectorAll('video[data-hero]').forEach(function (v) {
      if (v.dataset.rlBuilt) return;
      var stem  = v.dataset.hero;
      var small = MOBILE.matches;
      var base  = small ? stem + '-mobile' : stem;
      v.poster  = base + '-poster.jpg';
      var s = document.createElement('source');
      s.src = base + '.mp4';
      s.type = 'video/mp4';
      v.appendChild(s);
      v.preload = 'auto';
      v.load();
      var p = v.play();
      if (p && p.catch) p.catch(function () {});   /* autoplay refused, poster stands in */
      v.dataset.rlBuilt = '1';
    });
  }


  /* ---- 4. Persistent contact bar --------------------------------------
     Four pages shipped with their own bar wired to a slide-up form panel.
     Every other page had nothing, so on a phone there was no way to reach
     the firm without scrolling to the footer. Inject a bar where one is
     missing rather than editing 140 files, and work out the path back to
     the homepage from the stylesheet href so it is right at any depth. */

  function sitePrefix() {
    var l = document.querySelector('link[rel="stylesheet"][href*="styles.css"]');
    if (!l) return '';
    return l.getAttribute('href').split('styles.css')[0];
  }

  function contactBar() {
    if (document.querySelector('.mobile-consult-bar')) return;   /* page has its own */
    var r = sitePrefix();
    var bar = document.createElement('div');
    bar.className = 'mobile-consult-bar rl-bar';
    bar.innerHTML =
      '<a class="rl-bar-call" href="tel:4072582002" aria-label="Call Ready Legal">' +
        '<span aria-hidden="true">\u260E</span> Call</a>' +
      '<a class="rl-bar-cta" href="' + r + '#intake">Request a Consultation</a>';
    document.body.appendChild(bar);
  }

  /* The footer's Contact link calls openMobileForm(), which only exists on the
     pages that ship a form panel. Everywhere else it threw. */
  if (typeof window.openMobileForm !== 'function') {
    window.openMobileForm = function () { window.location.href = sitePrefix() + '#intake'; };
  }

  function init() {
    contactBar();
    heroVideo();
    var cards = document.querySelectorAll('.rl-expand');
    var lists = document.querySelectorAll('.rl-truncate');
    cards.forEach(buildCard);
    lists.forEach(buildList);
    function sync() { cards.forEach(syncCard); lists.forEach(syncList); }
    sync();
    if (MOBILE.addEventListener) MOBILE.addEventListener('change', sync);
    else MOBILE.addListener(sync);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
