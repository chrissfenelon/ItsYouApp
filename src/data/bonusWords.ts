// Mots bonus courts qui peuvent apparaître naturellement dans la grille
export const BONUS_WORDS = [
  // Mots de 3 lettres
  'THE', 'CAT', 'DOG', 'BAT', 'RAT', 'HAT', 'MAT', 'SAT', 'FAT',
  'BIG', 'PIG', 'DIG', 'FIG', 'WIG', 'JIG',
  'HOT', 'POT', 'DOT', 'LOT', 'GOT', 'NOT', 'ROT', 'COT',
  'SUN', 'FUN', 'RUN', 'BUN', 'GUN', 'NUN',
  'CAR', 'BAR', 'JAR', 'TAR', 'FAR', 'WAR',
  'RED', 'BED', 'LED', 'FED', 'WED',
  'SEE', 'BEE', 'FEE', 'TEE',
  'OLD', 'COLD', 'GOLD', 'HOLD', 'FOLD', 'SOLD', 'TOLD', 'BOLD',

  // Mots français de 3 lettres
  'ROI', 'LIT', 'VIE', 'MER', 'FEU', 'AIR', 'EAU', 'SUR', 'VIN',
  'SOL', 'COU', 'DOS', 'NEZ', 'BAS', 'SAC', 'SEC', 'VOL', 'VUE',
  'AMI', 'AGE', 'ART', 'BLE', 'CLE', 'DUC', 'ETE', 'FIN', 'GAZ',
  'LUC', 'MAL', 'MUR', 'NEF', 'OIE', 'PAR', 'PRE', 'QUI', 'RUE',
  'SOU', 'THE', 'UNE', 'VAL', 'ZOO',

  // Mots de 4 lettres français
  'PAIN', 'CHAT', 'LOUP', 'OURS', 'ROSE', 'VERT', 'BLEU', 'NOIR',
  'DANS', 'AVEC', 'POUR', 'SANS', 'TOUT', 'ELLE', 'ELLE', 'VOUS',
  'FILLE', 'FILS', 'MERE', 'PERE', 'BEBE', 'DAME', 'MARI',
  'CAFE', 'BIER', 'LAIT', 'MIEL', 'SOIF', 'FAIM',
  'BOIS', 'PONT', 'TOUR', 'PORT', 'GARE', 'PARC', 'BANC',
  'FORT', 'DOUX', 'JOLI', 'BEAU', 'LAID', 'HAUT', 'LONG',
];

// Récompenses pour les mots bonus
export const BONUS_WORD_REWARDS = {
  3: { coins: 10, xp: 15, label: 'Petit Bonus !' },
  4: { coins: 15, xp: 25, label: 'Bon Bonus !' },
  5: { coins: 20, xp: 35, label: 'Super Bonus !' },
  6: { coins: 30, xp: 60, label: 'Excellent Bonus !' },
  7: { coins: 50, xp: 100, label: 'Incroyable Bonus !' },
  8: { coins: 75, xp: 150, label: 'Extraordinaire !' },
  9: { coins: 100, xp: 200, label: 'Légendaire !' },
  10: { coins: 150, xp: 300, label: 'Mythique !' },
};

export const getBonusReward = (wordLength: number) => {
  if (wordLength <= 2) return null;
  if (wordLength >= 10) return BONUS_WORD_REWARDS[10];
  return BONUS_WORD_REWARDS[wordLength as keyof typeof BONUS_WORD_REWARDS] || null;
};

export const isBonusWord = (word: string): boolean => {
  return BONUS_WORDS.includes(word.toUpperCase());
};
