/* Brunch Crush — Full Candy Crush-style Match-3 Engine
   Responsive touch swipe + tap controls tuned for iPhone 14 & Samsung Galaxy S25 */
(() => {
  const STORAGE_KEY = 'brunch_crush_save_v1';
  const TYPES = window.BRUNCH_ICONS.TYPES;
  const GRID_SIZE = window.BRUNCH_LEVELS.GRID_SIZE;
  const AUDIO = window.BRUNCH_AUDIO;

  // Persistent Player State
  let save = loadSave();

  // Runtime Level State
  let config = null;
  let board = []; // 2D array of tile objects or null (holes / empty)
  let syrup = []; // 2D array of booleans
  let tileElements = new Map(); // tile.id -> DOM element
  let nextTileId = 1;
  let levelRng = Math.random;

  let score = 0;
  let movesLeft = 20;
  let goalProgress = [];
  let comboCount = 0;
  let state = 'IDLE'; // IDLE | ANIMATING | MODAL
  let selectedCell = null;
  let hintPair = null;
  let hintTimer = null;
  let cellPx = 40;
  let dragOrigin = null;
  let pendingCoffeeMilestone = null; // e.g., 100, 200, 300...

  // DOM References
  const dom = {
    hudLevel: document.getElementById('hud-level'),
    hudBatch: document.getElementById('hud-batch'),
    hudMoves: document.getElementById('hud-moves'),
    hudGoalTitle: document.getElementById('hud-goal-title'),
    hudGoals: document.getElementById('hud-goals'),
    hudScore: document.getElementById('hud-score'),
    hudProgressFill: document.getElementById('hud-progress-fill'),
    starDots: [
      document.getElementById('star-m-1'),
      document.getElementById('star-m-2'),
      document.getElementById('star-m-3'),
    ],
    boardStage: document.querySelector('.board-stage'),
    boardFrame: document.getElementById('board-frame'),
    boardCells: document.getElementById('board-cells'),
    boardTiles: document.getElementById('board-tiles'),
    boardFx: document.getElementById('board-fx'),
    screenFx: document.getElementById('screen-fx'),
    comboBanner: document.getElementById('combo-banner'),
    toast: document.getElementById('toast'),

    btnLevels: document.getElementById('btn-levels'),
    btnSound: document.getElementById('btn-sound'),
    iconSoundOn: document.getElementById('icon-sound-on'),
    iconSoundOff: document.getElementById('icon-sound-off'),
    btnHelp: document.getElementById('btn-help'),
    btnHint: document.getElementById('btn-hint'),
    btnRestart: document.getElementById('btn-restart'),

    modalWin: document.getElementById('modal-win'),
    winStars: document.getElementById('win-stars'),
    winTitle: document.getElementById('win-title'),
    winSubtitle: document.getElementById('win-subtitle'),
    winScore: document.getElementById('win-score'),
    winBest: document.getElementById('win-best'),
    btnWinReplay: document.getElementById('btn-win-replay'),
    btnWinNext: document.getElementById('btn-win-next'),

    modalLose: document.getElementById('modal-lose'),
    loseScore: document.getElementById('lose-score'),
    loseLevel: document.getElementById('lose-level'),
    btnLoseLevels: document.getElementById('btn-lose-levels'),
    btnLoseRetry: document.getElementById('btn-lose-retry'),

    modalCoffee: document.getElementById('modal-coffee'),
    coffeeBadge: document.getElementById('coffee-milestone-badge'),
    coffeeDesc: document.getElementById('coffee-desc'),
    btnCoffeeNo: document.getElementById('btn-coffee-no'),
    btnCoffeeYes: document.getElementById('btn-coffee-yes'),
    btnCoffeeYesSub: document.getElementById('btn-coffee-yes-sub'),

    modalLevels: document.getElementById('modal-levels'),
    levelsMeta: document.getElementById('levels-meta'),
    tierTabs: document.getElementById('tier-tabs'),
    levelsGrid: document.getElementById('levels-grid'),
    btnCloseLevels: document.getElementById('btn-close-levels'),

    modalMenu: document.getElementById('modal-menu'),
    btnCloseMenu: document.getElementById('btn-close-menu'),
    guidePieces: document.getElementById('guide-pieces'),
    btnMenuResetAll: document.getElementById('btn-menu-reset-all'),
  };

  function defaultSave() {
    return {
      currentLevel: 1,
      maxUnlockedLevel: 1,
      milestoneCap: 100,
      shuffleEpoch: 0,
      soundEnabled: true,
      stars: {},
      bestScores: {},
    };
  }

  function loadSave() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultSave();
      const parsed = JSON.parse(raw);
      return {
        ...defaultSave(),
        ...parsed,
        stars: parsed.stars || {},
        bestScores: parsed.bestScores || {},
      };
    } catch (_) {
      return defaultSave();
    }
  }

  function persistSave() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
    } catch (_) {}
  }

  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  let toastTimeout = null;
  function showToast(msg, duration = 2400) {
    dom.toast.textContent = msg;
    dom.toast.classList.remove('hidden');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      dom.toast.classList.add('hidden');
    }, duration);
  }

  // Responsive board sizing so it fits iPhone 14, Galaxy S25, tablets, and desktop cleanly
  function updateBoardSizing() {
    const rect = dom.boardStage.getBoundingClientRect();
    const availW = Math.max(240, rect.width - 4);
    const availH = Math.max(240, rect.height - 4);
    const size = Math.floor(Math.min(availW, availH, 480));
    dom.boardFrame.style.setProperty('--board-size', `${size}px`);
    cellPx = (size - 16) / GRID_SIZE;
    layoutAllCellsAndTiles();
  }

  function layoutAllCellsAndTiles() {
    if (!config) return;
    // Update background cells
    const cellNodes = dom.boardCells.children;
    for (let i = 0; i < cellNodes.length; i++) {
      const el = cellNodes[i];
      const r = Number(el.dataset.r);
      const c = Number(el.dataset.c);
      el.style.width = `${cellPx - 2}px`;
      el.style.height = `${cellPx - 2}px`;
      el.style.left = `${c * cellPx + 1}px`;
      el.style.top = `${r * cellPx + 1}px`;
    }
    // Update tile sizes & positions
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const tile = board[r] && board[r][c];
        if (!tile) continue;
        const el = tileElements.get(tile.id);
        if (el) {
          el.style.width = `${cellPx}px`;
          el.style.height = `${cellPx}px`;
          el.style.transform = `translate3d(${c * cellPx}px, ${r * cellPx}px, 0)`;
        }
      }
    }
  }

  function syncSoundUI() {
    AUDIO.setEnabled(save.soundEnabled);
    dom.iconSoundOn.classList.toggle('hidden', !save.soundEnabled);
    dom.iconSoundOff.classList.toggle('hidden', save.soundEnabled);
  }

  function renderGuidePieces() {
    dom.guidePieces.innerHTML = TYPES.map((t) => {
      const meta = window.BRUNCH_ICONS.META[t];
      return `
        <div class="guide-piece-card">
          ${window.BRUNCH_ICONS.getPieceSvg(t, null)}
          <span>${meta.label}</span>
        </div>
      `;
    }).join('');
  }

  // ---- LEVEL INITIALIZATION ----
  function startLevel(levelNumber) {
    closeAllModals();
    clearHint();
    selectedCell = null;
    dragOrigin = null;
    comboCount = 0;
    state = 'IDLE';

    save.currentLevel = levelNumber;
    if (levelNumber > save.maxUnlockedLevel) {
      save.maxUnlockedLevel = levelNumber;
    }
    persistSave();

    config = window.BRUNCH_LEVELS.getLevelConfig(levelNumber, save.shuffleEpoch);
    levelRng = window.BRUNCH_LEVELS.mulberry32(config.seed ^ 0xA5A5A5A5);

    score = 0;
    movesLeft = config.moves;
    syrup = config.syrupMap.map((row) => row.slice());
    goalProgress = config.goals.map((g) => ({ ...g, current: 0 }));

    buildInitialBoard();
    renderBoardCells();
    renderAllTiles();
    updateBoardSizing();
    updateHUD();
    scheduleHintTimer();
  }

  function randomType() {
    return TYPES[Math.floor(levelRng() * TYPES.length)];
  }

  function buildInitialBoard() {
    // Generate a board with NO starting 3-in-a-row and AT LEAST one valid move
    for (let attempt = 0; attempt < 40; attempt++) {
      board = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (!config.mask[r][c]) continue;
          const forbidden = new Set();
          if (c >= 2 && board[r][c - 1] && board[r][c - 2] && board[r][c - 1].type === board[r][c - 2].type) {
            forbidden.add(board[r][c - 1].type);
          }
          if (r >= 2 && board[r - 1][c] && board[r - 2][c] && board[r - 1][c].type === board[r - 2][c].type) {
            forbidden.add(board[r - 1][c].type);
          }
          const allowed = TYPES.filter((t) => !forbidden.has(t));
          const chosen = allowed[Math.floor(levelRng() * allowed.length)] || randomType();
          board[r][c] = createTileObj(chosen, null);
        }
      }
      if (findPossibleMoves().length > 0) return;
    }
  }

  function createTileObj(type, special = null) {
    return {
      id: nextTileId++,
      type,
      special, // null | 'striped-h' | 'striped-v' | 'wrapped' | 'color-bomb'
    };
  }

  function renderBoardCells() {
    dom.boardCells.innerHTML = '';
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (!config.mask[r][c]) continue;
        const cell = document.createElement('div');
        cell.className = `cell-bg ${(r + c) % 2 === 0 ? 'light' : 'dark'}${syrup[r][c] ? ' syrup' : ''}`;
        cell.dataset.r = r;
        cell.dataset.c = c;
        cell.id = `cell-${r}-${c}`;
        dom.boardCells.appendChild(cell);
      }
    }
  }

  function createTileElement(tile, r, c, spawnAboveRows = 0, delayMs = 0) {
    const el = document.createElement('div');
    el.className = tileClassName(tile);
    el.dataset.id = String(tile.id);
    el.style.width = `${cellPx}px`;
    el.style.height = `${cellPx}px`;
    el.innerHTML = `<div class="tile-inner">${window.BRUNCH_ICONS.getPieceSvg(tile.type, tile.special)}</div>`;

    const startY = (r - spawnAboveRows) * cellPx;
    el.style.transform = `translate3d(${c * cellPx}px, ${startY}px, 0)`;
    if (spawnAboveRows > 0) {
      el.style.opacity = '0';
    }
    dom.boardTiles.appendChild(el);
    tileElements.set(tile.id, el);

    if (spawnAboveRows > 0) {
      const durationMs = Math.round(370 + spawnAboveRows * 78);
      el.classList.add('dropping');
      el.style.transitionDuration = `${durationMs}ms, 220ms`;
      el.style.transitionDelay = `${delayMs}ms, ${delayMs}ms`;
      // Double rAF guarantees the browser paints the off-top start position before dropping
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.opacity = '1';
          el.style.transform = `translate3d(${c * cellPx}px, ${r * cellPx}px, 0)`;
        });
      });
    }
    return el;
  }

  function tileClassName(tile) {
    let cls = 'tile';
    if (tile.special) cls += ` special-${tile.special}`;
    return cls;
  }

  function refreshTileVisual(tile) {
    const el = tileElements.get(tile.id);
    if (!el) return;
    el.className = tileClassName(tile);
    const inner = el.querySelector('.tile-inner');
    if (inner) {
      inner.innerHTML = window.BRUNCH_ICONS.getPieceSvg(tile.type, tile.special);
    }
  }

  function renderAllTiles() {
    dom.boardTiles.innerHTML = '';
    tileElements.clear();
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const tile = board[r][c];
        if (tile) createTileElement(tile, r, c, 0);
      }
    }
  }

  function updateHUD() {
    dom.hudLevel.textContent = String(config.level);

    if (save.shuffleEpoch > 0) {
      dom.hudBatch.textContent = `Reshuffle #${save.shuffleEpoch + 1}`;
      dom.hudBatch.classList.remove('hidden');
    } else {
      dom.hudBatch.classList.add('hidden');
    }

    dom.hudMoves.textContent = String(movesLeft);
    dom.hudMoves.classList.toggle('low-moves', movesLeft <= 5);

    dom.hudScore.textContent = score.toLocaleString();

    const maxStar = config.starThresholds[2];
    const pct = Math.min(100, Math.round((score / maxStar) * 100));
    dom.hudProgressFill.style.width = `${pct}%`;

    config.starThresholds.forEach((threshold, i) => {
      dom.starDots[i].classList.toggle('lit', score >= threshold);
    });

    // Render goals
    if (goalProgress.length === 1 && goalProgress[0].kind === 'score') {
      dom.hudGoalTitle.textContent = 'TARGET SCORE';
    } else if (goalProgress.length === 1 && goalProgress[0].kind === 'syrup') {
      dom.hudGoalTitle.textContent = 'CLEAR SYRUP';
    } else {
      dom.hudGoalTitle.textContent = config.isMilestone ? 'COFFEE MILESTONE' : 'COLLECT';
    }

    dom.hudGoals.innerHTML = goalProgress
      .map((g) => {
        const current = g.kind === 'score' ? score : g.current;
        const remaining = Math.max(0, g.target - current);
        const done = remaining === 0;
        if (g.kind === 'score') {
          return `<div class="goal-chip${done ? ' done' : ''}"><span>${done ? '✓' : g.target.toLocaleString()}</span></div>`;
        }
        if (g.kind === 'syrup') {
          return `<div class="goal-chip${done ? ' done' : ''}"><span class="syrup-swatch"></span><span>${done ? '✓' : remaining}</span></div>`;
        }
        return `
          <div class="goal-chip${done ? ' done' : ''}">
            <span class="goal-svg">${window.BRUNCH_ICONS.getPieceSvg(g.piece, null)}</span>
            <span>${done ? '✓' : remaining}</span>
          </div>
        `;
      })
      .join('');
  }

  function areGoalsComplete() {
    return goalProgress.every((g) => {
      const cur = g.kind === 'score' ? score : g.current;
      return cur >= g.target;
    });
  }

  function earnedStars() {
    let s = 1;
    if (score >= config.starThresholds[1]) s = 2;
    if (score >= config.starThresholds[2]) s = 3;
    return s;
  }

  // ---- POINTER / TOUCH SWIPE & TAP INPUT ----
  function getCellFromClientPoint(clientX, clientY) {
    const rect = dom.boardTiles.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const c = Math.floor(x / cellPx);
    const r = Math.floor(y / cellPx);
    if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return null;
    if (!config.mask[r][c] || !board[r][c]) return null;
    return { r, c };
  }

  function setSelectedCell(cell) {
    if (selectedCell) {
      const prev = board[selectedCell.r] && board[selectedCell.r][selectedCell.c];
      if (prev) {
        const el = tileElements.get(prev.id);
        if (el) el.classList.remove('selected');
      }
    }
    selectedCell = cell;
    if (selectedCell) {
      const cur = board[selectedCell.r] && board[selectedCell.r][selectedCell.c];
      if (cur) {
        const el = tileElements.get(cur.id);
        if (el) el.classList.add('selected');
      }
    }
  }

  function isAdjacent(a, b) {
    return Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;
  }

  dom.boardTiles.addEventListener('pointerdown', (e) => {
    AUDIO.unlock();
    if (state !== 'IDLE') return;
    const cell = getCellFromClientPoint(e.clientX, e.clientY);
    if (!cell) return;
    e.preventDefault();
    try {
      dom.boardTiles.setPointerCapture(e.pointerId);
    } catch (_) {}

    dragOrigin = {
      pointerId: e.pointerId,
      r: cell.r,
      c: cell.c,
      startX: e.clientX,
      startY: e.clientY,
      swiped: false,
    };
  });

  dom.boardTiles.addEventListener('pointermove', (e) => {
    if (!dragOrigin || dragOrigin.swiped || state !== 'IDLE') return;
    const dx = e.clientX - dragOrigin.startX;
    const dy = e.clientY - dragOrigin.startY;
    const threshold = Math.max(16, cellPx * 0.34);
    if (Math.hypot(dx, dy) < threshold) return;

    dragOrigin.swiped = true;
    let nr = dragOrigin.r;
    let nc = dragOrigin.c;
    if (Math.abs(dx) > Math.abs(dy)) {
      nc += dx > 0 ? 1 : -1;
    } else {
      nr += dy > 0 ? 1 : -1;
    }
    const from = { r: dragOrigin.r, c: dragOrigin.c };
    const to = { r: nr, c: nc };
    dragOrigin = null;
    setSelectedCell(null);

    if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && config.mask[nr][nc] && board[nr][nc]) {
      attemptSwap(from, to);
    }
  });

  function handlePointerRelease(e) {
    if (!dragOrigin) return;
    const origin = dragOrigin;
    dragOrigin = null;
    if (origin.swiped || state !== 'IDLE') return;

    const tapped = { r: origin.r, c: origin.c };
    if (!selectedCell) {
      setSelectedCell(tapped);
    } else if (selectedCell.r === tapped.r && selectedCell.c === tapped.c) {
      setSelectedCell(null);
    } else if (isAdjacent(selectedCell, tapped)) {
      const from = selectedCell;
      setSelectedCell(null);
      attemptSwap(from, tapped);
    } else {
      setSelectedCell(tapped);
    }
  }

  dom.boardTiles.addEventListener('pointerup', handlePointerRelease);
  dom.boardTiles.addEventListener('pointercancel', () => {
    dragOrigin = null;
  });

  // ---- MATCH-3 CORE LOGIC ----
  function moveTileDOM(tile, r, c, dropping = false, dropRows = 1, delayMs = 0) {
    const el = tileElements.get(tile.id);
    if (!el) return;
    el.classList.toggle('dropping', dropping);
    if (dropping) {
      const durationMs = Math.round(360 + Math.max(1, dropRows) * 78);
      el.style.transitionDuration = `${durationMs}ms, 220ms`;
      el.style.transitionDelay = `${delayMs}ms, 0ms`;
    } else {
      el.style.transitionDuration = '';
      el.style.transitionDelay = '';
    }
    el.style.transform = `translate3d(${c * cellPx}px, ${r * cellPx}px, 0)`;
  }

  async function attemptSwap(a, b) {
    if (state !== 'IDLE') return;
    clearHint();
    state = 'ANIMATING';

    const tileA = board[a.r][a.c];
    const tileB = board[b.r][b.c];
    if (!tileA || !tileB) {
      state = 'IDLE';
      return;
    }

    // Perform visual swap
    board[a.r][a.c] = tileB;
    board[b.r][b.c] = tileA;
    moveTileDOM(tileA, b.r, b.c, false);
    moveTileDOM(tileB, a.r, a.c, false);
    AUDIO.swap();
    await sleep(245);

    // Check special + special OR color-bomb swap first
    const isSpecialCombo =
      (tileA.special === 'color-bomb' || tileB.special === 'color-bomb') ||
      (tileA.special && tileB.special);

    if (isSpecialCombo) {
      movesLeft = Math.max(0, movesLeft - 1);
      comboCount = 1;
      updateHUD();
      await executeSpecialSwapCombo(tileA, b, tileB, a);
      await runPostClearLoop();
      finishMoveTurn();
      return;
    }

    // Otherwise check standard matches
    const matches = findMatches();
    if (matches.length === 0) {
      // Invalid swap -> bounce back
      AUDIO.invalid();
      board[a.r][a.c] = tileA;
      board[b.r][b.c] = tileB;
      moveTileDOM(tileA, a.r, a.c, false);
      moveTileDOM(tileB, b.r, b.c, false);
      await sleep(250);
      state = 'IDLE';
      scheduleHintTimer();
      return;
    }

    movesLeft = Math.max(0, movesLeft - 1);
    comboCount = 0;
    updateHUD();

    const swapDir = a.r === b.r ? 'h' : 'v';
    await resolveMatchesAndCascades(matches, [b, a], swapDir);
    finishMoveTurn();
  }

  // Find all horizontal & vertical runs of 3+ and merge intersecting runs of the same type
  function findMatches() {
    const runs = [];

    // Horizontal runs
    for (let r = 0; r < GRID_SIZE; r++) {
      let c = 0;
      while (c < GRID_SIZE) {
        const t = board[r][c];
        if (!t || t.special === 'color-bomb') {
          c++;
          continue;
        }
        let end = c + 1;
        while (
          end < GRID_SIZE &&
          board[r][end] &&
          board[r][end].special !== 'color-bomb' &&
          board[r][end].type === t.type
        ) {
          end++;
        }
        if (end - c >= 3) {
          const cells = [];
          for (let k = c; k < end; k++) cells.push({ r, c: k });
          runs.push({ type: t.type, dir: 'h', length: end - c, cells });
        }
        c = end;
      }
    }

    // Vertical runs
    for (let c = 0; c < GRID_SIZE; c++) {
      let r = 0;
      while (r < GRID_SIZE) {
        const t = board[r][c];
        if (!t || t.special === 'color-bomb') {
          r++;
          continue;
        }
        let end = r + 1;
        while (
          end < GRID_SIZE &&
          board[end][c] &&
          board[end][c].special !== 'color-bomb' &&
          board[end][c].type === t.type
        ) {
          end++;
        }
        if (end - r >= 3) {
          const cells = [];
          for (let k = r; k < end; k++) cells.push({ r: k, c });
          runs.push({ type: t.type, dir: 'v', length: end - r, cells });
        }
        r = end;
      }
    }

    if (runs.length === 0) return [];

    // Merge intersecting runs of same type
    const visited = new Array(runs.length).fill(false);
    const groups = [];

    for (let i = 0; i < runs.length; i++) {
      if (visited[i]) continue;
      visited[i] = true;
      const queue = [runs[i]];
      const mergedRuns = [runs[i]];
      const cellMap = new Map();
      runs[i].cells.forEach((p) => cellMap.set(`${p.r},${p.c}`, p));

      while (queue.length > 0) {
        const cur = queue.shift();
        for (let j = 0; j < runs.length; j++) {
          if (visited[j] || runs[j].type !== cur.type) continue;
          const overlaps = runs[j].cells.some((p) => cellMap.has(`${p.r},${p.c}`));
          if (overlaps) {
            visited[j] = true;
            queue.push(runs[j]);
            mergedRuns.push(runs[j]);
            runs[j].cells.forEach((p) => cellMap.set(`${p.r},${p.c}`, p));
          }
        }
      }

      const hasH = mergedRuns.some((x) => x.dir === 'h');
      const hasV = mergedRuns.some((x) => x.dir === 'v');
      const maxLine = Math.max(...mergedRuns.map((x) => x.length));

      groups.push({
        type: runs[i].type,
        cells: Array.from(cellMap.values()),
        isIntersection: hasH && hasV,
        maxLine,
        dominantDir: hasH && !hasV ? 'h' : 'v',
      });
    }

    return groups;
  }

  async function executeSpecialSwapCombo(tileA, posA, tileB, posB) {
    AUDIO.specialBlast();
    const toClear = new Set();
    const key = (r, c) => `${r},${c}`;

    const aBomb = tileA.special === 'color-bomb';
    const bBomb = tileB.special === 'color-bomb';

    if (aBomb && bBomb) {
      // Double Color Bomb: clear entire board!
      showComboBanner('ESPRESSO SUPERNOVA!');
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (board[r][c]) toClear.add(key(r, c));
        }
      }
      spawnBurstFx(3.5, 3.5, cellPx * 6);
    } else if (aBomb || bBomb) {
      const bombPos = aBomb ? posA : posB;
      const otherTile = aBomb ? tileB : tileA;
      const targetType = otherTile.type;
      toClear.add(key(bombPos.r, bombPos.c));

      if (otherTile.special === 'striped-h' || otherTile.special === 'striped-v') {
        showComboBanner('SUPER LINE BREW!');
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            const t = board[r][c];
            if (t && t.type === targetType) {
              t.special = (r + c) % 2 === 0 ? 'striped-h' : 'striped-v';
              refreshTileVisual(t);
              toClear.add(key(r, c));
            }
          }
        }
      } else if (otherTile.special === 'wrapped') {
        showComboBanner('MEGA SIZZLE!');
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            const t = board[r][c];
            if (t && t.type === targetType) {
              t.special = 'wrapped';
              refreshTileVisual(t);
              toClear.add(key(r, c));
            }
          }
        }
      } else {
        showComboBanner(targetType === 'bacon' ? 'Extra Crispy!!' : 'SUPER ESPRESSO!');
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            const t = board[r][c];
            if (t && t.type === targetType) {
              toClear.add(key(r, c));
            }
          }
        }
      }
      spawnBurstFx(bombPos.r, bombPos.c, cellPx * 3.5);
    } else {
      // Striped + Striped, Striped + Wrapped, or Wrapped + Wrapped
      const isAStriped = tileA.special === 'striped-h' || tileA.special === 'striped-v';
      const isBStriped = tileB.special === 'striped-h' || tileB.special === 'striped-v';
      const isAWrapped = tileA.special === 'wrapped';
      const isBWrapped = tileB.special === 'wrapped';

      toClear.add(key(posA.r, posA.c));
      toClear.add(key(posB.r, posB.c));

      if (isAStriped && isBStriped) {
        showComboBanner('CROSS BLAST!', 'big-combo');
        addRowToSet(posA.r, toClear);
        addColToSet(posA.c, toClear);
        spawnBeamFx('h', posA.r, tileA.type);
        spawnBeamFx('v', posA.c, tileB.type);
      } else if (isAWrapped && isBWrapped) {
        showComboBanner('DOUBLE SIZZLE!', 'big-combo');
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const nr = posA.r + dr;
            const nc = posA.c + dc;
            if (inBounds(nr, nc) && board[nr][nc]) toClear.add(key(nr, nc));
          }
        }
        spawnBurstFx(posA.r, posA.c, cellPx * 5);
      } else {
        showComboBanner('TRIPLE CROSS!', 'big-combo');
        for (let d = -1; d <= 1; d++) {
          if (inBounds(posA.r + d, 0)) {
            addRowToSet(posA.r + d, toClear);
            spawnBeamFx('h', posA.r + d, tileA.type);
          }
          if (inBounds(0, posA.c + d)) {
            addColToSet(posA.c + d, toClear);
            spawnBeamFx('v', posA.c + d, tileB.type);
          }
        }
      }
    }

    await clearCellsWithChain(toClear, new Map());
  }

  function inBounds(r, c) {
    return r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE;
  }

  function addRowToSet(r, set) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (board[r][c]) set.add(`${r},${c}`);
    }
  }

  function addColToSet(c, set) {
    for (let r = 0; r < GRID_SIZE; r++) {
      if (board[r][c]) set.add(`${r},${c}`);
    }
  }

  async function resolveMatchesAndCascades(initialGroups, preferredCoords = [], swapDir = 'h') {
    let groups = initialGroups;
    let firstPass = true;

    while (groups.length > 0) {
      comboCount++;
      const toClear = new Set();
      const specialsToSpawn = new Map(); // "r,c" -> { type, special }

      for (const group of groups) {
        for (const cell of group.cells) {
          toClear.add(`${cell.r},${cell.c}`);
        }

        // Determine if this group spawns a special piece
        let newSpecial = null;
        if (group.maxLine >= 5) {
          newSpecial = 'color-bomb';
        } else if (group.isIntersection) {
          newSpecial = 'wrapped';
        } else if (group.maxLine === 4) {
          newSpecial = firstPass ? (swapDir === 'h' ? 'striped-v' : 'striped-h') : (group.dominantDir === 'h' ? 'striped-v' : 'striped-h');
        }

        if (newSpecial) {
          // Prefer placing the special on the swapped tile if present in the group
          let anchor = group.cells[Math.floor(group.cells.length / 2)];
          if (firstPass && preferredCoords.length > 0) {
            const matchPref = preferredCoords.find((p) =>
              group.cells.some((gc) => gc.r === p.r && gc.c === p.c)
            );
            if (matchPref) anchor = matchPref;
          }
          specialsToSpawn.set(`${anchor.r},${anchor.c}`, {
            type: group.type,
            special: newSpecial,
          });
        }
      }

      if (specialsToSpawn.size > 0) {
        AUDIO.specialCreate();
      } else {
        AUDIO.match(comboCount);
      }

      const matchedBacon = groups.some((g) => g.type === 'bacon');
      const primaryGroup = groups[0];

      // Flash themed full-screen line animation whenever a player completes a 4+ straight line!
      for (const group of groups) {
        if (group.maxLine >= 4 && !group.isIntersection) {
          const sample = group.cells[0];
          spawnBeamFx(group.dominantDir, group.dominantDir === 'h' ? sample.r : sample.c, group.type);
        }
      }

      if (matchedBacon) {
        showComboBanner('Extra Crispy!!', 'bacon-word');
        if (comboCount >= 2) {
          setTimeout(() => showComboBanner(pickRandomWord(primaryGroup.type, comboCount), 'big-combo'), 180);
        }
      } else {
        const word = pickRandomWord(primaryGroup.type, comboCount);
        const tone = comboCount >= 2 ? 'big-combo' : `${primaryGroup.type}-word`;
        showComboBanner(word, tone);
      }

      await clearCellsWithChain(toClear, specialsToSpawn);
      await dropAndRefill();

      firstPass = false;
      groups = findMatches();
    }
  }

  async function runPostClearLoop() {
    await dropAndRefill();
    const nextMatches = findMatches();
    if (nextMatches.length > 0) {
      await resolveMatchesAndCascades(nextMatches, [], 'h');
    }
  }

  // Expand special pieces triggered inside the clear set, animate popping, award points & goal progress
  async function clearCellsWithChain(initialSet, specialsToSpawn) {
    const clearSet = new Set(initialSet);
    const triggeredSpecials = new Set();
    const queue = Array.from(clearSet);
    let blastedSpecial = false;

    while (queue.length > 0) {
      const k = queue.shift();
      if (triggeredSpecials.has(k)) continue;
      const [r, c] = k.split(',').map(Number);
      const tile = board[r] && board[r][c];
      if (!tile || !tile.special) continue;

      triggeredSpecials.add(k);
      blastedSpecial = true;

      if (tile.special === 'striped-h') {
        spawnBeamFx('h', r, tile.type);
        if (tile.type === 'bacon') showComboBanner('Extra Crispy!!', 'bacon-word');
        for (let cc = 0; cc < GRID_SIZE; cc++) {
          const nk = `${r},${cc}`;
          if (board[r][cc] && !clearSet.has(nk)) {
            clearSet.add(nk);
            queue.push(nk);
          }
        }
      } else if (tile.special === 'striped-v') {
        spawnBeamFx('v', c, tile.type);
        if (tile.type === 'bacon') showComboBanner('Extra Crispy!!', 'bacon-word');
        for (let rr = 0; rr < GRID_SIZE; rr++) {
          const nk = `${rr},${c}`;
          if (board[rr][c] && !clearSet.has(nk)) {
            clearSet.add(nk);
            queue.push(nk);
          }
        }
      } else if (tile.special === 'wrapped') {
        spawnBurstFx(r, c, cellPx * 3.1);
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            const nk = `${nr},${nc}`;
            if (inBounds(nr, nc) && board[nr][nc] && !clearSet.has(nk)) {
              clearSet.add(nk);
              queue.push(nk);
            }
          }
        }
      } else if (tile.special === 'color-bomb') {
        // Triggered indirectly -> pick most frequent type on board
        const targetType = mostFrequentBoardType();
        spawnBurstFx(r, c, cellPx * 3.4);
        for (let rr = 0; rr < GRID_SIZE; rr++) {
          for (let cc = 0; cc < GRID_SIZE; cc++) {
            const nk = `${rr},${cc}`;
            if (board[rr][cc] && board[rr][cc].type === targetType && !clearSet.has(nk)) {
              clearSet.add(nk);
              queue.push(nk);
            }
          }
        }
      }
    }

    if (blastedSpecial) {
      AUDIO.specialBlast();
    }

    // Pop animations + scoring + goal tracking
    let sumR = 0;
    let sumC = 0;
    let countCleared = 0;

    for (const k of clearSet) {
      const [r, c] = k.split(',').map(Number);
      const tile = board[r][c];
      if (!tile) continue;

      sumR += r;
      sumC += c;
      countCleared++;

      // Clear syrup underneath if present
      if (syrup[r][c]) {
        syrup[r][c] = false;
        const cellEl = document.getElementById(`cell-${r}-${c}`);
        if (cellEl) cellEl.classList.remove('syrup');
        incrementGoal('syrup', null, 1);
      }

      // Track piece collection goals
      incrementGoal('collect', tile.type, 1);

      // Animate removal unless this cell becomes a newly forged special
      if (!specialsToSpawn.has(k)) {
        const el = tileElements.get(tile.id);
        if (el) el.classList.add('popping');
      }
    }

    const pointsEarned = countCleared * 35 * Math.max(1, comboCount) + (blastedSpecial ? 120 : 0);
    if (pointsEarned > 0) {
      score += pointsEarned;
      spawnScoreFx(sumR / Math.max(1, countCleared), sumC / Math.max(1, countCleared), `+${pointsEarned}`);
    }
    updateHUD();

    await sleep(blastedSpecial ? 460 : 340);

    // Actually remove popped tiles & transform/spawn special tiles
    for (const k of clearSet) {
      const [r, c] = k.split(',').map(Number);
      const tile = board[r][c];
      if (specialsToSpawn.has(k)) {
        const spec = specialsToSpawn.get(k);
        if (tile) {
          tile.type = spec.type;
          tile.special = spec.special;
          refreshTileVisual(tile);
          const el = tileElements.get(tile.id);
          if (el) {
            el.classList.remove('popping');
          }
        } else {
          const fresh = createTileObj(spec.type, spec.special);
          board[r][c] = fresh;
          createTileElement(fresh, r, c, 0);
        }
      } else {
        if (tile) {
          const el = tileElements.get(tile.id);
          if (el) el.remove();
          tileElements.delete(tile.id);
        }
        board[r][c] = null;
      }
    }
  }

  function mostFrequentBoardType() {
    const counts = {};
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const t = board[r][c];
        if (t && t.special !== 'color-bomb') {
          counts[t.type] = (counts[t.type] || 0) + 1;
        }
      }
    }
    let best = TYPES[0];
    let bestCount = -1;
    for (const t of TYPES) {
      if ((counts[t] || 0) > bestCount) {
        bestCount = counts[t] || 0;
        best = t;
      }
    }
    return best;
  }

  function incrementGoal(kind, piece, amount) {
    for (const g of goalProgress) {
      if (g.kind === kind && (kind !== 'collect' || g.piece === piece)) {
        g.current = Math.min(g.target, g.current + amount);
      }
    }
  }

  async function dropAndRefill() {
    let maxFinishMs = 0;

    for (let c = 0; c < GRID_SIZE; c++) {
      // Collect active row indices in this column from bottom to top
      const activeRows = [];
      for (let r = GRID_SIZE - 1; r >= 0; r--) {
        if (config.mask[r][c]) activeRows.push(r);
      }

      const existing = [];
      for (const r of activeRows) {
        if (board[r][c]) {
          existing.push({ tile: board[r][c], fromR: r });
          board[r][c] = null;
        }
      }

      const colDelay = c * 14;
      let idx = 0;
      let movedOrder = 0;
      let spawnSlot = 0;

      for (const targetR of activeRows) {
        if (idx < existing.length) {
          const item = existing[idx++];
          board[targetR][c] = item.tile;
          if (item.fromR !== targetR) {
            const dropRows = targetR - item.fromR;
            const delayMs = colDelay + movedOrder * 34;
            movedOrder++;
            const durationMs = Math.round(360 + dropRows * 78);
            maxFinishMs = Math.max(maxFinishMs, durationMs + delayMs);
            moveTileDOM(item.tile, targetR, c, true, dropRows, delayMs);
          }
        } else {
          // Spawn new piece gently from above the board
          spawnSlot++;
          const fresh = createTileObj(randomType(), null);
          board[targetR][c] = fresh;
          const dropDist = targetR + spawnSlot + 0.6;
          const delayMs = colDelay + movedOrder * 36;
          movedOrder++;
          const durationMs = Math.round(370 + dropDist * 78);
          maxFinishMs = Math.max(maxFinishMs, durationMs + delayMs);
          createTileElement(fresh, targetR, c, dropDist, delayMs);
        }
      }
    }

    if (maxFinishMs > 0) {
      await sleep(maxFinishMs + 110);
      // Clear per-drop inline transition timings so subsequent swaps stay snappy
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          const t = board[r][c];
          if (!t) continue;
          const el = tileElements.get(t.id);
          if (el) {
            el.classList.remove('dropping');
            el.style.transitionDuration = '';
            el.style.transitionDelay = '';
          }
        }
      }
    }
  }

  // ---- TURN COMPLETION, DEADLOCK CHECK & LEVEL END ----
  async function finishMoveTurn() {
    if (areGoalsComplete()) {
      await handleLevelVictory();
      return;
    }

    if (movesLeft <= 0) {
      handleLevelDefeat();
      return;
    }

    // Check for available moves; auto-reshuffle board if deadlocked
    if (findPossibleMoves().length === 0) {
      showToast('No moves left — reshuffling board!');
      AUDIO.reshuffle();
      await sleep(380);
      await reshuffleCurrentBoardInPlace();
    }

    state = 'IDLE';
    scheduleHintTimer();
  }

  async function reshuffleCurrentBoardInPlace() {
    const activeCoords = [];
    const pool = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (config.mask[r][c] && board[r][c]) {
          activeCoords.push([r, c]);
          pool.push(board[r][c]);
        }
      }
    }

    for (let attempt = 0; attempt < 25; attempt++) {
      // Fisher-Yates shuffle
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      activeCoords.forEach(([r, c], idx) => {
        board[r][c] = pool[idx];
      });
      if (findMatches().length === 0 && findPossibleMoves().length > 0) break;
    }

    // If still no valid move, force a clean matchable trio
    if (findPossibleMoves().length === 0 && activeCoords.length >= 4) {
      const t = TYPES[0];
      const [r0, c0] = activeCoords[0];
      board[r0][c0].type = t;
      refreshTileVisual(board[r0][c0]);
    }

    activeCoords.forEach(([r, c]) => {
      moveTileDOM(board[r][c], r, c, true);
    });
    await sleep(300);
  }

  async function handleLevelVictory() {
    state = 'MODAL';
    clearHint();

    // Bonus points for leftover moves
    if (movesLeft > 0) {
      const moveBonus = movesLeft * 150;
      score += moveBonus;
      showComboBanner(`+${moveBonus} Move Bonus!`);
      updateHUD();
      await sleep(520);
    }

    const stars = earnedStars();
    const lvlKey = String(config.level);
    save.stars[lvlKey] = Math.max(save.stars[lvlKey] || 0, stars);
    save.bestScores[lvlKey] = Math.max(save.bestScores[lvlKey] || 0, score);

    // Every 100 levels (100, 200, 300...) -> trigger the signature Coffee Check!
    if (config.level % 100 === 0) {
      persistSave();
      openCoffeeCheckModal(config.level);
      return;
    }

    if (config.level + 1 <= save.milestoneCap && config.level + 1 > save.maxUnlockedLevel) {
      save.maxUnlockedLevel = config.level + 1;
    }
    persistSave();

    AUDIO.win();
    dom.winStars.textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
    dom.winTitle.textContent = `Level ${config.level} Complete!`;
    dom.winSubtitle.textContent =
      stars === 3 ? 'Master Barista! Three crispy stars!' : stars === 2 ? 'Savory combo skills!' : 'Order up! Ready for the next plate.';
    dom.winScore.textContent = score.toLocaleString();
    dom.winBest.textContent = save.bestScores[lvlKey].toLocaleString();
    dom.modalWin.classList.remove('hidden');
  }

  function handleLevelDefeat() {
    state = 'MODAL';
    clearHint();
    AUDIO.lose();
    dom.loseScore.textContent = score.toLocaleString();
    dom.loseLevel.textContent = String(config.level);
    dom.modalLose.classList.remove('hidden');
  }

  // ---- EVERY-100-LEVELS COFFEE CHECK ----
  function openCoffeeCheckModal(milestoneLevel) {
    closeAllModals();
    state = 'MODAL';
    pendingCoffeeMilestone = milestoneLevel;
    const nextCap = milestoneLevel + 100;

    AUDIO.coffeePrompt();
    dom.coffeeBadge.textContent = `LEVEL ${milestoneLevel} COMPLETE!`;
    dom.coffeeDesc.innerHTML = `Answer <strong>Yes</strong> to continue to Level ${nextCap}. Answer <strong>No</strong> to return to Level 1 and reshuffle the levels!`;
    dom.btnCoffeeYesSub.textContent = `Continue to Lv. ${nextCap}`;
    dom.modalCoffee.classList.remove('hidden');
  }

  function handleCoffeeAnswerYes() {
    const milestone = pendingCoffeeMilestone || Math.max(100, Math.ceil(config.level / 100) * 100);
    const newCap = milestone + 100;
    if (newCap > save.milestoneCap) {
      save.milestoneCap = newCap;
    }
    const nextLevel = milestone + 1;
    if (nextLevel > save.maxUnlockedLevel) {
      save.maxUnlockedLevel = nextLevel;
    }
    persistSave();
    pendingCoffeeMilestone = null;

    AUDIO.win();
    showToast(`Cheers! Unlocked Levels ${nextLevel}–${newCap} ☕`, 3000);
    startLevel(nextLevel);
  }

  function handleCoffeeAnswerNo() {
    // Return to Level 1 and reshuffle all levels with a new shuffleEpoch!
    save.shuffleEpoch += 1;
    save.currentLevel = 1;
    save.maxUnlockedLevel = 1;
    save.milestoneCap = 100;
    save.stars = {};
    save.bestScores = {};
    persistSave();
    pendingCoffeeMilestone = null;

    AUDIO.reshuffle();
    showToast(`No coffee yet! Back to Level 1 — all levels reshuffled (Mix #${save.shuffleEpoch + 1})!`, 3600);
    startLevel(1);
  }

  // ---- POSSIBLE MOVES & HINT SYSTEM ----
  function findPossibleMoves() {
    const moves = [];
    const dirs = [
      [0, 1],
      [1, 0],
    ];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const a = board[r][c];
        if (!a) continue;
        for (const [dr, dc] of dirs) {
          const nr = r + dr;
          const nc = c + dc;
          if (!inBounds(nr, nc)) continue;
          const b = board[nr][nc];
          if (!b) continue;

          if (a.special === 'color-bomb' || b.special === 'color-bomb' || (a.special && b.special)) {
            moves.push([{ r, c }, { r: nr, c: nc }]);
            continue;
          }

          // Temporary swap
          board[r][c] = b;
          board[nr][nc] = a;
          const matched = hasQuickMatchAt(r, c) || hasQuickMatchAt(nr, nc);
          board[r][c] = a;
          board[nr][nc] = b;

          if (matched) {
            moves.push([{ r, c }, { r: nr, c: nc }]);
          }
        }
      }
    }
    return moves;
  }

  function hasQuickMatchAt(r, c) {
    const t = board[r][c];
    if (!t || t.special === 'color-bomb') return false;
    const type = t.type;

    let h = 1;
    for (let cc = c - 1; cc >= 0 && board[r][cc] && board[r][cc].special !== 'color-bomb' && board[r][cc].type === type; cc--) h++;
    for (let cc = c + 1; cc < GRID_SIZE && board[r][cc] && board[r][cc].special !== 'color-bomb' && board[r][cc].type === type; cc++) h++;
    if (h >= 3) return true;

    let v = 1;
    for (let rr = r - 1; rr >= 0 && board[rr][c] && board[rr][c].special !== 'color-bomb' && board[rr][c].type === type; rr--) v++;
    for (let rr = r + 1; rr < GRID_SIZE && board[rr][c] && board[rr][c].special !== 'color-bomb' && board[rr][c].type === type; rr++) v++;
    return v >= 3;
  }

  function scheduleHintTimer() {
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => {
      if (state === 'IDLE') showHint();
    }, 5200);
  }

  function clearHint() {
    clearTimeout(hintTimer);
    if (hintPair) {
      hintPair.forEach(({ r, c }) => {
        const t = board[r] && board[r][c];
        if (t) {
          const el = tileElements.get(t.id);
          if (el) el.classList.remove('hint');
        }
      });
      hintPair = null;
    }
  }

  function showHint() {
    clearHint();
    const moves = findPossibleMoves();
    if (moves.length === 0) return;
    hintPair = moves[Math.floor(Math.random() * moves.length)];
    hintPair.forEach(({ r, c }) => {
      const t = board[r][c];
      if (t) {
        const el = tileElements.get(t.id);
        if (el) el.classList.add('hint');
      }
    });
  }

  // ---- RANDOM CALLOUT WORDS & VISUAL FX ----
  const WORD_POOLS = {
    coffee: ['Caffeinated!', 'Espresso Shot!', 'Double Shot!', 'Perked Up!', 'Full Roast!', 'Fresh Brew!', 'Buzzing!'],
    bacon: ['Extra Crispy!!'],
    egg: ['Egg-cellent!', 'Sunny Side!', 'Over Easy!', 'Yolk Yeah!', 'Crackin\'!', 'Golden Yolk!'],
    avocado: ['Holy Guac!', 'Smashed It!', 'Avo-mazing!', 'Fresh Guac!', 'So Ripe!', 'Guac On!'],
    chicken: ['Winner Winner!', 'Golden Crisp!', 'Cluck Yeah!', 'Hot & Crispy!', 'Drumroll!', 'Finger Lickin\'!'],
    general: [
      'Yummy!', 'Tasty!', 'Delish!', 'Sizzling!', 'Piping Hot!', 'Chef\'s Kiss!',
      'Brunch Time!', 'Sweet!', 'Crunchy!', 'Toasty!', 'Zesty!', 'Order Up!',
      'So Good!', 'Mouthwatering!', 'Boom!', 'Nice!'
    ],
    combos: [
      'DIVINE!', 'DELICIOUS!', 'TASTY!', 'UNSTOPPABLE!', 'BRUNCH BLAST!',
      'BOTTOMLESS!', 'MEGA CRUNCH!', 'HOT PLATE!', 'SUNDAY FUNDAY!', 'FLAVOR EXPLOSION!'
    ],
  };

  let lastWord = '';
  function pickRandomWord(pieceType, combo) {
    if (pieceType === 'bacon' && combo <= 1) return 'Extra Crispy!!';
    const pool =
      combo >= 2
        ? WORD_POOLS.combos
        : Math.random() < 0.55 && WORD_POOLS[pieceType]
          ? WORD_POOLS[pieceType]
          : WORD_POOLS.general;
    let pick = pool[Math.floor(Math.random() * pool.length)];
    if (pick === lastWord && pool.length > 1) {
      pick = pool[(pool.indexOf(pick) + 1) % pool.length];
    }
    lastWord = pick;
    return pick;
  }

  // Full-screen themed line-clear blast (bacon strip, coffee jet, runny egg, mushed avocado, crispy chicken)
  function spawnBeamFx(orientation, index, pieceType = 'coffee') {
    const rect = dom.boardTiles.getBoundingClientRect();
    const el = document.createElement('div');
    const thickness = Math.max(58, Math.round(cellPx * 1.65));
    el.className = `fx-line-blast ${orientation === 'h' ? 'horiz' : 'vert'} fx-type-${pieceType}`;
    el.dataset.piece = pieceType;

    const svgHtml = window.BRUNCH_ICONS.getLineBlastSvg(pieceType);
    if (orientation === 'h') {
      el.style.top = `${rect.top + (index + 0.5) * cellPx}px`;
      el.style.height = `${thickness}px`;
      el.innerHTML = svgHtml;
    } else {
      el.style.left = `${rect.left + (index + 0.5) * cellPx}px`;
      el.style.width = `${thickness}px`;
      el.innerHTML = `<div class="vert-rot" style="height:${thickness}px">${svgHtml}</div>`;
    }

    dom.screenFx.appendChild(el);
    setTimeout(() => el.remove(), 760);
  }

  function spawnBurstFx(r, c, diameterPx) {
    const el = document.createElement('div');
    el.className = 'fx-burst';
    el.style.left = `${(c + 0.5) * cellPx}px`;
    el.style.top = `${(r + 0.5) * cellPx}px`;
    el.style.width = `${diameterPx}px`;
    el.style.height = `${diameterPx}px`;
    dom.boardFx.appendChild(el);
    setTimeout(() => el.remove(), 460);
  }

  function spawnScoreFx(r, c, text) {
    const el = document.createElement('div');
    el.className = 'fx-score';
    el.textContent = text;
    el.style.left = `${(c + 0.5) * cellPx}px`;
    el.style.top = `${(r + 0.5) * cellPx}px`;
    dom.boardFx.appendChild(el);
    setTimeout(() => el.remove(), 880);
  }

  let wordLaneIndex = 0;
  function showComboBanner(text, toneClass = '') {
    // Keep accessible live banner text updated (hidden visually so floating words shine)
    dom.comboBanner.textContent = text;

    const rect = dom.boardTiles.getBoundingClientRect();
    const pop = document.createElement('div');
    pop.className = `fx-word-pop${toneClass ? ` ${toneClass}` : ''}`;
    pop.textContent = text;

    // Cycle through separated vertical lanes so cascade words never overlap each other
    const lanes = [0.22, 0.5, 0.76];
    const laneY = lanes[wordLaneIndex % lanes.length];
    wordLaneIndex++;

    const rx = rect.left + rect.width * (0.3 + Math.random() * 0.4);
    const ry = rect.top + rect.height * laneY;
    const tilt = Math.round((Math.random() - 0.5) * 14);
    pop.style.left = `${rx}px`;
    pop.style.top = `${ry}px`;
    pop.style.setProperty('--word-tilt', `${tilt}deg`);

    dom.screenFx.appendChild(pop);
    setTimeout(() => pop.remove(), 1180);
  }

  // ---- LEVEL MAP MODAL ----
  let activeTierIndex = 0;

  function openLevelsModal() {
    closeAllModals();
    state = 'MODAL';
    const numTiers = Math.max(1, Math.ceil(save.milestoneCap / 100));
    activeTierIndex = Math.min(numTiers - 1, Math.floor((save.currentLevel - 1) / 100));
    renderLevelsModal();
    dom.modalLevels.classList.remove('hidden');
  }

  function renderLevelsModal() {
    const numTiers = Math.max(1, Math.ceil(save.milestoneCap / 100));
    const startLvl = activeTierIndex * 100 + 1;
    const endLvl = (activeTierIndex + 1) * 100;

    dom.levelsMeta.textContent = `Levels ${startLvl}–${endLvl} · Mix #${save.shuffleEpoch + 1}`;

    dom.tierTabs.innerHTML = '';
    for (let i = 0; i < numTiers; i++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `tier-tab${i === activeTierIndex ? ' active' : ''}`;
      btn.textContent = `${i * 100 + 1}–${(i + 1) * 100}`;
      btn.addEventListener('click', () => {
        activeTierIndex = i;
        renderLevelsModal();
      });
      dom.tierTabs.appendChild(btn);
    }

    const frag = document.createDocumentFragment();
    for (let lvl = startLvl; lvl <= endLvl; lvl++) {
      const unlocked = lvl <= save.maxUnlockedLevel;
      const isCurrent = lvl === config.level;
      const isMilestone = lvl % 100 === 0;
      const st = save.stars[String(lvl)] || 0;

      const node = document.createElement('button');
      node.type = 'button';
      node.className = `lvl-node${isCurrent ? ' current' : ''}${!unlocked ? ' locked' : ''}${isMilestone ? ' milestone' : ''}`;
      node.disabled = !unlocked;
      node.innerHTML = `
        <span class="lvl-num">${isMilestone ? '☕' : ''}${lvl}</span>
        <span class="lvl-stars">${st > 0 ? '★'.repeat(st) : unlocked ? '···' : '🔒'}</span>
      `;
      if (unlocked) {
        node.addEventListener('click', () => startLevel(lvl));
      }
      frag.appendChild(node);
    }
    dom.levelsGrid.innerHTML = '';
    dom.levelsGrid.appendChild(frag);
  }

  function closeAllModals() {
    dom.modalWin.classList.add('hidden');
    dom.modalLose.classList.add('hidden');
    dom.modalCoffee.classList.add('hidden');
    dom.modalLevels.classList.add('hidden');
    dom.modalMenu.classList.add('hidden');
  }

  function closeModalToGame() {
    closeAllModals();
    state = 'IDLE';
    scheduleHintTimer();
  }

  // ---- BUTTON HANDLERS ----
  dom.btnSound.addEventListener('click', () => {
    save.soundEnabled = !save.soundEnabled;
    persistSave();
    syncSoundUI();
    if (save.soundEnabled) {
      AUDIO.unlock();
      AUDIO.swap();
    }
  });

  dom.btnLevels.addEventListener('click', () => {
    AUDIO.unlock();
    openLevelsModal();
  });

  dom.btnCloseLevels.addEventListener('click', closeModalToGame);

  dom.btnHelp.addEventListener('click', () => {
    AUDIO.unlock();
    closeAllModals();
    state = 'MODAL';
    dom.modalMenu.classList.remove('hidden');
  });

  dom.btnCloseMenu.addEventListener('click', closeModalToGame);

  dom.btnHint.addEventListener('click', () => {
    AUDIO.unlock();
    if (state !== 'IDLE') return;
    showHint();
  });

  dom.btnRestart.addEventListener('click', () => {
    AUDIO.unlock();
    startLevel(config.level);
  });

  dom.btnMenuResetAll.addEventListener('click', () => {
    save = defaultSave();
    persistSave();
    syncSoundUI();
    showToast('All progress reset to Level 1!');
    startLevel(1);
  });

  dom.btnWinReplay.addEventListener('click', () => startLevel(config.level));
  dom.btnWinNext.addEventListener('click', () => startLevel(config.level + 1));

  dom.btnLoseRetry.addEventListener('click', () => startLevel(config.level));
  dom.btnLoseLevels.addEventListener('click', openLevelsModal);

  dom.btnCoffeeYes.addEventListener('click', handleCoffeeAnswerYes);
  dom.btnCoffeeNo.addEventListener('click', handleCoffeeAnswerNo);

  // Close Level/Menu modals when clicking backdrop
  [dom.modalLevels, dom.modalMenu].forEach((backdrop) => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModalToGame();
    });
  });

  // Keep board perfectly sized on resize / phone orientation changes / dynamic mobile address bar
  window.addEventListener('resize', updateBoardSizing);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', updateBoardSizing);
  }

  // ---- BOOT ----
  renderGuidePieces();
  syncSoundUI();
  startLevel(save.currentLevel || 1);
})();
