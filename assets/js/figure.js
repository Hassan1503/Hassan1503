/* Figure 1 — a synthetic pediatric phonocardiogram (PCG).
   Renders the heart-sound signal this research classifies: S1 and S2 per
   cardiac cycle, with an optional systolic murmur of the kind a ventricular
   septal defect produces. Colours are read from CSS custom properties so the
   figure follows the page theme. Canvas 2D only, no dependencies. */
(function () {
  'use strict';

  var canvas = document.getElementById('pcg');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var ui = {
    play: document.getElementById('pcg-play'),
    murmur: document.getElementById('pcg-murmur'),
    label: document.getElementById('pcg-label')
  };

  var BPM = 96;                 // paediatric resting rate
  var CYCLE = 60 / BPM;
  var WINDOW = 2.6;             // seconds visible

  // S1: mitral+tricuspid closure, lower frequency, longer.
  // S2: aortic+pulmonary closure, higher frequency, shorter, ~0.34 of cycle later.
  var S1 = { at: 0.00, dur: 0.11, f1: 36, f2: 72, amp: 1.00, tau: 0.030 };
  var S2 = { at: 0.34, dur: 0.08, f1: 58, f2: 115, amp: 0.66, tau: 0.020 };
  // Systolic murmur: band-limited noise filling systole between S1 and S2.
  var MUR = { from: 0.11, to: 0.33, amp: 0.30 };
  // Loudest excursion the model can produce is ~0.30 of the raw scale (a murmur
  // at full crescendo; S1 peaks at ~0.263). Normalising by it fills the frame
  // without ever clipping, and keeps the two sounds in their true proportion.
  var NORM = 1 / 0.30;

  function rnd(t) {   // deterministic pseudo-noise, stable across redraws
    var x = Math.sin(t * 12543.7) * 43758.5453;
    return (x - Math.floor(x)) * 2 - 1;
  }
  function burst(tc, s) {
    var u = tc - s.at;
    if (u < 0 || u > s.dur) return 0;
    var env = Math.exp(-u / s.tau) * Math.sin(Math.PI * u / s.dur);
    return s.amp * env * (0.72 * Math.sin(2 * Math.PI * s.f1 * u) + 0.28 * Math.sin(2 * Math.PI * s.f2 * u));
  }
  function murmur(tc, t) {
    if (!ui.murmur || !ui.murmur.checked) return 0;
    if (tc < MUR.from || tc > MUR.to) return 0;
    var span = (tc - MUR.from) / (MUR.to - MUR.from);
    var env = Math.sin(Math.PI * span);              // crescendo-decrescendo
    return MUR.amp * env * (0.6 * rnd(t * 900) + 0.4 * Math.sin(2 * Math.PI * 170 * t));
  }
  function sample(t) {
    var tc = t % CYCLE;
    return burst(tc, S1) + burst(tc, S2) + murmur(tc, t) + 0.018 * rnd(t * 300);
  }

  function css(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name);
    return (v && v.trim()) || fallback;
  }

  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  function resize() {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(now);
  }

  var now = WINDOW, playing = false, last = null, raf = null;

  function draw(t) {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    var trace = css('--fig-trace', '#1f3d7a');
    var grid = css('--fig-grid', '#e6e5e0');
    var mark = css('--fig-mark', '#8a8a82');
    var band = css('--fig-band', 'rgba(31,61,122,0.07)');
    var padL = 4, padR = 4, mid = h * 0.48, gain = h * 0.40 * NORM, base = h - 24;

    ctx.clearRect(0, 0, w, h);
    var t0 = t - WINDOW;
    var X = function (tt) { return padL + ((tt - t0) / WINDOW) * (w - padL - padR); };

    // baseline grid: one hairline per 0.2 s
    ctx.strokeStyle = grid; ctx.lineWidth = 1;
    var g0 = Math.ceil(t0 / 0.2) * 0.2;
    for (var gx = g0; gx < t; gx += 0.2) {
      var x = Math.round(X(gx)) + 0.5;
      ctx.beginPath(); ctx.moveTo(x, 8); ctx.lineTo(x, base); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(padL, Math.round(mid) + 0.5); ctx.lineTo(w - padR, Math.round(mid) + 0.5); ctx.stroke();

    // shade systole and annotate S1 / S2
    var first = Math.floor(t0 / CYCLE) * CYCLE;
    var shade = !!(ui.murmur && ui.murmur.checked);
    ctx.font = '600 10px ui-monospace, SFMono-Regular, Menlo, monospace';
    for (var b = first; b < t + CYCLE; b += CYCLE) {
      var sa = X(b + MUR.from), sb = X(b + MUR.to);
      if (shade && sb > padL && sa < w - padR) {
        ctx.fillStyle = band;
        ctx.fillRect(Math.max(sa, padL), 8, Math.min(sb, w - padR) - Math.max(sa, padL), base - 8);
      }
      [[S1, 'S1'], [S2, 'S2']].forEach(function (p) {
        var cx = X(b + p[0].at + p[0].dur / 2);
        if (cx < padL + 6 || cx > w - padR - 6) return;
        ctx.fillStyle = mark;
        ctx.fillText(p[1], cx - 7, base + 15);
        ctx.beginPath();
        ctx.moveTo(Math.round(cx) + 0.5, base + 2);
        ctx.lineTo(Math.round(cx) + 0.5, base + 6);
        ctx.strokeStyle = mark; ctx.stroke();
      });
    }

    // the trace itself
    ctx.strokeStyle = trace; ctx.lineWidth = 1.4; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath();
    var n = Math.max(260, Math.floor(w * 2));
    for (var i = 0; i <= n; i++) {
      var tt = t0 + (i / n) * WINDOW;
      var xx = padL + (i / n) * (w - padL - padR);
      var yy = mid - sample(tt) * gain;
      if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
  }

  function frame(ts) {
    raf = null;
    if (!playing) return;
    if (last === null) last = ts;
    now += Math.min((ts - last) / 1000, 0.05);
    last = ts;
    draw(now);
    raf = requestAnimationFrame(frame);
  }
  function setPlaying(on) {
    playing = on; last = null;
    // The label is the state; a second announcement via aria-pressed would
    // contradict it ("Pause, pressed").
    if (ui.play) ui.play.textContent = on ? 'Pause' : 'Play';
    if (on && !raf) raf = requestAnimationFrame(frame);
  }

  if (ui.play) ui.play.addEventListener('click', function () { setPlaying(!playing); });
  if (ui.murmur) ui.murmur.addEventListener('change', function () {
    draw(now);
    if (ui.label) ui.label.textContent = ui.murmur.checked
      ? 'Systolic murmur present — the pattern a septal defect produces'
      : 'Normal heart sounds — S1 and S2, silent systole';
  });
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', function () { if (document.hidden && playing) setPlaying(false); });
  if (typeof MutationObserver !== 'undefined') {
    new MutationObserver(function () { draw(now); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting && playing) setPlaying(false);
    }, { threshold: 0 }).observe(canvas);
  }

  resize();
  if (reduced && ui.play) { ui.play.disabled = true; ui.play.title = 'Animation disabled by your reduced-motion setting'; }
})();
