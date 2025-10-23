// French crossword words database with romantic and couple-themed content

export interface WordData {
  word: string;
  clue: string;
  category: 'romantique' | 'couple' | 'general' | 'culture';
  difficulty: 'facile' | 'moyen' | 'difficile';
}

export const frenchCrosswordWords: WordData[] = [
  // ========== FACILE (3-5 letters) ==========

  // Romantique
  { word: 'AMOUR', clue: 'Sentiment fort entre deux personnes', category: 'romantique', difficulty: 'facile' },
  { word: 'COEUR', clue: 'Symbole de l\'amour', category: 'romantique', difficulty: 'facile' },
  { word: 'ROSE', clue: 'Fleur de l\'amour', category: 'romantique', difficulty: 'facile' },
  { word: 'DATE', clue: 'Rendez-vous romantique', category: 'romantique', difficulty: 'facile' },
  { word: 'BAISER', clue: 'Geste d\'affection avec les lèvres', category: 'romantique', difficulty: 'facile' },
  { word: 'DOUX', clue: 'Tendre et agréable', category: 'romantique', difficulty: 'facile' },
  { word: 'REVE', clue: 'Pensée pendant le sommeil', category: 'romantique', difficulty: 'facile' },
  { word: 'NUIT', clue: 'Période entre le coucher et le lever du soleil', category: 'romantique', difficulty: 'facile' },
  { word: 'LUNE', clue: 'Astre de la nuit', category: 'romantique', difficulty: 'facile' },
  { word: 'DINER', clue: 'Repas du soir', category: 'romantique', difficulty: 'facile' },

  // Couple
  { word: 'DEUX', clue: 'Nombre d\'un couple', category: 'couple', difficulty: 'facile' },
  { word: 'UNION', clue: 'Association de deux personnes', category: 'couple', difficulty: 'facile' },
  { word: 'FOYER', clue: 'Maison d\'un couple', category: 'couple', difficulty: 'facile' },
  { word: 'TEMPS', clue: 'Ce qu\'on passe ensemble', category: 'couple', difficulty: 'facile' },
  { word: 'VIE', clue: 'Ce qu\'on partage à deux', category: 'couple', difficulty: 'facile' },

  // General
  { word: 'JOIE', clue: 'Sentiment de bonheur', category: 'general', difficulty: 'facile' },
  { word: 'PAIX', clue: 'Absence de conflit', category: 'general', difficulty: 'facile' },
  { word: 'RIRE', clue: 'Expression de l\'amusement', category: 'general', difficulty: 'facile' },
  { word: 'FAIT', clue: 'Chose accomplie', category: 'general', difficulty: 'facile' },
  { word: 'CAFE', clue: 'Boisson chaude du matin', category: 'general', difficulty: 'facile' },

  // ========== MOYEN (6-8 letters) ==========

  // Romantique
  { word: 'TENDRESSE', clue: 'Affection douce et délicate', category: 'romantique', difficulty: 'moyen' },
  { word: 'PASSION', clue: 'Amour intense et ardent', category: 'romantique', difficulty: 'moyen' },
  { word: 'CARESSE', clue: 'Geste tendre avec la main', category: 'romantique', difficulty: 'moyen' },
  { word: 'ROMANCE', clue: 'Histoire d\'amour', category: 'romantique', difficulty: 'moyen' },
  { word: 'BOUQUET', clue: 'Assemblage de fleurs', category: 'romantique', difficulty: 'moyen' },
  { word: 'REGARD', clue: 'Action de fixer avec les yeux', category: 'romantique', difficulty: 'moyen' },
  { word: 'SOURIRE', clue: 'Expression du visage montrant la joie', category: 'romantique', difficulty: 'moyen' },
  { word: 'VALENTIN', clue: 'Prénom du saint de l\'amour', category: 'romantique', difficulty: 'moyen' },
  { word: 'ETERNEL', clue: 'Qui dure toujours', category: 'romantique', difficulty: 'moyen' },
  { word: 'DESIR', clue: 'Envie profonde', category: 'romantique', difficulty: 'moyen' },

  // Couple
  { word: 'MARIAGE', clue: 'Union officielle de deux personnes', category: 'couple', difficulty: 'moyen' },
  { word: 'FIANCE', clue: 'Futur époux', category: 'couple', difficulty: 'moyen' },
  { word: 'ALLIANCE', clue: 'Anneau du mariage', category: 'couple', difficulty: 'moyen' },
  { word: 'PROMESSE', clue: 'Engagement à faire quelque chose', category: 'couple', difficulty: 'moyen' },
  { word: 'CONFIANCE', clue: 'Foi en quelqu\'un', category: 'couple', difficulty: 'moyen' },
  { word: 'PARTAGE', clue: 'Action de diviser en parts', category: 'couple', difficulty: 'moyen' },
  { word: 'SOUTIEN', clue: 'Aide et support', category: 'couple', difficulty: 'moyen' },
  { word: 'RESPECT', clue: 'Considération envers quelqu\'un', category: 'couple', difficulty: 'moyen' },
  { word: 'ENSEMBLE', clue: 'L\'un avec l\'autre', category: 'couple', difficulty: 'moyen' },
  { word: 'FAMILLE', clue: 'Groupe de personnes unies par des liens', category: 'couple', difficulty: 'moyen' },

  // General
  { word: 'BONHEUR', clue: 'État de satisfaction complète', category: 'general', difficulty: 'moyen' },
  { word: 'EMOTION', clue: 'Réaction affective', category: 'general', difficulty: 'moyen' },
  { word: 'MEMOIRE', clue: 'Capacité de se souvenir', category: 'general', difficulty: 'moyen' },
  { word: 'VOYAGER', clue: 'Se déplacer pour visiter des lieux', category: 'general', difficulty: 'moyen' },
  { word: 'MUSIQUE', clue: 'Art des sons', category: 'general', difficulty: 'moyen' },

  // ========== DIFFICILE (9+ letters) ==========

  // Romantique
  { word: 'DECLARATION', clue: 'Aveu amoureux', category: 'romantique', difficulty: 'difficile' },
  { word: 'SEDUCTION', clue: 'Art d\'attirer quelqu\'un', category: 'romantique', difficulty: 'difficile' },
  { word: 'COMPLICE', clue: 'Personne avec qui on partage des secrets', category: 'romantique', difficulty: 'difficile' },
  { word: 'ENCHANTEMENT', clue: 'État de fascination', category: 'romantique', difficulty: 'difficile' },
  { word: 'ROMANTISME', clue: 'Attitude sentimentale', category: 'romantique', difficulty: 'difficile' },
  { word: 'ATTENTIONS', clue: 'Petits gestes de gentillesse', category: 'romantique', difficulty: 'difficile' },
  { word: 'HARMONIE', clue: 'Accord parfait', category: 'romantique', difficulty: 'difficile' },

  // Couple
  { word: 'ENGAGEMENT', clue: 'Promesse sérieuse', category: 'couple', difficulty: 'difficile' },
  { word: 'COMMUNICATION', clue: 'Échange d\'informations', category: 'couple', difficulty: 'difficile' },
  { word: 'COMPLICITE', clue: 'Entente profonde', category: 'couple', difficulty: 'difficile' },
  { word: 'FIDELITE', clue: 'Qualité de rester loyal', category: 'couple', difficulty: 'difficile' },
  { word: 'ANNIVERSAIRE', clue: 'Date de célébration annuelle', category: 'couple', difficulty: 'difficile' },
  { word: 'COMPROMIS', clue: 'Accord par concessions mutuelles', category: 'couple', difficulty: 'difficile' },
  { word: 'PATIENCE', clue: 'Capacité d\'attendre calmement', category: 'couple', difficulty: 'difficile' },

  // Culture
  { word: 'RENAISSANCE', clue: 'Renouveau culturel européen', category: 'culture', difficulty: 'difficile' },
  { word: 'LITTERATURE', clue: 'Ensemble des œuvres écrites', category: 'culture', difficulty: 'difficile' },
  { word: 'PHILOSOPHIE', clue: 'Étude des questions fondamentales', category: 'culture', difficulty: 'difficile' },
];

// Helper functions to filter words by difficulty
export const getWordsByDifficulty = (difficulty: 'facile' | 'moyen' | 'difficile'): WordData[] => {
  return frenchCrosswordWords.filter(w => w.difficulty === difficulty);
};

export const getWordsByCategory = (category: 'romantique' | 'couple' | 'general' | 'culture'): WordData[] => {
  return frenchCrosswordWords.filter(w => w.category === category);
};

export const getRandomWords = (count: number, difficulty?: 'facile' | 'moyen' | 'difficile'): WordData[] => {
  const pool = difficulty ? getWordsByDifficulty(difficulty) : frenchCrosswordWords;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
};
