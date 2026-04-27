(function () {
  'use strict';

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // ── Theme toggle (persistent) ──
  var themeToggle = document.getElementById('theme-toggle');
  var stored = null;
  try { stored = localStorage.getItem('theme'); } catch (e) {}
  if (stored === 'light' || stored === 'dark') {
    document.documentElement.setAttribute('data-theme', stored);
  }
  themeToggle.addEventListener('click', function () {
    var current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    var next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
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
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });
    sections.forEach(function (s) { spy.observe(s); });
  }

  // ── Scroll reveal ──
  var revealTargets = document.querySelectorAll(
    'section .container > h2, section .container > p, section .container > .highlight-card, ' +
    'section .container > .card-grid, section .container > .topic-item, ' +
    'section .container > .pub-list, section .container > .pub-filters, ' +
    'section .container > .timeline, section .container > .dates-timeline, ' +
    'section .container > .skills-grid, section .container > .contact-grid'
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
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTimeout(type, 600);
    }
  }

  // ── Publication filter ──
  var pubTabs = document.querySelectorAll('.pub-tab');
  var pubItems = document.querySelectorAll('.pub-item');
  pubTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      pubTabs.forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
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
