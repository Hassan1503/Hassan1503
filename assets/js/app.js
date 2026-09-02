/* Site behaviour: navigation, theme, table of contents, the publication
   explorer (search / filters / sort / abstracts / BibTeX / chart), the
   research-topic links, the expandable timeline, and Google Scholar data
   loading. Vanilla JS, no dependencies. */
(function () {
  'use strict';
  var SITE = window.SITE || { publications: [], topics: [], timeline: [] };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'text') e.textContent = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (k === 'hidden') e.hidden = !!attrs[k];
      else e.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  function isDark() { return document.documentElement.getAttribute('data-theme') === 'dark'; }

  /* ── Theme ── */
  var themeToggle = $('#theme-toggle');
  function syncTheme() {
    var d = isDark();
    themeToggle.setAttribute('aria-pressed', d ? 'true' : 'false');
    themeToggle.setAttribute('aria-label', d ? 'Switch to light theme' : 'Switch to dark theme');
  }
  if (themeToggle) {
    syncTheme();
    themeToggle.addEventListener('click', function () {
      var next = isDark() ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      syncTheme();
    });
  }

  /* ── Nav, progress bar, back to top ── */
  var nav = $('#topnav'), backTop = $('#back-to-top'), progress = $('#progress');
  function onScroll() {
    var y = window.scrollY;
    nav.classList.toggle('scrolled', y > 24);
    if (backTop) backTop.classList.toggle('visible', y > 600);
    if (progress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (max > 0 ? Math.min(100, (y / max) * 100) : 0) + '%';
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (backTop) backTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  });
  var navToggle = $('#nav-toggle'), navList = $('#nav-list');
  if (navToggle) {
    navToggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    navList.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { nav.classList.remove('open'); navToggle.setAttribute('aria-expanded', 'false'); }
    });
  }

  /* ── Scroll spy for nav + table of contents ── */
  var spyLinks = $$('#nav-list a[href^="#"], .toc a[href^="#"]');
  var spySections = $$('main > section[id]');
  function setActive(id) {
    spyLinks.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + id); });
  }
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) setActive(en.target.id); });
    }, { rootMargin: '-25% 0px -65% 0px', threshold: 0 });
    spySections.forEach(function (s) { spy.observe(s); });
  }

  /* ── Reveal on scroll (gentle) ── */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduced) {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); ro.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    reveals.forEach(function (r) { ro.observe(r); });
  } else reveals.forEach(function (r) { r.classList.add('in'); });

  /* ── Toast ── */
  var toast = $('#toast'), toastTimer = null;
  function notify(msg) {
    if (!toast) return;
    toast.textContent = msg; toast.hidden = false; toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); toast.hidden = true; }, 2200);
  }
  function copyText(txt) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(txt);
    return new Promise(function (res, rej) {
      var ta = el('textarea', { style: 'position:fixed;opacity:0' }); ta.value = txt;
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy') ? res() : rej(); } catch (e) { rej(e); }
      document.body.removeChild(ta);
    });
  }

  /* ── Publications: data helpers ── */
  var pubs = SITE.publications.slice();
  var TYPE_LABEL = { journal: 'Journal article', conference: 'Conference paper', preprint: 'Preprint', chapter: 'Book chapter' };
  function citedPubs() { return pubs.filter(function (p) { return typeof p.cites === 'number'; }); }
  function metrics() {
    var c = citedPubs().map(function (p) { return p.cites; }).sort(function (a, b) { return b - a; });
    var h = 0; c.forEach(function (v, i) { if (v >= i + 1) h = i + 1; });
    return { citations: c.reduce(function (a, b) { return a + b; }, 0), h_index: h,
             i10_index: c.filter(function (v) { return v >= 10; }).length, count: pubs.length };
  }
  function bibtex(p) {
    var t = p.bib && p.bib.type || 'misc';
    var f = [['author', p.bibAuthors], ['title', p.title]];
    if (t === 'article') f.push(['journal', p.venue]);
    else if (t === 'inproceedings') f.push(['booktitle', p.venue]);
    else if (t === 'incollection') f.push(['booktitle', 'Enhancing Healthcare Through AI, AR, and VR']);
    f.push(['year', String(p.year)]);
    var ex = p.bib && p.bib.extra || {};
    Object.keys(ex).forEach(function (k) { f.push([k, ex[k]]); });
    if (p.links && p.links[0] && !ex.doi && !ex.eprint) f.push(['url', p.links[0].url]);
    var w = Math.max.apply(null, f.map(function (x) { return x[0].length; }));
    return '@' + t + '{' + p.id + ',\n' + f.map(function (x) {
      return '  ' + x[0] + new Array(w - x[0].length + 1).join(' ') + ' = {' + x[1] + '}';
    }).join(',\n') + '\n}';
  }

  /* ── Publications: render ── */
  var list = $('#pub-list'), countEl = $('#pub-count');
  var state = { q: '', year: 'all', type: 'all', topic: null, sort: 'newest' };
  function norm(s) { return String(s || '').toLowerCase(); }
  function matches(p) {
    if (state.year !== 'all' && String(p.year) !== state.year) return false;
    if (state.type !== 'all' && p.type !== state.type) return false;
    if (state.topic && p.tags.indexOf(state.topic) < 0) return false;
    if (state.q) {
      var hay = norm([p.title, p.authors, p.venue, p.year, p.tags.join(' '), (p.abstract || '').slice(0, 400)].join(' '));
      return state.q.split(/\s+/).every(function (w) { return hay.indexOf(w) >= 0; });
    }
    return true;
  }
  function sorted(arr) {
    var a = arr.slice();
    if (state.sort === 'cited') a.sort(function (x, y) { return (y.cites || 0) - (x.cites || 0) || y.year - x.year; });
    else if (state.sort === 'oldest') a.sort(function (x, y) { return x.year - y.year; });
    else a.sort(function (x, y) { return y.year - x.year || (y.cites || 0) - (x.cites || 0); });
    return a;
  }
  function topicName(tag) { var t = SITE.topics.filter(function (x) { return x.tag === tag; })[0]; return t ? t.name : tag; }

  function renderPub(p, i) {
    var badges = [el('span', { class: 'badge badge-type', text: TYPE_LABEL[p.type] || p.type })];
    badges.push(typeof p.cites === 'number'
      ? el('span', { class: 'badge pub-cites', text: 'Cited by ' + p.cites })
      : el('span', { class: 'badge pub-cites pub-cites-na', text: 'Not indexed' }));
    var actions = [];
    if (p.abstract) actions.push(el('button', { type: 'button', class: 'linkish', 'aria-expanded': 'false', 'data-toggle': 'abstract', text: 'Abstract' }));
    actions.push(el('button', { type: 'button', class: 'linkish', 'aria-expanded': 'false', 'data-toggle': 'bibtex', text: 'BibTeX' }));
    (p.links || []).forEach(function (l) {
      actions.push(el('a', { href: l.url, target: '_blank', rel: 'noopener', class: 'linkish', text: l.label + ' ↗' }));
    });
    var tagRow = el('div', { class: 'pub-tags' }, p.tags.map(function (t) {
      return el('button', { type: 'button', class: 'tag', 'data-topic': t, text: topicName(t) });
    }));
    var item = el('li', { class: 'pub-item', 'data-id': p.id }, [
      el('span', { class: 'pub-num', text: String(i + 1).padStart(2, '0') }),
      el('div', { class: 'pub-body' }, [
        el('h3', { class: 'pub-title', text: p.title }),
        el('p', { class: 'pub-authors', html: p.authors.replace('M. Hassanuzzaman', '<strong>M. Hassanuzzaman</strong>') }),
        el('p', { class: 'pub-venue-line' }, [el('em', { text: p.venue }), ' · ' + p.year + (p.highlight ? ' · ' + p.highlight : '')]),
        el('div', { class: 'pub-badges' }, badges),
        el('div', { class: 'pub-actions' }, actions),
        p.abstract ? el('div', { class: 'pub-panel pub-abstract', hidden: true }, [el('p', { text: p.abstract })]) : null,
        el('div', { class: 'pub-panel pub-bibtex', hidden: true }, [
          el('pre', { text: bibtex(p) }),
          el('button', { type: 'button', class: 'btn btn-small', 'data-copy': 'bibtex', text: 'Copy BibTeX' })
        ]),
        tagRow
      ])
    ]);
    return item;
  }
  function renderList() {
    if (!list) return;
    var shown = sorted(pubs.filter(matches));
    list.innerHTML = '';
    shown.forEach(function (p, i) { list.appendChild(renderPub(p, i)); });
    if (countEl) countEl.textContent = shown.length === pubs.length
      ? 'Showing all ' + pubs.length + ' publications'
      : 'Showing ' + shown.length + ' of ' + pubs.length + ' publications';
    var empty = $('#pub-empty'); if (empty) empty.hidden = shown.length > 0;
    var pill = $('#active-topic');
    if (pill) { pill.hidden = !state.topic; if (state.topic) $('#active-topic-name').textContent = topicName(state.topic); }
  }
  function renderMetrics() {
    var m = metrics();
    $$('.metric').forEach(function (card) {
      var num = $('.metric-num', card), label = norm($('.metric-label', card).textContent);
      var v = label.indexOf('citation') >= 0 ? m.citations : label.indexOf('h') === 0 ? m.h_index : label.indexOf('i10') === 0 ? m.i10_index : m.count;
      num.setAttribute('data-count', String(v));
      if (num.getAttribute('data-done')) num.textContent = String(v);
    });
    var src = $('#metrics-source');
    if (src && !src.getAttribute('data-live')) {
      var s = SITE.citationSource;
      src.innerHTML = ''; src.appendChild(document.createTextNode('Citation counts: '));
      src.appendChild(el('a', { href: s.url, target: '_blank', rel: 'noopener', text: s.label }));
      src.appendChild(document.createTextNode(' (' + s.date + '). '));
      src.appendChild(el('a', { href: SITE.scholarUrl, target: '_blank', rel: 'noopener', text: 'Google Scholar profile ↗' }));
    }
  }
  function renderChart() {
    var host = $('#impact-chart'); if (!host) return;
    var data = citedPubs().slice().sort(function (a, b) { return b.cites - a.cites; });
    var max = Math.max.apply(null, data.map(function (p) { return p.cites; }).concat([1]));
    var W = 520, rowH = 30, labelW = 150, H = data.length * rowH + 8;
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Citations per publication" preserveAspectRatio="xMinYMin meet">';
    data.forEach(function (p, i) {
      var y = i * rowH + 4, bw = Math.max(2, ((W - labelW - 44) * p.cites) / max);
      var lab = p.venueShort + ' ' + p.year;
      svg += '<g class="bar-row" data-id="' + p.id + '"><title>' + p.title.replace(/"/g, '&quot;') + ': ' + p.cites + ' citations</title>' +
        '<text x="' + (labelW - 8) + '" y="' + (y + 19) + '" text-anchor="end" class="bar-label">' + lab + '</text>' +
        '<rect x="' + labelW + '" y="' + (y + 6) + '" width="' + bw + '" height="' + (rowH - 12) + '" rx="3" class="bar"/>' +
        '<text x="' + (labelW + bw + 8) + '" y="' + (y + 19) + '" class="bar-value">' + p.cites + '</text></g>';
    });
    host.innerHTML = svg + '</svg>';
    $$('.bar-row', host).forEach(function (g) {
      g.addEventListener('click', function () {
        var item = $('.pub-item[data-id="' + g.getAttribute('data-id') + '"]');
        if (item) { item.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' }); item.classList.add('flash'); setTimeout(function () { item.classList.remove('flash'); }, 1600); }
      });
    });
  }
  function renderTopics() {
    $$('.topic-card').forEach(function (card) {
      var tag = card.getAttribute('data-tag');
      var n = pubs.filter(function (p) { return p.tags.indexOf(tag) >= 0; }).length;
      var c = $('.topic-count', card);
      if (c) c.textContent = n ? n + (n === 1 ? ' publication' : ' publications') : 'ongoing work';
      card.classList.toggle('active', state.topic === tag);
    });
  }
  function setTopic(tag, scroll) {
    state.topic = state.topic === tag ? null : tag;
    renderList(); renderTopics();
    if (scroll && state.topic) $('#publications').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  }

  /* ── Publications: controls ── */
  var search = $('#pub-search'), sortSel = $('#pub-sort'), yearChips = $('#year-chips'), typeChips = $('#type-chips');
  if (yearChips) {
    var years = pubs.map(function (p) { return p.year; }).filter(function (y, i, a) { return a.indexOf(y) === i; }).sort(function (a, b) { return b - a; });
    ['all'].concat(years).forEach(function (y) {
      yearChips.appendChild(el('button', { type: 'button', class: 'chip' + (y === 'all' ? ' active' : ''), 'data-year': String(y), 'aria-pressed': y === 'all' ? 'true' : 'false', text: y === 'all' ? 'All years' : String(y) }));
    });
  }
  if (typeChips) {
    var types = ['all'].concat(Object.keys(TYPE_LABEL).filter(function (t) { return pubs.some(function (p) { return p.type === t; }); }));
    types.forEach(function (t) {
      typeChips.appendChild(el('button', { type: 'button', class: 'chip' + (t === 'all' ? ' active' : ''), 'data-type': t, 'aria-pressed': t === 'all' ? 'true' : 'false', text: t === 'all' ? 'All types' : TYPE_LABEL[t] }));
    });
  }
  function chipHandler(container, key) {
    if (!container) return;
    container.addEventListener('click', function (e) {
      var b = e.target.closest('.chip'); if (!b) return;
      state[key] = b.getAttribute('data-' + key);
      $$('.chip', container).forEach(function (c) { var on = c === b; c.classList.toggle('active', on); c.setAttribute('aria-pressed', on ? 'true' : 'false'); });
      renderList();
    });
  }
  chipHandler(yearChips, 'year'); chipHandler(typeChips, 'type');
  var debounce = null;
  if (search) search.addEventListener('input', function () {
    clearTimeout(debounce);
    debounce = setTimeout(function () { state.q = norm(search.value).trim(); renderList(); }, 120);
  });
  if (sortSel) sortSel.addEventListener('change', function () { state.sort = sortSel.value; renderList(); });
  var clearTopic = $('#active-topic-clear');
  if (clearTopic) clearTopic.addEventListener('click', function () { setTopic(state.topic, false); });
  var resetBtn = $('#pub-reset');
  if (resetBtn) resetBtn.addEventListener('click', function () {
    state = { q: '', year: 'all', type: 'all', topic: null, sort: 'newest' };
    if (search) search.value = ''; if (sortSel) sortSel.value = 'newest';
    [yearChips, typeChips].forEach(function (c) { if (c) $$('.chip', c).forEach(function (x, i) { x.classList.toggle('active', i === 0); x.setAttribute('aria-pressed', i === 0 ? 'true' : 'false'); }); });
    renderList(); renderTopics();
  });
  if (list) list.addEventListener('click', function (e) {
    var t = e.target.closest('[data-toggle]');
    if (t) {
      var item = t.closest('.pub-item'), panel = $('.pub-' + t.getAttribute('data-toggle'), item);
      var open = panel.hidden; panel.hidden = !open; t.setAttribute('aria-expanded', open ? 'true' : 'false');
      return;
    }
    var c = e.target.closest('[data-copy]');
    if (c) {
      var txt = $('pre', c.parentNode).textContent;
      copyText(txt).then(function () { notify('BibTeX copied to clipboard'); }, function () { notify('Select the text to copy'); });
      return;
    }
    var tag = e.target.closest('[data-topic]');
    if (tag) setTopic(tag.getAttribute('data-topic'), false);
  });
  $$('.topic-card').forEach(function (card) {
    card.addEventListener('click', function () { setTopic(card.getAttribute('data-tag'), true); });
  });
  document.addEventListener('keydown', function (e) {
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
    if (e.key === '/' && !typing && search) { e.preventDefault(); search.focus(); search.select(); }
    if (e.key === 'Escape' && document.activeElement === search) { search.value = ''; state.q = ''; renderList(); search.blur(); }
  });

  /* ── Metric counters ── */
  function animateCounters() {
    var nums = $$('.metric-num');
    function finish(n) { n.textContent = n.getAttribute('data-count'); n.setAttribute('data-done', '1'); }
    if (reduced || !('IntersectionObserver' in window)) { nums.forEach(finish); return; }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return; obs.unobserve(en.target);
        var target = parseInt(en.target.getAttribute('data-count'), 10) || 0, t0 = null;
        (function step(ts) {
          if (t0 === null) t0 = ts;
          var p = Math.min((ts - t0) / 900, 1);
          en.target.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(step); else finish(en.target);
        })(performance.now());
      });
    }, { threshold: 0.4 });
    nums.forEach(function (n) { obs.observe(n); });
  }

  /* ── Timeline ── */
  var tl = $('#timeline');
  if (tl) SITE.timeline.forEach(function (t, i) {
    var body = el('div', { class: 'tl-body', id: 'tl-body-' + i, hidden: true }, [
      el('ul', {}, t.details.map(function (d) { return el('li', { text: d }); }))
    ]);
    tl.appendChild(el('li', { class: 'tl-item' + (t.current ? ' current' : '') }, [
      el('span', { class: 'tl-marker', 'aria-hidden': 'true' }),
      el('button', { type: 'button', class: 'tl-toggle', 'aria-expanded': 'false', 'aria-controls': 'tl-body-' + i }, [
        el('span', { class: 'tl-date', text: t.from + ' – ' + t.to }),
        el('span', { class: 'tl-title', text: t.title }),
        el('span', { class: 'tl-org', text: t.org + ' · ' + t.loc }),
        el('span', { class: 'tl-chevron', 'aria-hidden': 'true' })
      ]),
      body
    ]));
  });
  if (tl) tl.addEventListener('click', function (e) {
    var b = e.target.closest('.tl-toggle'); if (!b) return;
    var body = document.getElementById(b.getAttribute('aria-controls'));
    var open = body.hidden; body.hidden = !open; b.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  /* ── Google Scholar data (assets/data/scholar.json) ── */
  function tokens(s) {
    var EXP = { chd: 'congenital heart disease', chds: 'congenital heart disease', pcg: 'phonocardiogram', pcgs: 'phonocardiogram' };
    var STOP = { a: 1, an: 1, and: 1, the: 1, of: 1, for: 1, from: 1, by: 1, in: 1, on: 1, to: 1, using: 1, with: 1, via: 1, based: 1 };
    var out = {};
    norm(s).replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).forEach(function (w) {
      (EXP[w] ? EXP[w].split(' ') : [w]).forEach(function (x) {
        if (!x || STOP[x]) return; if (x.length > 3 && x.slice(-1) === 's') x = x.slice(0, -1); out[x] = 1;
      });
    });
    return out;
  }
  function similarity(a, b) {
    var ta = tokens(a), tb = tokens(b), inter = 0, union = 0, k;
    for (k in ta) { union++; if (tb[k]) inter++; } for (k in tb) if (!ta[k]) union++;
    return union ? inter / union : 0;
  }
  function applyScholar(data) {
    var m = data.metrics || {};
    (data.publications || []).forEach(function (sp) {
      var best = null, score = 0;
      pubs.forEach(function (p) { var s = similarity(p.title, sp.title); if (s > score) { score = s; best = p; } });
      if (best && score >= 0.6 && typeof sp.cited_by === 'number') best.cites = sp.cited_by;
    });
    var src = $('#metrics-source');
    if (src) {
      src.setAttribute('data-live', '1'); src.innerHTML = '';
      src.appendChild(document.createTextNode('Citation counts: '));
      src.appendChild(el('a', { href: data.profile_url || SITE.scholarUrl, target: '_blank', rel: 'noopener', text: 'Google Scholar' }));
      src.appendChild(document.createTextNode(' · updated ' + data.updated));
    }
    renderMetrics(); renderList(); renderChart(); renderTopics();
    if (m.citations) $$('.metric').forEach(function (card) {
      var label = norm($('.metric-label', card).textContent), num = $('.metric-num', card), key = null;
      if (label.indexOf('citation') >= 0) key = 'citations'; else if (label.indexOf('h') === 0) key = 'h_index'; else if (label.indexOf('i10') === 0) key = 'i10_index';
      if (key && m[key]) {
        num.setAttribute('data-count', String(m[key].all)); if (num.getAttribute('data-done')) num.textContent = String(m[key].all);
        if (m.since_year) card.title = m[key].since + ' since ' + m.since_year;
      }
    });
  }
  if (window.fetch) fetch('assets/data/scholar.json', { cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) { if (d && d.metrics) applyScholar(d); })
    .catch(function () {});

  /* ── Misc ── */
  var yearEl = $('#year'); if (yearEl) yearEl.textContent = new Date().getFullYear();
  var upd = $('#last-updated'); if (upd) upd.textContent = SITE.updated;
  var printBtn = $('#print-btn'); if (printBtn) printBtn.addEventListener('click', function () { window.print(); });

  renderMetrics(); renderList(); renderChart(); renderTopics(); animateCounters();
})();
