/* =============================================
   BRICK — Main Application
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {

  // ============================================
  // LENIS — Smooth Scrolling
  // ============================================
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 0.8,
    touchMultiplier: 1.5,
  });

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  // ============================================
  // LOADING SCREEN
  // ============================================
  const loader = document.getElementById('loader');

  function hideLoader() {
    if (loader.classList.contains('hidden')) return;
    loader.classList.add('hidden');
    setTimeout(() => {
      const cursor = document.querySelector('.cursor');
      if (cursor) cursor.style.opacity = '1';
    }, 300);
  }

  window.addEventListener('load', () => setTimeout(hideLoader, 2000));
  setTimeout(() => { if (loader && !loader.classList.contains('hidden')) hideLoader(); }, 4000);

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
      if (!cursorActive) {
        cursorActive = true;
        if (!cursorRafId) animateCursor();
      }
    }, { passive: true });

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

    document.querySelectorAll('a, button, .hotspot-dot, .color-btn, .gallery-thumb, .gallery-thumb, .qty-btn').forEach(el => {
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
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });

  menuToggle.addEventListener('click', () => {
    mobileMenu.classList.toggle('show');
    const icon = menuToggle.querySelector('i');
    icon.className = mobileMenu.classList.contains('show') ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
  });

  document.querySelectorAll('[data-nav]').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('show');
      menuToggle.querySelector('i').className = 'fa-solid fa-bars';
    });
  });

  document.querySelectorAll('[data-smooth]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      // Close any open modals
      const gameResult = document.getElementById('gameResult');
      if (gameResult?.classList.contains('show')) {
        gameResult.classList.remove('show');
        document.body.style.overflow = '';
      }
      const target = link.getAttribute('href');
      if (target && target.startsWith('#')) {
        const el = document.querySelector(target);
        if (el) lenis.scrollTo(el, { duration: 1.5 });
      }
    });
  });

  // ============================================
  // BACK TO TOP
  // ============================================
  const backToTop = document.getElementById('backToTop');
  window.addEventListener('scroll', () => {
    backToTop.classList.toggle('show', window.scrollY > 500);
  }, { passive: true });
  backToTop.addEventListener('click', () => {
    lenis.scrollTo('#hero', { duration: 1.5 });
  });

  // ============================================
  // AMBIENT AUDIO
  // ============================================
  const audio = document.getElementById('ambientAudio');
  let isAudioPlaying = false;

  document.querySelectorAll('.audio-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      if (isAudioPlaying) {
        audio.pause();
        btn.querySelector('i').className = 'fa-solid fa-music';
      } else {
        audio.play().catch(() => {});
        btn.querySelector('i').className = 'fa-solid fa-volume-high';
      }
      isAudioPlaying = !isAudioPlaying;
    });
  });

  // ============================================
  // HERO PARTICLES
  // ============================================
  function createParticles(containerId, count = 60) {
    const container = document.getElementById(containerId);
    if (!container) return;
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';
      particle.style.width = (Math.random() * 3 + 2) + 'px';
      particle.style.height = particle.style.width;
      particle.style.animation = `floatParticle ${Math.random() * 6 + 4}s ease-in-out infinite`;
      particle.style.animationDelay = (Math.random() * 4) + 's';
      particle.style.opacity = Math.random() * 0.5 + 0.1;
      container.appendChild(particle);
    }
  }

  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes floatParticle {
      0%, 100% { transform: translateY(0) translateX(0); opacity: 0.2; }
      25% { transform: translateY(-20px) translateX(10px); }
      50% { transform: translateY(-10px) translateX(-10px); opacity: 0.6; }
      75% { transform: translateY(-30px) translateX(5px); }
    }
  `;
  document.head.appendChild(styleSheet);

  const particleTier = window.DEVICE_TIER || 'high';
  const heroParticleCount = particleTier === 'low' ? 15 : particleTier === 'mid' ? 40 : 80;
  const footerParticleCount = particleTier === 'low' ? 0 : particleTier === 'mid' ? 15 : 40;
  createParticles('heroParticles', heroParticleCount);
  if (footerParticleCount > 0) createParticles('footerParticles', footerParticleCount);

  // ============================================
  // THREE.JS BRICK
  // ============================================
  if (typeof THREE !== 'undefined' && typeof THREE_BRICK !== 'undefined') {
    THREE_BRICK.init('heroCanvas');
  }

  // ============================================
  // STORY — Cinematic Scroll Chapters (GSAP)
  // ============================================
  const chapters = document.querySelectorAll('.story-chapter');
  const chapterParticles = document.getElementById('ch2Particles');

  // Chapter 1: Before the Brick — text + particle + brick emergence
  const ch1Texts = document.querySelectorAll('.ch1-text');
  const ch1Particles = document.querySelectorAll('.ch1-particle-container');
  const ch1Brick = document.querySelector('.ch1-brick-emerge');

  ScrollTrigger.create({
    trigger: '#chapter1',
    start: 'top 30%',
    end: 'bottom 70%',
    onEnter: () => {
      gsap.to(ch1Texts, { y: 0, opacity: 1, duration: 1.2, stagger: 0.4, ease: 'power3.out' });
      gsap.to(ch1Particles, { opacity: 1, duration: 1.5, delay: 1.5, ease: 'power2.out' });
      gsap.to(ch1Brick, { scale: 1, opacity: 1, duration: 1.5, delay: 2.5, ease: 'back.out(1.7)' });
    },
    onLeaveBack: () => {
      gsap.set(ch1Texts, { y: 20, opacity: 0 });
      gsap.set(ch1Particles, { opacity: 0 });
      gsap.set(ch1Brick, { scale: 0.3, opacity: 0 });
    },
  });

  // Chapter 2: Born from the Earth — particles + text reveal
  const ch2Lines = document.querySelectorAll('.ch2-line');
  const ch2BrickCore = document.querySelector('.ch2-brick-core');
  const ch2BrickGlow = document.querySelector('.ch2-brick-glow');

  // Create floating particles for ch2
  if (chapterParticles) {
    for (let i = 0; i < 40; i++) {
      const p = document.createElement('div');
      p.className = 'ch2-particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.top = Math.random() * 100 + '%';
      p.style.animationDelay = (Math.random() * 4) + 's';
      chapterParticles.appendChild(p);
    }
  }

  ScrollTrigger.create({
    trigger: '#chapter2',
    start: 'top 30%',
    end: 'bottom 70%',
    onEnter: () => {
      gsap.to(ch2Lines, { y: 0, opacity: 1, duration: 1.2, stagger: 0.5, ease: 'power3.out' });
      gsap.to(ch2BrickCore, { scale: 1, opacity: 1, duration: 1.2, delay: 2, ease: 'back.out(2)' });
      gsap.to(ch2BrickGlow, { opacity: 1, duration: 1.5, delay: 2.2, ease: 'power2.out' });
      // Animate particles
      gsap.to('.ch2-particle', {
        opacity: 0.6, duration: 1.5, stagger: 0.02, ease: 'power2.out', delay: 0.5,
      });
    },
    onLeaveBack: () => {
      gsap.set(ch2Lines, { y: 30, opacity: 0 });
      gsap.set(ch2BrickCore, { scale: 0.5, opacity: 0 });
      gsap.set(ch2BrickGlow, { opacity: 0 });
      gsap.set('.ch2-particle', { opacity: 0 });
    },
  });

  // Chapter 3: Time — year timeline + brick constant
  const ch3Years = document.querySelectorAll('.ch3-year');
  const ch3Brick = document.querySelector('.ch3-brick-constant');
  const ch3Message = document.querySelector('.ch3-message');

  ScrollTrigger.create({
    trigger: '#chapter3',
    start: 'top 30%',
    end: 'bottom 70%',
    onEnter: () => {
      gsap.to(ch3Years, { y: 0, opacity: 1, duration: 0.8, stagger: 0.3, ease: 'power3.out' });
      gsap.to(ch3Years, { color: '#D4A843', duration: 0.3, stagger: 0.3, delay: 0.6, ease: 'power2.in' });
      gsap.to(ch3Brick, { opacity: 1, duration: 1, delay: 1.8, ease: 'power2.out' });
      gsap.to(ch3Message, { opacity: 1, duration: 1.2, delay: 2.5, ease: 'power2.out' });
    },
    onLeaveBack: () => {
      gsap.set(ch3Years, { y: 20, opacity: 0, color: '#555' });
      gsap.set(ch3Brick, { opacity: 0 });
      gsap.set(ch3Message, { opacity: 0 });
    },
  });

  // Chapter 4: The Test — items reveal then drop off
  const ch4Headline = document.querySelector('.ch4-headline');
  const ch4Items = document.querySelectorAll('.ch4-item');
  const ch4Msgs = document.querySelectorAll('.ch4-msg');

  ScrollTrigger.create({
    trigger: '#chapter4',
    start: 'top 20%',
    end: 'bottom 50%',
    onEnter: () => {
      const nonBrickItems = gsap.utils.toArray('.ch4-item:not(.ch4-item-brick)');
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl
        .to(ch4Headline, { opacity: 1, duration: 1 })
        .to(ch4Items, { y: 0, opacity: 1, duration: 0.6, stagger: 0.15, ease: 'power3.out' }, '-=0.5')
        .to(nonBrickItems, { opacity: 0, y: 20, scale: 0.9, duration: 0.6, stagger: 0.15, ease: 'power2.in' }, '+=2.5')
        .to(ch4Msgs, { opacity: 1, y: 0, duration: 0.8, stagger: 0.3, ease: 'power3.out' }, '-=0.4');
    },
    onLeaveBack: () => {
      gsap.set(ch4Headline, { opacity: 0 });
      gsap.set(ch4Items, { y: 20, opacity: 0, scale: 1 });
      gsap.set(ch4Msgs, { y: 10, opacity: 0 });
    },
  });

  // Chapter 5: The Legacy — wall of bricks + reveal
  const ch5Wall = document.getElementById('ch5BrickWall');
  let ch5WallBricks = [];

  if (ch5Wall) {
    for (let i = 0; i < 60; i++) {
      const brick = document.createElement('div');
      brick.className = 'ch5-wall-brick';
      ch5Wall.appendChild(brick);
      ch5WallBricks.push(brick);
    }
  }

  const ch5Reveal = document.querySelector('.ch5-reveal');

  ScrollTrigger.create({
    trigger: '#chapter5',
    start: 'top 30%',
    end: 'bottom 70%',
    onEnter: () => {
      gsap.to(ch5WallBricks, { opacity: 1, duration: 0.3, stagger: 0.005, ease: 'power2.out' });
      gsap.to(ch5Reveal, { scale: 1, opacity: 1, duration: 1.5, delay: 1.5, ease: 'elastic.out(1, 0.5)' });
    },
    onLeaveBack: () => {
      gsap.set(ch5WallBricks, { opacity: 0 });
      gsap.set(ch5Reveal, { scale: 0.8, opacity: 0 });
    },
  });

  // Chapter 3: Skyline buildings
  const ch3Skyline = document.getElementById('ch3Skyline');
  if (ch3Skyline) {
    const buildingHeights = [100, 140, 80, 180, 120, 90, 160, 110, 70, 200, 130, 95, 150, 85, 170, 100, 140, 120, 90, 160];
    const buildingWidths = [30, 25, 35, 20, 28, 32, 22, 26, 38, 18, 30, 24, 28, 34, 20, 30, 25, 22, 35, 28];
    buildingHeights.forEach((h, i) => {
      const b = document.createElement('div');
      b.className = 'ch3-building';
      b.style.height = h + 'px';
      b.style.width = (buildingWidths[i] || 26) + 'px';
      b.style.left = (i * 5) + '%';
      ch3Skyline.appendChild(b);
    });
  }

  // Chapter parallax background shifts
  chapters.forEach((chapter) => {
    const bg = chapter.querySelector('.chapter-bg');
    if (!bg) return;
    ScrollTrigger.create({
      trigger: chapter,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        const progress = self.progress;
        gsap.set(bg, { scale: 1 + progress * 0.02 });
      },
    });
  });

  // ============================================
  // GSAP + SCROLLTRIGGER — Cinematic Animations
  // ============================================

  // Hero entrance
  const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  heroTl
    .from('.hero-badge', { y: 30, opacity: 0, duration: 1.2, delay: 0.5 })
    .from('.title-line', { y: 100, opacity: 0, duration: 1, stagger: 0.2 }, '-=0.6')
    .from('.hero-subtitle', { y: 40, opacity: 0, duration: 1 }, '-=0.4')
    .from('.hero-actions .btn', { y: 30, opacity: 0, stagger: 0.2, duration: 0.8 }, '-=0.4')
    .from('.hero-scroll-indicator', { opacity: 0, duration: 1 }, '-=0.2');

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

  // ============================================
  // MOUSE-FOLLOW LIGHTING
  // ============================================
  const heroLighting = window.DEVICE_TIER !== 'low' ? document.getElementById('heroLighting') : null;
  if (heroLighting) {
    let lightRafId = null;
    document.addEventListener('mousemove', (e) => {
      if (lightRafId) cancelAnimationFrame(lightRafId);
      lightRafId = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth) * 100;
        const y = (e.clientY / window.innerHeight) * 100;
        heroLighting.style.background =
          `radial-gradient(600px circle at ${x}% ${y}%, rgba(198, 40, 40, 0.08), transparent 60%)`;
        lightRafId = null;
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
  // EXPLORE — 360° Brick Display (CSS 3D)
  // ============================================
  const sbdBrick = document.getElementById('sbdBrick');
  const rotateToggle = document.getElementById('rotateToggle');
  const resetViewBtn = document.getElementById('resetView');
  const zoomInBtn = document.getElementById('zoomIn');
  const zoomOutBtn = document.getElementById('zoomOut');
  const zoomLevelSpan = document.getElementById('zoomLevel');

  if (sbdBrick) {
    let isRotating = true;
    let rotX = -15, rotY = 25;
    let zoom = 1;
    let autoRotateInterval;

    function applyBrickTransform() {
      sbdBrick.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${zoom})`;
    }

    function startAutoRotate() {
      stopAutoRotate();
      autoRotateInterval = setInterval(() => {
        rotY += 0.3;
        applyBrickTransform();
      }, 16);
    }

    function stopAutoRotate() {
      if (autoRotateInterval) {
        clearInterval(autoRotateInterval);
        autoRotateInterval = null;
      }
    }

    startAutoRotate();

    if (rotateToggle) {
      rotateToggle.addEventListener('click', function () {
        isRotating = !isRotating;
        this.classList.toggle('active');
        if (isRotating) {
          startAutoRotate();
        } else {
          stopAutoRotate();
        }
      });
    }

    if (resetViewBtn) {
      resetViewBtn.addEventListener('click', () => {
        rotX = -15;
        rotY = 25;
        zoom = 1;
        isRotating = true;
        if (rotateToggle) rotateToggle.classList.remove('active');
        if (zoomLevelSpan) zoomLevelSpan.textContent = '1.0';
        applyBrickTransform();
        startAutoRotate();
      });
    }

    if (zoomInBtn && zoomOutBtn && zoomLevelSpan) {
      zoomInBtn.addEventListener('click', () => {
        zoom = Math.min(2, +(zoom + 0.1).toFixed(1));
        zoomLevelSpan.textContent = zoom.toFixed(1);
        applyBrickTransform();
      });
      zoomOutBtn.addEventListener('click', () => {
        zoom = Math.max(0.5, +(zoom - 0.1).toFixed(1));
        zoomLevelSpan.textContent = zoom.toFixed(1);
        applyBrickTransform();
      });
    }

    // Hotspot hover effect
    document.querySelectorAll('.hotspot').forEach(hs => {
      hs.addEventListener('mouseenter', () => {
        stopAutoRotate();
      });
      hs.addEventListener('mouseleave', () => {
        if (isRotating) startAutoRotate();
      });
    });
  }

  // ============================================
  // EXPLORE — X-Ray Cutaway Toggle
  // ============================================
  const xrayToggle = document.getElementById('xrayToggle');
  const xrayCutaway = document.getElementById('xrayCutaway');
  const xrayToggleText = document.getElementById('xrayToggleText');

  if (xrayToggle && xrayCutaway) {
    xrayToggle.addEventListener('click', () => {
      const isOpen = xrayCutaway.classList.toggle('open');
      xrayToggleText.textContent = isOpen ? 'Hide Cutaway' : 'Show Cutaway';
      xrayToggle.classList.toggle('active');
    });
  }

  // ============================================
  // EXPLORE — Build Mode
  // ============================================
  const buildGrid = document.getElementById('buildGrid');
  const buildCount = document.getElementById('buildCount');
  const buildAddBtn = document.getElementById('buildAddBtn');
  const buildClearBtn = document.getElementById('buildClearBtn');
  const buildStageFill = document.getElementById('buildStageFill');
  const buildStageText = document.getElementById('buildStageText');
  let bricksPlaced = 0;

  function updateBuildUI() {
    if (buildCount) buildCount.textContent = bricksPlaced;
    if (buildStageFill) {
      const pct = Math.min((bricksPlaced / 24) * 100, 100);
      buildStageFill.style.width = pct + '%';
    }
    if (buildStageText) {
      const stages = ['Place your first brick', 'Building a wall', 'Raising a house', 'Constructing a castle', 'Creating a skyline'];
      const idx = Math.min(Math.floor(bricksPlaced / 6), 4);
      buildStageText.textContent = stages[idx];
    }
  }

  if (buildGrid) {
    for (let i = 0; i < 24; i++) {
      const cell = document.createElement('div');
      cell.className = 'build-cell';
      cell.addEventListener('click', () => {
        if (cell.classList.contains('placed')) {
          cell.classList.add('removing');
          setTimeout(() => {
            cell.classList.remove('placed', 'removing');
            bricksPlaced = Math.max(0, bricksPlaced - 1);
            updateBuildUI();
          }, 300);
        } else {
          cell.classList.add('placed');
          bricksPlaced++;
          updateBuildUI();
        }
      });
      buildGrid.appendChild(cell);
    }
  }

  if (buildAddBtn) {
    buildAddBtn.addEventListener('click', () => {
      const emptyCells = document.querySelectorAll('.build-cell:not(.placed)');
      if (emptyCells.length > 0) {
        const cell = emptyCells[0];
        cell.classList.add('placed');
        bricksPlaced++;
        updateBuildUI();
      }
    });
  }

  if (buildClearBtn) {
    buildClearBtn.addEventListener('click', () => {
      document.querySelectorAll('.build-cell.placed').forEach(cell => {
        cell.classList.add('removing');
        setTimeout(() => cell.classList.remove('placed', 'removing'), 300);
      });
      bricksPlaced = 0;
      setTimeout(updateBuildUI, 350);
    });
  }

  // ============================================
  // EXPLORE — Legacy Counter Animation
  // ============================================
  function animateLegacyCounter(el, target, duration = 2500) {
    const start = 0;
    const startTime = performance.now();

    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + (target - start) * eased);
      el.textContent = current.toLocaleString();
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  const legacyObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.target);
        if (!isNaN(target)) animateLegacyCounter(el, target);
        legacyObserver.unobserve(el);
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.legacy-number[data-target]').forEach(el => legacyObserver.observe(el));

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

  if (cardInput) {
    cardInput.addEventListener('input', function () {
      this.value = this.value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').substring(0, 19);
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
      mobileMenu.classList.remove('show');
      menuToggle.querySelector('i').className = 'fa-solid fa-bars';

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
  const modals = [document.getElementById('cartPanel'), document.getElementById('checkoutPanel'), confirmModal];
  const modalObservers = [];
  modals.forEach(modal => {
    if (!modal) return;
    const observer = new MutationObserver(() => {
      if (modal.classList.contains('show')) {
        modalObservers.push(trapFocus(modal));
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
  // LAZY LOAD IMAGES
  // ============================================
  document.querySelectorAll('img[data-src]').forEach(img => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          img.src = img.dataset.src;
          img.classList.add('loaded');
          observer.unobserve(img);
        }
      });
    });
    observer.observe(img);
  });

  // ============================================
  // RESIZE
  // ============================================
  window.addEventListener('resize', () => lenis.resize());

  console.log(
    '%c BRICK ',
    'background: #C62828; color: white; font-size: 20px; font-weight: bold; padding: 10px; border-radius: 4px;'
  );
  console.log('%c The brick that chooses you. ', 'color: #D4A843; font-size: 14px;');

});
