/* ============================================================
   PERFIMMO — main.js (Premium UX edition)
   ============================================================ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- PRELOADER ---------- */
  function initPreloader() {
    var pre = document.getElementById('preloader');
    var fill = document.getElementById('pl-fill');
    var num = document.getElementById('pl-num');
    if (!pre) { document.body.classList.add('loaded'); return; }

    var p = 0;
    var dur = reduced ? 200 : 1150;
    var start = null;
    function tick(ts) {
      if (!start) start = ts;
      var t = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - t, 2);
      p = Math.round(eased * 100);
      if (fill) fill.style.width = p + '%';
      if (num) num.textContent = p;
      if (t < 1) requestAnimationFrame(tick);
      else finish();
    }
    function finish() {
      pre.classList.add('done');
      document.body.classList.add('loaded');
      setTimeout(function () { if (pre && pre.parentNode) pre.style.display = 'none'; }, 850);
    }
    requestAnimationFrame(tick);
    // safety
    setTimeout(function () { if (!document.body.classList.contains('loaded')) finish(); }, 3500);
  }

  /* ---------- CUSTOM CURSOR ---------- */
  function initCursor() {
    if (!canHover || reduced) return;
    var cursor = document.getElementById('cursor');
    if (!cursor) return;
    var dot = cursor.querySelector('.cursor-dot');
    var ring = cursor.querySelector('.cursor-ring');
    cursor.style.display = 'block';
    document.body.classList.add('has-cursor');

    var mx = window.innerWidth / 2, my = window.innerHeight / 2;
    var rx = mx, ry = my;
    window.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px) translate(-50%,-50%)';
    });
    function loop() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px) translate(-50%,-50%)';
      requestAnimationFrame(loop);
    }
    loop();

    var hoverables = 'a, button, [data-magnetic], .faq-q, .card, .pain-card';
    document.querySelectorAll(hoverables).forEach(function (el) {
      el.addEventListener('mouseenter', function () { cursor.classList.add('hovering'); });
      el.addEventListener('mouseleave', function () { cursor.classList.remove('hovering'); });
    });
    document.addEventListener('mouseleave', function () { cursor.style.opacity = '0'; });
    document.addEventListener('mouseenter', function () { cursor.style.opacity = '1'; });
  }

  /* ---------- MAGNETIC BUTTONS ---------- */
  function initMagnetic() {
    if (!canHover || reduced) return;
    document.querySelectorAll('[data-magnetic]').forEach(function (el) {
      var strength = 0.32;
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var x = e.clientX - (r.left + r.width / 2);
        var y = e.clientY - (r.top + r.height / 2);
        el.style.transform = 'translate(' + x * strength + 'px,' + y * strength + 'px)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }

  /* ---------- NAV (scroll state + auto-hide) ---------- */
  function initNav() {
    var nav = document.querySelector('.nav');
    var burger = document.getElementById('burger');
    var mobileMenu = document.getElementById('mobile-menu');
    var lastY = 0;

    function onScroll() {
      var y = window.scrollY;
      if (y > 30) nav.classList.add('scrolled'); else nav.classList.remove('scrolled');
      // auto-hide when scrolling down past hero
      if (y > 600 && y > lastY + 4) nav.classList.add('hidden');
      else if (y < lastY - 4 || y < 200) nav.classList.remove('hidden');
      lastY = y;
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
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
        document.body.style.overflow = open ? 'hidden' : '';
      });
    }
    document.querySelectorAll('.mobile-menu a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', closeMenu);
    });

    // smooth anchor scroll
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id.length < 2) return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        var top = target.getBoundingClientRect().top + window.pageYOffset - 10;
        window.scrollTo({ top: top, behavior: reduced ? 'auto' : 'smooth' });
      });
    });
  }

  /* ---------- SCROLL REVEAL ---------- */
  function initReveal() {
    var revealEls = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && !reduced) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
      revealEls.forEach(function (el) { io.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add('in'); });
    }
  }

  /* ---------- COUNTERS ---------- */
  function initCounters() {
    var nums = document.querySelectorAll('[data-count]');
    if (!nums.length) return;
    function run(el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var suffix = el.getAttribute('data-suffix') || '';
      var prefix = el.getAttribute('data-prefix') || '';
      if (reduced) { el.textContent = prefix + target + suffix; return; }
      var dur = 1400, start = null;
      function frame(ts) {
        if (!start) start = ts;
        var t = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - t, 3);
        var val = Math.round(target * eased);
        el.textContent = prefix + val + suffix;
        if (t < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
        });
      }, { threshold: 0.6 });
      nums.forEach(function (n) { io.observe(n); });
    } else {
      nums.forEach(run);
    }
  }

  /* ---------- FAQ ACCORDION ---------- */
  function initFAQ() {
    var items = document.querySelectorAll('.faq-item');
    items.forEach(function (item) {
      var q = item.querySelector('.faq-q');
      var a = item.querySelector('.faq-a');
      q.addEventListener('click', function () {
        var isOpen = item.classList.contains('open');
        // close others
        items.forEach(function (other) {
          if (other !== item) {
            other.classList.remove('open');
            other.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
            other.querySelector('.faq-a').style.maxHeight = null;
          }
        });
        if (isOpen) {
          item.classList.remove('open');
          q.setAttribute('aria-expanded', 'false');
          a.style.maxHeight = null;
        } else {
          item.classList.add('open');
          q.setAttribute('aria-expanded', 'true');
          a.style.maxHeight = a.scrollHeight + 'px';
        }
      });
    });
    window.addEventListener('resize', function () {
      document.querySelectorAll('.faq-item.open .faq-a').forEach(function (a) {
        a.style.maxHeight = a.scrollHeight + 'px';
      });
    });
  }

  /* ---------- METHOD TIMELINE ---------- */
  function initTimeline() {
    var timeline = document.querySelector('.timeline');
    if (!timeline) return;
    var steps = Array.prototype.slice.call(document.querySelectorAll('.step'));
    var track = document.querySelector('.progress-track');

    function update() {
      var rect = timeline.getBoundingClientRect();
      var vh = window.innerHeight;
      var trigger = vh * 0.55;
      var total = rect.height;
      var passed = Math.min(Math.max(trigger - rect.top, 0), total);
      if (track) track.style.height = passed + 'px';
      steps.forEach(function (s) {
        var dr = s.querySelector('.dot').getBoundingClientRect();
        if (dr.top + dr.height / 2 < trigger) s.classList.add('active');
        else s.classList.remove('active');
      });
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ---------- CARD 3D TILT ---------- */
  function initCardTilt() {
    if (!canHover || reduced) return;
    document.querySelectorAll('.card').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        var rx = (py - 0.5) * -6;
        var ry = (px - 0.5) * 8;
        card.style.transform = 'perspective(1000px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) translateY(-6px)';
        card.style.setProperty('--mx', (px * 100) + '%');
        card.style.setProperty('--my', (py * 100) + '%');
      });
      card.addEventListener('mouseleave', function () { card.style.transform = ''; });
    });
  }

  /* ---------- CONTACT FORM ---------- */
  function initForm() {
    var form = document.getElementById('contact-form');
    if (!form) return;
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
      if (!valid) return;

      // Submit to Netlify Forms (handled server-side, notifies contact@myperfimmo.fr).
      var data = new FormData(form);
      var encoded = new URLSearchParams();
      data.forEach(function (value, key) { encoded.append(key, value); });

      var success = document.getElementById('form-success');
      var submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      fetch('https://formsubmit.co/ajax/contact@myperfimmo.fr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
        body: encoded.toString()
      }).then(function (res) {
        return res.json();
      }).then(function (json) {
        if (!json.success) throw new Error('formsubmit');
        form.style.display = 'none';
        if (success) success.classList.add('show');
      }).catch(function () {
        if (submitBtn) submitBtn.disabled = false;
        window.location.href = 'mailto:contact@myperfimmo.fr?subject=' +
          encodeURIComponent('Demande Perfimmo — ' + (data.get('agence') || data.get('prenom') || '')) +
          '&body=' + encodeURIComponent(
            'Prénom : ' + (data.get('prenom') || '') + '\n' +
            'Nom : ' + (data.get('nom') || '') + '\n' +
            'Email : ' + (data.get('email') || '') + '\n' +
            'Téléphone : ' + (data.get('telephone') || '') + '\n' +
            'Agence : ' + (data.get('agence') || '') + '\n' +
            'Nombre d\'agents : ' + (data.get('agents') || '') + '\n\n' +
            'Message :\n' + (data.get('message') || '')
          );
      });
    });
    form.querySelectorAll('[data-required]').forEach(function (input) {
      input.addEventListener('input', function () { input.closest('.field').classList.remove('invalid'); });
    });
  }

  /* ---------- HERO: THREE.JS NETWORK ---------- */
  function initHero() {
    var canvas = document.getElementById('hero-canvas');
    if (!canvas) return;
    if (reduced || typeof THREE === 'undefined') { staticFallback(canvas); return; }

    var renderer, scene, camera, points, lines, raf;
    try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true }); }
    catch (e) { staticFallback(canvas); return; }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    camera.position.z = 30;

    var GOLD = new THREE.Color('#B0552E');
    var LIGHT = new THREE.Color('#9A8A74');

    var N = window.innerWidth < 700 ? 46 : 80;
    var R = 22;
    var positions = [], velocities = [], nodeColors = [];
    for (var i = 0; i < N; i++) {
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

    var sprite = makeGlowTexture();
    var pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions.slice(), 3));
    pGeo.setAttribute('color', new THREE.Float32BufferAttribute(nodeColors, 3));
    var pMat = new THREE.PointsMaterial({ size: 1.5, map: sprite, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.NormalBlending, sizeAttenuation: true, opacity: 0.9 });
    points = new THREE.Points(pGeo, pMat);
    scene.add(points);

    var lineGeo = new THREE.BufferGeometry();
    var MAXLINKS = N * 6;
    var linePos = new Float32Array(MAXLINKS * 6);
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
    var lineMat = new THREE.LineBasicMaterial({ color: 0xB0552E, transparent: true, opacity: 0.13, blending: THREE.NormalBlending, depthWrite: false });
    lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);

    var posAttr = pGeo.getAttribute('position');
    var DIST = 9.2, DIST2 = DIST * DIST;
    var mouse = { x: 0, y: 0, tx: 0, ty: 0 };

    function rebuildLinks() {
      var arr = posAttr.array, k = 0;
      for (var a = 0; a < N; a++) {
        var ax = arr[a*3], ay = arr[a*3+1], az = arr[a*3+2];
        for (var b = a + 1; b < N; b++) {
          var dx = ax - arr[b*3], dy = ay - arr[b*3+1], dz = az - arr[b*3+2];
          if (dx*dx + dy*dy + dz*dz < DIST2 && k < MAXLINKS) {
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
        arr[i*3] += velocities[i*3]; arr[i*3+1] += velocities[i*3+1]; arr[i*3+2] += velocities[i*3+2];
        for (var ax = 0; ax < 3; ax++) { var idx = i*3+ax; if (arr[idx] > R || arr[idx] < -R) velocities[idx] *= -1; }
      }
      posAttr.needsUpdate = true;
      rebuildLinks();
      pMat.size = 1.42 + Math.sin(t) * 0.18;
      lineMat.opacity = 0.10 + (Math.sin(t * 0.8) + 1) * 0.03;
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;
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
      camera.position.z = w < 700 ? 40 : 30;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);
    resize();
    window.addEventListener('mousemove', function (e) {
      mouse.tx = (e.clientX / window.innerWidth - 0.5);
      mouse.ty = (e.clientY / window.innerHeight - 0.5);
    });

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
    ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
    var tex = new THREE.Texture(c); tex.needsUpdate = true; return tex;
  }

  function staticFallback(canvas) {
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    function draw() {
      var w = canvas.width = canvas.clientWidth;
      var h = canvas.height = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      var pts = [], seed = 7;
      function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
      for (var i = 0; i < 40; i++) pts.push({ x: rnd() * w, y: rnd() * h });
      ctx.strokeStyle = 'rgba(34,28,20,0.10)';
      for (var a = 0; a < pts.length; a++) for (var b = a + 1; b < pts.length; b++) {
        var dx = pts[a].x - pts[b].x, dy = pts[a].y - pts[b].y;
        if (dx*dx + dy*dy < 26000) { ctx.beginPath(); ctx.moveTo(pts[a].x, pts[a].y); ctx.lineTo(pts[b].x, pts[b].y); ctx.stroke(); }
      }
      pts.forEach(function (p, i) { ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, 7); ctx.fillStyle = i % 3 === 0 ? '#B0552E' : 'rgba(154,138,116,0.85)'; ctx.fill(); });
    }
    draw();
    window.addEventListener('resize', draw);
  }

  /* ---------- WHY: PERFORMANCE DIAGRAM ---------- */
  function initPerfDiagram() {
    var canvas = document.getElementById('perf-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio, 2);
    var W, H, started = false;

    function size() {
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();
    window.addEventListener('resize', function () { size(); render(1); });

    var bars = [0.28, 0.42, 0.38, 0.55, 0.68, 0.82, 0.95];
    function render(p) {
      ctx.clearRect(0, 0, W, H);
      var padX = W * 0.12, padB = H * 0.16, padT = H * 0.18;
      var plotW = W - padX * 2, plotH = H - padB - padT;
      var bw = plotW / bars.length * 0.5, gap = plotW / bars.length;

      ctx.strokeStyle = 'rgba(241,235,224,0.07)'; ctx.lineWidth = 1;
      for (var g = 0; g <= 4; g++) { var y = padT + plotH * (g / 4); ctx.beginPath(); ctx.moveTo(padX, y); ctx.lineTo(W - padX, y); ctx.stroke(); }

      bars.forEach(function (b, i) {
        var bh = plotH * b * p;
        var x = padX + gap * i + (gap - bw) / 2;
        var y = padT + plotH - bh;
        var grad = ctx.createLinearGradient(0, y, 0, y + bh);
        grad.addColorStop(0, i >= bars.length - 2 ? '#D9885A' : 'rgba(176,85,46,0.6)');
        grad.addColorStop(1, 'rgba(176,85,46,0.05)');
        ctx.fillStyle = grad; roundRect(ctx, x, y, bw, bh, 3); ctx.fill();
      });

      ctx.beginPath();
      bars.forEach(function (b, i) {
        var x = padX + gap * i + gap / 2;
        var y = padT + plotH - plotH * b * p;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = '#D9885A'; ctx.lineWidth = 2; ctx.lineJoin = 'round';
      ctx.shadowColor = 'rgba(217,136,90,0.55)'; ctx.shadowBlur = 12; ctx.stroke(); ctx.shadowBlur = 0;

      var lx = padX + gap * (bars.length - 1) + gap / 2;
      var ly = padT + plotH - plotH * bars[bars.length - 1] * p;
      ctx.beginPath(); ctx.arc(lx, ly, 5, 0, 7); ctx.fillStyle = '#D9885A'; ctx.fill();
      ctx.beginPath(); ctx.arc(lx, ly, 10, 0, 7); ctx.strokeStyle = 'rgba(217,136,90,0.4)'; ctx.lineWidth = 1.5; ctx.stroke();

      ctx.fillStyle = 'rgba(241,235,224,0.85)'; ctx.font = '600 13px Inter, sans-serif';
      ctx.fillText('+ Ventes récupérées', padX, padT - 8);
    }

    function play() {
      var start = null;
      function frame(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / 1100, 1);
        render(1 - Math.pow(1 - p, 3));
        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    render(reduced ? 1 : 0.001);
    if (reduced) { render(1); return; }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting && !started) { started = true; play(); } });
      }, { threshold: 0.25 }).observe(canvas);
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
    initPreloader();
    initCursor();
    initMagnetic();
    initNav();
    initReveal();
    initCounters();
    initFAQ();
    initTimeline();
    initCardTilt();
    initForm();
    initHero();
    initPerfDiagram();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
