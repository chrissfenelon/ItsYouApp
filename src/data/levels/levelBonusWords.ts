/**
 * Mots bonus cachés pour chaque niveau
 * Ces mots sont placés intentionnellement dans la grille mais ne sont pas affichés dans la liste
 * Le joueur peut les trouver pour gagner des bonus !
 */

export interface LevelBonusWords {
  levelId: number;
  bonusWords: string[];
}

export const LEVEL_BONUS_WORDS: LevelBonusWords[] = [
  // MONDE 1: DÉCOUVERTE (Levels 1-10) - 2-3 bonus words each
  { levelId: 1, bonusWords: ['VIE', 'ROI', 'COU'] }, // Animals theme
  { levelId: 2, bonusWords: ['THE', 'SEL', 'RIZ'] }, // Food theme
  { levelId: 3, bonusWords: ['VIF', 'JEU', 'BUT'] }, // Sports theme
  { levelId: 4, bonusWords: ['OIE', 'VER', 'ANE'] }, // Animals theme
  { levelId: 5, bonusWords: ['ARC', 'TRI', 'VUE'] }, // Colors theme
  { levelId: 6, bonusWords: ['PAIN', 'LAIT', 'MIEL'] }, // Food theme
  { levelId: 7, bonusWords: ['BOIS', 'ROUX', 'VENT'] }, // Nature theme
  { levelId: 8, bonusWords: ['GAIN', 'PIED', 'MAIN'] }, // Sports theme
  { levelId: 9, bonusWords: ['GRUE', 'PAON', 'LYNX'] }, // Animals theme
  { levelId: 10, bonusWords: ['ROSE', 'BLEU', 'GRIS'] }, // Colors theme

  // MONDE 2: AVENTURE (Levels 11-25) - 3-4 bonus words each
  { levelId: 11, bonusWords: ['PONT', 'GARE', 'TAXI', 'QUAI'] }, // Travel theme
  { levelId: 12, bonusWords: ['SOIF', 'FAIM', 'BEUR', 'CAFE'] }, // Food theme
  { levelId: 13, bonusWords: ['SONO', 'VOIX', 'TUNE', 'ECHO'] }, // Music theme
  { levelId: 14, bonusWords: ['FAON', 'BETE', 'PARC', 'CAGE'] }, // Animals theme
  { levelId: 15, bonusWords: ['PUCE', 'BITS', 'MEGA', 'CODE'] }, // Technology theme
  { levelId: 16, bonusWords: ['PARI', 'RING', 'CLUB', 'CAGE'] }, // Sports theme
  { levelId: 17, bonusWords: ['PAVE', 'PARC', 'MARE', 'ALLEE'] }, // Nature theme
  { levelId: 18, bonusWords: ['JUGE', 'CHEF', 'AIDE', 'VETO'] }, // Professions theme
  { levelId: 19, bonusWords: ['VISA', 'ILES', 'TOUR', 'COTE'] }, // Travel theme
  { levelId: 20, bonusWords: ['LIVE', 'SOLO', 'RIFF', 'NOTE'] }, // Music theme
  { levelId: 21, bonusWords: ['CHEF', 'FOUR', 'FRIT', 'ROTI'] }, // Food theme
  { levelId: 22, bonusWords: ['SPAM', 'BETA', 'CHIP', 'BOOT'] }, // Technology theme
  { levelId: 23, bonusWords: ['CRIN', 'PEAU', 'FAON', 'BOIS'] }, // Animals theme
  { levelId: 24, bonusWords: ['DORE', 'ROUX', 'KAKI', 'CIEL'] }, // Colors theme
  { levelId: 25, bonusWords: ['FOUL', 'RUSH', 'PUCK', 'DUNK'] }, // Sports theme

  // MONDE 3: DÉFI (Levels 26-40) - 4-5 bonus words each
  { levelId: 26, bonusWords: ['STAGE', 'POSTE', 'SALUT', 'PRIME', 'BONUS'] }, // Professions theme
  { levelId: 27, bonusWords: ['GLOBE', 'ROUTE', 'SEJOUR', 'HOTEL', 'VISITE'] }, // Travel theme
  { levelId: 28, bonusWords: ['CHOEUR', 'OPERA', 'CHANT', 'SCENE', 'APPLAUD'] }, // Music theme
  { levelId: 29, bonusWords: ['CORAIL', 'ALGUE', 'VAGUE', 'PLAGE', 'ECUME'] }, // Animals theme
  { levelId: 30, bonusWords: ['PIXEL', 'ECRAN', 'CLIQUE', 'SOURIS', 'CLIC'] }, // Technology theme
  { levelId: 31, bonusWords: ['FOIRE', 'TARTE', 'SUCRE', 'CREME', 'GOUT'] }, // Food theme
  { levelId: 32, bonusWords: ['SEVE', 'FEUILLE', 'RACINE', 'TRONC', 'HUMUS'] }, // Nature theme
  { levelId: 33, bonusWords: ['POSTE', 'GRADE', 'EMPLOI', 'BUREAU', 'USINE'] }, // Professions theme
  { levelId: 34, bonusWords: ['MATCH', 'COUPE', 'ARBITRE', 'FINAL', 'VICTOIRE'] }, // Sports theme
  { levelId: 35, bonusWords: ['TEINTE', 'NUANCE', 'OMBRE', 'LUMIERE', 'PASTEL'] }, // Colors theme
  { levelId: 36, bonusWords: ['BILLET', 'VALISE', 'DEPART', 'ARRIVEE', 'ESCALE'] }, // Travel theme
  { levelId: 37, bonusWords: ['RIDEAU', 'SCENE', 'ARTISTE', 'PUBLIC', 'OVATION'] }, // Music theme
  { levelId: 38, bonusWords: ['ESPECE', 'HABITAT', 'PROIE', 'CHASSE', 'TERRIER'] }, // Animals theme
  { levelId: 39, bonusWords: ['RESEAU', 'SERVEUR', 'FIBRE', 'SIGNAL', 'ANTENNE'] }, // Technology theme
  { levelId: 40, bonusWords: ['SAVEUR', 'EPICE', 'RECETTE', 'FESTIN', 'BANQUET'] }, // Food theme

  // MONDE 4: MAÎTRE (Levels 41-60) - 5-7 bonus words each
  { levelId: 41, bonusWords: ['COLLINE', 'VALLEE', 'SOMMET', 'SENTIER', 'CASCADE', 'RIVIERE'] }, // Nature theme
  { levelId: 42, bonusWords: ['CARRIERE', 'MISSION', 'SALAIRE', 'CONTRAT', 'DIPLOME', 'TALENT'] }, // Professions theme
  { levelId: 43, bonusWords: ['PODIUM', 'MEDAILLE', 'VICTOIRE', 'RECORD', 'EXPLOIT', 'CHAMPION'] }, // Sports theme
  { levelId: 44, bonusWords: ['FRONTIERE', 'DOUANE', 'PASSPORT', 'BAGAGES', 'TERMINAL', 'PILOTE'] }, // Travel theme
  { levelId: 45, bonusWords: ['HARMONIE', 'MELODIE', 'VIRTUOSE', 'PARTITION', 'COMPOSITEUR', 'ORCHESTRE'] }, // Music theme
  { levelId: 46, bonusWords: ['ECOSYSTEME', 'BIODIVERSITE', 'MIGRATION', 'EVOLUTION', 'MUTATION', 'COLONIE'] }, // Animals theme
  { levelId: 47, bonusWords: ['ALGORITHME', 'BINAIRE', 'OCTET', 'GIGAOCTET', 'PROTOCOLE', 'CRYPTAGE'] }, // Technology theme
  { levelId: 48, bonusWords: ['GASTRONOMIE', 'SOMMELIER', 'INGREDIENT', 'DELICIEUX', 'RAFFINEMENT', 'GOURMET'] }, // Food theme
  { levelId: 49, bonusWords: ['PALETTE', 'PIGMENT', 'CONTRASTE', 'SATURATION', 'TONALITE', 'HARMONIE'] }, // Colors theme
  { levelId: 50, bonusWords: ['BIODOME', 'CANOPEE', 'BIOTOPE', 'RELIEF', 'HORIZON', 'VEGETATION'] }, // Nature theme
  { levelId: 51, bonusWords: ['EXPERTISE', 'COMPETENCE', 'EXCELLENCE', 'METIER', 'SAVOIR', 'EXPERIENCE'] }, // Professions theme
  { levelId: 52, bonusWords: ['ATHLETISME', 'COMPETITION', 'ENDURANCE', 'SPRINT', 'MARATHON', 'PERFORMANCE'] }, // Sports theme
  { levelId: 53, bonusWords: ['AVENTURIER', 'EXPEDITION', 'DECOUVERTE', 'EXPLORATEUR', 'ITINERAIRE', 'BOUSSOLE'] }, // Travel theme
  { levelId: 54, bonusWords: ['SYMPHONY', 'CONCERTO', 'MOUVEMENT', 'CRESCENDO', 'FORTISSIMO', 'MAESTRO'] }, // Music theme
  { levelId: 55, bonusWords: ['MAMMIFERE', 'VERTEBRE', 'CARNIVORE', 'HERBIVORE', 'OMNIVORE', 'PREDATEUR'] }, // Animals theme
  { levelId: 56, bonusWords: ['CYBERNETIC', 'QUANTUM', 'VIRTUALIZATION', 'ROBOTIQUE', 'AUTOMATISATION', 'INNOVATION'] }, // Technology theme
  { levelId: 57, bonusWords: ['PATISSERIE', 'BOULANGERIE', 'CONFISERIE', 'CHOCOLATERIE', 'BRASSERIE', 'TRAITEUR'] }, // Food theme
  { levelId: 58, bonusWords: ['CHROMATIQUE', 'LUMINOSITE', 'REFLET', 'TRANSPARENT', 'IRIDESCENT', 'FLUORESCENT'] }, // Colors theme
  { levelId: 59, bonusWords: ['SANCTUAIRE', 'PARADIS', 'PRISTINE', 'WILDERNESS', 'CONSERVATION', 'PRESERVATION'] }, // Nature theme
  { levelId: 60, bonusWords: ['LEADERSHIP', 'EXPERTISE', 'INNOVATION', 'EXCELLENCE', 'PERFECTION', 'MASTERY', 'LEGENDARY'] }, // Professions theme
];

/**
 * Récupérer les mots bonus pour un niveau donné
 */
export const getBonusWordsForLevel = (levelId: number): string[] => {
  const levelBonus = LEVEL_BONUS_WORDS.find(lb => lb.levelId === levelId);
  return levelBonus ? levelBonus.bonusWords : [];
};

/**
 * Vérifier si un niveau a des mots bonus
 */
export const levelHasBonusWords = (levelId: number): boolean => {
  return LEVEL_BONUS_WORDS.some(lb => lb.levelId === levelId);
};

/**
 * Obtenir le nombre de mots bonus pour un niveau
 */
export const getBonusWordCount = (levelId: number): number => {
  const bonusWords = getBonusWordsForLevel(levelId);
  return bonusWords.length;
};
