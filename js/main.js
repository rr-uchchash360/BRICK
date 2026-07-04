/* =============================================
   BRICK — Main Application
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {

  // ============================================
  // LENIS — Smooth Scrolling
  // ============================================
  const tier = window.DEVICE_TIER || 'high';
  const isLowTier = tier === 'low';
  const shouldAnimate = tier !== 'low';

  const lenis = new Lenis({
    duration: isLowTier ? 0.5 : 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    smoothWheel: !isLowTier,
    wheelMultiplier: 0.8,
    touchMultiplier: 1.5,
  });

  if (!isLowTier) {
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  }

  // ============================================
  // LOADING SCREEN — The Kiln
  // ============================================
  const loader = document.getElementById('loader');
  const loaderText = document.getElementById('loaderText');
  const ringFill = document.getElementById('ringFill');
  const ringDot = document.getElementById('ringDot');
  const tempReading = document.getElementById('tempReading');
  const forgeGlow = document.getElementById('forgeGlow');
  const brickFaces = document.querySelectorAll('.loader-brick-face');
  const brickGlowInner = document.getElementById('brickGlowInner');

  const RING_CIRCUMFERENCE = 659.73;
  const RING_RADIUS = 105;
  const RING_CX = 120;
  const RING_CY = 120;

  const kilnPhases = [
    { text: 'Igniting',    temp: 200,  pct: 0.15, ringColor: '#884422',  tempColor: '#884422', glow: 'rgba(120,60,20,0.05)' },
    { text: 'Smoldering',  temp: 500,  pct: 0.30, ringColor: '#aa6633',  tempColor: '#995533', glow: 'rgba(160,90,40,0.06)' },
    { text: 'Heating',     temp: 800,  pct: 0.45, ringColor: '#cc8844',  tempColor: '#cc7733', glow: 'rgba(200,120,50,0.07)' },
    { text: 'Firing',      temp: 1100, pct: 0.60, ringColor: '#cc5522',  tempColor: '#cc4422', glow: 'rgba(200,80,30,0.09)' },
    { text: 'Soaking',     temp: 1400, pct: 0.80, ringColor: '#cc3322',  tempColor: '#dd3322', glow: 'rgba(220,60,30,0.10)' },
    { text: 'Tempering',   temp: 1700, pct: 1.00, ringColor: '#ddaa44',  tempColor: '#eebb33', glow: 'rgba(240,180,50,0.12)' },
  ];

  let phaseIndex = 0;
  let loadDone = false;
  let loadTimer = null;
  let currentTemp = 0;
  let tempAnimId = null;

  function animateTemp(target) {
    if (tempAnimId) { cancelAnimationFrame(tempAnimId); tempAnimId = null; }
    var start = currentTemp;
    var diff = target - start;
    var startTime = performance.now();
    var duration = 600;

    function tick(now) {
      var t = Math.min(1, (now - startTime) / duration);
      var eased = 1 - Math.pow(1 - t, 3);
      currentTemp = Math.round(start + diff * eased);
      if (tempReading) tempReading.textContent = currentTemp + '°';
      if (t < 1) { tempAnimId = requestAnimationFrame(tick); }
      else { tempAnimId = null; currentTemp = target; }
    }
    tempAnimId = requestAnimationFrame(tick);
  }

  function updateRingDot(pct) {
    if (!ringDot) return;
    var angle = pct * Math.PI * 2 - Math.PI / 2;
    var dotX = RING_CX + RING_RADIUS * Math.cos(angle);
    var dotY = RING_CY + RING_RADIUS * Math.sin(angle);
    var container = ringDot.parentElement;
    var rect = container.getBoundingClientRect();
    ringDot.style.left = (dotX / 240 * 100) + '%';
    ringDot.style.top = (dotY / 240 * 100) + '%';
    ringDot.style.opacity = pct > 0 ? '1' : '0';
  }

  function applyPhase(p) {
    if (loaderText) loaderText.textContent = p.text;
    animateTemp(p.temp);
    if (tempReading) tempReading.style.color = p.tempColor;
    if (ringFill) {
      var offset = RING_CIRCUMFERENCE * (1 - p.pct);
      ringFill.setAttribute('stroke-dashoffset', offset);
      ringFill.setAttribute('stroke', p.ringColor);
    }
    updateRingDot(p.pct);
    if (forgeGlow) {
      forgeGlow.style.background = 'radial-gradient(ellipse at 50% 60%, ' + p.glow + ' 0%, transparent 60%)';
    }
    brickFaces.forEach(function(f) {
      var t = Math.min(1, p.pct * 1.2);
      var r = Math.round(50 + t * 70);
      var g = Math.round(20 + t * 40);
      var b = Math.round(16 - t * 10);
      f.style.background = 'rgb(' + r + ',' + g + ',' + b + ')';
    });
    if (brickGlowInner) {
      var glowIntensity = p.pct * 0.7;
      brickGlowInner.style.background = 'radial-gradient(ellipse at 50% 50%, rgba(255,180,50,' + (glowIntensity * 0.6) + ') 0%, rgba(200,80,30,' + (glowIntensity * 0.3) + ') 40%, transparent 70%)';
    }
    if (tempReading) {
      tempReading.classList.toggle('glow', p.temp >= 1100);
    }
  }

  function advanceLoader() {
    if (loadDone) return;
    if (phaseIndex < kilnPhases.length) {
      applyPhase(kilnPhases[phaseIndex]);
      phaseIndex++;
      loadTimer = setTimeout(advanceLoader, 1000);
    } else {
      loadDone = true;
      burstExit();
    }
  }

  function burstExit() {
    if (loader) loader.classList.add('loader-burst');
    spawnBurstParticles();
    setTimeout(hideLoader, 600);
  }

  function spawnBurstParticles() {
    var colors = ['#ff8833', '#ff6633', '#ffcc44', '#ffaa44', '#ff4422'];
    for (var i = 0; i < 30; i++) {
      (function() {
        var p = document.createElement('span');
        p.className = 'cursor-ember';
        var size = 3 + Math.random() * 5;
        p.style.left = (window.innerWidth / 2 + (Math.random() - 0.5) * 60) + 'px';
        p.style.top = (window.innerHeight / 2 + (Math.random() - 0.5) * 60) + 'px';
        p.style.width = size + 'px';
        p.style.height = size + 'px';
        p.style.background = colors[Math.floor(Math.random() * colors.length)];
        p.style.boxShadow = '0 0 6px ' + p.style.background;
        p.style.animationDuration = (0.6 + Math.random() * 0.4) + 's';
        var angle = Math.random() * Math.PI * 2;
        var dist = 80 + Math.random() * 120;
        var dx = Math.cos(angle) * dist;
        var dy = Math.sin(angle) * dist;
        p.style.setProperty('--dx', dx + 'px');
        p.style.setProperty('--dy', dy + 'px');
        p.style.animation = 'none';
        p.animate([
          { transform: 'translate(0,0) scale(1)', opacity: 1 },
          { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(0.15)', opacity: 0 }
        ], { duration: 700 + Math.random() * 300, easing: 'ease-out', fill: 'forwards' });
        document.body.appendChild(p);
        setTimeout(function() { if (p.parentNode) p.parentNode.removeChild(p); }, 1200);
      })();
    }
  }

  function hideLoader() {
    if (loader && loader.classList.contains('hidden')) return;
    if (loadTimer) { clearTimeout(loadTimer); loadTimer = null; }
    if (tempAnimId) { cancelAnimationFrame(tempAnimId); tempAnimId = null; }
    applyPhase(kilnPhases[kilnPhases.length - 1]);
    if (loader) {
      loader.classList.add('hidden');
      setTimeout(function() {
        var cursor = document.querySelector('.cursor');
        if (cursor) cursor.style.opacity = '1';
      }, 300);
    }
    loadDone = true;
  }

  advanceLoader();

  window.addEventListener('load', function() {
    setTimeout(hideLoader, 1200);
  });

  setTimeout(function() {
    if (loader && !loader.classList.contains('hidden')) hideLoader();
  }, 7000);

  // ============================================
  // INTERACTIVE CURSOR
  // ============================================
  const cursor = window.DEVICE_TIER === 'low' ? null : document.getElementById('cursor');
  if (cursor) {
    const cursorDot = cursor.querySelector('.cursor-dot');
    const cursorRing = cursor.querySelector('.cursor-ring');
    let cursorX = -100, cursorY = -100;
    let ringX = -100, ringY = -100;
    let lastMoveX = -100, lastMoveY = -100;
    let cursorRafId = null;
    let cursorActive = false;

    document.addEventListener('mousemove', (e) => {
      cursorX = e.clientX;
      cursorY = e.clientY;
      spawnEmber(e.clientX, e.clientY);
      if (!cursorActive) {
        cursorActive = true;
        if (!cursorRafId) animateCursor();
      }
    }, { passive: true });

    var lastEmberTime = 0;
    function spawnEmber(x, y) {
      var now = Date.now();
      if (now - lastEmberTime < 25) return;
      lastEmberTime = now;
      var e = document.createElement('span');
      e.className = 'cursor-ember';
      var size = 2 + Math.random() * 3;
      var colors = ['#ff8833', '#ff6633', '#ffcc44', '#ffaa44', '#ff4422'];
      e.style.left = x + 'px';
      e.style.top = y + 'px';
      e.style.width = size + 'px';
      e.style.height = size + 'px';
      e.style.background = colors[Math.floor(Math.random() * colors.length)];
      if (Math.random() > 0.5) e.style.boxShadow = '0 0 4px ' + e.style.background;
      document.body.appendChild(e);
      setTimeout(function() { if (e.parentNode) e.parentNode.removeChild(e); }, 700);
    }

    function animateCursor() {
      var dx = Math.abs(cursorX - lastMoveX);
      var dy = Math.abs(cursorY - lastMoveY);
      if (dx < 0.5 && dy < 0.5 && Math.abs(ringX - cursorX) < 1 && Math.abs(ringY - cursorY) < 1) {
        cursorActive = false;
        cursorRafId = null;
        return;
      }
      ringX += (cursorX - ringX) * 0.08;
      ringY += (cursorY - ringY) * 0.08;
      cursorDot.style.transform = `translate(${cursorX}px, ${cursorY}px)`;
      cursorRing.style.transform = `translate(${ringX}px, ${ringY}px)`;
      lastMoveX = cursorX;
      lastMoveY = cursorY;
      cursorRafId = requestAnimationFrame(animateCursor);
    }
    animateCursor();

    document.querySelectorAll('a, button, .hotspot-dot, .qty-btn, .xray-dot').forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
    });

    if ('ontouchstart' in window) cursor.style.display = 'none';
  }

  // ============================================
  // SCROLL PROGRESS BAR
  // ============================================
  const progressFill = document.getElementById('scrollProgressFill');
  let scrollTicking = false;
  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        progressFill.style.width = ((scrollTop / docHeight) * 100) + '%';
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  });

  // ============================================
  // NAVIGATION
  // ============================================
  const navbar = document.getElementById('navbar');
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');

  window.addEventListener('scroll', () => {
    if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });

  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('show');
      const icon = menuToggle.querySelector('i');
      icon.className = mobileMenu.classList.contains('show') ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
    });
  }

  document.querySelectorAll('[data-nav]').forEach(link => {
    link.addEventListener('click', () => {
      if (mobileMenu) mobileMenu.classList.remove('show');
      if (menuToggle) menuToggle.querySelector('i').className = 'fa-solid fa-bars';
    });
  });

  document.addEventListener('click', function(e) {
    var link = e.target.closest('[data-smooth]');
    if (!link) return;
    e.preventDefault();
    // Close any open modals
    var gameResult = document.getElementById('gameResult');
    if (gameResult && gameResult.classList.contains('show')) {
      gameResult.classList.remove('show');
      document.body.style.overflow = '';
    }
    var target = link.getAttribute('href');
    if (target && target.startsWith('#')) {
      var el = document.querySelector(target);
      if (el) lenis.scrollTo(el, { duration: 1.5 });
    }
  });

  // ============================================
  // BACK TO TOP
  // ============================================
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('show', window.scrollY > 500);
    }, { passive: true });
    backToTop.addEventListener('click', () => {
      lenis.scrollTo('#hero', { duration: 1.5 });
    });
  }

  // ============================================
  // THREE.JS BRICK — handled by three-brick.js module
  // ============================================

  // ============================================
  // STORY — Minimal Chapter Animations
  // ============================================

  if (shouldAnimate) {

  const chapters = document.querySelectorAll('.story-chapter');

  function animateChapter(triggerId) {
    const chapter = document.getElementById(triggerId);
    if (!chapter) return;
    const label = chapter.querySelector('.ch-label');
    const lines = chapter.querySelectorAll('.ch-line');
    const btn = chapter.querySelector('.btn');

    ScrollTrigger.create({
      trigger: '#' + triggerId,
      start: 'top 35%',
      end: 'bottom 65%',
      onEnter: () => {
        gsap.to(label, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' });
        gsap.to(lines, { y: 0, opacity: 1, duration: 1, stagger: 0.3, ease: 'power3.out', delay: 0.15 });
        if (btn) gsap.to(btn, { y: 0, opacity: 1, duration: 0.6, delay: 0.6, ease: 'power3.out' });
      },
      onLeaveBack: () => {
        gsap.set(label, { y: 8, opacity: 0 });
        gsap.set(lines, { y: 20, opacity: 0 });
        if (btn) gsap.set(btn, { y: 10, opacity: 0 });
      }
    });
  }

  animateChapter('prologue');
  animateChapter('chapter1');
  animateChapter('chapter2');
  animateChapter('chapter3');
  animateChapter('chapter4');
  animateChapter('chapter5');
  animateChapter('chapter6');

  // Chapter parallax background shifts
  chapters.forEach((chapter) => {
    const bg = chapter.querySelector('.chapter-bg');
    if (!bg) return;
    ScrollTrigger.create({
      trigger: chapter,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        gsap.set(bg, { scale: 1 + self.progress * 0.015 });
      }
    });
  });

  }

  // ============================================
  // GSAP + SCROLLTRIGGER — Cinematic Animations
  // ============================================

  if (shouldAnimate) {

  // Hero entrance
  const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  heroTl
    .from('.title-line', { y: 120, opacity: 0, duration: 1.2, stagger: 0.2 })
    .from('.hero-subtitle', { y: 40, opacity: 0, duration: 1 }, '-=0.4')
    .from('.hero-actions .btn', { y: 30, opacity: 0, scale: 0.95, duration: 0.8 }, '-=0.4');

  // Features — staggered reveal (one-time)
  gsap.utils.toArray('.feature-card').forEach((card) => {
    ScrollTrigger.create({
      trigger: card,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        gsap.to(card, {
          y: 0, opacity: 1, duration: 0.8,
          delay: parseFloat(card.dataset.delay) || 0,
          ease: 'power3.out',
        });
      },
    });
    gsap.set(card, { y: 40, opacity: 0 });
  });

  // Explore
  ScrollTrigger.create({
    trigger: '.explore', start: 'top 70%', once: true,
    onEnter: () => {
      gsap.from('.explore-tabs', { y: 20, opacity: 0, duration: 0.8, ease: 'power3.out' });
      gsap.from('.explore-panel.active', { y: 30, opacity: 0, duration: 0.8, delay: 0.2, ease: 'power3.out' });
    },
  });

  // Game
  ScrollTrigger.create({
    trigger: '.game', start: 'top 70%', once: true,
    onEnter: () => {
      gsap.from('.game-hud', { y: 30, opacity: 0, duration: 0.8, ease: 'power3.out' });
      gsap.from('.game-board', { scale: 0.95, opacity: 0, duration: 0.8, delay: 0.2, ease: 'power3.out' });
      gsap.from('.game-controls', { y: 20, opacity: 0, duration: 0.6, delay: 0.4, ease: 'power3.out' });
    },
  });

  // Testimonials
  ScrollTrigger.create({
    trigger: '.testimonials', start: 'top 70%', once: true,
    onEnter: () => {
      gsap.from('.testimonials-track', { opacity: 0, duration: 1, ease: 'power3.out' });
    },
  });

  // Product
  ScrollTrigger.create({
    trigger: '.product', start: 'top 60%', once: true,
    onEnter: () => {
      gsap.from('.product-gallery', { x: -30, opacity: 0, duration: 1, ease: 'power3.out' });
      gsap.from('.product-details > *', {
        y: 20, opacity: 0, stagger: 0.08, duration: 0.6, ease: 'power3.out', delay: 0.2,
      });
    },
  });

  // Footer
  ScrollTrigger.create({
    trigger: '.footer', start: 'top 80%', once: true,
    onEnter: () => {
      gsap.from('.footer-brand', { y: 30, opacity: 0, duration: 0.8, ease: 'power3.out' });
      gsap.from('.footer-col', { y: 20, opacity: 0, stagger: 0.1, duration: 0.6, ease: 'power3.out', delay: 0.2 });
    },
  });

  // Section labels & titles — generic reveal
  document.querySelectorAll('.section[data-section]').forEach((section) => {
    const label = section.querySelector('.section-label');
    const title = section.querySelector('.section-title');
    ScrollTrigger.create({
      trigger: section, start: 'top 75%', once: true,
      onEnter: () => {
        if (label) gsap.from(label, { x: -30, opacity: 0, duration: 0.8, ease: 'power3.out' });
        if (title) {
          gsap.from(title.querySelectorAll('.title-reveal'), {
            y: 60, opacity: 0, stagger: 0.15, duration: 0.8, ease: 'power3.out', delay: 0.2,
          });
        }
      },
    });
  });

  }

  // ============================================
  // EXPLORE — Tab Panels
  // ============================================
  const exploreTabs = document.querySelectorAll('.explore-tab');
  const explorePanels = document.querySelectorAll('.explore-panel');

  exploreTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.panel;
      exploreTabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      explorePanels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      const panel = document.getElementById(`panel-${target}`);
      if (panel) panel.classList.add('active');
    });
  });

  // ============================================
  // EXPLORE — Hotspot Detail Panel
  // ============================================
  const hotspotDots = document.querySelectorAll('.hotspot-dot');
  const detailFill = document.getElementById('showcaseDetailFill');
  const fillIcon = document.getElementById('fillIcon');
  const fillLabel = document.getElementById('fillLabel');
  const fillValue = document.getElementById('fillValue');

  const hotspotData = {
    material: { icon: '<i class="fa-solid fa-layer-group"></i>', label: 'Material', value: 'Premium fired clay, aged to perfection' },
    craftsmanship: { icon: '<i class="fa-solid fa-hand"></i>', label: 'Craftsmanship', value: 'Hand-finished by master artisans' },
    texture: { icon: '<i class="fa-solid fa-border-all"></i>', label: 'Texture', value: 'Matte surface with natural variations' },
    weight: { icon: '<i class="fa-solid fa-weight-scale"></i>', label: 'Weight', value: '2.3 kg — substantial yet portable' },
    durability: { icon: '<i class="fa-solid fa-shield-halved"></i>', label: 'Durability', value: 'Engineered to outlast civilizations' },
  };

  hotspotDots.forEach(dot => {
    const hotspot = dot.closest('.hotspot');
    const detail = hotspot ? hotspot.dataset.detail : null;
    dot.addEventListener('mouseenter', () => {
      if (detail && hotspotData[detail] && detailFill && fillIcon && fillLabel && fillValue) {
        const data = hotspotData[detail];
        fillIcon.innerHTML = data.icon;
        fillLabel.textContent = data.label;
        fillValue.textContent = data.value;
        detailFill.classList.add('highlight');
      }
    });
    dot.addEventListener('mouseleave', () => {
      if (detailFill) detailFill.classList.remove('highlight');
    });
  });

  // ============================================
  // EXPLORE — 3D Brick Display Controls
  // ============================================
  var showcaseControls = window.brickControls && window.brickControls.showcase;

  function getShowcaseControls() {
    return window.brickControls && window.brickControls.showcase;
  }

  var zoomInBtn = document.getElementById('zoomIn');
  var zoomOutBtn = document.getElementById('zoomOut');
  var zoomLevelEl = document.getElementById('zoomLevel');
  var rotateToggle = document.getElementById('rotateToggle');
  var resetViewBtn = document.getElementById('resetView');

  if (zoomInBtn) {
    zoomInBtn.addEventListener('click', function() {
      var c = getShowcaseControls();
      if (c) { c.zoomIn(); if (zoomLevelEl) zoomLevelEl.textContent = c.getZoomLevel(); }
    });
  }

  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', function() {
      var c = getShowcaseControls();
      if (c) { c.zoomOut(); if (zoomLevelEl) zoomLevelEl.textContent = c.getZoomLevel(); }
    });
  }

  if (rotateToggle) {
    rotateToggle.addEventListener('click', function() {
      var c = getShowcaseControls();
      if (c) {
        var on = !c.autoRotate();
        c.autoRotate(on);
        rotateToggle.classList.toggle('active', on);
      }
    });
  }

  if (resetViewBtn) {
    resetViewBtn.addEventListener('click', function() {
      var c = getShowcaseControls();
      if (c) { c.resetView(); if (zoomLevelEl) zoomLevelEl.textContent = c.getZoomLevel(); }
    });
  }

  // ============================================
  // EXPLORE — X-Ray Cutaway Toggle
  // ============================================
  const xrayToggle = document.getElementById('xrayToggle');
  const xrayCutaway = document.getElementById('xrayCutaway');
  const xrayToggleText = document.getElementById('xrayToggleText');

  if (xrayToggle && xrayCutaway) {
    const xrayLabels = document.querySelectorAll('.xray-label');
    xrayToggle.addEventListener('click', () => {
      const isOpen = xrayCutaway.classList.toggle('open');
      xrayToggleText.textContent = isOpen ? 'Hide Layers' : 'Reveal Layers';
      xrayToggle.classList.toggle('active');

      if (isOpen) {
        xrayLabels.forEach((label, idx) => {
          const text = label.querySelector('.xray-text');
          if (text) {
            gsap.set(text, { opacity: 0 });
            gsap.to(text, { opacity: 1, duration: 0.4, delay: 0.8 + idx * 0.25, ease: 'power2.out' });
          }
        });
      } else {
        xrayLabels.forEach((label) => {
          const text = label.querySelector('.xray-text');
          if (text) gsap.set(text, { opacity: 0 });
        });
      }
    });
  }

  // ============================================
  // INITIALIZE CART & GAME
  // ============================================
  if (typeof CART !== 'undefined') CART.init();
  if (typeof BRICK_GAME !== 'undefined') BRICK_GAME.init();

  // ============================================
  // PAYMENT FORMATTING
  // ============================================
  const cardInput = document.getElementById('checkoutCard');
  const expiryInput = document.getElementById('checkoutExpiry');
  const cvcInput = document.getElementById('checkoutCVC');
  const cardBrandIcon = document.getElementById('cardBrandIcon');

  function detectCardBrand(num) {
    var clean = num.replace(/\s/g, '');
    if (/^4[0-9]/.test(clean)) return { brand: 'Visa', icon: 'fa-brands fa-cc-visa', color: '#1A1F71' };
    if (/^5[1-5]/.test(clean)) return { brand: 'Mastercard', icon: 'fa-brands fa-cc-mastercard', color: '#EB001B' };
    if (/^3[47]/.test(clean)) return { brand: 'Amex', icon: 'fa-brands fa-cc-amex', color: '#2E77BC' };
    return null;
  }

  if (cardInput && cardBrandIcon) {
    cardInput.addEventListener('input', function () {
      this.value = this.value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').substring(0, 19);
      var detected = detectCardBrand(this.value);
      if (detected) {
        cardBrandIcon.innerHTML = '<i class="' + detected.icon + '" style="color:' + detected.color + ';font-size:22px"></i>';
        cardBrandIcon.title = detected.brand;
      } else {
        cardBrandIcon.innerHTML = '<i class="fa-regular fa-credit-card"></i>';
        cardBrandIcon.title = '';
      }
    });
  }
  if (expiryInput) {
    expiryInput.addEventListener('input', function () {
      let val = this.value.replace(/\D/g, '');
      if (val.length >= 2) val = val.substring(0, 2) + '/' + val.substring(2);
      this.value = val.substring(0, 5);
    });
  }
  if (cvcInput) {
    cvcInput.addEventListener('input', function () {
      this.value = this.value.replace(/\D/g, '').substring(0, 4);
    });
  }

  // ============================================
  // CONFIRMATION — Close
  // ============================================
  const confirmOverlay = document.getElementById('confirmationOverlay');
  const confirmModal = document.getElementById('confirmationModal');
  if (confirmOverlay) {
    confirmOverlay.addEventListener('click', () => {
      confirmModal.classList.remove('show');
      confirmOverlay.classList.remove('show');
      document.body.style.overflow = '';
    });
  }

  // ============================================
  // KEYBOARD NAVIGATION
  // ============================================
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (mobileMenu && menuToggle) {
        mobileMenu.classList.remove('show');
        menuToggle.querySelector('i').className = 'fa-solid fa-bars';
      }

      const cartClose = document.getElementById('cartClose');
      if (cartClose && document.getElementById('cartPanel').classList.contains('show')) {
        cartClose.click();
      }

      const checkoutClose = document.getElementById('checkoutClose');
      if (checkoutClose && document.getElementById('checkoutPanel').classList.contains('show')) {
        checkoutClose.click();
      }

      if (confirmModal?.classList.contains('show')) {
        confirmModal.classList.remove('show');
        confirmOverlay.classList.remove('show');
        document.body.style.overflow = '';
      }
    }
  });

  // ============================================
  // FOCUS TRAP for modals
  // ============================================
  function trapFocus(containerEl) {
    const focusableEls = containerEl.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableEls[0];
    const lastFocusable = focusableEls[focusableEls.length - 1];

    function handler(e) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    }
    containerEl.addEventListener('keydown', handler);
    if (firstFocusable) firstFocusable.focus();
    return () => containerEl.removeEventListener('keydown', handler);
  }

  // Apply focus trap to modals
  var modals = [document.getElementById('cartPanel'), document.getElementById('checkoutPanel'), confirmModal];
  var modalCleanups = [];
  modals.forEach(function(modal) {
    if (!modal) return;
    var observer = new MutationObserver(function() {
      if (modal.classList.contains('show')) {
        modalCleanups.push(trapFocus(modal));
      } else {
        while (modalCleanups.length > 0) {
          var cleanup = modalCleanups.pop();
          if (cleanup) cleanup();
        }
      }
    });
    observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
  });

  // ============================================
  // ACCESSIBILITY — Focus management
  // ============================================
  document.addEventListener('focusin', (e) => {
    if (e.target.matches('a, button, input, select, textarea, [tabindex]')) {
      e.target.style.outline = '2px solid var(--accent-red)';
      e.target.style.outlineOffset = '2px';
    }
  });
  document.addEventListener('focusout', (e) => {
    if (e.target.matches('a, button, input, select, textarea, [tabindex]')) {
      e.target.style.outline = '';
    }
  });

  // ============================================
  // RESIZE
  // ============================================
  window.addEventListener('resize', () => lenis.resize());

  // ============================================
  // FOOTER MODAL
  // ============================================
  var footerModalOverlay = document.getElementById('footerModalOverlay');
  var footerModal = document.getElementById('footerModal');
  var footerModalTitle = document.getElementById('footerModalTitle');
  var footerModalBody = document.getElementById('footerModalBody');
  var footerModalClose = document.getElementById('footerModalClose');

  var footerContent = {
    contact: {
      title: 'Contact BRICK',
      body: '<h5>Get in Touch</h5><p>We\'d love to hear from you. Whether you have a question about the brick, your order, or just want to say hello.</p><ul><li>Email: <strong>hello@brick.com.bd</strong></li><li>Phone: <strong>+880 1700-000000</strong></li><li>Address: <strong>House 42, Road 11, Gulshan 2, Dhaka 1212, Bangladesh</strong></li></ul><p>Our team typically responds within 24 hours.</p>'
    },
    faq: {
      title: 'Frequently Asked Questions',
      body: '<h5>What is The Original Brick?</h5><p>A limited edition luxury object. A brick. One hundred exist. Each one authenticated.</p><h5>How long does shipping take?</h5><p>All orders ship within 2 business days. Delivery across Bangladesh takes 3–7 business days via Sundarban Courier or Pathao.</p><h5>Can I return my brick?</h5><p>Yes. If the brick does not speak to you within 30 days, return it for a full refund. No questions asked.</p><h5>Can I change my order?</h5><p>Contact us within 24 hours of placing your order and we\'ll adjust it. After that, it enters production.</p>'
    },
    shipping: {
      title: 'Shipping Policy',
      body: '<h5>Shipping & Handling</h5><p>Complimentary shipping across Bangladesh. No hidden fees, no surcharges.</p><ul><li><strong>Dhaka City:</strong> 2–3 business days</li><li><strong>Divisional Cities:</strong> 3–5 business days</li><li><strong>Other Districts:</strong> 5–7 business days</li><li><strong>Express Delivery:</strong> Available via Pathao Express (additional fee)</li></ul><p>All shipments are insured and require a signature upon delivery. Tracking information is shared via SMS once your order ships.</p>'
    },
    returns: {
      title: 'Returns & Exchanges',
      body: '<h5>30-Day Satisfaction Guarantee</h5><p>If The Original Brick does not meet your expectations, return it within 30 days of delivery for a full refund.</p><ul><li>Items must be unused and in original packaging</li><li>Refunds are processed within 5 business days of receipt</li><li>Shipping costs are non-refundable on returns</li></ul><p>To initiate a return, email <strong>returns@brick.com.bd</strong> with your order number.</p>'
    },
    privacy: {
      title: 'Privacy Policy',
      body: '<h5>Your Privacy Matters</h5><p>BRICK collects only the information necessary to process your order and improve your experience.</p><ul><li>We do not sell your personal data</li><li>We do not share your information with third parties for marketing</li><li>Payment data is processed securely by our payment partners</li><li>You may request deletion of your data at any time</li></ul><p>Contact <strong>privacy@brick.com.bd</strong> for any privacy-related inquiries.</p>'
    },
    terms: {
      title: 'Terms of Service',
      body: '<h5>Terms & Conditions</h5><p>By purchasing The Original Brick, you agree to the following terms:</p><ul><li>All sales are subject to availability</li><li>Ownership of the physical brick does not transfer intellectual property rights</li><li>BRICK reserves the right to cancel orders in case of technical errors</li><li>Prices are in Bangladeshi Taka (BDT) and include applicable VAT</li></ul><p>These terms are governed by the laws of the People\'s Republic of Bangladesh.</p>'
    },
    cookies: {
      title: 'Cookie Policy',
      body: '<h5>How We Use Cookies</h5><p>BRICK uses essential cookies to ensure the site functions properly. These are necessary for the shopping cart and checkout experience.</p><ul><li><strong>Essential:</strong> Cart, session management, security</li><li><strong>Analytics:</strong> Anonymous usage data to improve the site (opt-out available)</li><li><strong>No tracking:</strong> We do not use advertising or cross-site tracking cookies</li></ul><p>By continuing to use this site, you accept our use of essential cookies.</p>'
    }
  };

  function openFooterModal(key) {
    var content = footerContent[key];
    if (!content || !footerModal || !footerModalTitle || !footerModalBody || !footerModalOverlay) return;
    footerModalTitle.textContent = content.title;
    footerModalBody.innerHTML = content.body;
    footerModal.classList.add('show');
    footerModalOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function closeFooterModal() {
    if (!footerModal || !footerModalOverlay) return;
    footerModal.classList.remove('show');
    footerModalOverlay.classList.remove('show');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('[data-footer]').forEach(function(link) {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      openFooterModal(link.dataset.footer);
    });
  });

  if (footerModalClose) footerModalClose.addEventListener('click', closeFooterModal);
  if (footerModalOverlay) footerModalOverlay.addEventListener('click', closeFooterModal);

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeFooterModal();
  });

  console.log(
    '%c BRICK ',
    'background: #B83A1A; color: white; font-size: 20px; font-weight: bold; padding: 10px; border-radius: 4px;'
  );
  console.log('%c The brick that chooses you. ', 'color: #D4A843; font-size: 14px;');

});
