/* Site behaviour: theme, navigation, scroll-spy, publication filtering,
   BibTeX copy, and the Google Scholar metric overlay.
   Vanilla JS, no dependencies, progressive — the page is complete without it. */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Theme ─────────────────────────────────────────────── */
  var toggle = $('#theme-toggle');
  function isDark() { return document.documentElement.getAttribute('data-theme') === 'dark'; }
  function syncToggle() {
    if (!toggle) return;
    var d = isDark();
    toggle.setAttribute('aria-pressed', d ? 'true' : 'false');
    toggle.setAttribute('aria-label', d ? 'Switch to light theme' : 'Switch to dark theme');
  }
  if (toggle) {
    syncToggle();
    toggle.addEventListener('click', function () {
      var next = isDark() ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      syncToggle();
    });
  }

  /* ── Mobile navigation ─────────────────────────────────── */
  var nav = $('#nav'), navToggle = $('#nav-toggle');
  if (navToggle && nav) {
    navToggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ── Scroll-spy over the section index ─────────────────── */
  var spyLinks = $$('[data-spy] a[href^="#"]');
  if (spyLinks.length && 'IntersectionObserver' in window) {
    var targets = spyLinks
      .map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); })
      .filter(Boolean);
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        spyLinks.forEach(function (a) {
          a.classList.toggle('is-current', a.getAttribute('href') === '#' + en.target.id);
        });
      });
    }, { rootMargin: '-28% 0px -62% 0px', threshold: 0 });
    targets.forEach(function (t) { spy.observe(t); });
  }

  /* ── Reveal on scroll (opt-in via .reveal) ─────────────── */
  var reveals = $$('.reveal');
  if (reveals.length && 'IntersectionObserver' in window && !reduced) {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); ro.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.04 });
    reveals.forEach(function (r) { ro.observe(r); });
  } else {
    reveals.forEach(function (r) { r.classList.add('is-in'); });
  }

  /* ── Publication filtering ─────────────────────────────── */
  var items = $$('.pub');
  var countEl = $('#pub-count');
  var state = { topic: 'all', kind: 'all' };

  function applyFilter() {
    var shown = 0;
    items.forEach(function (li) {
      var topics = (li.getAttribute('data-topics') || '').split(/\s+/);
      var kind = li.getAttribute('data-kind') || '';
      var ok = (state.topic === 'all' || topics.indexOf(state.topic) >= 0) &&
               (state.kind === 'all' || kind === state.kind);
      li.hidden = !ok;
      if (ok) shown++;
    });
    if (countEl) {
      countEl.textContent = shown === items.length
        ? items.length + ' publications'
        : shown + ' of ' + items.length + ' publications';
    }
    var empty = $('#pub-empty');
    if (empty) empty.hidden = shown > 0;
  }

  $$('[data-filter]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var group = btn.getAttribute('data-filter');   // 'topic' | 'kind'
      var value = btn.getAttribute('data-value');
      state[group] = value;
      $$('[data-filter="' + group + '"]').forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      applyFilter();
    });
  });
  if (items.length) applyFilter();

  /* ── BibTeX disclosure + copy ──────────────────────────── */
  $$('[data-bib-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var wrap = btn.closest('.pub').querySelector('.pub-bib');
      if (!wrap) return;
      var open = wrap.hidden;
      wrap.hidden = !open;
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  var toast = $('#toast'), toastTimer = null;
  function notify(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('is-up');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('is-up'); }, 2000);
  }
  $$('[data-bib-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var pre = btn.closest('.pub-bib').querySelector('pre');
      if (!pre) return;
      var text = pre.textContent;
      var done = function () { notify('BibTeX copied'); };
      var fail = function () { notify('Select the text to copy'); };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done, fail);
      } else {
        var ta = document.createElement('textarea');
        ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy') ? done() : fail(); } catch (e) { fail(); }
        document.body.removeChild(ta);
      }
    });
  });

  /* ── Google Scholar overlay ────────────────────────────────
     assets/data/scholar.json is refreshed weekly by a GitHub Action.
     When present it supersedes the numbers written into the HTML. */
  function norm(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function tokens(s) {
    var EXPAND = { chd: 'congenital heart disease', pcg: 'phonocardiogram', ecg: 'electrocardiogram' };
    var STOP = { a:1, an:1, and:1, the:1, of:1, for:1, from:1, by:1, in:1, on:1, to:1, using:1, with:1, via:1, based:1 };
    var out = {};
    norm(s).split(' ').forEach(function (w) {
      (EXPAND[w] ? EXPAND[w].split(' ') : [w]).forEach(function (x) {
        if (!x || STOP[x]) return;
        if (x.length > 3 && x.slice(-1) === 's') x = x.slice(0, -1);
        out[x] = 1;
      });
    });
    return out;
  }
  function similarity(a, b) {
    var ta = tokens(a), tb = tokens(b), inter = 0, union = 0, k;
    for (k in ta) { union++; if (tb[k]) inter++; }
    for (k in tb) if (!ta[k]) union++;
    return union ? inter / union : 0;
  }

  function applyScholar(data) {
    var m = data.metrics || {};
    $$('[data-metric]').forEach(function (el) {
      var key = el.getAttribute('data-metric');
      if (key === 'publications') {
        if ((data.publications || []).length) el.textContent = data.publications.length;
        return;
      }
      if (m[key] && typeof m[key].all === 'number') {
        el.textContent = m[key].all;
        var card = el.closest('[data-metric-card]');
        if (card && m.since_year) card.title = m[key].since + ' since ' + m.since_year;
      }
    });

    (data.publications || []).forEach(function (sp) {
      if (typeof sp.cited_by !== 'number') return;
      var best = null, score = 0;
      items.forEach(function (li) {
        var t = li.getAttribute('data-title') || (li.querySelector('.pub-title') || {}).textContent;
        var s = similarity(t, sp.title);
        if (s > score) { score = s; best = li; }
      });
      if (best && score >= 0.6) {
        var badge = best.querySelector('[data-cites]');
        if (badge) {
          // An uncited paper carries no badge; a "0 citations" tag is noise.
          badge.textContent = sp.cited_by === 1 ? '1 citation' : sp.cited_by + ' citations';
          badge.hidden = sp.cited_by < 1;
        }
      }
    });

    var stamp = $('#scholar-stamp');
    if (stamp && data.updated) {
      stamp.textContent = data.updated;
      var wrap = $('#scholar-note');
      if (wrap) wrap.hidden = false;
    }
  }

  if (window.fetch) {
    fetch('assets/data/scholar.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (d && d.metrics) applyScholar(d); })
      .catch(function () { /* keep the numbers already in the HTML */ });
  }

  /* ── Footer year ───────────────────────────────────────── */
  var y = $('#year');
  if (y) y.textContent = new Date().getFullYear();
})();
