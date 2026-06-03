/* ============================================================
   PERFIMMO — main.js
   ============================================================ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- NAV ---------- */
  var nav = document.querySelector('.nav');
  var burger = document.querySelector('.burger');
  var mobileMenu = document.querySelector('.mobile-menu');

  function onScroll() {
    if (window.scrollY > 30) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function closeMenu() {
    burger.classList.remove('open');
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
  }
  if (burger) {
    burger.addEventListener('click', function () {
      var open = burger.classList.toggle('open');
      mobileMenu.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
  }
  document.querySelectorAll('.mobile-menu a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', closeMenu);
  });

  /* ---------- SCROLL REVEAL ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- METHOD TIMELINE PROGRESS + STEP ACTIVATION ---------- */
  var timeline = document.querySelector('.timeline');
  var steps = Array.prototype.slice.call(document.querySelectorAll('.step'));
  var track = document.querySelector('.progress-track');

  function updateTimeline() {
    if (!timeline) return;
    var rect = timeline.getBoundingClientRect();
    var vh = window.innerHeight;
    var trigger = vh * 0.55;
    // progress fill
    var total = rect.height;
    var passed = Math.min(Math.max(trigger - rect.top, 0), total);
    if (track) track.style.height = passed + 'px';
    // activate steps whose dot passed the trigger
    steps.forEach(function (s) {
      var dr = s.querySelector('.dot').getBoundingClientRect();
      if (dr.top + dr.height / 2 < trigger) s.classList.add('active');
      else s.classList.remove('active');
    });
  }
  window.addEventListener('scroll', updateTimeline, { passive: true });
  window.addEventListener('resize', updateTimeline);
  updateTimeline();

  /* ---------- CARD 3D TILT ---------- */
  if (!reduced && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.card').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        var rx = (py - 0.5) * -7;
        var ry = (px - 0.5) * 9;
        card.style.transform = 'perspective(1000px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) translateY(-6px)';
        card.style.setProperty('--mx', (px * 100) + '%');
        card.style.setProperty('--my', (py * 100) + '%');
      });
      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
      });
    });
  }

  /* ---------- CONTACT FORM ---------- */
  var form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var valid = true;
      form.querySelectorAll('[data-required]').forEach(function (input) {
        var field = input.closest('.field');
        var ok = input.value.trim() !== '';
        if (input.type === 'email') ok = ok && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value);
        field.classList.toggle('invalid', !ok);
        if (!ok) valid = false;
      });
      if (!valid) {
        var firstErr = form.querySelector('.field.invalid');
        if (firstErr) firstErr.scrollIntoView ? null : null; // no scrollIntoView per guidelines
        return;
      }
      // Build a mailto fallback so the form is functional without a backend.
      var data = new FormData(form);
      var subject = 'Demande Perfimmo — ' + (data.get('agence') || data.get('prenom') || '');
      var lines = [
        'Prénom : ' + (data.get('prenom') || ''),
        'Nom : ' + (data.get('nom') || ''),
        'Email : ' + (data.get('email') || ''),
        'Téléphone : ' + (data.get('telephone') || ''),
        'Agence : ' + (data.get('agence') || ''),
        'Nombre d\'agents : ' + (data.get('agents') || ''),
        '',
        'Message :',
        (data.get('message') || '')
      ];
      var mailto = 'mailto:contact@perfimmo.fr?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(lines.join('\n'));

      // Show success state
      form.style.display = 'none';
      var success = document.getElementById('form-success');
      if (success) success.classList.add('show');

      // Fire the mailto (and a fictional endpoint, silently)
      try {
        fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(Object.fromEntries(data.entries()))
        }).catch(function () {});
      } catch (err) {}
      window.location.href = mailto;
    });

    // clear invalid on input
    form.querySelectorAll('[data-required]').forEach(function (input) {
      input.addEventListener('input', function () {
        input.closest('.field').classList.remove('invalid');
      });
    });
  }

  /* ---------- HERO: THREE.JS NETWORK ---------- */
  function initHero() {
    var canvas = document.getElementById('hero-canvas');
    if (!canvas) return;
    if (reduced || typeof THREE === 'undefined') { staticFallback(canvas); return; }

    var renderer, scene, camera, points, lines, raf;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    } catch (e) { staticFallback(canvas); return; }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    camera.position.z = 30;

    var GOLD = new THREE.Color('#C9A84C');
    var LIGHT = new THREE.Color('#7FA6D9');

    // --- nodes ---
    var N = window.innerWidth < 700 ? 46 : 80;
    var R = 22;
    var positions = [];
    var velocities = [];
    var nodeColors = [];
    for (var i = 0; i < N; i++) {
      // distribute in a rough sphere shell + interior
      var u = Math.random(), v = Math.random();
      var theta = u * Math.PI * 2, phi = Math.acos(2 * v - 1);
      var rad = R * (0.45 + Math.random() * 0.55);
      var x = rad * Math.sin(phi) * Math.cos(theta);
      var y = rad * Math.sin(phi) * Math.sin(theta) * 0.78;
      var z = rad * Math.cos(phi);
      positions.push(x, y, z);
      velocities.push((Math.random() - 0.5) * 0.012, (Math.random() - 0.5) * 0.012, (Math.random() - 0.5) * 0.012);
      var c = Math.random() < 0.34 ? GOLD : LIGHT;
      nodeColors.push(c.r, c.g, c.b);
    }

    // --- node sprite (soft glow) ---
    var sprite = makeGlowTexture();
    var pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions.slice(), 3));
    pGeo.setAttribute('color', new THREE.Float32BufferAttribute(nodeColors, 3));
    var pMat = new THREE.PointsMaterial({
      size: 1.5, map: sprite, vertexColors: true, transparent: true,
      depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true, opacity: 0.95
    });
    points = new THREE.Points(pGeo, pMat);
    scene.add(points);

    // --- connection lines ---
    var lineGeo = new THREE.BufferGeometry();
    var MAXLINKS = N * 6;
    var linePos = new Float32Array(MAXLINKS * 6);
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
    var lineMat = new THREE.LineBasicMaterial({ color: 0xC9A84C, transparent: true, opacity: 0.14, blending: THREE.AdditiveBlending, depthWrite: false });
    lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);

    var posAttr = pGeo.getAttribute('position');
    var DIST = 9.2, DIST2 = DIST * DIST;
    var mouse = { x: 0, y: 0, tx: 0, ty: 0 };

    function rebuildLinks() {
      var arr = posAttr.array;
      var k = 0;
      for (var a = 0; a < N; a++) {
        var ax = arr[a*3], ay = arr[a*3+1], az = arr[a*3+2];
        for (var b = a + 1; b < N; b++) {
          var dx = ax - arr[b*3], dy = ay - arr[b*3+1], dz = az - arr[b*3+2];
          var d2 = dx*dx + dy*dy + dz*dz;
          if (d2 < DIST2 && k < MAXLINKS) {
            linePos[k*6]=ax; linePos[k*6+1]=ay; linePos[k*6+2]=az;
            linePos[k*6+3]=arr[b*3]; linePos[k*6+4]=arr[b*3+1]; linePos[k*6+5]=arr[b*3+2];
            k++;
          }
        }
      }
      lineGeo.setDrawRange(0, k * 2);
      lineGeo.getAttribute('position').needsUpdate = true;
    }

    var t = 0;
    function animate() {
      t += 0.01;
      var arr = posAttr.array;
      for (var i = 0; i < N; i++) {
        arr[i*3]   += velocities[i*3];
        arr[i*3+1] += velocities[i*3+1];
        arr[i*3+2] += velocities[i*3+2];
        for (var ax = 0; ax < 3; ax++) {
          var idx = i*3+ax;
          if (arr[idx] > R || arr[idx] < -R) velocities[idx] *= -1;
        }
      }
      posAttr.needsUpdate = true;
      rebuildLinks();

      // gentle pulse on node size
      pMat.size = 1.42 + Math.sin(t) * 0.18;
      lineMat.opacity = 0.12 + (Math.sin(t * 0.8) + 1) * 0.03;

      // slow auto-rotate + subtle mouse parallax
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;
      var group = points.rotation;
      points.rotation.y = lines.rotation.y = t * 0.06 + mouse.x * 0.4;
      points.rotation.x = lines.rotation.x = mouse.y * 0.25;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    }

    function resize() {
      var w = canvas.clientWidth || window.innerWidth;
      var h = canvas.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // fit camera distance to viewport
      camera.position.z = w < 700 ? 40 : 30;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);
    resize();

    window.addEventListener('mousemove', function (e) {
      mouse.tx = (e.clientX / window.innerWidth - 0.5);
      mouse.ty = (e.clientY / window.innerHeight - 0.5);
    });

    // pause when hero off-screen
    var heroEl = document.querySelector('.hero');
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { if (!raf) raf = requestAnimationFrame(animate); }
          else { cancelAnimationFrame(raf); raf = null; }
        });
      }, { threshold: 0 }).observe(heroEl);
    }
    animate();
  }

  function makeGlowTexture() {
    var c = document.createElement('canvas');
    c.width = c.height = 64;
    var ctx = c.getContext('2d');
    var g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.2, 'rgba(255,255,255,0.9)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.25)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    var tex = new THREE.Texture(c);
    tex.needsUpdate = true;
    return tex;
  }

  function staticFallback(canvas) {
    // simple 2D dotted network so non-WebGL/reduced still looks intentional
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    function draw() {
      var w = canvas.width = canvas.clientWidth;
      var h = canvas.height = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      var pts = [];
      var seed = 7;
      function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
      for (var i = 0; i < 40; i++) pts.push({ x: rnd() * w, y: rnd() * h });
      ctx.strokeStyle = 'rgba(201,168,76,0.12)';
      for (var a = 0; a < pts.length; a++) for (var b = a + 1; b < pts.length; b++) {
        var dx = pts[a].x - pts[b].x, dy = pts[a].y - pts[b].y;
        if (dx*dx + dy*dy < 26000) { ctx.beginPath(); ctx.moveTo(pts[a].x, pts[a].y); ctx.lineTo(pts[b].x, pts[b].y); ctx.stroke(); }
      }
      pts.forEach(function (p, i) {
        ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, 7); ctx.fillStyle = i % 3 === 0 ? '#C9A84C' : 'rgba(127,166,217,0.8)'; ctx.fill();
      });
    }
    draw();
    window.addEventListener('resize', draw);
  }

  /* ---------- WHY: PERFORMANCE DIAGRAM (canvas) ---------- */
  function initPerfDiagram() {
    var canvas = document.getElementById('perf-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio, 2);
    var W, H, anim = 0, started = false;

    function size() {
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();
    window.addEventListener('resize', function () { size(); render(1); });

    // ascending performance bars + rising curve
    var bars = [0.28, 0.42, 0.38, 0.55, 0.68, 0.82, 0.95];
    function render(p) {
      ctx.clearRect(0, 0, W, H);
      var padX = W * 0.12, padB = H * 0.16, padT = H * 0.18;
      var plotW = W - padX * 2, plotH = H - padB - padT;
      var bw = plotW / bars.length * 0.5;
      var gap = plotW / bars.length;

      // grid
      ctx.strokeStyle = 'rgba(248,246,241,0.06)';
      ctx.lineWidth = 1;
      for (var g = 0; g <= 4; g++) {
        var y = padT + plotH * (g / 4);
        ctx.beginPath(); ctx.moveTo(padX, y); ctx.lineTo(W - padX, y); ctx.stroke();
      }

      // bars
      bars.forEach(function (b, i) {
        var bh = plotH * b * p;
        var x = padX + gap * i + (gap - bw) / 2;
        var y = padT + plotH - bh;
        var grad = ctx.createLinearGradient(0, y, 0, y + bh);
        var top = i >= bars.length - 2 ? '#E0C26B' : 'rgba(201,168,76,0.55)';
        grad.addColorStop(0, top);
        grad.addColorStop(1, 'rgba(201,168,76,0.05)');
        ctx.fillStyle = grad;
        roundRect(ctx, x, y, bw, bh, 3); ctx.fill();
      });

      // rising line
      ctx.beginPath();
      bars.forEach(function (b, i) {
        var x = padX + gap * i + gap / 2;
        var y = padT + plotH - plotH * b * p;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = '#E0C26B'; ctx.lineWidth = 2; ctx.lineJoin = 'round';
      ctx.shadowColor = 'rgba(201,168,76,0.6)'; ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // end node
      var lx = padX + gap * (bars.length - 1) + gap / 2;
      var ly = padT + plotH - plotH * bars[bars.length - 1] * p;
      ctx.beginPath(); ctx.arc(lx, ly, 5, 0, 7); ctx.fillStyle = '#E0C26B'; ctx.fill();
      ctx.beginPath(); ctx.arc(lx, ly, 10, 0, 7); ctx.strokeStyle = 'rgba(224,194,107,0.4)'; ctx.lineWidth = 1.5; ctx.stroke();

      // arrow label
      ctx.fillStyle = 'rgba(248,246,241,0.85)';
      ctx.font = '600 13px Inter, sans-serif';
      ctx.fillText('+ Ventes récupérées', padX, padT - 8);
    }

    function play() {
      var start = null;
      function frame(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / 1100, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        render(eased);
        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    // draw a baseline immediately so the canvas is never blank (print/jump/edge cases)
    render(reduced ? 1 : 0.001);
    if (reduced) { render(1); return; }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting && !started) { started = true; play(); }
        });
      }, { threshold: 0.25 }).observe(canvas);
      // safety fallback: if never triggered (e.g. printed/exported), fill in after a beat
      setTimeout(function () { if (!started) { started = true; render(1); } }, 2500);
    } else { render(1); }
  }

  function roundRect(ctx, x, y, w, h, r) {
    if (h < r) r = h;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, 0);
    ctx.arcTo(x, y + h, x, y, 0);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /* ---------- INIT ---------- */
  function boot() {
    initHero();
    initPerfDiagram();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
