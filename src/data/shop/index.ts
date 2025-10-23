import { ShopItem, PowerUp } from '../../types/wordSearch.types';

export const SHOP_ITEMS: ShopItem[] = [
  // Consommables - Indices
  {
    id: 'hint_letter',
    type: 'consumable',
    name: 'Révéler une Lettre',
    description: 'Révèle une lettre aléatoire d\'un mot',
    price: 5,
    icon: '💡',
  },
  {
    id: 'hint_word',
    type: 'consumable',
    name: 'Révéler un Mot',
    description: 'Révèle un mot complet',
    price: 15,
    icon: '🔍',
  },
  {
    id: 'time_freeze',
    type: 'powerup',
    name: 'Gel du Temps',
    description: 'Arrête le chronomètre pendant 30 secondes',
    price: 20,
    icon: '⏸️',
  },
  {
    id: 'highlight_first',
    type: 'powerup',
    name: 'Première Lettre',
    description: 'Surligne la première lettre de chaque mot',
    price: 10,
    icon: '✨',
  },

  // Pack d'indices
  {
    id: 'hint_bundle_5',
    type: 'consumable',
    name: 'Pack 5 Indices',
    description: '5 révélations de lettres',
    price: 20,
    icon: '📦',
  },
  {
    id: 'hint_bundle_10',
    type: 'consumable',
    name: 'Pack 10 Indices',
    description: '10 révélations de lettres',
    price: 35,
    icon: '🎁',
  },

  // Thèmes (déblocables)
  {
    id: 'theme_nature',
    type: 'theme',
    name: 'Thème Nature',
    description: 'Débloque le thème Nature avec 40 mots',
    price: 100,
    icon: '🌳',
  },
  {
    id: 'theme_tech',
    type: 'theme',
    name: 'Thème Technologie',
    description: 'Débloque le thème Technologie',
    price: 100,
    icon: '💻',
  },
  {
    id: 'theme_music',
    type: 'theme',
    name: 'Thème Musique',
    description: 'Débloque le thème Musique',
    price: 100,
    icon: '🎵',
  },
];

export const POWER_UPS: Record<string, PowerUp> = {
  revealLetter: {
    id: 'revealLetter',
    type: 'revealLetter',
    name: 'Révéler Lettre',
    description: 'Révèle une lettre aléatoire',
    icon: '💡',
    quantity: 0,
  },
  revealWord: {
    id: 'revealWord',
    type: 'revealWord',
    name: 'Révéler Mot',
    description: 'Révèle un mot complet',
    icon: '🔍',
    quantity: 0,
  },
  timeFreeze: {
    id: 'timeFreeze',
    type: 'timeFreeze',
    name: 'Gel du Temps',
    description: 'Arrête le chronomètre',
    icon: '⏸️',
    quantity: 0,
  },
  highlightFirst: {
    id: 'highlightFirst',
    type: 'highlightFirst',
    name: 'Première Lettre',
    description: 'Surligne les premières lettres',
    icon: '✨',
    quantity: 0,
  },
};

export const getShopItemById = (id: string): ShopItem | undefined => {
  return SHOP_ITEMS.find(item => item.id === id);
};

export const getShopItemsByType = (type: ShopItem['type']): ShopItem[] => {
  return SHOP_ITEMS.filter(item => item.type === type);
};
