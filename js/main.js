/* =============================================
   BRICK — Main Application
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {

  // ============================================
  // DEVICE TIER
  // ============================================
  const tier = window.DEVICE_TIER || 'high';
  const shouldAnimate = tier !== 'low';
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // ============================================
  // HERO EMBER PARTICLE FIELD
  // ============================================
  if (tier !== 'low') {
    var emberField = document.getElementById('heroEmberField');
    if (emberField) {
      var emberColors = ['#ff8833', '#ff6633', '#ffcc44', '#ffaa44', '#ff4422'];
      for (var i = 0; i < 25; i++) {
        var e = document.createElement('span');
        e.className = 'hero-ember';
        e.style.left = (Math.random() * 100) + '%';
        e.style.width = e.style.height = (2 + Math.random() * 4) + 'px';
        e.style.background = emberColors[Math.floor(Math.random() * emberColors.length)];
        e.style.animationDuration = (8 + Math.random() * 12) + 's';
        e.style.animationDelay = (Math.random() * 15) + 's';
        e.style.opacity = '0';
        emberField.appendChild(e);
      }
    }
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
      var t = Math.max(0, Math.min(1, (now - startTime) / duration));
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
  const cursor = (window.DEVICE_TIER === 'low' || isTouchDevice) ? null : document.getElementById('cursor');
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
    var emberCount = 0;
    var MAX_EMBERS = 30;
    function spawnEmber(x, y) {
      var now = Date.now();
      if (now - lastEmberTime < 25 || emberCount >= MAX_EMBERS) return;
      lastEmberTime = now;
      emberCount++;
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
      setTimeout(function() { if (e.parentNode) e.parentNode.removeChild(e); emberCount--; }, 700);
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
  // SNAP SCROLL — Hero through Explore (disabled on mobile touch devices)
  // ============================================
  function initSectionSnap() {
    if (isTouchDevice && isMobile) return;
    var snapSelectors = '#hero, .story-chapter, #explore';
    var snapEls = document.querySelectorAll(snapSelectors);
    if (snapEls.length < 2) { window._snapSectionCount = 0; return; }

    var activeIdx = 0;

    snapEls.forEach(function(el, i) {
      el.classList.add('snap-section');
      el.style.minHeight = '100vh';
      if (i === 0) {
        el.classList.add('snap-active');
      } else {
        el.classList.add('snap-inactive');
      }
    });

    function getScrollY() {
      return window.pageYOffset || document.documentElement.scrollTop;
    }

    function updateActive() {
      var sy = getScrollY();
      var vh = window.innerHeight;
      // Snap sections are each 100vh tall — round to the nearest section
      var raw = sy / vh;
      var idx = Math.round(raw);
      idx = Math.max(0, Math.min(idx, snapEls.length - 1));

      if (idx !== activeIdx) {
        snapEls[activeIdx].classList.remove('snap-active');
        snapEls[activeIdx].classList.add('snap-inactive');
        activeIdx = idx;
        snapEls[activeIdx].classList.remove('snap-inactive');
        snapEls[activeIdx].classList.add('snap-active');
      }
    }

    // Listen on native scroll / resize
    window.addEventListener('scroll', updateActive, { passive: true });
    window.addEventListener('resize', updateActive, { passive: true });

    // Run once on init
    updateActive();
  }

  initSectionSnap();

  // ============================================
  // BODY SCROLL LOCK (iOS-safe)
  // ============================================
  function lockBodyScroll() {
    var sy = window.scrollY;
    document.body.dataset.scrollY = sy;
    document.body.style.position = 'fixed';
    document.body.style.top = '-' + sy + 'px';
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
  }
  function unlockBodyScroll() {
    var sy = parseInt(document.body.dataset.scrollY, 10) || 0;
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    delete document.body.dataset.scrollY;
    window.scrollTo(0, sy);
  }
  window.lockBodyScroll = lockBodyScroll;
  window.unlockBodyScroll = unlockBodyScroll;

  // ============================================
  // SCROLL PROGRESS BAR
  // ============================================
  const progressFill = document.getElementById('scrollProgressFill');
  let scrollTicking = false;
  function updateScrollProgress() {
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    progressFill.style.width = Math.min(100, (window.scrollY / docHeight) * 100) + '%';
  }
  function onScrollTick() {
    if (!scrollTicking) {
      requestAnimationFrame(function () {
        updateScrollProgress();
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }
  window.addEventListener('scroll', onScrollTick, { passive: true });

  // ============================================
  // NAVIGATION
  // ============================================
  const navbar = document.getElementById('navbar');
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');

  function getScrollTop() {
    return window.scrollY;
  }
  function onNavScroll() {
    if (navbar) navbar.classList.toggle('scrolled', getScrollTop() > 50);
  }
  window.addEventListener('scroll', onNavScroll, { passive: true });

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
      if (typeof unlockBodyScroll === 'function') unlockBodyScroll();
    }
    var target = link.getAttribute('href');
    if (target && target.startsWith('#')) {
      var el = document.querySelector(target);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  });

  // ============================================
  // BACK TO TOP
  // ============================================
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    function onBackToTopScroll() {
      backToTop.classList.toggle('show', getScrollTop() > 500);
    }
    window.addEventListener('scroll', onBackToTopScroll, { passive: true });
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ============================================
  // THREE.JS BRICK — handled by three-brick.js module
  // ============================================

  // ============================================
  // STORY — Cinematic Chapter Animations (scrub-based)
  // ============================================

  if (shouldAnimate) {

  const chapters = document.querySelectorAll('.story-chapter');
  var chapterIds = ['prologue', 'chapter1', 'chapter2', 'chapter3', 'chapter4', 'chapter5', 'chapter6'];
  var chapterProgress = document.getElementById('chapterProgress');
  var chapterDots = chapterProgress ? chapterProgress.querySelectorAll('.chapter-dot') : [];
  var chapterProgressFill = document.getElementById('chapterProgressFill');

  // Chapter progress bar visibility
  ScrollTrigger.create({
    trigger: '#story',
    start: 'top bottom',
    end: 'bottom top',
    onUpdate: function(self) {
      if (chapterProgress) {
        if (self.progress > 0 && self.progress < 1) {
          chapterProgress.classList.add('visible');
        } else {
          chapterProgress.classList.remove('visible');
        }
      }
    }
  });

  // Scroll-linked chapter text reveals with scrub
  chapterIds.forEach(function(id) {
    var chapter = document.getElementById(id);
    if (!chapter) return;
    var label = chapter.querySelector('.ch-label');
    var lines = chapter.querySelectorAll('.ch-line');
    var btn = chapter.querySelector('.btn');
    var visual = chapter.querySelector('.chapter-visual');

    ScrollTrigger.create({
      trigger: '#' + id,
      start: 'top 40%',
      end: 'top 10%',
      scrub: 1.2,
      onUpdate: function(self) {
        var p = self.progress;
        if (label) {
          label.style.opacity = Math.min(1, p * 2);
          label.style.transform = 'translateY(' + (8 - p * 8) + 'px)';
        }
        lines.forEach(function(line, i) {
          var d = p - i * 0.15;
          if (d > 0) {
            line.style.opacity = Math.min(1, d * 2.5);
            line.style.transform = 'translateY(' + (20 - d * 20) + 'px)';
          } else {
            line.style.opacity = '0';
            line.style.transform = 'translateY(20px)';
          }
        });
        if (btn) {
          btn.style.opacity = Math.min(1, (p - 0.5) * 3);
          btn.style.transform = 'translateY(' + (10 - Math.min(1, (p - 0.5) * 3) * 10) + 'px)';
        }
        if (visual) {
          visual.style.opacity = Math.min(1, p * 2);
        }
      }
    });
  });

  // Chapter transition: blur/scale on the background between chapters
  chapters.forEach(function(chapter) {
    var bg = chapter.querySelector('.chapter-bg');
    if (!bg) return;
    ScrollTrigger.create({
      trigger: chapter,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: function(self) {
        var p = self.progress;
        var blur = Math.sin(p * Math.PI) * 3;
        bg.style.filter = 'blur(' + blur + 'px)';
        bg.style.transform = 'scale(' + (1 + p * 0.02) + ')';
      }
    });
  });

  // Background gradient evolution across chapters
  var storySection = document.getElementById('story');
  if (storySection) {
    var storyBgColors = [
      '#0a0a0f',
      '#1a0a00',
      '#2a0500',
      '#000814',
      '#0a1a08',
      '#1a0005',
      '#1a0a00'
    ];
    ScrollTrigger.create({
      trigger: '#story',
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1,
      onUpdate: function(self) {
        var p = self.progress * (storyBgColors.length - 1);
        var idx = Math.floor(p);
        var frac = p - idx;
        var idx2 = Math.min(idx + 1, storyBgColors.length - 1);
        var c1 = storyBgColors[idx];
        var c2 = storyBgColors[idx2];
        if (c1 && c2 && storySection) {
          storySection.style.background = 'linear-gradient(to bottom, ' + c1 + ', ' + c2 + ')';
          storySection.style.transition = 'background 0.3s ease';
        }
      }
    });
  }

  // Chapter progress dot tracking
  chapterIds.forEach(function(id, i) {
    ScrollTrigger.create({
      trigger: '#' + id,
      start: 'top center',
      end: 'bottom center',
      onUpdate: function(self) {
        if (self.isActive && chapterDots[i]) {
          chapterDots.forEach(function(d) { d.classList.remove('active'); });
          chapterDots[i].classList.add('active');
          if (chapterProgressFill) {
            chapterProgressFill.style.height = ((i + self.progress) / chapterIds.length * 100) + '%';
          }
        }
      }
    });
  });

  // Chapter dot click navigation
  chapterDots.forEach(function(dot) {
    dot.addEventListener('click', function() {
      var target = document.getElementById(dot.dataset.chapter);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  }

  // ============================================
  // GSAP + SCROLLTRIGGER — Cinematic Animations
  // ============================================

  if (shouldAnimate) {

  // Hero entrance — split characters
  const heroTitle = document.getElementById('heroTitle');
  if (heroTitle) {
    const lines = heroTitle.querySelectorAll('.title-line');
    lines.forEach(function(line) {
      var text = line.textContent.trim();
      line.textContent = '';
      for (var i = 0; i < text.length; i++) {
        var ch = document.createElement('span');
        ch.className = 'char';
        ch.textContent = text[i] === ' ' ? '\u00A0' : text[i];
        line.appendChild(ch);
      }
    });
    var allChars = heroTitle.querySelectorAll('.char');
    gsap.to(allChars, {
      y: 0, opacity: 1, rotateX: 0,
      duration: 1.0,
      stagger: 0.025,
      ease: 'power4.out',
      delay: 0.3,
    });
  }

  // Hero subtitle
  gsap.set('.hero-subtitle.active', { opacity: 0 });
  gsap.to('.hero-subtitle.active', { opacity: 1, duration: 1.2, delay: 1.6, ease: 'power2.out' });

  // Hero actions button
  gsap.fromTo('.hero-btn', { y: 30, opacity: 0, scale: 0.95 }, { y: 0, opacity: 1, scale: 1, duration: 1, delay: 2.0, ease: 'power3.out' });

  // Scroll indicator
  gsap.to('#heroScrollIndicator', { opacity: 1, duration: 1, delay: 2.8, ease: 'power2.out' });
  window.addEventListener('scroll', function() {
    var hero = document.getElementById('hero');
    var indicator = document.getElementById('heroScrollIndicator');
    if (hero && indicator) {
      var heroBottom = hero.getBoundingClientRect().bottom;
      indicator.style.opacity = heroBottom < 100 ? '0' : '';
    }
  }, { passive: true });

  // Tagline cycling
  var subtitleEl = document.getElementById('heroSubtitle');
  if (subtitleEl) {
    var taglines;
    try { taglines = JSON.parse(subtitleEl.dataset.taglines); } catch(e) { taglines = null; }
    if (taglines && taglines.length > 1) {
      var tagIdx = 0;
      setInterval(function() {
        tagIdx = (tagIdx + 1) % taglines.length;
        var current = subtitleEl;
        var nextText = taglines[tagIdx];
        if (current.textContent !== nextText) {
          gsap.to(current, { opacity: 0, duration: 0.4, ease: 'power2.in', onComplete: function() {
            current.textContent = nextText;
            gsap.to(current, { opacity: 1, duration: 0.6, ease: 'power2.out' });
          }});
        }
      }, 4000);
    }
  }

  // Magnetic button effect
  var heroBtn = document.querySelector('.hero-btn');
  if (heroBtn && !isTouchDevice) {
    var btnRect, btnCX, btnCY;
    function updateBtnRect() {
      btnRect = heroBtn.getBoundingClientRect();
      btnCX = btnRect.left + btnRect.width / 2;
      btnCY = btnRect.top + btnRect.height / 2;
    }
    updateBtnRect();
    window.addEventListener('resize', updateBtnRect);
    document.addEventListener('mousemove', function(e) {
      var dx = e.clientX - btnCX;
      var dy = e.clientY - btnCY;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120 && dist > 0) {
        var pull = (1 - dist / 120) * 8;
        var angle = Math.atan2(dy, dx);
        heroBtn.style.transform = 'translate(' + (Math.cos(angle) * pull) + 'px, ' + (Math.sin(angle) * pull) + 'px)';
      } else {
        heroBtn.style.transform = '';
      }
    });
    heroBtn.addEventListener('mouseleave', function() {
      heroBtn.style.transform = '';
    });
  }

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
      gsap.from('.game-container', { scale: 0.95, opacity: 0, duration: 0.8, delay: 0.2, ease: 'power3.out' });
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
    material: { icon: '<i class="fa-solid fa-layer-group"></i>', label: 'Material', value: 'Fired clay — transformed by heat into a ceramic that will never return to mud.' },
    craftsmanship: { icon: '<i class="fa-solid fa-hand"></i>', label: 'Surface', value: 'Matte texture with natural grain — no two faces are identical.' },
    texture: { icon: '<i class="fa-solid fa-border-all"></i>', label: 'Firing Marks', value: 'Subtle color variations from the kiln — the fingerprint of its making.' },
    weight: { icon: '<i class="fa-solid fa-weight-scale"></i>', label: 'Weight', value: '3.2 kg — the satisfying heft of something built to last.' },
    durability: { icon: '<i class="fa-solid fa-shield-halved"></i>', label: 'Durability', value: 'Rated for 10,000 PSI compressive strength — stronger than concrete.' },
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
  const confirmClose = document.getElementById('confirmationClose');
  var confirmClosing = false;
  function closeConfirmation() {
    if (confirmClosing) return;
    confirmClosing = true;

    if (typeof gsap !== 'undefined') {
      var exitTl = gsap.timeline({ onComplete: function () {
        var content = document.querySelector('.confirmation-content');
        if (content) content.style.opacity = '';
        confirmModal.classList.remove('show');
        confirmOverlay.classList.remove('show');
        confirmClosing = false;
        if (typeof unlockBodyScroll === 'function') unlockBodyScroll();
      }});
      exitTl.to('.confirmation-content', { opacity: 0, scale: 0.95, duration: 0.25, ease: 'power2.in' }, 0);
      exitTl.to('.confirmation-close', { opacity: 0, duration: 0.2, ease: 'power2.in' }, 0);
    } else {
      confirmModal.classList.remove('show');
      confirmOverlay.classList.remove('show');
      confirmClosing = false;
      if (typeof unlockBodyScroll === 'function') unlockBodyScroll();
    }
  }

  if (confirmOverlay) {
    confirmOverlay.addEventListener('click', closeConfirmation);
  }
  if (confirmClose) {
    confirmClose.addEventListener('click', closeConfirmation);
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
        closeConfirmation();
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
      body: '<h5>Terms & Conditions</h5><p>By purchasing The Original Brick, you agree to the following terms:</p><ul><li>All sales are subject to availability</li><li>Ownership of the physical brick does not transfer intellectual property rights</li><li>BRICK reserves the right to cancel orders in case of technical errors</li><li>Prices are in Bangladeshi Taka (BDT). A 15% VAT is added at checkout.</li></ul><p>These terms are governed by the laws of the People\'s Republic of Bangladesh.</p>'
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
    if (typeof lockBodyScroll === 'function') lockBodyScroll();
  }

  function closeFooterModal() {
    if (!footerModal || !footerModalOverlay) return;
    footerModal.classList.remove('show');
    footerModalOverlay.classList.remove('show');
    if (typeof unlockBodyScroll === 'function') unlockBodyScroll();
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
