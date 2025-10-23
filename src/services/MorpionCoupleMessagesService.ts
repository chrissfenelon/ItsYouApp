import { User } from '../types/user';

export interface VictoryMessage {
  title: string;
  message: string;
  emoji: string;
}

/**
 * Service for generating personalized romantic messages for couple mode
 */
export class MorpionCoupleMessagesService {
  /**
   * Get personalized victory message for the winner
   */
  static getWinnerMessage(
    winner: 'X' | 'O',
    playerX: string,
    playerO: string,
    consecutiveWins: number,
    user?: User | null,
    isPlayerX?: boolean
  ): VictoryMessage {
    const winnerName = winner === 'X' ? playerX : playerO;
    const isUserWinner = (winner === 'X' && isPlayerX) || (winner === 'O' && !isPlayerX);

    // Get partner name if available
    const hasPartner = !!user?.partnerId;

    // Different messages based on consecutive wins
    if (consecutiveWins >= 5) {
      return this.getStreakMessage(winnerName, consecutiveWins, isUserWinner, hasPartner);
    } else if (consecutiveWins >= 3) {
      return this.getMultiWinMessage(winnerName, consecutiveWins, isUserWinner, hasPartner);
    } else {
      return this.getSingleWinMessage(winnerName, isUserWinner, hasPartner);
    }
  }

  /**
   * Get personalized defeat message for the loser
   */
  static getLoserMessage(
    loser: 'X' | 'O',
    playerX: string,
    playerO: string,
    consecutiveLosses: number,
    user?: User | null,
    isPlayerX?: boolean
  ): VictoryMessage {
    const loserName = loser === 'X' ? playerX : playerO;
    const isUserLoser = (loser === 'X' && isPlayerX) || (loser === 'O' && !isPlayerX);

    // Get partner name if available
    const hasPartner = !!user?.partnerId;

    // Different messages based on consecutive losses
    if (consecutiveLosses >= 5) {
      return this.getHeavyDefeatMessage(loserName, consecutiveLosses, isUserLoser, hasPartner);
    } else if (consecutiveLosses >= 3) {
      return this.getMultiLossMessage(loserName, consecutiveLosses, isUserLoser, hasPartner);
    } else {
      return this.getSingleLossMessage(loserName, isUserLoser, hasPartner);
    }
  }

