(function() {
  'use strict';

  function detectTier() {
    var cores = navigator.hardwareConcurrency || 0;
    var memory = navigator.deviceMemory || 0;
    var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    var effectiveType = conn ? conn.effectiveType : null;
    var ua = navigator.userAgent || '';
    var isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
    var screenWidth = screen.width || 0;
    var screenHeight = screen.height || 0;
    var isOldOS = /Android [0-6]|iPhone OS [0-9]_|iPad; CPU OS [0-9]_/i.test(ua);
    var isLowEnd = /Redmi [0-4]|Galaxy J|Galaxy A[0-3]|Galaxy S[0-5]|Pixel [0-2]|iPhone [0-6]|iPhone 7|iPhone 8/i.test(ua);

    var score = isMobile ? 1 : 3;

    if (cores >= 6) score += 1;
    else if (cores <= 2) score -= 2;

    if (memory > 0) {
      if (memory >= 6) score += 1;
      else if (memory <= 3) score -= 1;
      else if (memory <= 2) score -= 2;
    }

    if (effectiveType === '4g') score += 1;
    else if (effectiveType === '3g') score -= 1;
    else if (effectiveType === '2g' || effectiveType === 'slow-2g') score -= 2;
    else if (isMobile && !effectiveType) score -= 1;

    if (isOldOS) score -= 2;
    if (isLowEnd) score -= 2;
    if (isMobile && screenWidth < 480) score -= 2;
    if (isMobile && screenWidth < 768) score -= 1;
    if (!isMobile && screenWidth >= 1024) score += 1;
    if (screenHeight <= 640) score -= 1;
    if (navigator.maxTouchPoints > 0 && screenWidth < 1024) score -= 1;

    if (score <= 1) return 'low';
    if (score <= 3) return 'mid';
    return 'high';
  }

  var tier = detectTier();
  document.documentElement.className += ' device-' + tier;
  window.DEVICE_TIER = tier;

  if (tier === 'low') {
    var s = document.createElement('style');
    s.textContent =
      '.device-low, .device-low * {' +
      '  animation-duration: 0.01ms !important;' +
      '  animation-iteration-count: 1 !important;' +
      '  transition-duration: 0.01ms !important;' +
      '}' +
      '.device-low *, .device-low *::before, .device-low *::after {' +
      '  backdrop-filter: none !important;' +
      '  -webkit-backdrop-filter: none !important;' +
      '}' +

      '.device-low .back-to-top { display: none !important; }' +
      '.device-low .showcase-hotspots { display: none !important; }' +
      '.device-low .testimonials-track { animation: none !important; }' +
      '.device-low .story-chapter .ch-line,' +
      '.device-low .story-chapter .ch-label {' +
      '  opacity: 1 !important;' +
      '  transform: none !important;' +
      '}' +
      '.device-low .cv-brick { opacity: 0.5 !important; }' +
      '.device-low .cv-earth { opacity: 0.2 !important; }' +
      '.device-low .cursor { display: none !important; }' +
      '.device-low .xray-scanline { animation: none !important; display: none !important; }' +
      '.device-low .game-rules-backdrop { backdrop-filter: none !important; }';
    document.head.appendChild(s);
  }

  if (tier === 'mid') {
    var s = document.createElement('style');
    s.textContent =
      '.device-mid .cursor { display: none !important; }' +
      '.device-mid .xray-scanline { animation-duration: 8s !important; opacity: 0.2 !important; }';
    document.head.appendChild(s);
  }
})();
