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

    var score = 0;

    if (cores >= 8) score += 3;
    else if (cores >= 6) score += 2;
    else if (cores >= 4) score += 1;

    if (memory >= 4) score += 2;
    else if (memory >= 2) score += 1;

    if (effectiveType === '4g') score += 2;
    else if (effectiveType === '3g') score += 1;
    else if (effectiveType === '2g' || effectiveType === 'slow-2g') score -= 1;

    if (isMobile && screenWidth < 480) score -= 1;
    if (!isMobile || screenWidth >= 768) score += 1;

    if (/Android [0-6]|iPhone OS [0-9]_|iPad; CPU OS [0-9]_/i.test(ua)) score -= 1;

    var tier;
    if (score <= 1) tier = 'low';
    else if (score <= 3) tier = 'mid';
    else tier = 'high';

    if (isMobile && tier === 'high') tier = 'mid';

    return tier;
  }

  var tier = detectTier();
  document.documentElement.className += ' device-' + tier;
  window.DEVICE_TIER = tier;
  window.__DEVICE_TIER_READY = true;
})();
