import { Difficulty } from '../../types/wordSearch.types';

export interface World {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  startLevel: number;
  endLevel: number;
  difficulty: Difficulty;
  unlockRequirement?: {
    level?: number;
    coins?: number;
  };
}

export const WORLDS: World[] = [
  {
    id: 1,
    name: 'Découverte',
    description: 'Commence ton aventure avec des mots simples',
    icon: '🌱',
    color: '#4CAF50',
    startLevel: 1,
    endLevel: 30,
    difficulty: 'easy',
  },
  {
    id: 2,
    name: 'Exploration',
    description: 'Explore de nouveaux thèmes passionnants',
    icon: '🧭',
    color: '#2196F3',
    startLevel: 31,
    endLevel: 60,
    difficulty: 'easy',
  },
  {
    id: 3,
    name: 'Aventure',
    description: 'L\'aventure devient plus excitante',
    icon: '⛵',
    color: '#00BCD4',
    startLevel: 61,
    endLevel: 90,
    difficulty: 'medium',
    unlockRequirement: { level: 60, coins: 200 },
  },
  {
    id: 4,
    name: 'Voyageur',
    description: 'Parcours le monde des mots',
    icon: '✈️',
    color: '#03A9F4',
    startLevel: 91,
    endLevel: 120,
    difficulty: 'medium',
    unlockRequirement: { level: 90, coins: 300 },
  },
  {
    id: 5,
    name: 'Explorateur',
    description: 'Découvre des territoires inconnus',
    icon: '🗺️',
    color: '#009688',
    startLevel: 121,
    endLevel: 150,
    difficulty: 'medium',
    unlockRequirement: { level: 120, coins: 400 },
  },
  {
    id: 6,
    name: 'Savant',
    description: 'La connaissance est ta force',
    icon: '📚',
    color: '#673AB7',
    startLevel: 151,
    endLevel: 180,
    difficulty: 'hard',
    unlockRequirement: { level: 150, coins: 500 },
  },
  {
    id: 7,
    name: 'Expert',
    description: 'Seuls les experts peuvent réussir',
    icon: '🎓',
    color: '#9C27B0',
    startLevel: 181,
    endLevel: 210,
    difficulty: 'hard',
    unlockRequirement: { level: 180, coins: 700 },
  },
  {
    id: 8,
    name: 'Maître',
    description: 'Tu deviens un vrai maître',
    icon: '👑',
    color: '#E91E63',
    startLevel: 211,
    endLevel: 240,
    difficulty: 'hard',
    unlockRequirement: { level: 210, coins: 1000 },
  },
  {
    id: 9,
    name: 'Légende',
    description: 'Entre dans la légende',
    icon: '⭐',
    color: '#FF9800',
    startLevel: 241,
    endLevel: 270,
    difficulty: 'expert',
    unlockRequirement: { level: 240, coins: 1500 },
  },
  {
    id: 10,
    name: 'Absolu',
    description: 'Le défi ultime t\'attend',
    icon: '🏆',
    color: '#FFD700',
    startLevel: 271,
    endLevel: 300,
    difficulty: 'expert',
    unlockRequirement: { level: 270, coins: 2000 },
  },
];

export const getWorldByLevel = (levelId: number): World | undefined => {
  return WORLDS.find(
    world => levelId >= world.startLevel && levelId <= world.endLevel
  );
};

export const getWorldById = (worldId: number): World | undefined => {
  return WORLDS.find(world => world.id === worldId);
};

export const isWorldUnlocked = (
  worldId: number,
  completedLevels: number[],
  currentCoins: number
): boolean => {
  const world = getWorldById(worldId);
  if (!world) return false;

  // Premier monde toujours débloqué
  if (worldId === 1) return true;

  // Vérifier les exigences
  if (world.unlockRequirement?.level) {
    if (!completedLevels.includes(world.unlockRequirement.level)) {
      return false;
    }
  }

  if (world.unlockRequirement?.coins) {
    if (currentCoins < world.unlockRequirement.coins) {
      return false;
    }
  }

  return true;
};
