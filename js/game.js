/* =============================================
   BRICK — Brick Balance Mini Game
   ============================================= */

const BRICK_GAME = (() => {
  const state = {
    isPlaying: false,
    bestAngle: 90,
    timeLeft: 30,
    totalPlaced: 0,
    leftWeight: 0,
    rightWeight: 0,
    timerInterval: null,
    timerRafId: null,
    timerLastTick: 0,
    discountMultiplier: 0,
    tier: null,
  };

  let timerEl, bestAngleEl, angleHudEl;
  let plankEl, angleEl, arrowFill, arrowIndicator, boardEl;
  let stackLeft, stackRight, offerBrick, offerWeight, offerHint;
  let placeLeftBtn, placeRightBtn, startBtn, balanceControls;
  let currentWeight = 0;
  let brickTimerId = null;
  const MAX_ANGLE = 90;

  function init() {
    timerEl = document.getElementById('gameTimer');
    bestAngleEl = document.getElementById('gameBestAngle');
    angleHudEl = document.getElementById('gameAngle');
    plankEl = document.getElementById('balancePlank');
    angleEl = document.getElementById('balanceAngle');
    arrowFill = document.getElementById('arrowFill');
    arrowIndicator = document.getElementById('arrowIndicator');
    boardEl = document.getElementById('balanceBoard');
    stackLeft = document.getElementById('stackLeft');
    stackRight = document.getElementById('stackRight');
    offerBrick = document.getElementById('offerBrick');
    offerWeight = document.getElementById('offerWeight');
    offerHint = document.getElementById('offerHint');
    placeLeftBtn = document.getElementById('placeLeft');
    placeRightBtn = document.getElementById('placeRight');
    startBtn = document.getElementById('gameStartBtn');
    balanceControls = document.getElementById('balanceControls');

    bestAngleEl.textContent = '0\u00B0';

    if (placeLeftBtn) placeLeftBtn.addEventListener('click', function() { placeBrick('left'); });
    if (placeRightBtn) placeRightBtn.addEventListener('click', function() { placeBrick('right'); });
    if (startBtn) startBtn.addEventListener('click', startGame);

    var retryBtn = document.getElementById('gameRetryBtn');
    if (retryBtn) retryBtn.addEventListener('click', function() {
      document.getElementById('gameResult').classList.remove('show');
      document.body.style.overflow = '';
      resetVisuals();
      startGame();
    });
  }

  function resetVisuals() {
    clearBrickTimer();
    plankEl.style.transform = 'rotate(0deg)';
    angleEl.innerHTML = '0&deg; <span class="balance-pct">50%</span>';
    angleHudEl.textContent = '0\u00B0';
    angleEl.className = 'balance-angle';
    arrowFill.className = 'arrow-fill';
    arrowFill.style.width = '50%';
    arrowIndicator.className = 'arrow-indicator';
    arrowIndicator.style.left = '50%';
    stackLeft.innerHTML = '';
    stackRight.innerHTML = '';
    boardEl.classList.remove('tip');
    boardEl.querySelectorAll('.game-floating-text').forEach(function(el) { el.remove(); });
    boardEl.querySelectorAll('.game-particle').forEach(function(el) { el.remove(); });
  }

  function startGame() {
    state.isPlaying = true;
    state.bestAngle = 90;
    state.timeLeft = 30;
    state.totalPlaced = 0;
    state.leftWeight = 0;
    state.rightWeight = 0;

    resetVisuals();

    timerEl.textContent = state.timeLeft;
    timerEl.classList.remove('warning');
    timerEl.style.color = '';
    bestAngleEl.textContent = '0\u00B0';

    startBtn.style.display = 'none';
    if (balanceControls) balanceControls.style.display = '';

    clearInterval(state.timerInterval);
    if (state.timerRafId) cancelAnimationFrame(state.timerRafId);

    state.timerLastTick = Date.now();

    function timerLoop() {
      if (!state.isPlaying) return;
      var now = Date.now();
      var elapsed = now - state.timerLastTick;
      if (elapsed >= 1000) {
        state.timerLastTick = now - (elapsed - 1000);
        state.timeLeft--;
        timerEl.textContent = state.timeLeft;
        if (state.timeLeft <= 5) timerEl.classList.add('warning');
        if (state.timeLeft <= 0) { endGame(); return; }
      }
      state.timerRafId = requestAnimationFrame(timerLoop);
    }
    timerLoop();

    generateBrick();
  }

  /* ---- Auto-place Timer ---- */

  function startBrickTimer() {
    clearBrickTimer();
    if (offerHint) {
      offerHint.textContent = 'Auto in 3s';
      offerHint.className = 'offer-hint countdown';
    }
    offerBrick.classList.add('urgent');

    var secondsLeft = 3;
    brickTimerId = setInterval(function() {
      secondsLeft--;
      if (secondsLeft > 0) {
        if (offerHint) offerHint.textContent = 'Auto in ' + secondsLeft + 's';
      } else {
        clearBrickTimer();
        autoPlaceBrick();
      }
    }, 1000);
  }

  function clearBrickTimer() {
    if (brickTimerId) { clearInterval(brickTimerId); brickTimerId = null; }
    if (offerHint) {
      offerHint.textContent = 'Place this brick';
      offerHint.className = 'offer-hint';
    }
    offerBrick.classList.remove('urgent');
  }

  function autoPlaceBrick() {
    if (!state.isPlaying) return;
    if (currentWeight === 0) return;
    var side = state.leftWeight >= state.rightWeight ? 'left' : 'right';
    placeBrick(side);
  }

  /* ---- Core Gameplay ---- */

  function generateBrick() {
    currentWeight = Math.floor(Math.random() * 7) + 2; // 2–8 kg
    offerWeight.textContent = currentWeight;
    offerBrick.className = 'offer-brick';
    offerBrick.style.animation = 'none';
    void offerBrick.offsetWidth;
    offerBrick.style.animation = 'brickLand 0.35s cubic-bezier(0.22, 1, 0.36, 1)';

    startBrickTimer();
  }

  function placeBrick(side) {
    if (!state.isPlaying) return;
    if (currentWeight === 0) return;

    clearBrickTimer();

    var leftEl = document.createElement('div');
    leftEl.className = 'stack-brick';
    if (currentWeight >= 8) leftEl.classList.add('heavy');
    else if (currentWeight <= 3) leftEl.classList.add('light');

    if (side === 'left') {
      state.leftWeight += currentWeight;
      stackLeft.appendChild(leftEl);
    } else {
      state.rightWeight += currentWeight;
      stackRight.appendChild(leftEl);
    }

    state.totalPlaced++;

    updateBalance();

    generateBrick();

    if (Math.abs(getAngle()) >= MAX_ANGLE) {
      boardEl.classList.add('tip');
      setTimeout(function() { endGame(); }, 600);
    }
  }

  function getAngle() {
    var LEVER_ARM = 38;
    var netTorque = (state.rightWeight - state.leftWeight) * LEVER_ARM;
    var TORSIONAL_SPRING = (48 * LEVER_ARM) / MAX_ANGLE;
    var angle = netTorque / TORSIONAL_SPRING;
    return Math.max(-MAX_ANGLE, Math.min(MAX_ANGLE, angle));
  }

  function getBalanceTier(angle) {
    var absAngle = Math.abs(angle);
    var pct = Math.max(0, 50 - Math.floor(absAngle / 2) * 5);
    var cls;
    if (absAngle <= 1)      cls = 'perfect';
    else if (absAngle <= 5) cls = 'good';
    else if (absAngle <= 10) cls = 'fair';
    else if (absAngle <= 15) cls = 'unstable';
    else                     cls = 'critical';
    return { pct: pct, cls: cls };
  }

  function updateBalance() {
    var angle = getAngle();
    var tier = getBalanceTier(angle);
    var remaining = 100 - Math.round(Math.abs(angle) / MAX_ANGLE * 100);

    plankEl.style.transform = 'rotate(' + angle + 'deg)';
    angleEl.innerHTML = Math.round(angle) + '&deg; <span class="balance-pct">' + tier.pct + '%</span>';
    angleHudEl.textContent = Math.round(angle) + '\u00B0';

    var absAngle = Math.abs(angle);
    if (absAngle < state.bestAngle) {
      state.bestAngle = absAngle;
      bestAngleEl.textContent = Math.round(absAngle) + '\u00B0';
    }

    angleEl.className = 'balance-angle';
    if (tier.cls === 'critical') angleEl.classList.add('warning');
    else if (tier.cls === 'perfect') angleEl.classList.add('perfect');

    arrowFill.className = 'arrow-fill';
    var fillW = Math.min(50, 50 * (remaining / 100));
    if (angle >= 0) {
      arrowFill.classList.add('tilt-right');
      arrowFill.style.width = (50 + fillW) + '%';
    } else {
      arrowFill.style.width = (50 + fillW) + '%';
    }

    var indicatorPct = 50 - (angle / MAX_ANGLE) * 50;
    arrowIndicator.style.left = indicatorPct + '%';
    arrowIndicator.className = 'arrow-indicator';
    if (tier.cls === 'critical') arrowIndicator.classList.add('warning');
  }

  function endGame() {
    state.isPlaying = false;
    clearBrickTimer();
    currentWeight = 0;
    clearInterval(state.timerInterval);
    if (state.timerRafId) {
      cancelAnimationFrame(state.timerRafId);
      state.timerRafId = null;
    }
    timerEl.classList.remove('warning');
    timerEl.style.color = '';

    var finalAngle = Math.abs(getAngle());
    var bestAngle = state.bestAngle;
    var finalTier = getBalanceTier(finalAngle);
    var discount = finalTier.pct;
    var tier, tierSub, message;

    if (discount >= 50) {
      tier = 'PLATINUM'; tierSub = 'Grand Master';
      message = 'Perfect equilibrium. Your instincts are unmatched.';
    } else if (discount >= 40) {
      tier = 'DIAMOND'; tierSub = 'Master Balancer';
      message = 'Exceptional poise under pressure. Truly impressive.';
    } else if (discount >= 30) {
      tier = 'GOLD'; tierSub = 'Artisan';
      message = 'Steady hands and a sharp mind. The brick approves.';
    } else if (discount >= 20) {
      tier = 'SILVER'; tierSub = 'Apprentice';
      message = 'You\'re learning the art of equilibrium. Keep going.';
    } else if (discount >= 10) {
      tier = 'BRONZE'; tierSub = 'Novice Balancer';
      message = 'A solid start. Every brick teaches something.';
    } else if (discount >= 5) {
      tier = 'IRON'; tierSub = 'Beginner';
      message = 'The scales are unforgiving. Try again with patience.';
    } else {
      tier = 'PARTICIPANT'; tierSub = 'Observer'; discount = 0;
      message = 'The brick tipped, but you showed up. That counts.';
    }

    state.tier = tier;
    state.discountMultiplier = discount;

    var tierNameEl = document.getElementById('tierName');
    var tierSubEl = document.getElementById('tierSub');
    var rewardValueEl = document.getElementById('rewardValue');
    var messageEl = document.getElementById('resultMessage');
    var resultBestEl = document.getElementById('resultBest');
    var resultFinalEl = document.getElementById('resultFinal');

    tierNameEl.textContent = tier;
    if (tierSubEl) tierSubEl.textContent = tierSub;
    if (rewardValueEl) rewardValueEl.innerHTML = '<span class="reward-pct">' + discount + '</span>% Discount';
    messageEl.textContent = message;
    if (resultBestEl) resultBestEl.textContent = Math.round(bestAngle) + '\u00B0';
    if (resultFinalEl) resultFinalEl.textContent = Math.round(finalAngle) + '\u00B0';

    var tierColors = {
      'PLATINUM': '#E5E4E2', 'DIAMOND': '#B9F2FF',
      'GOLD': '#D4A843', 'SILVER': '#C0C0C0',
      'BRONZE': '#CD7F32', 'IRON': '#8B8C7A', 'PARTICIPANT': '#666666',
    };
    var tColor = tierColors[tier] || '#fff';
    tierNameEl.style.color = tColor;
    var tierIconEl = document.querySelector('.tier-icon');
    if (tierIconEl) tierIconEl.style.color = tColor;

    var modal = document.getElementById('gameResult');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';

    startBtn.style.display = '';
    if (balanceControls) balanceControls.style.display = 'none';

    window.dispatchEvent(new CustomEvent('gameComplete', {
      detail: { discount: discount, tier: tier, bestAngle: bestAngle }
    }));
  }

  function getDiscount() {
    return state.discountMultiplier;
  }

  var api = { init: init, getDiscount: getDiscount };
  window.BRICK_GAME = api;
  return api;
})();
