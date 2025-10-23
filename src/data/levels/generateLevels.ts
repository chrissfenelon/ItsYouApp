import { Difficulty } from '../../types/wordSearch.types';
import { LevelDefinition } from './levelDefinitions';

// Thèmes disponibles par monde
const WORLD_THEMES = [
  // Monde 1-3 (1-90): Facile à Moyen
  ['animals', 'food', 'sports', 'colors', 'nature'],
  // Monde 4-6 (91-180): Moyen à Difficile
  ['travel', 'music', 'technology', 'professions', 'weather'],
  // Monde 7-8 (181-240): Difficile
  ['science', 'space', 'history', 'geography', 'art'],
  // Monde 9-10 (241-300): Expert
  ['literature', 'philosophy', 'medicine', 'architecture', 'mixed'],
];

// Noms thématiques par monde
const WORLD_NAMES = {
  // Monde 1 (61-90)
  61: 'Débutant Avancé',
  // Monde 2 (91-120)
  91: 'Explorateur',
  // Monde 3 (121-150)
  121: 'Aventurier',
  // Monde 4 (151-180)
  151: 'Voyageur',
  // Monde 5 (181-210)
  181: 'Savant',
  // Monde 6 (211-240)
  211: 'Expert',
  // Monde 7 (241-270)
  241: 'Maître',
  // Monde 8 (271-300)
  271: 'Légende',
};

// Générateur de noms de niveaux créatifs
const LEVEL_NAME_PATTERNS = {
  animals: ['Safari', 'Zoo', 'Faune', 'Bestiaire', 'Ménagerie', 'Animalerie'],
  food: ['Cuisine', 'Festin', 'Menu', 'Dégustation', 'Saveurs', 'Recettes'],
  sports: ['Championnat', 'Tournoi', 'Olympiade', 'Compétition', 'Défi Sportif'],
  colors: ['Palette', 'Nuancier', 'Spectre', 'Teintes', 'Couleurs'],
  nature: ['Jardin', 'Forêt', 'Écosystème', 'Botanique', 'Biome'],
  travel: ['Voyage', 'Destination', 'Exploration', 'Circuit', 'Périple'],
  music: ['Concert', 'Symphonie', 'Festival', 'Mélodie', 'Harmonie'],
  technology: ['Innovation', 'Numérique', 'Tech', 'Digital', 'Cyber'],
  professions: ['Métiers', 'Carrières', 'Professions', 'Vocations', 'Emplois'],
  weather: ['Climat', 'Météo', 'Saisons', 'Éléments', 'Atmosphère'],
  science: ['Laboratoire', 'Découverte', 'Expérience', 'Recherche', 'Science'],
  space: ['Cosmos', 'Galaxie', 'Univers', 'Astronomie', 'Espace'],
  history: ['Époque', 'Histoire', 'Chronique', 'Passé', 'Ère'],
  geography: ['Atlas', 'Cartographie', 'Territoires', 'Monde', 'Géo'],
  art: ['Galerie', 'Musée', 'Création', 'Œuvre', 'Artistique'],
  literature: ['Bibliothèque', 'Littérature', 'Récits', 'Écrits', 'Textes'],
  philosophy: ['Pensée', 'Philosophie', 'Sagesse', 'Réflexion', 'Idées'],
  medicine: ['Médecine', 'Santé', 'Clinique', 'Soins', 'Thérapie'],
  architecture: ['Architecture', 'Édifices', 'Bâtiments', 'Structures', 'Monuments'],
  mixed: ['Omniscience', 'Universel', 'Complet', 'Total', 'Absolu'],
};

// Qualificatifs pour rendre les noms uniques
const QUALIFIERS = [
  'Mystérieux', 'Magique', 'Épique', 'Légendaire', 'Grandiose',
  'Sublime', 'Exquis', 'Parfait', 'Ultime', 'Suprême',
  'Royal', 'Impérial', 'Divin', 'Céleste', 'Extraordinaire',
  'Fantastique', 'Merveilleux', 'Prodigieux', 'Fascinant', 'Spectaculaire',
];

export function generateLevel(id: number): LevelDefinition {
  // Déterminer la difficulté basée sur l'ID
  let difficulty: Difficulty;
  let gridSize: number;
  let wordCount: number;
  let timeLimit: number;
  let coinReward: number;
  let xpReward: number;

  if (id <= 90) {
    difficulty = 'easy';
    gridSize = 8 + Math.floor((id - 61) / 6);
    wordCount = 5 + Math.floor((id - 61) / 5);
    timeLimit = 300 + (id - 61) * 10;
    coinReward = 15 + (id - 61) * 2;
    xpReward = 70 + (id - 61) * 5;
  } else if (id <= 150) {
    difficulty = 'medium';
    gridSize = 10 + Math.floor((id - 91) / 6);
    wordCount = 7 + Math.floor((id - 91) / 5);
    timeLimit = 400 + (id - 91) * 10;
    coinReward = 30 + (id - 91) * 2;
    xpReward = 120 + (id - 91) * 6;
  } else if (id <= 240) {
    difficulty = 'hard';
    gridSize = 12 + Math.floor((id - 151) / 6);
    wordCount = 9 + Math.floor((id - 151) / 5);
    timeLimit = 600 + (id - 151) * 10;
    coinReward = 50 + (id - 151) * 3;
    xpReward = 200 + (id - 151) * 7;
  } else {
    difficulty = 'expert';
    gridSize = 15 + Math.floor((id - 241) / 6);
    wordCount = 13 + Math.floor((id - 241) / 4);
    timeLimit = 900 + (id - 241) * 15;
    coinReward = 100 + (id - 241) * 4;
    xpReward = 400 + (id - 241) * 10;
  }

  // Limites maximales
  gridSize = Math.min(gridSize, 20);
  wordCount = Math.min(wordCount, 25);
  timeLimit = Math.min(timeLimit, 1800);

  // Sélectionner le thème
  const worldIndex = Math.floor((id - 61) / 60);
  const themes = WORLD_THEMES[Math.min(worldIndex, WORLD_THEMES.length - 1)];
  const themeIndex = (id - 61) % themes.length;
  const themeId = themes[themeIndex];

  // Générer le nom
  const namePatterns = LEVEL_NAME_PATTERNS[themeId as keyof typeof LEVEL_NAME_PATTERNS] || ['Niveau'];
  const patternIndex = Math.floor((id - 61) / 10) % namePatterns.length;
  const qualifierIndex = (id - 61) % QUALIFIERS.length;
  const name = `${namePatterns[patternIndex]} ${QUALIFIERS[qualifierIndex]}`;

  // Unlock requirements - tous les 30 niveaux
  const unlockRequirement =
    id % 30 === 1 && id > 61
      ? {
          level: id - 1,
          coins: 100 * Math.floor(id / 30),
        }
      : undefined;

  return {
    id,
    name,
    difficulty,
    themeId,
    gridSize,
    wordCount,
    timeLimit,
    coinReward,
    xpReward,
    unlockRequirement,
  };
}

// Générer tous les niveaux 61-300
export function generateAllLevels(): LevelDefinition[] {
  const levels: LevelDefinition[] = [];
  for (let i = 61; i <= 300; i++) {
    levels.push(generateLevel(i));
  }
  return levels;
}
