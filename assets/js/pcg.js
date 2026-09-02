/* Interactive figure: a synthetic pediatric phonocardiogram (heart-sound)
   trace, the kind of signal the research classifies. Play scrolls the
   trace at real time; "Show S1 / S2" shades the two heart sounds. Pure
   Canvas 2D, no dependencies; renders a static frame under
   prefers-reduced-motion. */
(function () {
  'use strict';
  var canvas = document.getElementById('pcg-canvas');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var playBtn = document.getElementById('pcg-play');
  var segToggle = document.getElementById('pcg-segments');
  var bpmEl = document.getElementById('pcg-bpm');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var BPM = 72;
  var CYCLE = 60 / BPM;              // seconds per heartbeat
  var WINDOW = 3.0;                  // seconds visible
  var S1 = { start: 0.00, dur: 0.12, f1: 38, f2: 75, amp: 1.0, tau: 0.032 };
  var S2 = { start: 0.31, dur: 0.09, f1: 62, f2: 118, amp: 0.62, tau: 0.022 };

  // Deterministic "noise" so the trace looks recorded, not drawn.
  function noise(t) {
    return 0.035 * (Math.sin(t * 431.7) * Math.sin(t * 97.3) + 0.5 * Math.sin(t * 1231.1));
  }
  function burst(tc, s) {
    var u = tc - s.start;
    if (u < 0 || u > s.dur) return 0;
    var env = Math.exp(-u / s.tau) * Math.sin(Math.PI * u / s.dur);
    return s.amp * env * (0.7 * Math.sin(2 * Math.PI * s.f1 * u) + 0.3 * Math.sin(2 * Math.PI * s.f2 * u));
  }
  function sample(t) {
    var tc = t % CYCLE;
    return burst(tc, S1) + burst(tc, S2) + noise(t);
  }

  var css = getComputedStyle(document.documentElement);
  function color(name, fallback) { return (css.getPropertyValue(name) || fallback).trim(); }
  function palette() {
    css = getComputedStyle(document.documentElement);
    return {
      trace: color('--accent', '#1e429f'),
      grid: color('--border', '#e3e4de'),
      muted: color('--muted', '#4b5565'),
      s1: 'rgba(30, 66, 159, 0.10)',
      s2: 'rgba(15, 118, 110, 0.12)',
      s1Text: color('--accent', '#1e429f'),
      s2Text: color('--accent2', '#0f766e')
    };
  }

  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  function resize() {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(now);
  }

  var now = 0, playing = false, last = null, raf = null;

  function draw(t) {
    var w = canvas.clientWidth, h = canvas.clientHeight, p = palette();
    var mid = h * 0.52, gain = h * 0.36, pad = 8;
    ctx.clearRect(0, 0, w, h);

    // grid
    ctx.strokeStyle = p.grid; ctx.lineWidth = 1;
    for (var gx = 0; gx <= WINDOW; gx += 0.5) {
      var x = pad + (gx / WINDOW) * (w - 2 * pad);
      ctx.beginPath(); ctx.moveTo(x, 6); ctx.lineTo(x, h - 18); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(pad, mid); ctx.lineTo(w - pad, mid); ctx.stroke();

    var t0 = t - WINDOW;
    // shaded S1/S2 windows
    if (segToggle && segToggle.checked) {
      var firstBeat = Math.floor(t0 / CYCLE) * CYCLE;
      for (var b = firstBeat; b < t; b += CYCLE) {
        [[S1, p.s1, 'S1', p.s1Text], [S2, p.s2, 'S2', p.s2Text]].forEach(function (seg) {
          var a = b + seg[0].start, e = a + seg[0].dur;
          if (e < t0 || a > t) return;
          var xa = pad + ((Math.max(a, t0) - t0) / WINDOW) * (w - 2 * pad);
          var xe = pad + ((Math.min(e, t) - t0) / WINDOW) * (w - 2 * pad);
          ctx.fillStyle = seg[1];
          ctx.fillRect(xa, 6, Math.max(xe - xa, 1), h - 24);
          if (xe - xa > 14 && a >= t0) {
            ctx.fillStyle = seg[3]; ctx.font = '600 11px Inter, sans-serif';
            ctx.fillText(seg[2], xa + 3, 17);
          }
        });
      }
    }

    // trace
    ctx.strokeStyle = p.trace; ctx.lineWidth = 1.6; ctx.lineJoin = 'round';
    ctx.beginPath();
    var n = Math.max(200, Math.floor(w * 1.5));
    for (var i = 0; i <= n; i++) {
      var tt = t0 + (i / n) * WINDOW;
      var xx = pad + (i / n) * (w - 2 * pad);
      var yy = mid - sample(tt) * gain;
      if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
    }
    ctx.stroke();

    // axis label
    ctx.fillStyle = p.muted; ctx.font = '11px Inter, sans-serif';
    ctx.fillText('0 s', pad, h - 5);
    ctx.fillText(WINDOW.toFixed(0) + ' s', w - pad - 18, h - 5);
  }

  function frame(ts) {
    if (last === null) last = ts;
    now += Math.min((ts - last) / 1000, 0.05);
    last = ts;
    draw(now);
    raf = playing ? requestAnimationFrame(frame) : null;
  }
  function setPlaying(on) {
    playing = on; last = null;
    if (playBtn) {
      playBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      playBtn.textContent = on ? 'Pause' : 'Play';
    }
    if (on && !raf) raf = requestAnimationFrame(frame);
  }

  if (playBtn) playBtn.addEventListener('click', function () { setPlaying(!playing); });
  if (segToggle) segToggle.addEventListener('change', function () { draw(now); });
  if (bpmEl) bpmEl.textContent = BPM + ' bpm';
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', function () { if (document.hidden && playing) setPlaying(false); });
  new MutationObserver(function () { draw(now); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  now = WINDOW;      // start with a full trace on screen
  resize();
  if (reduced && playBtn) {
    playBtn.disabled = true;
    playBtn.title = 'Animation disabled by your reduced-motion setting';
  }
})();
