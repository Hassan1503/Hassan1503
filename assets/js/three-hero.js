/* 3D hero background: a flowing phonocardiogram-style particle waveform.
   Degrades gracefully — if Three.js or WebGL is unavailable, the CSS
   gradient + grid backdrop remains and the page works untouched. */
(function () {
  'use strict';

  var canvas = document.getElementById('hero-canvas');
  var hero = document.getElementById('hero');
  var hint = document.getElementById('hero-hint');
  if (!canvas || !hero || typeof THREE === 'undefined') return;

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isCoarse = window.matchMedia('(pointer: coarse)').matches;
  var isSmall = window.matchMedia('(max-width: 768px)').matches;
  var lite = isCoarse || isSmall;

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch (e) {
    canvas.parentNode.removeChild(canvas);
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.set(0, 2.4, 8);
  camera.lookAt(0, 0.4, 0);

  var world = new THREE.Group();
  scene.add(world);

  var palettes = {
    dark: { base: 0x6c63ff, peak: 0x00d4aa, hot: 0xff6b6b, star: 0x8892a4, opacity: 0.85, additive: true },
    light: { base: 0x5a52e0, peak: 0x00a387, hot: 0xe94e4e, star: 0x5a6478, opacity: 0.5, additive: false }
  };
  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }

  /* ── Waveform surface of points ── */
  var COLS = lite ? 90 : 150;
  var ROWS = lite ? 34 : 56;
  var W = 22, D = 12;
  var count = COLS * ROWS;
  var positions = new Float32Array(count * 3);
  var colors = new Float32Array(count * 3);
  var geometry = new THREE.BufferGeometry();

  for (var r = 0; r < ROWS; r++) {
    for (var c = 0; c < COLS; c++) {
      var i = (r * COLS + c) * 3;
      positions[i] = (c / (COLS - 1) - 0.5) * W;
      positions[i + 1] = 0;
      positions[i + 2] = -(r / (ROWS - 1)) * D + 2.5;
    }
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3).setUsage(THREE.DynamicDrawUsage));

  var pointsMaterial = new THREE.PointsMaterial({
    size: lite ? 0.06 : 0.05,
    vertexColors: true,
    transparent: true,
    opacity: palettes.dark.opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true
  });
  var points = new THREE.Points(geometry, pointsMaterial);
  points.position.y = -0.6;
  world.add(points);

  /* ── Drifting ambient particles ── */
  var STARS = lite ? 140 : 320;
  var starPos = new Float32Array(STARS * 3);
  for (var s = 0; s < STARS; s++) {
    starPos[s * 3] = (Math.random() - 0.5) * 30;
    starPos[s * 3 + 1] = Math.random() * 9 - 1.5;
    starPos[s * 3 + 2] = (Math.random() - 0.5) * 18 - 2;
  }
  var starsGeo = new THREE.BufferGeometry();
  starsGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  var starsMaterial = new THREE.PointsMaterial({
    size: 0.035,
    color: palettes.dark.star,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    sizeAttenuation: true
  });
  var stars = new THREE.Points(starsGeo, starsMaterial);
  world.add(stars);

  var colBase = new THREE.Color(), colPeak = new THREE.Color(), colHot = new THREE.Color();
  function applyPalette() {
    var p = palettes[currentTheme()];
    colBase.setHex(p.base);
    colPeak.setHex(p.peak);
    colHot.setHex(p.hot);
    starsMaterial.color.setHex(p.star);
    pointsMaterial.opacity = p.opacity;
    pointsMaterial.blending = p.additive ? THREE.AdditiveBlending : THREE.NormalBlending;
    pointsMaterial.needsUpdate = true;
    if (reducedMotion) renderStatic();
  }

  /* PCG "lub-dub": an S1 burst followed by a softer, higher-pitched S2,
     repeating with period P — the classic heart-sound envelope. */
  var P = 7.0;
  function pcg(u) {
    var m = u % P;
    if (m < 0) m += P;
    var d1 = m - 1.0;
    var s1 = Math.exp(-d1 * d1 * 22) * Math.sin(m * 34) * 1.35;
    var d2 = m - 2.1;
    var s2 = Math.exp(-d2 * d2 * 30) * Math.sin(m * 46) * 0.9;
    return s1 + s2;
  }

  var tmpColor = new THREE.Color();
  function updateWave(t) {
    var pos = geometry.attributes.position.array;
    var col = geometry.attributes.color.array;
    for (var r = 0; r < ROWS; r++) {
      var depthFade = 1 - r / (ROWS - 1);
      var envelope = 0.25 + 0.75 * depthFade * depthFade;
      var rowPhase = r * 0.35;
      for (var c = 0; c < COLS; c++) {
        var i = (r * COLS + c) * 3;
        var x = pos[i];
        var y = pcg(x * 0.9 + t * 2.2 + rowPhase) * envelope;
        y += Math.sin(x * 0.55 + t * 0.9 + r * 0.4) * 0.1;
        pos[i + 1] = y;

        var a = Math.min(Math.abs(y) / 1.3, 1);
        if (a < 0.55) {
          tmpColor.copy(colBase).lerp(colPeak, a / 0.55);
        } else {
          tmpColor.copy(colPeak).lerp(colHot, (a - 0.55) / 0.45);
        }
        var fade = 0.35 + 0.65 * depthFade;
        col[i] = tmpColor.r * fade;
        col[i + 1] = tmpColor.g * fade;
        col[i + 2] = tmpColor.b * fade;
      }
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
  }

  function resize() {
    var w = hero.clientWidth, h = hero.clientHeight;
    if (!w || !h) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (reducedMotion) renderStatic();
  }
  window.addEventListener('resize', resize);

  /* ── Cursor parallax ── */
  var targetRX = 0, targetRY = 0;
  if (!isCoarse && !reducedMotion) {
    window.addEventListener('pointermove', function (e) {
      targetRY = (e.clientX / window.innerWidth - 0.5) * 0.22;
      targetRX = (e.clientY / window.innerHeight - 0.5) * 0.12;
    }, { passive: true });
  }

  /* ── Animation loop, paused when hidden or scrolled away ── */
  var running = !document.hidden, inView = true, rafId = null;
  var clock = new THREE.Clock();
  var elapsed = 0;

  function frame() {
    rafId = null;
    if (!running || !inView) return;
    elapsed += Math.min(clock.getDelta(), 0.05);
    updateWave(elapsed);
    stars.rotation.y = elapsed * 0.02;
    world.rotation.y += (targetRY - world.rotation.y) * 0.045;
    world.rotation.x += (targetRX - world.rotation.x) * 0.045;
    renderer.render(scene, camera);
    rafId = requestAnimationFrame(frame);
  }
  function start() {
    if (reducedMotion) return;
    if (!rafId && running && inView) {
      clock.getDelta();
      rafId = requestAnimationFrame(frame);
    }
  }
  function renderStatic() {
    updateWave(1.6);
    renderer.render(scene, camera);
  }

  document.addEventListener('visibilitychange', function () {
    running = !document.hidden;
    start();
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      inView = entries[entries.length - 1].isIntersecting;
      start();
    }, { threshold: 0.02 }).observe(hero);
  }
  if (typeof MutationObserver !== 'undefined') {
    new MutationObserver(applyPalette).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
  }

  applyPalette();
  resize();

  if (reducedMotion) {
    renderStatic();
  } else {
    start();
    if (hint && !isCoarse) hint.hidden = false;
  }
})();
