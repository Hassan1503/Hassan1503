(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function isDark() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  }

  // ── Sticky nav background on scroll ──
  var nav = document.getElementById('topnav');
  var backTop = document.getElementById('back-to-top');
  function onScroll() {
    var y = window.scrollY;
    if (y > 40) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
    if (y > 600) {
      backTop.classList.add('visible');
    } else {
      backTop.classList.remove('visible');
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ── Back to top ──
  backTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  });

  // ── Mobile nav toggle ──
  var navToggle = document.getElementById('nav-toggle');
  var navList = document.getElementById('nav-list');
  navToggle.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  navList.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') {
      nav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });

  // ── Theme toggle (light default; stored theme applied by inline head script) ──
  var themeToggle = document.getElementById('theme-toggle');
  function syncThemeToggle() {
    var dark = isDark();
    themeToggle.setAttribute('aria-pressed', dark ? 'true' : 'false');
    themeToggle.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
  }
  syncThemeToggle();
  themeToggle.addEventListener('click', function () {
    var next = isDark() ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    syncThemeToggle();
  });

  // ── Active nav highlight (scroll spy) ──
  var navLinks = Array.from(document.querySelectorAll('nav ul li a[href^="#"]'));
  var sectionIds = navLinks.map(function (a) { return a.getAttribute('href').slice(1); });
  var sections = sectionIds
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);

  function setActive(id) {
    navLinks.forEach(function (a) {
      a.classList.toggle('nav-active', a.getAttribute('href') === '#' + id);
    });
  }
  navLinks.forEach(function (a) {
    a.addEventListener('click', function () {
      setActive(a.getAttribute('href').slice(1));
    });
  });

  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        // Entering the hero clears all highlights ('hero' matches no nav link)
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });
    sections.forEach(function (s) { spy.observe(s); });
    var hero = document.getElementById('hero');
    if (hero) spy.observe(hero);
  }

  // ── Scroll reveal ──
  var revealTargets = document.querySelectorAll(
    'section .container > h2, section .container > p, section .container > .prose, ' +
    'section .container > .card-grid, section .container > .topic-item, ' +
    'section .container > .pub-list, section .container > .pub-filters, ' +
    'section .container > .timeline, section .container > .dates-timeline, ' +
    'section .container > .skills-grid, section .container > .contact-list, ' +
    'section .container > .metrics-strip'
  );
  revealTargets.forEach(function (el) { el.classList.add('reveal'); });

  if ('IntersectionObserver' in window) {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObs.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
    revealTargets.forEach(function (el) { revealObs.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('visible'); });
  }

  // ── Animated citation counters ──
  var statNums = document.querySelectorAll('.metric-num');
  function setInstantly(el) {
    el.textContent = el.getAttribute('data-count');
  }
  if (statNums.length && 'IntersectionObserver' in window && !reducedMotion) {
    var statObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        statObs.unobserve(entry.target);
        var target = parseInt(entry.target.getAttribute('data-count'), 10) || 0;
        var t0 = null, dur = 900;
        function step(ts) {
          if (t0 === null) t0 = ts;
          var p = Math.min((ts - t0) / dur, 1);
          entry.target.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.4 });
    statNums.forEach(function (n) { statObs.observe(n); });
  } else {
    statNums.forEach(setInstantly);
  }

  // ── Publication filter ──
  var pubTabs = document.querySelectorAll('.pub-tab');
  var pubItems = document.querySelectorAll('.pub-item');
  pubTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      pubTabs.forEach(function (t) {
        t.classList.remove('active');
        t.setAttribute('aria-pressed', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-pressed', 'true');
      var filter = tab.getAttribute('data-filter');
      pubItems.forEach(function (item) {
        var year = item.getAttribute('data-year');
        if (filter === 'all' || year === filter) {
          item.classList.remove('hidden');
        } else {
          item.classList.add('hidden');
        }
      });
    });
  });

  // ── Footer year ──
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
