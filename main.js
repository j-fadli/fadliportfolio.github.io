(function () {
  'use strict';
  document.documentElement.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------------- hero: dots that connect ---------------- */
  (function hero() {
    var cv = $('#heroCanvas'); if (!cv) return;
    var ctx = cv.getContext('2d');
    // experience -> skill -> value
    var chains = [
      ['Highest-reviewed staff member', 'customer relationships', 'trust'],
      ['Beginner-friendly', 'making things simple', 'empathy'],
      ['Luxury product launch', 'visual storytelling', 'collaboration'],
      ['21 brands, one booth', 'creative direction', 'cohesion'],
      ['Workshop launch campaign', 'event storytelling', 'connection'],
      ['Instagram & photography', 'content creation', 'consistency'],
      ['Psychology at SUSS', 'seeing different perspectives', 'curiosity']
    ];
    var STY = [
      { font: '500 11px "IBM Plex Mono", monospace', col: '20,20,24' },
      { font: '400 11px "IBM Plex Mono", monospace', col: '150,104,32' },
      { font: '500 12px "IBM Plex Mono", monospace', col: '127,87,23' }
    ];
    var dots = [], W = 0, H = 0, dpr = 1, mouse = { x: -9999, y: -9999, active: false }, raf = 0, visible = true, quiet = 0, quietTo = 0, rs = [], live = [], ci = 0;
    var textEls = $$('.hero-title, .hero-sub, .hint, .eyebrow, .roles, .open, .hero-actions, .stats li', cv.parentElement);
    function overText() { var c = cv.getBoundingClientRect(); return textEls.some(function (el) { var r = el.getBoundingClientRect(), p = 10; return mouse.x + c.left > r.left - p && mouse.x + c.left < r.right + p && mouse.y + c.top > r.top - p && mouse.y + c.top < r.bottom + p; }); }
    function rand(seed) { var x = Math.sin(seed * 9301 + 49297) * 233280; return x - Math.floor(x); }
    function measureRects() {
      var c = cv.getBoundingClientRect();
      rs = [];
      textEls.forEach(function (el) {
        var rg = document.createRange(); rg.selectNodeContents(el);
        Array.prototype.forEach.call(rg.getClientRects(), function (r) { if (r.width < 1 || r.height < 1) return; rs.push({ l: r.left - c.left - 10, r: r.right - c.left + 10, t: r.top - c.top - 8, b: r.bottom - c.top + 8 }); });
      });
      rs = rs
        .concat($$('.hero-portrait', cv.parentElement).map(function (el) { var r = el.getBoundingClientRect(); return { l: r.left - c.left - 16, r: r.right - c.left + 16, t: r.top - c.top - 16, b: r.bottom - c.top + 8 }; }));
      var wr = $('.hero .wrap'), rail = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--rail')) || 72;
      if (wr) rs.push({ l: -9999, r: wr.getBoundingClientRect().left - c.left + rail * 0.45 + 16, t: -9999, b: 99999 });
    }
    function build() {
      var r = cv.getBoundingClientRect(); W = r.width; H = r.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(90, Math.max(34, W * H / 15000)));
      dots = []; live = [];
      for (var i = 0; i < n; i++) dots.push({ x: rand(i + 1) * W, y: rand(i + 101) * H, vx: (rand(i + 7) - .5) * .18, vy: (rand(i + 13) - .5) * .18, r: 1.4 + rand(i + 3) * 1.8, chain: 0 });
      measureRects();
    }
    function box(p, txt, k) {
      ctx.font = STY[k].font; txt = txt.toUpperCase();
      var lh = k === 2 ? 14 : 13, maxW = W < 600 ? 110 : 190, words = txt.split(' '), lines = [], cur = '';
      words.forEach(function (w) { var t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; });
      lines.push(cur);
      var w = Math.max.apply(null, lines.map(function (l) { return ctx.measureText(l).width; })), left = p.x + 10 + w > W - 8;
      var x = left ? p.x - 10 - w : p.x + 10, top = p.y - 6 - lh * lines.length;
      return { x: x, w: w, lines: lines, lh: lh, top: top, l: Math.min(p.x, x) - 6, r: Math.max(p.x, x + w) + 6, t: top - 4, b: p.y + 8 };
    }
    function clash(b, others) { return b.t < 64 || b.l < 6 || b.r > W - 4 || b.b > H - 4 || rs.concat(others || []).some(function (r) { return b.r > r.l && b.l < r.r && b.b > r.t && b.t < r.b; }); }
    function makeChain(a) {
      var c = chains[ci % chains.length], ba = box(a, c[0], 0); if (clash(ba)) return null;
      var pick = function (from, txt, k, used, taken) {
        var best = null, bd = 1e9;
        dots.forEach(function (d) {
          if (used.indexOf(d) > -1) return;
          var dist = Math.hypot(d.x - from.x, d.y - from.y); if (dist < 60 || dist > 230) return;
          if (used.some(function (u) { return Math.hypot(d.x - u.x, d.y - u.y) < 60; })) return;
          var bx = box(d, txt, k); if (clash(bx, taken)) return;
          if (dist < bd) { bd = dist; best = d; }
        });
        if (best) return best;
        for (var rr = 90; rr <= 210 && !best; rr += 40) for (var ang = 0; ang < 24 && !best; ang++) {
          var th = (ang * 15 + (from.x * 7 % 360)) * Math.PI / 180, v = { x: from.x + Math.cos(th) * rr, y: from.y + Math.sin(th) * rr, r: 2.2, virt: 1 };
          if (used.some(function (u) { return Math.hypot(v.x - u.x, v.y - u.y) < 70; })) continue;
          if (!clash(box(v, txt, k), taken)) best = v;
        }
        return best;
      };
      var b = pick(a, c[1], 1, [a], [ba]), cc = null;
      if (b) cc = pick(b, c[2], 2, [a, b], [ba, box(b, c[1], 1)]);
      if (!b || !cc) return null;
      ci++;
      return { nodes: [a, b, cc], t0: performance.now(), al: 0, on: true, c: c };
    }
    function drawLabel(p, txt, k, al) {
      var bx = box(p, txt, k);
      ctx.fillStyle = 'rgba(246,245,241,' + (0.9 * al).toFixed(3) + ')';
      ctx.fillRect(bx.x - 4, bx.top - 1, bx.w + 8, bx.lh * bx.lines.length + 5);
      ctx.font = STY[k].font; ctx.fillStyle = 'rgba(' + STY[k].col + ',' + al.toFixed(3) + ')';
      bx.lines.forEach(function (l, i) { ctx.fillText(l, bx.x, bx.top + bx.lh - 3 + bx.lh * i); });
    }
    function seg(t, a, b) { return Math.max(0, Math.min(1, (t - a) / (b - a))); }
    function drawChains(now, vis) {
      // pick the story dot nearest the cursor
      var target = null, cur = live.filter(function (l) { return l.on; })[0];
      var hold = cur && mouse.active && vis > 0.05 && Math.hypot(cur.nodes[0].x - mouse.x, cur.nodes[0].y - mouse.y) < 210;
      if (hold) target = cur.nodes[0];
      else if (mouse.active && vis > 0.05) {
        var bd = 130;
        dots.forEach(function (d) { if (d.fail && now - d.fail < 700) return; var md = Math.hypot(d.x - mouse.x, d.y - mouse.y); if (md < bd) { bd = md; target = d; } });
      }
      if (target && (!cur || cur.nodes[0] !== target)) {
        var cand = makeChain(target);
        if (cand) { if (cur) cur.on = false; live.push(cand); cur = cand; }
        else target.fail = now;
      }
      if (!hold && mouse.active && vis > 0.05 && (!cur || !target || target.fail === now) && now - (drawChains.vf || 0) > 600) {
        var v = { x: mouse.x, y: mouse.y, r: 2.4, virt: 1 }, cv2 = makeChain(v);
        if (cv2) { if (cur) cur.on = false; live.push(cv2); cur = cv2; } else drawChains.vf = now;
      }
      if (!target && cur) cur.on = false;
      live.forEach(function (l) { l.al += ((l.on ? 1 : 0) - l.al) * 0.12; });
      live = live.filter(function (l) { return l.on || l.al > 0.02; });
      live.forEach(function (l) {
        var t = now - l.t0, A = l.al * vis, n = l.nodes;
        if (A < 0.01) return;
        var p1 = seg(t, 180, 560), p2 = seg(t, 620, 1000);
        ctx.strokeStyle = 'rgba(168,119,42,' + (0.9 * A).toFixed(3) + ')'; ctx.lineWidth = 1.6;
        if (n[1]) { ctx.beginPath(); ctx.moveTo(n[0].x, n[0].y); ctx.lineTo(n[0].x + (n[1].x - n[0].x) * p1, n[0].y + (n[1].y - n[0].y) * p1); ctx.stroke(); }
        if (n[2]) { ctx.beginPath(); ctx.moveTo(n[1].x, n[1].y); ctx.lineTo(n[1].x + (n[2].x - n[1].x) * p2, n[1].y + (n[2].y - n[1].y) * p2); ctx.stroke(); }
        var shown = [1, p1 >= 1 ? 1 : 0, p2 >= 1 ? 1 : 0];
        n.forEach(function (d, k) {
          var a2 = A * (k === 0 ? seg(t, 0, 220) : k === 1 ? seg(t, 560, 760) : seg(t, 1000, 1200));
          if (!shown[k] && k) return;
          ctx.fillStyle = 'rgba(168,119,42,' + Math.min(1, a2 + .2).toFixed(3) + ')';
          ctx.beginPath(); ctx.arc(d.x, d.y, d.r + (k === 2 ? 3 : 2), 0, Math.PI * 2); ctx.fill();
          if (k === 2) { ctx.strokeStyle = 'rgba(168,119,42,' + (0.35 * a2).toFixed(3) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(d.x, d.y, d.r + 9, 0, Math.PI * 2); ctx.stroke(); }
          drawLabel(d, l.c[k], k, a2);
        });
      });
    }
    function draw(now) {
      now = now || performance.now();
      ctx.clearRect(0, 0, W, H);
      var D = Math.min(150, W / 7), MR = 190;
      quiet += (quietTo - quiet) * (reduce ? 1 : 0.14); var vis = 1 - quiet;
      for (var i = 0; i < dots.length; i++) {
        var a = dots[i];
        if (!reduce) { a.x += a.vx; a.y += a.vy; if (a.x < 0 || a.x > W) a.vx *= -1; if (a.y < 0 || a.y > H) a.vy *= -1; }
        for (var j = i + 1; j < dots.length; j++) {
          var b = dots[j], dx = a.x - b.x, dy = a.y - b.y, d = Math.sqrt(dx * dx + dy * dy);
          if (d < D) { ctx.strokeStyle = 'rgba(20,20,24,' + (0.10 * (1 - d / D)).toFixed(3) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
        }
        var mx = a.x - mouse.x, my = a.y - mouse.y, md = Math.sqrt(mx * mx + my * my), near = mouse.active && md < MR && vis > 0.02;
        if (near) { ctx.strokeStyle = 'rgba(168,119,42,' + (0.6 * vis * (1 - md / MR)).toFixed(3) + ')'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke(); }
        ctx.fillStyle = near ? 'rgba(168,119,42,' + (0.5 + 0.5 * vis).toFixed(2) + ')' : 'rgba(20,20,24,.38)';
        ctx.beginPath(); ctx.arc(a.x, a.y, near ? a.r + 1.2 : a.r, 0, Math.PI * 2); ctx.fill();
      }
      drawChains(now, vis);
      if (mouse.active) { ctx.fillStyle = '#A8772A'; ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 4, 0, Math.PI * 2); ctx.fill(); }
      if (!reduce && visible) raf = requestAnimationFrame(draw);
    }
    function pos(e) { var r = cv.getBoundingClientRect(), p = e.touches ? e.touches[0] : e; mouse.x = p.clientX - r.left; mouse.y = p.clientY - r.top; mouse.active = true; quietTo = overText() ? 1 : 0; if (reduce) draw(); }
    var hero = cv.parentElement;
    hero.addEventListener('pointermove', pos);
    hero.addEventListener('pointerdown', pos);
    var touchT = 0;
    hero.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'mouse') return; mouse.active = false; if (reduce) draw(); });
    hero.addEventListener('pointerup', function (e) { if (e.pointerType === 'mouse') return; clearTimeout(touchT); touchT = setTimeout(function () { mouse.active = false; if (reduce) draw(); }, 3500); });
    window.addEventListener('resize', function () { build(); if (reduce) draw(); });
    window.addEventListener('load', measureRects);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureRects);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible && !reduce) { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); } }).observe(hero);
    build(); draw();
  })();

  /* ---------------- the thread ---------------- */
  var thread = (function () {
    var svg = $('#thread'), core = $('#threadCore'), braid = $('#threadBraid'), ghost = $('#threadGhost'), clip = $('#threadClipRect');
    var nodes = [], dotsEls = [], startY = 0, endY = 0, jack = null;
    function railX() { var w = $('.wrap'); var cs = getComputedStyle(document.documentElement); var rail = parseFloat(cs.getPropertyValue('--rail')) || 72; var r = w.getBoundingClientRect(); return r.left + window.scrollX + rail * 0.45 + (window.innerWidth < 720 ? 2 : 0); }
    function layout() {
      var docH = document.documentElement.scrollHeight;
      svg.setAttribute('height', docH); svg.style.height = docH + 'px';
      svg.setAttribute('viewBox', '0 0 ' + document.documentElement.clientWidth + ' ' + docH);
      var x = railX();
      nodes = $$('[data-node]').map(function (el) { var r = el.getBoundingClientRect(); return { el: el, y: r.top + window.scrollY + Math.min(18, r.height / 2) }; });
      if (!nodes.length) return;
      startY = nodes[0].y; endY = nodes[nodes.length - 1].y;
      // braided, gently wavering path through every node
      var d = 'M ' + x + ' ' + startY, step = 46, amp = window.innerWidth < 720 ? 3 : 6;
      for (var y = startY + step, k = 1; y < endY; y += step, k++) {
        var near = nodes.some(function (n) { return Math.abs(n.y - y) < 40; });
        var off = near ? 0 : Math.sin(k * 0.9) * amp;
        d += ' L ' + (x + off).toFixed(1) + ' ' + y.toFixed(1);
      }
      d += ' L ' + x + ' ' + endY;
      core.setAttribute('d', d); braid.setAttribute('d', d); ghost.setAttribute('d', d);
      dotsEls.forEach(function (n) { n.remove(); });
      if (!jack) { jack = document.createElement('div'); jack.className = 'thread-jack'; jack.setAttribute('aria-hidden', 'true'); jack.innerHTML = '<svg viewBox="0 0 40 120"><rect x="11" y="0" width="18" height="46" rx="3"/><rect x="14" y="46" width="12" height="8"/><path d="M17 54h6v40l-3 6-3-6z"/><line x1="16" y1="70" x2="24" y2="70"/><line x1="16" y1="80" x2="24" y2="80"/><line x1="16" y1="88" x2="24" y2="88"/></svg><span class="mono">Plug in</span>'; document.body.appendChild(jack); }
      jack.style.left = x + 'px'; jack.style.top = (endY + 12) + 'px';
      dotsEls = nodes.map(function (n) { var s = document.createElement('span'); s.className = 'node-dot'; s.style.left = x + 'px'; s.style.top = n.y + 'px'; document.body.appendChild(s); return s; });
      update();
    }
    function update() {
      var reach = window.scrollY + window.innerHeight * 0.62;
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) reach = endY + 10;
      clip.setAttribute('height', Math.max(0, reach));
      nodes.forEach(function (n, i) { if (dotsEls[i]) dotsEls[i].classList.toggle('lit', reach >= n.y); });
      $('#nav').classList.toggle('scrolled', window.scrollY > 10);
    }
    var t; window.addEventListener('scroll', function () { if (!t) t = requestAnimationFrame(function () { t = 0; update(); }); }, { passive: true });
    window.addEventListener('resize', function () { clearTimeout(layout.t); layout.t = setTimeout(layout, 120); });
    window.addEventListener('load', layout);
    if ('ResizeObserver' in window) new ResizeObserver(function () { clearTimeout(layout.t); layout.t = setTimeout(layout, 150); }).observe(document.body);
    layout();
    return { layout: layout };
  })();

  /* ---------------- reveal (visible at rest; transform only) ---------------- */
  (function () {
    var els = $$('.sec-head, .case-head, .chain li, .j-node, .film, .zp-grid figure, .strip figure, .owner li, .form, .stats li');
    els.forEach(function (e) { e.classList.add('rv'); });
    if (!('IntersectionObserver' in window) || reduce) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (e) { var r = e.getBoundingClientRect(); if (r.top < window.innerHeight) e.classList.add('in'); else io.observe(e); });
  })();

  /* ---------------- nav active ---------------- */
  (function () {
    var links = $$('.nav nav a'); if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) links.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id); }); }); }, { rootMargin: '-45% 0px -50% 0px' });
    ['about', 'portfolio', 'reviews', 'contact'].forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  })();

  /* ---------------- strip arrows ---------------- */
  (function () {
    var st = $('#bkStrip'), pv = $('#stripPrev'), nx = $('#stripNext'); if (!st || !pv) return;
    function step() { var f = st.querySelector('figure'); return f ? f.getBoundingClientRect().width + 16 : 300; }
    function upd() { pv.disabled = st.scrollLeft < 4; nx.disabled = st.scrollLeft + st.clientWidth >= st.scrollWidth - 4; }
    pv.addEventListener('click', function () { st.scrollBy({ left: -step(), behavior: reduce ? 'auto' : 'smooth' }); });
    nx.addEventListener('click', function () { st.scrollBy({ left: step(), behavior: reduce ? 'auto' : 'smooth' }); });
    st.addEventListener('scroll', upd, { passive: true }); window.addEventListener('resize', upd); upd();
  })();

  /* ---------------- Bryce & Kimmel toggle ---------------- */
  (function () {
    var bk = $('#bk'), strip = $('#bkStrip'); if (!bk) return;
    var sets = {
      osmanthus: [['tile-single', 'Osmanthus IEM on botanical tiles'], ['card-osmanthus', 'Hand-drawn osmanthus illustration card'], ['tile-pair', 'Pair of Osmanthus IEMs on botanical tiles'], ['studio-coiled', 'Osmanthus IEMs with coiled cable on white'], ['tile-nozzle', 'Osmanthus IEM nozzle detail on tiles'], ['studio-pair', 'Osmanthus IEM pair in the studio'], ['tile-cable', 'Osmanthus cable and plug on tiles']],
      lily: [['tile-single', 'Lily of the Valley IEM on botanical tiles'], ['card-lily', 'Hand-drawn lily of the valley illustration card'], ['tile-pair', 'Pair of Lily of the Valley IEMs on tiles'], ['studio-coiled', 'Lily of the Valley IEMs with coiled cable on white'], ['tile-single-cable', 'Lily of the Valley IEM with cable on tiles'], ['studio-pair', 'Lily of the Valley IEM pair in the studio'], ['tile-cable', 'Lily of the Valley cable and plug on tiles']]
    };
    function file(set, k) { return k.indexOf('card-') === 0 ? 'assets/img/bk-' + k + '.webp' : 'assets/img/bk-' + set + '-' + k + '.webp'; }
    function show(set) {
      bk.dataset.flower = set;
      bk.style.setProperty('--flower', 'var(--' + set + ')'); bk.style.setProperty('--flower-soft', 'var(--' + set + '-soft)');
      $$('.flower-toggle button', bk).forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.set === set)); });
      strip.classList.add('swap');
      setTimeout(function () {
        var figs = $$('figure', strip);
        sets[set].forEach(function (it, i) { var img = figs[i] && $('img', figs[i]); if (!img) return; img.src = file(set, it[0]); img.alt = it[1]; var studio = it[0].indexOf('studio') === 0; img.width = studio ? 1200 : 1080; img.height = studio ? 1800 : 1350; });
        strip.scrollTo({ left: 0, behavior: reduce ? 'auto' : 'smooth' });
        setTimeout(function () { strip.classList.remove('swap'); }, 60);
      }, reduce ? 0 : 320);
    }
    $$('.flower-toggle button', bk).forEach(function (b) {
      b.addEventListener('click', function () { show(b.dataset.set); });
      b.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { var o = b.dataset.set === 'osmanthus' ? 'lily' : 'osmanthus'; show(o); $('[data-set="' + o + '"]', bk).focus(); } });
    });
    // preload the other set
    sets.lily.forEach(function (it) { var i = new Image(); i.src = file('lily', it[0]); });
  })();

  /* ---------------- StereoNet: brands → booth ---------------- */
  (function () {
    var map = $('#snMap'), lines = $('#snLines'), poster = $('#snPoster'), cap = $('#snCaption'); if (!map) return;
    var brands = [['qdc', 'qdc'], ['Cayin', 'cayin'], ['Melodic Artification', 'melodic-artification'], ['MASS-Kobo', 'mass-kobo'], ['HEDD', 'hedd-violectric'], ['Violectric', 'hedd-violectric'], ['Oriolus', 'oriolus'], ['iBasso', 'ibasso'], ['HiBy', 'hiby-bgvp'], ['BGVP', 'hiby-bgvp'], ['Flipears', 'flipears'], ['Palavox', 'palavox-artpical'], ['Artpical', 'palavox-artpical'], ['Cornerstone Audio', 'cornerstone-enleum-innuos'], ['Enleum', 'cornerstone-enleum-innuos'], ['Innuos', 'cornerstone-enleum-innuos'], ['WFS', 'wfs-acoustune-questyle'], ['Acoustune', 'wfs-acoustune-questyle'], ['Questyle', 'wfs-acoustune-questyle'], ['ZMF', 'zmf'], ['Letshuoer', 'letshuoer']];
    var btns = [], lns = [], current = 'zmf', auto = null, touched = false;
    brands.forEach(function (b, i) {
      var el = document.createElement('button'); el.type = 'button'; el.className = 'sn-brand'; el.textContent = b[0]; el.dataset.p = b[1];
      el.setAttribute('aria-label', 'Show the poster for ' + b[0]);
      el.addEventListener('mouseenter', function () { if (finePointer) { touched = true; stop(); pick(b[1], b[0]); } });
      el.addEventListener('click', function () { touched = true; stop(); pick(b[1], b[0]); });
      map.appendChild(el); btns.push(el);
      var l = document.createElementNS('http://www.w3.org/2000/svg', 'line'); lines.appendChild(l); lns.push(l);
    });
    function place() {
      var r = map.getBoundingClientRect(); if (window.innerWidth <= 860) return;
      var cx = r.width / 2, cy = r.height / 2, R1 = Math.min(cx, cy) * 0.93, R2 = Math.min(cx, cy) * 0.62;
      lines.setAttribute('viewBox', '0 0 ' + r.width + ' ' + r.height);
      btns.forEach(function (el, i) {
        var ring = i % 2 === 0, a = (i / btns.length) * Math.PI * 2 - Math.PI / 2, R = ring ? R1 : R2;
        var x = cx + Math.cos(a) * R * (ring ? 0.98 : 1), y = cy + Math.sin(a) * R;
        el.style.left = x + 'px'; el.style.top = y + 'px';
        var l = lns[i]; l.setAttribute('x1', x); l.setAttribute('y1', y); l.setAttribute('x2', cx); l.setAttribute('y2', cy);
      });
    }
    function pick(p, name) {
      var names = brands.filter(function (b) { return b[1] === p; }).map(function (b) { return b[0]; });
      btns.forEach(function (el, i) { var on = el.dataset.p === p; el.classList.toggle('on', on); lns[i].classList.toggle('on', on); });
      if (p === current && poster.getAttribute('src').indexOf(p) > -1) { cap.textContent = names.join(' · '); return; }
      current = p; poster.classList.add('fade');
      setTimeout(function () { poster.src = 'assets/img/sn-' + p + '.webp'; poster.alt = 'StereoNet poster for ' + names.join(', '); cap.textContent = names.join(' · '); poster.onload = function () { poster.classList.remove('fade'); }; setTimeout(function () { poster.classList.remove('fade'); }, 400); }, reduce ? 0 : 220);
    }
    var order = []; brands.forEach(function (b) { if (order.indexOf(b[1]) < 0) order.push(b[1]); });
    function stop() { if (auto) { clearInterval(auto); auto = null; } }
    function start() { if (reduce || touched || auto) return; auto = setInterval(function () { var i = (order.indexOf(current) + 1) % order.length; var p = order[i]; pick(p, ''); }, 3200); }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { if (es[0].isIntersecting) start(); else stop(); }, { threshold: .35 }).observe(map);
    window.addEventListener('resize', place); place(); pick('zmf', 'ZMF');
    order.forEach(function (p) { var i = new Image(); i.src = 'assets/img/sn-' + p + '.webp'; });
  })();

  /* ---------------- reviews constellation ---------------- */
  (function () {
    var cons = $('#cons'), svg = $('#consLines'), btn = $('#connectBtn'); if (!cons) return;
    var T = { patient: 'Patience', nopush: 'No pressure', know: 'Product knowledge', needs: 'Listening', first: 'First-timers' };
    var TPOS = { patient: [.5, .2], nopush: [.8, .42], know: [.68, .8], needs: [.32, .8], first: [.2, .42] };
    var R = [
      ['Ramesh M.', 5, '2 years ago', 'Fadli was super patient and I can sense that he really enjoys helping others discover what they need… Could they have pushed me to get more expensive stuff? Probably. But they didn\'t.', ['patient', 'nopush', 'needs']],
      ['Seah Y.', 5, 'a year ago', 'Fadli really loves his job and gave me choices and insights to guide me to finding the perfect equipment I needed. Zeppelin is lucky to have him.', ['needs', 'know']],
      ['voalm', 5, '4 months ago', 'For the next one and a half hours, he entertained my questions… he attempted (and succeeded in) answering all my questions from the perspective of a newbie and a pro.', ['first', 'know', 'patient']],
      ['Chandler F.', 5, 'a month ago', 'There was no pushy sales, but an assurance that he was there if I had any questions.', ['nopush']],
      ['Evander K.', 5, '4 years ago', 'They were also very patient and took the time to understand exactly what I desired out of my purchase… I felt the staff truly had my best interests in mind.', ['patient', 'needs', 'nopush', 'know']],
      ['Jerald C.', 5, '3 years ago', 'These folks are superbly warm and friendly. They were professional, patient and absolutely dangerous. No upselling of any sort.', ['patient', 'nopush']],
      ['Regan I.', 5, '2 years ago', 'I was served by Fadli, super helpful and not pushy.', ['nopush']],
      ['Guan Quan O.', 5, '5 years ago', 'Fahli is especially helpful, love his explanation and introduction for non audiophile like me.', ['first', 'know']],
      ['oliushijia', 5, '5 years ago', 'Fadli was very knowledgeable and professional. Moreover, he was very patient and was willing to listen to my needs in order to find products that suit me.', ['know', 'patient', 'needs']],
      ['Karthik M.', 5, 'a year ago', 'Fadli was super patient and helpful. The first day I bought a DAC dongle… The second day I returned to get myself in ear headphones.', ['patient']],
      ['YH S.', 5, '7 months ago', 'Came here wanting to repair my existing pair of IEMs but ended up leaving with a new set… helpfully assisted by Fadli, who had a deep understanding of the products.', ['know']],
      ['Daniel A.', 5, '2 years ago', 'He was very professional… and kindly explain every IEM in details based our needs.', ['needs', 'know']],
      ['Jason', 4, '2 years ago', 'Maybe I didn\'t look audiophile enough, but I am glad that I approached the right person, Fadli, who was very patient and nice.', ['patient', 'first']],
      ['Alan L.', 5, 'a year ago', 'They did not carry that brand. Instead, they gave me alternatives that sounded similar… It turns out I really enjoyed one of the alternatives.', ['needs']],
      ['YH C.', 5, '5 years ago', 'He was attentive and generous with his time, and recommended headphones that were well suited to my requests.', ['needs', 'patient']],
      ['W S', 5, '5 years ago', 'My girlfriend and I entered hoping to learn more about audiophile gear, and Fadli patiently let us sample several sets of headphones and IEMs to figure out what we liked.', ['patient', 'first']],
      ['Jin Yan C.', 5, '3 years ago', 'Gotten my first IEM with them was a blast, highly recommend engaging with Fadli and Jeremy, in depth knowledge for every thing you can think of.', ['first', 'know']],
      ['Yao S.', 5, '7 months ago', 'Luth, Jordan, and Fadli, in particular, have given wonderful recommendations, tips, as well as dispensed sound advice, without being pushy.', ['nopush']],
      ['Jian Sheng A.', 5, '5 years ago', 'He was very friendly and knowledgeable and managed to answer all of my questions. No pressure from the staff as well!', ['know', 'nopush']],
      ['Alex C.', 5, '10 months ago', 'One of the loveliest people I\'ve met. Thanks so much to Luke and Fadli.', []],
      ['Alex L.', 5, '3 years ago', 'Luth and Fadli thanks for your service today. Made my visit to Singapore really worth it. Good tea, good service, good iems. 11/10', []],
      ['Khairil A.', 5, '3 years ago', 'Really friendly and knowledgable staff. Shout out to Fadli.', ['know']]
    ];
    var counts = {}; Object.keys(T).forEach(function (k) { counts[k] = 0; }); R.forEach(function (r) { r[4].forEach(function (t) { counts[t]++; }); });
    var dots = [], tags = {}, lines = [], linked = false, cur = 0;
    function rnd(s) { var x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
    R.forEach(function (r, i) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'r-dot' + (r[1] === 4 ? ' four' : '');
      b.setAttribute('aria-label', 'Review by ' + r[0] + ', ' + r[1] + ' stars');
      b.addEventListener('click', function () { select(i); });
      b.addEventListener('mouseenter', function () { if (finePointer) select(i); });
      b.addEventListener('focus', function () { select(i); });
      cons.appendChild(b); dots.push(b);
    });
    Object.keys(T).forEach(function (k) { var e = document.createElement('span'); e.className = 'tag-node'; e.innerHTML = T[k] + '<b>' + counts[k] + '</b>'; cons.appendChild(e); tags[k] = e; });
    R.forEach(function (r, i) { r[4].forEach(function (t) { var l = document.createElementNS('http://www.w3.org/2000/svg', 'line'); l.dataset.r = i; l.dataset.t = t; svg.appendChild(l); lines.push(l); }); });
    var P = [], TP = {};
    function place() {
      var w = cons.clientWidth, h = cons.clientHeight; svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      var keys = Object.keys(T);
      keys.forEach(function (k) {
        var f = TPOS[k], sx = w < 520 ? 0.82 : 0.7;
        TP[k] = linked ? { x: w / 2 + (f[0] - .5) * w * sx, y: h / 2 + (f[1] - .5) * h * 0.82 } : { x: w / 2, y: h / 2 };
        tags[k].style.left = TP[k].x + 'px'; tags[k].style.top = TP[k].y + 'px';
      });
      P = R.map(function (r, i) {
        if (!linked) return { x: 16 + rnd(i + 1) * (w - 32), y: 16 + rnd(i + 50) * (h - 32) };
        var a = (i / R.length) * Math.PI * 2 - Math.PI / 2 + 0.07;
        return { x: w / 2 + Math.cos(a) * (w / 2 - 24), y: h / 2 + Math.sin(a) * (h / 2 - 18) };
      });
      dots.forEach(function (d, i) { d.style.left = P[i].x + 'px'; d.style.top = P[i].y + 'px'; });
      lines.forEach(function (l) { var p = P[+l.dataset.r], t = TP[l.dataset.t]; l.setAttribute('x1', p.x); l.setAttribute('y1', p.y); l.setAttribute('x2', t.x); l.setAttribute('y2', t.y); });
    }
    function select(i) {
      cur = i; var r = R[i];
      dots.forEach(function (d, j) { d.classList.toggle('on', j === i); });
      lines.forEach(function (l) { l.classList.toggle('hot', +l.dataset.r === i); });
      $('#qText').textContent = '“' + r[3] + '”';
      $('#qWho').textContent = r[0] + ' · Google review';
      $('#qStars').textContent = r[1] === 5 ? '★★★★★' : '★★★★☆';
      $('#qStars').setAttribute('aria-label', r[1] + ' stars');
    }
    btn.addEventListener('click', function () {
      linked = !linked; cons.classList.toggle('linked', linked); btn.setAttribute('aria-pressed', String(linked));
      btn.textContent = linked ? 'Scatter them again' : 'Connect the Dots: See the Pattern';
      $('#consNote').textContent = linked ? 'What they kept saying: product knowledge \u00D7' + counts.know + ', patience \u00D7' + counts.patient + ', no pressure \u00D7' + counts.nopush + ', listening \u00D7' + counts.needs + '.' : '';
      place();
    });
    var acts = $('.cons-actions');
    if (acts) {
      var dl = document.createElement('details'); dl.className = 'all-reviews';
      dl.innerHTML = '<summary>Read all ' + R.length + ' reviews</summary><ul></ul>';
      var ul = dl.querySelector('ul');
      R.forEach(function (r) { var li = document.createElement('li'); var q = document.createElement('blockquote'); q.textContent = '\u201C' + r[3] + '\u201D'; var w = document.createElement('p'); w.className = 'mono'; w.textContent = (r[1] === 5 ? '\u2605\u2605\u2605\u2605\u2605' : '\u2605\u2605\u2605\u2605\u2606') + '  ' + r[0]; li.appendChild(q); li.appendChild(w); ul.appendChild(li); });
      acts.parentNode.insertBefore(dl, acts.nextSibling);
    }
    window.addEventListener('resize', place); place(); select(0);
  })();

  /* ---------------- contact ---------------- */
  (function () {
    var copy = $('#copyBtn'), email = $('#emailText');
    copy.addEventListener('click', function () {
      var t = email.textContent.trim();
      function sel() { var r = document.createRange(); r.selectNodeContents(email); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); copy.textContent = 'Selected'; }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(function () { copy.textContent = 'Email copied'; setTimeout(function () { copy.textContent = 'Copy email'; }, 1800); }, sel); else sel();
    });
    var f = $('#contactForm'), st = $('#formStatus'), send = $('#sendBtn');
    f.addEventListener('submit', function (e) {
      e.preventDefault(); st.className = 'form-status';
      if (!f.checkValidity()) { st.textContent = 'Please fill in your name, a valid email and a message.'; st.classList.add('err'); var bad = f.querySelector(':invalid'); if (bad) bad.focus(); return; }
      if (f._honey.value) return;
      send.disabled = true; send.textContent = 'Sending…';
      var data = { name: f.name.value, email: f.email.value, topic: f.topic.value, message: f.message.value, _subject: 'Portfolio: ' + f.topic.value + ' from ' + f.name.value, _template: 'table', _captcha: 'false' };
      fetch('https://formsubmit.co/ajax/fadli.jasmuri@gmail.com', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function () { st.textContent = 'Sent. Thank you, I\'ll get back to you soon.'; st.classList.add('ok'); f.reset(); })
        .catch(function () { st.textContent = 'That didn\'t go through. Please email me directly at fadli.jasmuri@gmail.com.'; st.classList.add('err'); })
        .then(function () { send.disabled = false; send.textContent = 'Send message'; });
    });
  })();

  /* ---------------- cursor companion ---------------- */
  (function () {
    var c = $('#cursorDot'); if (!finePointer || reduce || !c) return;
    var x = 0, y = 0, tx = 0, ty = 0;
    window.addEventListener('pointermove', function (e) { tx = e.clientX; ty = e.clientY; c.classList.add('show'); var t = e.target.closest && e.target.closest('a,button,.strip figure,.zp-grid figure'); c.classList.toggle('big', !!t); });
    document.addEventListener('pointerleave', function () { c.classList.remove('show'); });
    (function loop() { x += (tx - x) * 0.2; y += (ty - y) * 0.2; c.style.transform = 'translate(' + x + 'px,' + y + 'px)'; requestAnimationFrame(loop); })();
  })();
})();
