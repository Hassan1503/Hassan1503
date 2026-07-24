(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Sticky nav background on scroll ──
  var nav = document.getElementById('topnav');
  var backTop = document.getElementById('back-to-top');
  function onScroll() {
    var y = window.scrollY;
    if (y > 60) {
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

  // ── Theme toggle (stored theme is applied by an inline <head> script) ──
  var themeToggle = document.getElementById('theme-toggle');
  function syncThemeToggle() {
    var light = document.documentElement.getAttribute('data-theme') === 'light';
    themeToggle.setAttribute('aria-pressed', light ? 'true' : 'false');
    themeToggle.setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme');
  }
  syncThemeToggle();
  themeToggle.addEventListener('click', function () {
    var current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    var next = current === 'light' ? 'dark' : 'light';
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
    'section .container > h2, section .container > p, section .container > .highlight-card, ' +
    'section .container > .card-grid, section .container > .topic-item, ' +
    'section .container > .pub-list, section .container > .pub-filters, ' +
    'section .container > .timeline, section .container > .dates-timeline, ' +
    'section .container > .skills-grid, section .container > .contact-grid, ' +
    'section .container > .stat-strip, section .container > .metrics-strip'
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

  // ── Hero typing effect ──
  var subtitle = document.getElementById('typed-subtitle');
  if (subtitle) {
    var phrases = [
      'PhD Candidate · Duke ECE',
      'Signal Processing & Healthcare AI',
      'Pediatric CHD Detection from PCG',
      'Multi-Agent RAG · Multimodal LLMs'
    ];
    var pi = 0, ci = 0, deleting = false;
    function type() {
      var phrase = phrases[pi];
      if (!deleting) {
        ci++;
        subtitle.textContent = phrase.slice(0, ci);
        if (ci === phrase.length) {
          deleting = true;
          return setTimeout(type, 1800);
        }
        return setTimeout(type, 55);
      }
      ci--;
      subtitle.textContent = phrase.slice(0, ci);
      if (ci === 0) {
        deleting = false;
        pi = (pi + 1) % phrases.length;
        return setTimeout(type, 280);
      }
      setTimeout(type, 28);
    }
    if (!reducedMotion) {
      setTimeout(type, 600);
    }
  }

  // ── 3D tilt cards (hover-capable pointers only) ──
  var canTilt = window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reducedMotion;
  if (canTilt) {
    document.querySelectorAll('.tilt').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        // Fresh rect each move: scrolling or filter reflows move the element
        var rect = el.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width;
        var py = (e.clientY - rect.top) / rect.height;
        el.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
        el.style.transform =
          'perspective(800px)' +
          ' rotateX(' + ((0.5 - py) * 6).toFixed(2) + 'deg)' +
          ' rotateY(' + ((px - 0.5) * 8).toFixed(2) + 'deg)' +
          ' translateY(-2px)';
      });
      el.addEventListener('pointerleave', function () {
        el.style.transform = '';
      });
    });
  }

  // ── Animated stat counters ──
  var statNums = document.querySelectorAll('.stat-num, .metric-num');
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
