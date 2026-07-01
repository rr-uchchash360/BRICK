/* =============================================
   BRICK — Brick Stacking Mini Game
   ============================================= */

const BRICK_GAME = (() => {
  const state = {
    isPlaying: false,
    score: 0,
    highScore: parseInt(localStorage.getItem('brickHighScore') || '0'),
    combo: 1,
    timeLeft: 30,
    bricks: [],
    currentBrick: null,
    isDragging: false,
    stackHeight: 0,
    timerInterval: null,
    discountMultiplier: 0,
    tier: null,
  };

  const BRICK_HEIGHT = 30;
  let boardWidth = 400;
  let boardHeight = 400;
  let brickWidth = 80;

  let board, ghost, timerEl, scoreEl, comboEl, highEl;

  function getBoardMetrics() {
    if (!board) return;
    const rect = board.getBoundingClientRect();
    boardWidth = board.clientWidth;
    boardHeight = board.clientHeight;
    brickWidth = Math.min(80, Math.floor(boardWidth * 0.2));
  }

  function init() {
    board = document.getElementById('gameBoard');
    ghost = document.getElementById('gameGhost');
    timerEl = document.getElementById('gameTimer');
    scoreEl = document.getElementById('gameScore');
    comboEl = document.getElementById('gameCombo');
    highEl = document.getElementById('gameHigh');

    highEl.textContent = state.highScore;

    board.addEventListener('click', onBoardClick);
    board.addEventListener('mousemove', onBoardMove);
    board.addEventListener('touchmove', onBoardTouch, { passive: false });

    document.getElementById('gameStartBtn').addEventListener('click', startGame);

    document.getElementById('gameRetryBtn').addEventListener('click', () => {
      document.getElementById('gameResult').classList.remove('show');
      document.body.style.overflow = '';
      startGame();
    });

    window.addEventListener('resize', () => {
      getBoardMetrics();
      if (ghost) ghost.style.width = brickWidth + 'px';
    });
  }

  function startGame() {
    getBoardMetrics();
    state.isPlaying = true;
    state.score = 0;
    state.combo = 1;
    state.timeLeft = 30;
    state.bricks = [];
    state.stackHeight = 0;

    timerEl.textContent = state.timeLeft;
    timerEl.style.color = '';
    scoreEl.textContent = '0';
    comboEl.textContent = 'x1';

    board.querySelectorAll('.game-brick').forEach(el => el.remove());
    document.getElementById('gameStartBtn').style.display = 'none';

    clearInterval(state.timerInterval);
    state.timerInterval = setInterval(() => {
      state.timeLeft--;
      timerEl.textContent = state.timeLeft;
      if (state.timeLeft <= 5) timerEl.style.color = '#C62828';
      if (state.timeLeft <= 0) endGame();
    }, 1000);

    spawnBrick();
  }

  function spawnBrick() {
    getBoardMetrics();
    const brick = document.createElement('div');
    brick.className = 'game-brick';
    brick.style.width = brickWidth + 'px';
    brick.style.height = BRICK_HEIGHT + 'px';
    brick.style.bottom = Math.max(0, boardHeight - 30 - state.stackHeight * BRICK_HEIGHT) + 'px';

    const maxLeft = Math.max(0, boardWidth - brickWidth);
    const startLeft = Math.random() * maxLeft;
    brick.style.left = startLeft + 'px';
    brick.dataset.placed = 'false';
    board.appendChild(brick);

    state.currentBrick = brick;
    state.isDragging = true;

    ghost.style.width = brickWidth + 'px';
    ghost.style.opacity = '1';
    ghost.style.bottom = brick.style.bottom;
    updateGhostPosition(startLeft);
  }

  function updateGhostPosition(left) {
    if (ghost) ghost.style.left = left + 'px';
  }

  function getBoardX(clientX) {
    const rect = board.getBoundingClientRect();
    let x = clientX - rect.left;
    return Math.max(0, Math.min(boardWidth - brickWidth, x));
  }

  function onBoardMove(e) {
    if (!state.isPlaying || !state.isDragging || !state.currentBrick) return;
    const x = getBoardX(e.clientX);
    state.currentBrick.style.left = x + 'px';
    updateGhostPosition(x);
  }

  function onBoardTouch(e) {
    if (!state.isPlaying || !state.isDragging || !state.currentBrick) return;
    e.preventDefault();
    const touch = e.touches[0];
    const x = getBoardX(touch.clientX);
    state.currentBrick.style.left = x + 'px';
    updateGhostPosition(x);
  }

  function onBoardClick() {
    if (!state.isPlaying || !state.isDragging || !state.currentBrick) return;
    dropBrick();
  }

  function dropBrick() {
    const brick = state.currentBrick;
    if (!brick) return;

    state.isDragging = false;
    ghost.style.opacity = '0';
    brick.dataset.placed = 'true';
    brick.classList.add('placed');

    const brickLeft = parseFloat(brick.style.left) || 0;
    const brickBottom = parseFloat(brick.style.bottom) || 0;
    const prevBrick = state.bricks[state.bricks.length - 1];
    let precision = 1;

    if (prevBrick) {
      const diff = Math.abs(brickLeft - prevBrick.left);
      if (diff < 5) {
        precision = 1.5;
        brick.classList.add('perfect');
        showFloatingText('PERFECT!', brickLeft + brickWidth / 2, brickBottom);
      } else if (diff < 15) {
        precision = 1.2;
      } else if (diff > brickWidth * 0.6) {
        precision = 0.5;
        if (diff > brickWidth * 0.7) {
          animateBrickFall(brick);
          state.combo = 1;
          comboEl.textContent = 'x1';
          showFloatingText('MISS!', brickLeft + brickWidth / 2, brickBottom);
          spawnBrick();
          return;
        }
      }
    }

    const points = Math.round(10 * state.combo * precision);
    state.score += points;
    state.combo += 1;
    state.stackHeight += 1;

    scoreEl.textContent = state.score;
    comboEl.textContent = 'x' + state.combo;

    state.bricks.push({ left: brickLeft, bottom: brickBottom, el: brick });
    showFloatingText('+' + points, brickLeft + brickWidth / 2, brickBottom + 30);
    spawnBrick();
  }

  function animateBrickFall(brick) {
    brick.style.transition = 'transform 0.3s ease-in, opacity 0.3s ease-in';
    brick.style.transform = 'translateY(80px) rotate(45deg)';
    brick.style.opacity = '0';
    setTimeout(() => { if (brick.parentNode) brick.remove(); }, 300);
  }

  function showFloatingText(text, x, y) {
    const el = document.createElement('div');
    el.textContent = text;
    el.style.cssText = `
      position: absolute; left: ${x}px; bottom: ${y}px;
      transform: translateX(-50%); color: #D4A843;
      font-family: 'Sora', sans-serif; font-size: 14px; font-weight: 600;
      pointer-events: none; z-index: 10;
      text-shadow: 0 2px 10px rgba(0,0,0,0.5); white-space: nowrap;
    `;
    board.appendChild(el);
    el.animate([
      { transform: 'translateX(-50%) translateY(0)', opacity: 1 },
      { transform: 'translateX(-50%) translateY(-40px)', opacity: 0 },
    ], { duration: 800, easing: 'ease-out' }).onfinish = () => el.remove();
  }

  function endGame() {
    state.isPlaying = false;
    clearInterval(state.timerInterval);
    timerEl.style.color = '';

    const score = state.score;
    let tier, discount, message;

    if (score >= 200) {
      tier = 'PLATINUM'; discount = 30;
      message = 'Extraordinary precision. The brick bows to you.';
    } else if (score >= 150) {
      tier = 'GOLD'; discount = 20;
      message = 'Masterful control. You are worthy of greatness.';
    } else if (score >= 80) {
      tier = 'SILVER'; discount = 10;
      message = 'Impressive focus. The brick acknowledges your effort.';
    } else if (score >= 30) {
      tier = 'BRONZE'; discount = 5;
      message = 'Not bad. The brick acknowledges your effort.';
    } else {
      tier = 'PARTICIPANT'; discount = 0;
      message = 'The brick respects your time. Try again for rewards.';
    }

    state.tier = tier;
    state.discountMultiplier = discount;

    if (score > state.highScore) {
      state.highScore = score;
      localStorage.setItem('brickHighScore', score.toString());
      highEl.textContent = score;
    }

    document.getElementById('tierName').textContent = tier;
    document.getElementById('resultScore').textContent = score;
    document.getElementById('rewardValue').textContent = discount + '% Discount';
    document.getElementById('resultMessage').textContent = message;

    const tierColors = {
      'PLATINUM': '#E5E4E2', 'GOLD': '#D4A843',
      'SILVER': '#C0C0C0', 'BRONZE': '#CD7F32', 'PARTICIPANT': '#666666',
    };
    document.querySelector('.tier-name').style.color = tierColors[tier] || '#fff';

    document.getElementById('gameResult').classList.add('show');
    document.body.style.overflow = 'hidden';
    document.getElementById('gameStartBtn').style.display = '';

    localStorage.setItem('brickDiscount', discount);
    localStorage.setItem('brickScore', score);
    localStorage.setItem('brickTier', tier);

    window.dispatchEvent(new CustomEvent('gameComplete', {
      detail: { discount, tier, score }
    }));
  }

  function getDiscount() {
    return state.discountMultiplier;
  }

  const api = { init, getDiscount };
  window.BRICK_GAME = api;
  return api;
})();
