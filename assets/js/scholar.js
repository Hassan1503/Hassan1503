/* Loads assets/data/scholar.json (refreshed by the update-scholar workflow)
   and replaces the hardcoded citation numbers with the live Google Scholar
   values. If the file is missing or unparseable the page keeps its
   fallback numbers untouched. */
(function () {
  'use strict';

  // Keys are normalized label text (lowercase, punctuation stripped).
  var LABEL_KEYS = {
    'total citations': 'citations',
    'citations': 'citations',
    'h index': 'h_index',
    'i10 index': 'i10_index'
  };

  // Common abbreviations used in the page's shortened titles.
  var EXPAND = {
    chd: 'congenital heart disease',
    chds: 'congenital heart disease',
    pcg: 'phonocardiogram',
    pcgs: 'phonocardiogram',
    cnn: 'convolutional neural network',
    ai: 'artificial intelligence'
  };
  var STOP = { a: 1, an: 1, and: 1, the: 1, of: 1, for: 1, from: 1, by: 1, in: 1, on: 1, to: 1, using: 1, with: 1, via: 1, based: 1 };

  function norm(s) {
    return String(s || '').toLowerCase()
      .replace(/&[a-z]+;|[^a-z0-9 ]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Content words only, abbreviations expanded, plurals folded.
  function tokens(s) {
    var out = {};
    norm(s).split(' ').forEach(function (w) {
      if (!w) return;
      var words = EXPAND[w] ? EXPAND[w].split(' ') : [w];
      words.forEach(function (x) {
        if (STOP[x]) return;
        if (x.length > 3 && x.charAt(x.length - 1) === 's') x = x.slice(0, -1);
        out[x] = 1;
      });
    });
    return out;
  }

  function similarity(a, b) {
    var ta = tokens(a), tb = tokens(b), inter = 0, union = 0, k;
    for (k in ta) { union++; if (tb[k]) inter++; }
    for (k in tb) { if (!ta[k]) union++; }
    var jaccard = union ? inter / union : 0;
    var na = norm(a), nb = norm(b);
    var prefix = (na === nb) ? 1 : (na.indexOf(nb) === 0 || nb.indexOf(na) === 0) ? 0.9 : 0;
    return Math.max(jaccard, prefix);
  }

  function findPub(pubs, title) {
    var best = null, bestScore = 0;
    pubs.forEach(function (p) {
      var score = similarity(title, p.title);
      if (score > bestScore) { bestScore = score; best = p; }
    });
    return bestScore >= 0.6 ? best : null;
  }

  function setMetric(el, value) {
    el.setAttribute('data-count', String(value));
    // If the counter already animated (or reduced-motion set it instantly),
    // update the visible number too.
    if (el.textContent.trim() !== '0') el.textContent = String(value);
  }

  // Replace only the text, keeping any decorative child (e.g. an icon span).
  function setBadgeText(el, txt) {
    var node = el.lastChild;
    while (node && node.nodeType !== 3) node = node.previousSibling;
    if (node) node.nodeValue = (el.firstChild !== node ? ' ' : '') + txt;
    else el.appendChild(document.createTextNode(txt));
  }

  function apply(data) {
    var m = data.metrics || {};
    document.querySelectorAll('.metric').forEach(function (card) {
      var num = card.querySelector('.metric-num');
      var label = card.querySelector('.metric-label');
      if (!num || !label) return;
      var labelKey = norm(label.textContent);
      var key = LABEL_KEYS[labelKey];
      if (key && m[key]) {
        setMetric(num, m[key].all);
        if (m.since_year) card.title = m[key].since + ' since ' + m.since_year;
      } else if (labelKey === 'publications' && data.publications && data.publications.length) {
        setMetric(num, data.publications.length);
      }
    });

    var pubs = data.publications || [];
    document.querySelectorAll('.pub-item').forEach(function (item) {
      var titleEl = item.querySelector('.pub-title');
      var cites = item.querySelector('.pub-cites');
      if (!titleEl || !cites || cites.classList.contains('pub-cites-na')) return;
      var hint = item.getAttribute('data-scholar-title');
      var match = findPub(pubs, hint || titleEl.textContent);
      if (!match) return;
      setBadgeText(cites, 'Cited by ' + match.cited_by);
      cites.title = 'Google Scholar, updated ' + data.updated;
    });

    var src = document.getElementById('metrics-source');
    if (src) {
      var link = document.createElement('a');
      link.href = data.profile_url;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = 'Google Scholar';
      src.textContent = 'Source: ';
      src.appendChild(link);
      src.appendChild(document.createTextNode(' · updated ' + data.updated));
      src.hidden = false;
    }
  }

  if (!window.fetch) return;
  fetch('assets/data/scholar.json', { cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) { if (data && data.metrics) apply(data); })
    .catch(function () { /* keep fallback numbers */ });
})();
