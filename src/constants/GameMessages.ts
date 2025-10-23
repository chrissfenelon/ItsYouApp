// Hilarious congratulations messages for Orlie when she wins
export const Orlie_WIN_MESSAGES = [
  "Félicitations Orlie, t'as encore écrasé le con! 🎉",
  "Orlie la stratège! Tu viens de détruire ton adversaire! 💪",
  "Bravo Orlie! Le pauvre garçon ne sait plus où donner de la tête! 😂",
  "Victoire royale pour Orlie! Le mec est complètement perdu! 👑",
  "Orlie la boss! Tu viens de le faire pleurer dans sa barbe! 🤣",
  "Félicitations princesse! Tu as encore humilié le perdant! 💅",
  "Orlie la terrible! Ce type n'avait aucune chance face à toi! ⚡",
  "Bravo ma reine! Tu viens de lui donner une leçon magistrale! 👸",
  "Orlie l'implacable! Le pauvre bougre s'est fait lessiver! 🧽",
  "Victoire écrasante d'Orlie! Le mec va avoir besoin d'une thérapie! 🛋️",
  "Félicitations Orlie! Tu as encore prouvé que t'es la plus forte! 💎",
  "Orlie la championne! Ce type ferait mieux de retourner à l'école! 🎓",
  "Bravo Orlie! Tu viens de lui faire mordre la poussière! 🌪️",
  "Orlie la légende! Le pauvre diable n'a même pas vu le coup venir! 👻",
  "Félicitations ma chérie! Tu as encore ridiculisé ton adversaire! 🎭",
  "Orlie la géniale! Ce mec devrait abandonner les jeux pour toujours! 🏳️",
  "Bravo Orlie! Tu l'as envoyé au tapis sans même transpirer! 🥊",
  "Orlie la redoutable! Le type va faire des cauchemars cette nuit! 😱",
  "Félicitations Orlie! Tu viens de lui infliger une défaite cuisante! 🔥",
  "Orlie la magnifique! Ce pauvre type n'était qu'un amuse-bouche! 🍤",
  "Bravo ma star! Tu as encore prouvé ta supériorité écrasante! ⭐",
  "Orlie l'invincible! Le mec ferait mieux de jouer aux dames! 🔴",
  "Félicitations Orlie! Tu l'as battu comme un tambour! 🥁",
  "Orlie la phénoménale! Ce type a l'air d'un débutant à côté de toi! 🍼",
  "Bravo Orlie! Tu viens de lui donner une masterclass! 🎨",
  "Orlie la fantastique! Le pauvre gars n'avait qu'à rester au lit! 🛏️",
  "Félicitations ma déesse! Tu as encore atomisé la concurrence! ⚛️",
  "Orlie la spectaculaire! Ce type devrait changer de hobby! 🎪",
  "Bravo Orlie! Tu l'as battu avec une facilité déconcertante! 🎯",
  "Orlie l'extraordinaire! Le mec vient de se prendre une raclée mémorable! 🏒"
];

// Messages when the player wins (much less enthusiastic)
export const PLAYER_WIN_MESSAGES = [
  "Bravo, tu as réussi à battre Orlie cette fois... 😏",
  "Félicitations, tu as eu de la chance aujourd'hui! 🍀",
  "Victoire! Orlie t'a laissé gagner par gentillesse! 😇",
  "Bravo! Même une horloge cassée donne l'heure exacte deux fois par jour! ⏰",
  "Tu as gagné! Orlie devait être distraite! 🤔",
  "Félicitations! C'était ton jour de chance! ✨",
  "Victoire! Tu as réussi l'impossible! 🎯",
  "Bravo! Orlie a dû avoir pitié de toi! 😅"
];

// Draw messages
export const DRAW_MESSAGES = [
  "Match nul! Vous êtes aussi forts l'un que l'autre! 🤝",
  "Égalité parfaite! Vous formez une équipe redoutable! ⚖️",
  "Match nul! L'amour l'emporte sur la compétition! 💕",
  "Égalité! Vous êtes faits l'un pour l'autre! 💑",
  "Match nul! Personne ne perd quand l'amour gagne! 💖"
];

// Get random message based on winner
export const getRandomWinMessage = (winner: 'Orlie' | 'player'): string => {
  const messages = winner === 'Orlie' ? Orlie_WIN_MESSAGES : PLAYER_WIN_MESSAGES;
  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex];
};

// Get random draw message
export const getRandomDrawMessage = (): string => {
  const randomIndex = Math.floor(Math.random() * DRAW_MESSAGES.length);
  return DRAW_MESSAGES[randomIndex];
};