  /**
   * Single win messages (romantic and playful)
   */
  private static getSingleWinMessage(
    winnerName: string,
    isUserWinner: boolean,
    hasPartner?: boolean
  ): VictoryMessage {
    const messages = hasPartner ? [
      {
        title: '💕 Victoire amoureuse!',
        message: `${winnerName} remporte la partie! Tu es mon champion(ne) préféré(e)! 😘`,
        emoji: '💕'
      },
      {
        title: '🎉 Bravo mon amour!',
        message: `${winnerName} gagne haut la main! Et moi qui gagne ton cœur! 💖`,
        emoji: '🎉'
      },
      {
        title: '😍 Champion(ne) adoré(e)!',
        message: `Victoire pour ${winnerName}! Tu es imbattable... comme mon amour pour toi! 💝`,
        emoji: '😍'
      },
      {
        title: '💖 Belle victoire!',
        message: `${winnerName} triomphe! Mais ma plus belle victoire, c'est toi! 🥰`,
        emoji: '💖'
      },
      {
        title: '🏆 Tu es le/la meilleur(e)!',
        message: `${winnerName} gagne! Normal, tu excelles en tout mon cœur! 💕`,
        emoji: '🏆'
      },
      {
        title: '✨ Victoire magique!',
        message: `${winnerName} l'emporte! Comme tu as conquis mon cœur! 💫`,
        emoji: '✨'
      }
    ] : [
      {
        title: '🎉 Victoire!',
        message: `${winnerName} remporte la partie! Bien joué! 🏆`,
        emoji: '🎉'
      },
      {
        title: '👑 Champion!',
        message: `${winnerName} gagne cette manche! Excellent! ⭐`,
        emoji: '👑'
      },
      {
        title: '🏆 Bravo!',
        message: `Victoire pour ${winnerName}! Continue comme ça! 💪`,
        emoji: '🏆'
      }
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Multiple consecutive wins (3-4)
   */
  private static getMultiWinMessage(
    winnerName: string,
    wins: number,
    isUserWinner: boolean,
    hasPartner?: boolean
  ): VictoryMessage {
    const messages = hasPartner ? [
      {
        title: '🔥 Série de feu!',
        message: `${winnerName} enchaîne ${wins} victoires! Tu es en feu mon amour! 💥`,
        emoji: '🔥'
      },
      {
        title: '💪 Inarrêtable!',
        message: `${wins} victoires consécutives pour ${winnerName}! Tu es exceptionnel(le) bébé! 😘`,
        emoji: '💪'
      },
      {
        title: '⚡ Domination totale!',
        message: `${winnerName} domine avec ${wins} victoires d'affilée! Mon champion(ne)! 👑`,
        emoji: '⚡'
      },
      {
        title: '🌟 Série impressionnante!',
        message: `${wins} victoires pour ${winnerName}! Tu m'impressionnes toujours mon cœur! 💖`,
        emoji: '🌟'
      },
      {
        title: '🎯 En pleine forme!',
        message: `${winnerName} marque ${wins} victoires! Tu es incroyable mon amour! 🥰`,
        emoji: '🎯'
      }
    ] : [
      {
        title: '🔥 Série gagnante!',
        message: `${winnerName} enchaîne ${wins} victoires consécutives! 🏆`,
        emoji: '🔥'
      },
      {
        title: '⚡ Imbattable!',
        message: `${wins} victoires pour ${winnerName}! Impressionnant! 💪`,
        emoji: '⚡'
      }
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Long winning streak (5+)
   */
  private static getStreakMessage(
    winnerName: string,
    wins: number,
    isUserWinner: boolean,
    hasPartner?: boolean
  ): VictoryMessage {
    const messages = hasPartner ? [
      {
        title: '👑 LÉGENDE ABSOLUE!',
        message: `${winnerName} DOMINE avec ${wins} victoires consécutives! Tu es une LÉGENDE mon amour! 💖🔥`,
        emoji: '👑'
      },
      {
        title: '🌟 IMBATTABLE!',
        message: `${wins} victoires d'affilée pour ${winnerName}! Tu es PARFAIT(E) bébé! 😍✨`,
        emoji: '🌟'
      },
      {
        title: '💥 PHÉNOMÉNAL!',
        message: `${winnerName} ÉCRASE tout avec ${wins} victoires! Tu es EXCEPTIONNEL(LE) mon cœur! 🔥💕`,
        emoji: '💥'
      },
      {
        title: '🏆 MAÎTRE ABSOLU!',
        message: `${wins} victoires consécutives! ${winnerName} est le/la MAÎTRE! Et mon grand amour! 👑💖`,
        emoji: '🏆'
      }
    ] : [
      {
        title: '👑 LÉGENDE!',
        message: `${wins} victoires consécutives pour ${winnerName}! INCROYABLE! 🔥`,
        emoji: '👑'
      },
      {
        title: '🌟 IMBATTABLE!',
        message: `${winnerName} domine avec ${wins} victoires! PHÉNOMÉNAL! ⚡`,
        emoji: '🌟'
      }
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Single loss messages (encouraging and romantic)
   */
  private static getSingleLossMessage(
    loserName: string,
    isUserLoser: boolean,
    hasPartner?: boolean
  ): VictoryMessage {
    const messages = hasPartner ? [
      {
        title: '😅 Petite défaite!',
        message: `${loserName} a perdu... mais gagne un gros câlin! 🤗💕`,
        emoji: '😅'
      },
      {
        title: '💪 Prochaine fois!',
        message: `Défaite pour ${loserName}... Ta revanche mon amour! Et un bisou de consolation! 😘`,
        emoji: '💪'
      },
      {
        title: '😘 Pas grave!',
        message: `${loserName} perd cette manche... mais reste mon/ma champion(ne)! 💖`,
        emoji: '😘'
      },
      {
        title: '🤗 Câlin de consolation!',
        message: `${loserName} n'a pas gagné... Viens dans mes bras bébé! 💕`,
        emoji: '🤗'
      },
      {
        title: '💋 Bisous réconfortants!',
        message: `Défaite pour ${loserName}... Je te console avec des bisous! 😘💖`,
        emoji: '💋'
      },
      {
        title: '🥰 Mon/ma préféré(e) quand même!',
        message: `${loserName} perd... mais gagne mon cœur à chaque fois! 💕`,
        emoji: '🥰'
      }
    ] : [
      {
        title: '😅 Défaite!',
        message: `${loserName} perd cette manche! Prochaine fois! 💪`,
        emoji: '😅'
      },
      {
        title: '🎯 Pas de chance!',
        message: `${loserName} n'a pas réussi... Continue! 🌟`,
        emoji: '🎯'
      }
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Multiple consecutive losses (3-4)
   */
  private static getMultiLossMessage(
    loserName: string,
    losses: number,
    isUserLoser: boolean,
    hasPartner?: boolean
  ): VictoryMessage {
    const messages = hasPartner ? [
      {
        title: '😢 Série difficile...',
        message: `${losses} défaites pour ${loserName}... Viens ici mon cœur, je te console! 🤗💕`,
        emoji: '😢'
      },
      {
        title: '💪 Courage bébé!',
        message: `${loserName} enchaîne ${losses} défaites... Mais je crois en toi mon amour! 💖`,
        emoji: '💪'
      },
      {
        title: '🤗 Gros câlin!',
        message: `${losses} défaites pour ${loserName}... Tu mérites tous mes câlins! 💕`,
        emoji: '🤗'
      },
      {
        title: '😘 Je suis là!',
        message: `Série difficile de ${losses} défaites... Mais tu es toujours mon/ma champion(ne)! 💖`,
        emoji: '😘'
      },
      {
        title: '💋 Série de bisous!',
        message: `${loserName} perd ${losses} fois... Tu gagnes ${losses} bisous! 😘💕`,
        emoji: '💋'
      }
    ] : [
      {
        title: '😅 Série difficile!',
        message: `${losses} défaites pour ${loserName}... Ne lâche rien! 💪`,
        emoji: '😅'
      },
      {
        title: '🎯 Continue!',
        message: `${loserName} enchaîne les défaites... Ta revanche arrive! 🌟`,
        emoji: '🎯'
      }
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Heavy defeat streak (5+)
   */
  private static getHeavyDefeatMessage(
    loserName: string,
    losses: number,
    isUserLoser: boolean,
    hasPartner?: boolean
  ): VictoryMessage {
    const messages = hasPartner ? [
      {
        title: '💕 Viens dans mes bras!',
        message: `${losses} défaites pour ${loserName}... C'est pas grave, tu es PARFAIT(E) pour moi! 🤗💖`,
        emoji: '💕'
      },
      {
        title: '😘 Je t\'aime quand même!',
        message: `${loserName} perd ${losses} fois... Mais tu GAGNES mon cœur à l'infini! 💝✨`,
        emoji: '😘'
      },
      {
        title: '🤗 Énorme câlin!',
        message: `${losses} défaites... ${loserName} a besoin de TOUS mes câlins! 💕💕💕`,
        emoji: '🤗'
      },
      {
        title: '💋 Pluie de bisous!',
        message: `Série noire de ${losses} défaites... ${loserName} mérite une AVALANCHE de bisous! 😘💖`,
        emoji: '💋'
      },
      {
        title: '👑 Toujours mon/ma roi/reine!',
        message: `${losses} défaites mais ${loserName} reste la personne la plus incroyable! 💖✨`,
        emoji: '👑'
      }
    ] : [
      {
        title: '😅 Grosse série!',
        message: `${losses} défaites pour ${loserName}... Il faut rebondir! 💪`,
        emoji: '😅'
      },
      {
        title: '🌟 Ne lâche rien!',
        message: `${loserName} accumule les défaites... La victoire viendra! 🎯`,
        emoji: '🌟'
      }
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Get draw message for couple mode
   */
  static getDrawMessage(
    playerX: string,
    playerO: string,
    user?: User | null
  ): VictoryMessage {
    const hasPartner = !!user?.partnerId;

    const messages = hasPartner ? [
      {
        title: '🤝 Match nul!',
        message: `Égalité parfaite entre ${playerX} et ${playerO}! Comme notre amour! 💕`,
        emoji: '🤝'
      },
      {
        title: '💑 Égalité amoureuse!',
        message: `Ni gagnant ni perdant... Juste deux cœurs qui s'aiment! 💖`,
        emoji: '💑'
      },
      {
        title: '⚖️ Équilibre parfait!',
        message: `Match nul! Vous êtes faits l'un(e) pour l'autre! 💕✨`,
        emoji: '⚖️'
      },
      {
        title: '💞 Harmonie totale!',
        message: `Égalité! Comme l'équilibre parfait de votre couple! 🥰`,
        emoji: '💞'
      },
      {
        title: '🎭 Ex aequo!',
        message: `Match nul! Vous gagnez tous les deux... un bisou! 😘💋`,
        emoji: '🎭'
      }
    ] : [
      {
        title: '🤝 Match nul!',
        message: `Égalité parfaite entre ${playerX} et ${playerO}!`,
        emoji: '🤝'
      },
      {
        title: '⚖️ Équilibre!',
        message: `Ni gagnant ni perdant cette fois!`,
        emoji: '⚖️'
      }
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Get AI-specific messages when playing against AI
   */
  static getAIVictoryMessage(
    playerWon: boolean,
    playerName: string,
    difficulty: string
  ): VictoryMessage {
    if (playerWon) {
      const messages = [
        {
          title: '🎉 Victoire contre l\'IA!',
          message: `${playerName} bat l'IA ${difficulty}! Bravo! 🏆`,
          emoji: '🎉'
        },
        {
          title: '👑 Supérieur à l\'IA!',
          message: `${playerName} triomphe! L'humain gagne! 💪`,
          emoji: '👑'
        },
        {
          title: '🏆 Champion!',
          message: `${playerName} domine l'IA ${difficulty}! Excellent! ⭐`,
          emoji: '🏆'
        }
      ];
      return messages[Math.floor(Math.random() * messages.length)];
    } else {
      const messages = [
        {
          title: '🤖 L\'IA gagne!',
          message: `L'IA ${difficulty} l'emporte... Revanche ${playerName}! 💪`,
          emoji: '🤖'
        },
        {
          title: '⚡ L\'IA triomphe!',
          message: `L'IA ${difficulty} est trop forte... Réessaye! 🎯`,
          emoji: '⚡'
        },
        {
          title: '🎮 Défaite!',
          message: `L'IA gagne cette manche... Continue ${playerName}! 🌟`,
          emoji: '🎮'
        }
      ];
      return messages[Math.floor(Math.random() * messages.length)];
    }
  }
}

export default MorpionCoupleMessagesService;
