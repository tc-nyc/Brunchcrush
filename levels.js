/* Seeded level generator for Levels 1..100, 101..200, 201..300...
   When the user answers "No" to the coffee question, shuffleEpoch increments
   so all levels 1..100 get genuinely reshuffled boards, goals, and layouts! */
window.BRUNCH_LEVELS = (() => {
  const GRID_SIZE = 8;

  // Deterministic fast PRNG (Mulberry32)
  function mulberry32(seed) {
    let t = seed >>> 0;
    return function () {
      t += 0x6D2B79F5;
      let x = Math.imul(t ^ (t >>> 15), 1 | t);
      x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }

  function randInt(rng, min, max) {
    return min + Math.floor(rng() * (max - min + 1));
  }

  function pickUnique(rng, arr, count) {
    const copy = arr.slice();
    const out = [];
    while (out.length < count && copy.length > 0) {
      const idx = Math.floor(rng() * copy.length);
      out.push(copy.splice(idx, 1)[0]);
    }
    return out;
  }

  // Build an 8x8 mask of active cells (true = playable, false = hole)
  function createBoardMask(patternIndex) {
    const mask = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(true));
    switch (patternIndex) {
      case 0:
        // Classic full 8x8
        break;
      case 1:
        // Rounded corners
        mask[0][0] = mask[0][7] = mask[7][0] = mask[7][7] = false;
        break;
      case 2:
        // Wide diamond cutouts
        mask[0][0] = mask[0][1] = mask[1][0] = false;
        mask[0][6] = mask[0][7] = mask[1][7] = false;
        mask[6][0] = mask[7][0] = mask[7][1] = false;
        mask[6][7] = mask[7][6] = mask[7][7] = false;
        break;
      case 3:
        // Cozy café table center donut (2x2 center hole)
        mask[3][3] = mask[3][4] = mask[4][3] = mask[4][4] = false;
        break;
      case 4:
        // Twin side notches
        mask[3][0] = mask[4][0] = mask[3][7] = mask[4][7] = false;
        break;
      case 5:
        // Top & bottom notches
        mask[0][3] = mask[0][4] = mask[7][3] = mask[7][4] = false;
        break;
      case 6:
        // Diagonal corner accents
        mask[0][0] = mask[0][1] = mask[7][6] = mask[7][7] = false;
        break;
      default:
        break;
    }
    return mask;
  }

  function createSyrupMap(mask, rng, count) {
    const map = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false));
    const candidates = [];
    for (let r = 1; r < GRID_SIZE - 1; r++) {
      for (let c = 1; c < GRID_SIZE - 1; c++) {
        if (mask[r][c]) candidates.push([r, c]);
      }
    }
    // Fallback to all active cells if needed
    if (candidates.length < count) {
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (mask[r][c] && !candidates.some(([rr, cc]) => rr === r && cc === c)) {
            candidates.push([r, c]);
          }
        }
      }
    }
    const chosen = pickUnique(rng, candidates, Math.min(count, candidates.length));
    chosen.forEach(([r, c]) => {
      map[r][c] = true;
    });
    return map;
  }

  function getLevelConfig(levelNumber, shuffleEpoch = 0) {
    const level = Math.max(1, Math.floor(levelNumber));
    const tier = Math.floor((level - 1) / 100); // 0 = 1..100, 1 = 101..200, ...
    const posInTier = ((level - 1) % 100) + 1; // 1..100

    // Seed mixes level number and shuffleEpoch so reshuffling creates a brand-new 100-level sequence
    const seed = ((level * 2654435761) ^ ((shuffleEpoch + 1) * 1597334677) ^ 0x9E3779B9) >>> 0;
    const rng = mulberry32(seed);

    // Gentle difficulty curve across each 100-level block, keeping early levels welcoming
    const difficulty = Math.min(1, (posInTier - 1) / 99 + tier * 0.14);

    // Choose board shape (levels 1-3 on first batch stay full 8x8 for easy onboarding)
    let patternIndex = 0;
    if (level <= 2 && shuffleEpoch === 0) {
      patternIndex = 0;
    } else {
      const patterns = posInTier < 10 ? [0, 0, 1, 4] : [0, 1, 2, 3, 4, 5, 6];
      patternIndex = patterns[Math.floor(rng() * patterns.length)];
    }

    const mask = createBoardMask(patternIndex);

    // Milestone levels (100, 200, 300...) are special Coffee Celebrations!
    const isMilestone = level % 100 === 0;

    // Goal types: 'score' | 'collect' | 'syrup'
    let goalType;
    if (isMilestone) {
      goalType = 'collect';
    } else if (level === 1 && shuffleEpoch === 0) {
      goalType = 'score';
    } else {
      const roll = rng();
      if (roll < 0.32) goalType = 'score';
      else if (roll < 0.72) goalType = 'collect';
      else goalType = 'syrup';
    }

    // Moves balance: generous enough to feel fun & fair on mobile
    const baseMoves = Math.round(24 - difficulty * 5 + randInt(rng, -2, 3));
    const moves = Math.max(16, Math.min(30, baseMoves));

    // Score star thresholds
    const targetScore = Math.round((1200 + posInTier * 42 + tier * 600 + randInt(rng, 0, 250)) / 50) * 50;
    const starThresholds = [
      Math.round(targetScore * 0.65),
      Math.round(targetScore * 1.15),
      Math.round(targetScore * 1.65),
    ];

    const types = window.BRUNCH_ICONS.TYPES;
    let goals = [];
    let syrupMap = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false));

    if (isMilestone) {
      // Every 100th level asks you to brew coffee + a brunch favorite!
      const partner = pickUnique(rng, types.filter((t) => t !== 'coffee'), 1)[0];
      goals = [
        { kind: 'collect', piece: 'coffee', target: 16 + tier * 4 },
        { kind: 'collect', piece: partner, target: 12 + tier * 3 },
      ];
    } else if (goalType === 'score') {
      goals = [{ kind: 'score', target: targetScore }];
    } else if (goalType === 'collect') {
      const numTargets = posInTier < 8 ? 1 : rng() < 0.68 ? 2 : 1;
      const chosenTypes = pickUnique(rng, types, numTargets);
      goals = chosenTypes.map((piece) => ({
        kind: 'collect',
        piece,
        target: Math.round(
          (numTargets === 1 ? 14 : 9) + difficulty * (numTargets === 1 ? 14 : 9) + randInt(rng, 0, 4)
        ),
      }));
    } else {
      // Clear golden syrup tiles
      const syrupCount = Math.min(24, Math.max(6, Math.round(7 + difficulty * 13 + randInt(rng, 0, 3))));
      syrupMap = createSyrupMap(mask, rng, syrupCount);
      let actualSyrup = 0;
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (syrupMap[r][c]) actualSyrup++;
        }
      }
      goals = [{ kind: 'syrup', target: actualSyrup }];
    }

    return {
      level,
      tier,
      isMilestone,
      shuffleEpoch,
      seed,
      gridSize: GRID_SIZE,
      moves,
      targetScore,
      starThresholds,
      goals,
      mask,
      syrupMap,
    };
  }

  return {
    GRID_SIZE,
    mulberry32,
    getLevelConfig,
  };
})();
