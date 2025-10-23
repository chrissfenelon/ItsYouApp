// Coin rewards
export const COIN_REWARDS = {
  // Base rewards by difficulty
  difficulty: {
    easy: 10,
    medium: 25,
    hard: 50,
    expert: 100,
  },

  // Time bonus (per second under time limit)
  timeBonus: 0.5,

  // Perfect game bonus (all words found)
  perfectBonus: 20,

  // First time completion bonus
  firstTimeBonus: 50,

  // Daily game bonus
  dailyBonus: 10,

  // Multiplayer rewards
  multiplayerWin: 50,
  multiplayerParticipation: 10,
};

// XP rewards
export const XP_REWARDS = {
  // Base XP by difficulty
  difficulty: {
    easy: 50,
    medium: 100,
    hard: 200,
    expert: 400,
  },

  // Per word found
  perWord: 10,

  // Time bonus
  timeBonus: 1,

  // Perfect game bonus
  perfectBonus: 100,

  // Multiplayer
  multiplayerWin: 200,
  multiplayerParticipation: 50,
};

// Shop prices
export const SHOP_PRICES = {
  // Consumables (hints/power-ups)
  revealLetter: 5,
  revealWord: 15,
  timeFreeze: 20,
  highlightFirst: 10,

  // Themes
  themeUnlock: 100,

  // Avatars
  avatarUnlock: 50,

  // Bundles
  hintBundle5: 20,
  hintBundle10: 35,
  powerUpBundle: 50,
};

// Level progression
export const LEVEL_PROGRESSION = {
  // XP required for each level (cumulative)
  xpPerLevel: (level: number): number => {
    return Math.floor(100 * Math.pow(1.15, level - 1));
  },

  // Coin reward per level up
  coinReward: 50,

  // Max level
  maxLevel: 100,
};

// Calculate total XP required for a level
export const getTotalXPForLevel = (level: number): number => {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += LEVEL_PROGRESSION.xpPerLevel(i);
  }
  return total;
};

// Calculate level from total XP
export const getLevelFromXP = (totalXP: number): number => {
  let level = 1;
  let xpNeeded = 0;

  while (level < LEVEL_PROGRESSION.maxLevel) {
    xpNeeded += LEVEL_PROGRESSION.xpPerLevel(level);
    if (totalXP < xpNeeded) {
      break;
    }
    level++;
  }

  return level;
};

// Calculate XP progress to next level
export const getXPProgress = (totalXP: number): { current: number; required: number; level: number } => {
  const level = getLevelFromXP(totalXP);
  const currentLevelXP = getTotalXPForLevel(level);
  const nextLevelXP = getTotalXPForLevel(level + 1);

  return {
    current: totalXP - currentLevelXP,
    required: nextLevelXP - currentLevelXP,
    level,
  };
};
