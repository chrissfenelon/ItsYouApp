import { User } from '../../types/user';

export interface QuizMessage {
  title: string;
  message: string;
  emoji: string;
}

/**
 * Service pour générer des messages romantiques pour le quiz couple
 */
export class QuizCoupleMessagesService {
  /**
   * Obtenir un message de victoire romantique
   */
  static getWinnerMessage(
    winnerName: string,
    loserName: string,
    compatibilityScore: number,
    user?: User | null
  ): QuizMessage {
    const hasPartner = !!user?.partnerId;

    if (compatibilityScore >= 90) {
      return this.getPerfectMatchMessage(winnerName, hasPartner);
    } else if (compatibilityScore >= 70) {
      return this.getGreatMatchMessage(winnerName, hasPartner);
    } else if (compatibilityScore >= 50) {
      return this.getGoodMatchMessage(winnerName, hasPartner);
    } else {
      return this.getNeedsWorkMessage(winnerName, hasPartner);
    }
  }

  /**
   * Obtenir un message de défaite (consolation)
   */
  static getLoserMessage(
    loserName: string,
    winnerName: string,
    compatibilityScore: number,
    user?: User | null
  ): QuizMessage {
    const hasPartner = !!user?.partnerId;

    if (compatibilityScore >= 90) {
      return this.getPerfectMatchLoserMessage(loserName, hasPartner);
    } else if (compatibilityScore >= 70) {
      return this.getGreatMatchLoserMessage(loserName, hasPartner);
    } else if (compatibilityScore >= 50) {
      return this.getGoodMatchLoserMessage(loserName, hasPartner);
    } else {
      return this.getNeedsWorkLoserMessage(loserName, hasPartner);
    }
  }

  /**
   * Messages pour compatibilité parfaite (90%+)
   */
  private static getPerfectMatchMessage(winnerName: string, hasPartner: boolean): QuizMessage {
    const messages = hasPartner ? [
      {
        title: '💯 COMPATIBILITÉ PARFAITE!',
        message: `${winnerName} gagne mais vous êtes FAITS l'un pour l'autre! 💖✨`,
        emoji: '💯'
      },
      {
        title: '🎯 MATCH PARFAIT!',
        message: `${winnerName} l'emporte! Vous pensez EXACTEMENT pareil mon amour! 💕🌟`,
        emoji: '🎯'
      },
      {
        title: '⭐ ÂMES SŒURS CONFIRMÉES!',
        message: `Victoire pour ${winnerName}! Vous êtes sur la même longueur d'onde! 💫💖`,
        emoji: '⭐'
      },
      {
        title: '💖 CONNEXION MAGIQUE!',
        message: `${winnerName} gagne! Votre complicité est INCROYABLE! 🥰✨`,
        emoji: '💖'
      }
    ] : [
      {
        title: '💯 COMPATIBILITÉ PARFAITE!',
        message: `${winnerName} gagne avec une compatibilité exceptionnelle! 🎯`,
        emoji: '💯'
      },
      {
        title: '🎯 SCORE PARFAIT!',
        message: `${winnerName} l'emporte! Excellente connexion! ⭐`,
        emoji: '🎯'
      }
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Messages pour très bonne compatibilité (70-89%)
   */
  private static getGreatMatchMessage(winnerName: string, hasPartner: boolean): QuizMessage {
    const messages = hasPartner ? [
      {
        title: '💕 EXCELLENTE COMPATIBILITÉ!',
        message: `${winnerName} gagne! Vous vous connaissez SI BIEN! 🥰`,
        emoji: '💕'
      },
      {
        title: '🌟 SUPER CONNECTION!',
        message: `Victoire pour ${winnerName}! Votre complicité est merveilleuse bébé! 💖`,
        emoji: '🌟'
      },
      {
        title: '💝 BELLE HARMONIE!',
        message: `${winnerName} l'emporte! Vous êtes vraiment bien assortis! 😘✨`,
        emoji: '💝'
      },
      {
        title: '✨ COUPLE EN OR!',
        message: `${winnerName} gagne! Votre alchimie est formidable mon cœur! 💕`,
        emoji: '✨'
      }
    ] : [
      {
        title: '💕 EXCELLENTE COMPATIBILITÉ!',
        message: `${winnerName} gagne avec une belle connexion! 🌟`,
        emoji: '💕'
      },
      {
        title: '🌟 TRÈS BONNE HARMONIE!',
        message: `${winnerName} l'emporte! Belle complicité! ✨`,
        emoji: '🌟'
      }
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Messages pour bonne compatibilité (50-69%)
   */
  private static getGoodMatchMessage(winnerName: string, hasPartner: boolean): QuizMessage {
    const messages = hasPartner ? [
      {
        title: '💗 BONNE COMPATIBILITÉ!',
        message: `${winnerName} gagne! Vous vous complétez bien mon amour! 💕`,
        emoji: '💗'
      },
      {
        title: '🎈 BELLE CONNEXION!',
        message: `Victoire pour ${winnerName}! Votre différence fait votre force! 😘`,
        emoji: '🎈'
      },
      {
        title: '💫 COMPLÉMENTARITÉ!',
        message: `${winnerName} l'emporte! Vos différences vous rendent uniques bébé! 💖`,
        emoji: '💫'
      },
      {
        title: '🌈 ÉQUILIBRE PARFAIT!',
        message: `${winnerName} gagne! Ensemble vous êtes complets! 🥰`,
        emoji: '🌈'
      }
    ] : [
      {
        title: '💗 BONNE COMPATIBILITÉ!',
        message: `${winnerName} gagne! Belle connexion! 🎈`,
        emoji: '💗'
      },
      {
        title: '🎈 CONNEXION POSITIVE!',
        message: `${winnerName} l'emporte! Bonne harmonie! 💫`,
        emoji: '🎈'
      }
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Messages pour compatibilité à améliorer (<50%)
   */
  private static getNeedsWorkMessage(winnerName: string, hasPartner: boolean): QuizMessage {
    const messages = hasPartner ? [
      {
        title: '💪 DÉCOUVERTE MUTUELLE!',
        message: `${winnerName} gagne! C'est l'occasion de mieux se connaître mon cœur! 💕`,
        emoji: '💪'
      },
      {
        title: '🌱 APPRENTISSAGE!',
        message: `Victoire pour ${winnerName}! Apprendre l'un de l'autre c'est grandir ensemble! 💖`,
        emoji: '🌱'
      },
      {
        title: '💝 EXPLORATION!',
        message: `${winnerName} l'emporte! Tant de choses à découvrir sur toi bébé! 🥰`,
        emoji: '💝'
      },
      {
        title: '🎯 AVENTURE À DEUX!',
        message: `${winnerName} gagne! Nos différences sont une aventure passionnante! 😘`,
        emoji: '🎯'
      }
    ] : [
      {
        title: '💪 DÉCOUVERTE!',
        message: `${winnerName} gagne! Place à la découverte mutuelle! 🌱`,
        emoji: '💪'
      },
      {
        title: '🌱 APPRENTISSAGE!',
        message: `${winnerName} l'emporte! Apprenez-vous mieux! 💝`,
        emoji: '🌱'
      }
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Messages de consolation pour compatibilité parfaite
   */
  private static getPerfectMatchLoserMessage(loserName: string, hasPartner: boolean): QuizMessage {
    const messages = hasPartner ? [
      {
        title: '💖 Connexion Parfaite!',
        message: `${loserName}, tu as peut-être perdu mais notre amour gagne TOUJOURS! 🥰✨`,
        emoji: '💖'
      },
      {
        title: '🥰 Tu es Parfait(e)!',
        message: `${loserName}, défaite au quiz mais VICTOIRE dans mon cœur! 💕💫`,
        emoji: '🥰'
      },
      {
        title: '💝 Mon Champion!',
        message: `${loserName} perd le quiz mais reste mon/ma champion(ne) absolu(e)! 😘💖`,
        emoji: '💝'
      }
    ] : [
      {
        title: '💖 Excellente Performance!',
        message: `${loserName}, belle compatibilité malgré la défaite! 🌟`,
        emoji: '💖'
      }
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Messages de consolation pour très bonne compatibilité
   */
  private static getGreatMatchLoserMessage(loserName: string, hasPartner: boolean): QuizMessage {
    const messages = hasPartner ? [
      {
        title: '💕 Tu me connais si bien!',
        message: `${loserName}, défaite au quiz mais tu es TOUJOURS gagnant(e) pour moi! 🥰`,
        emoji: '💕'
      },
      {
        title: '🌟 Mon Amour!',
        message: `${loserName} perd mais mérite tous mes câlins de consolation! 🤗💖`,
        emoji: '🌟'
      },
      {
        title: '💖 Belle Performance!',
        message: `${loserName}, tu as assuré mon cœur! Viens chercher ta récompense! 😘`,
        emoji: '💖'
      }
    ] : [
      {
        title: '💕 Belle Tentative!',
        message: `${loserName}, très bonne compatibilité! 🌟`,
        emoji: '💕'
      }
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Messages de consolation pour bonne compatibilité
   */
  private static getGoodMatchLoserMessage(loserName: string, hasPartner: boolean): QuizMessage {
    const messages = hasPartner ? [
      {
        title: '💗 Bien joué!',
        message: `${loserName}, défaite mais je t'aime pour nos différences aussi! 💕`,
        emoji: '💗'
      },
      {
        title: '🎈 C\'est OK!',
        message: `${loserName} perd mais gagne un gros bisou quand même! 😘💖`,
        emoji: '🎈'
      },
      {
        title: '💫 Prochaine fois!',
        message: `${loserName}, revanche bientôt mon amour! En attendant: câlin! 🤗`,
        emoji: '💫'
      }
    ] : [
      {
        title: '💗 Bonne Tentative!',
        message: `${loserName}, pas mal du tout! 🎈`,
        emoji: '💗'
      }
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Messages de consolation pour compatibilité à améliorer
   */
  private static getNeedsWorkLoserMessage(loserName: string, hasPartner: boolean): QuizMessage {
    const messages = hasPartner ? [
      {
        title: '💪 On apprend ensemble!',
        message: `${loserName}, défaite mais c'est l'occasion d'apprendre! Je t'aime mon cœur! 💕`,
        emoji: '💪'
      },
      {
        title: '🌱 Grandir à deux!',
        message: `${loserName} perd mais grandir ensemble c'est gagner! Viens dans mes bras! 🥰`,
        emoji: '🌱'
      },
      {
        title: '💝 Découverte!',
        message: `${loserName}, on a tant à découvrir l'un de l'autre bébé! C'est excitant! 💖`,
        emoji: '💝'
      }
    ] : [
      {
        title: '💪 Continue!',
        message: `${loserName}, apprenez-vous mieux! 🌱`,
        emoji: '💪'
      }
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Messages pour match nul
   */
  static getDrawMessage(
    player1Name: string,
    player2Name: string,
    compatibilityScore: number,
    user?: User | null
  ): QuizMessage {
    const hasPartner = !!user?.partnerId;

    const messages = hasPartner ? [
      {
        title: '🤝 ÉGALITÉ PARFAITE!',
        message: `${player1Name} et ${player2Name} à égalité! Vous êtes vraiment en harmonie! 💕💫`,
        emoji: '🤝'
      },
      {
        title: '💑 ÉQUILIBRE TOTAL!',
        message: `Match nul! Vous êtes parfaitement synchronisés mon amour! 🥰✨`,
        emoji: '💑'
      },
      {
        title: '⚖️ HARMONIE ABSOLUE!',
        message: `Égalité! Comme votre relation: parfaitement équilibrée! 💖🌟`,
        emoji: '⚖️'
      },
      {
        title: '💞 MÊME LONGUEUR D\'ONDE!',
        message: `Match nul! Vous pensez comme un seul cœur bébé! 😘💕`,
        emoji: '💞'
      }
    ] : [
      {
        title: '🤝 ÉGALITÉ!',
        message: `${player1Name} et ${player2Name} à égalité! Belle harmonie! ⚖️`,
        emoji: '🤝'
      },
      {
        title: '💑 MATCH NUL!',
        message: `Égalité parfaite! Excellente synchronisation! 💞`,
        emoji: '💑'
      }
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Messages pour réponse identique (mode compétitif)
   */
  static getSameAnswerMessage(hasPartner: boolean = false): QuizMessage {
    const messages = hasPartner ? [
      {
        title: '💕 MÊME RÉPONSE!',
        message: 'Vous pensez pareil! Trop mignons! 🥰',
        emoji: '💕'
      },
      {
        title: '🎯 CONNEXION!',
        message: 'Sur la même longueur d\'onde! 💖',
        emoji: '🎯'
      },
      {
        title: '✨ EN PHASE!',
        message: 'Parfaitement synchronisés! 💫',
        emoji: '✨'
      },
      {
        title: '💖 COMPLICITÉ!',
        message: 'Même choix! Vous êtes faits l\'un pour l\'autre! 😘',
        emoji: '💖'
      }
    ] : [
      {
        title: '💕 MÊME RÉPONSE!',
        message: 'Vous pensez pareil! 🎯',
        emoji: '💕'
      },
      {
        title: '🎯 CONNEXION!',
        message: 'Sur la même longueur d\'onde! ✨',
        emoji: '🎯'
      }
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Messages pour réponse différente (mode compétitif)
   */
  static getDifferentAnswerMessage(hasPartner: boolean = false): QuizMessage {
    const messages = hasPartner ? [
      {
        title: '🌈 DIFFÉRENCE!',
        message: 'Réponses différentes! Vos différences vous rendent uniques! 💕',
        emoji: '🌈'
      },
      {
        title: '💫 COMPLÉMENTARITÉ!',
        message: 'Pas la même réponse! Vous vous complétez bébé! 🥰',
        emoji: '💫'
      },
      {
        title: '🎨 DIVERSITÉ!',
        message: 'Choix différents! C\'est ce qui rend votre relation riche! 💖',
        emoji: '🎨'
      }
    ] : [
      {
        title: '🌈 DIFFÉRENCE!',
        message: 'Réponses différentes! Intéressant! 💫',
        emoji: '🌈'
      }
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Messages pour prédiction correcte (mode prédiction)
   */
  static getCorrectPredictionMessage(hasPartner: boolean = false): QuizMessage {
    const messages = hasPartner ? [
      {
        title: '🎯 BINGO!',
        message: 'Tu as deviné! Tu me connais trop bien mon amour! 💕✨',
        emoji: '🎯'
      },
      {
        title: '💖 PARFAIT!',
        message: 'Exactement! Tu lis dans mes pensées bébé! 🥰💫',
        emoji: '💖'
      },
      {
        title: '⭐ EXCELLENT!',
        message: 'Bonne réponse! Notre connexion est magique! 😘💕',
        emoji: '⭐'
      },
      {
        title: '✨ INCROYABLE!',
        message: 'Tu as tout bon! On se connaît par cœur! 💖🌟',
        emoji: '✨'
      }
    ] : [
      {
        title: '🎯 BINGO!',
        message: 'Prédiction correcte! Bien joué! ⭐',
        emoji: '🎯'
      },
      {
        title: '💖 PARFAIT!',
        message: 'Exactement! Excellente intuition! ✨',
        emoji: '💖'
      }
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Messages pour prédiction incorrecte (mode prédiction)
   */
  static getWrongPredictionMessage(hasPartner: boolean = false): QuizMessage {
    const messages = hasPartner ? [
      {
        title: '😅 RATÉ!',
        message: 'Pas tout à fait! Mais c\'est ce qui rend notre relation intéressante! 💕',
        emoji: '😅'
      },
      {
        title: '💫 OOH!',
        message: 'Mauvaise réponse! J\'adore te surprendre bébé! 🥰',
        emoji: '💫'
      },
      {
        title: '🎭 SURPRISE!',
        message: 'Raté! On a encore des mystères à découvrir! 💖',
        emoji: '🎭'
      },
      {
        title: '🌟 PAS GRAVE!',
        message: 'Ce n\'est pas ça! Mais je t\'aime quand même mon cœur! 😘',
        emoji: '🌟'
      }
    ] : [
      {
        title: '😅 RATÉ!',
        message: 'Prédiction incorrecte! Prochaine fois! 💫',
        emoji: '😅'
      },
      {
        title: '💫 PAS TOUT À FAIT!',
        message: 'Ce n\'est pas ça! Continue! 🌟',
        emoji: '💫'
      }
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Obtenir un message de compatibilité générique
   */
  static getCompatibilityMessage(score: number, hasPartner: boolean = false): QuizMessage {
    if (score >= 90) {
      return {
        title: '💯 COMPATIBILITÉ EXCEPTIONNELLE!',
        message: hasPartner
          ? `${score}%! Vous êtes PARFAITS l'un pour l'autre! 💖✨`
          : `${score}%! Compatibilité exceptionnelle! 🌟`,
        emoji: '💯'
      };
    } else if (score >= 80) {
      return {
        title: '⭐ EXCELLENTE COMPATIBILITÉ!',
        message: hasPartner
          ? `${score}%! Votre connexion est merveilleuse! 💕🌟`
          : `${score}%! Très bonne compatibilité! ✨`,
        emoji: '⭐'
      };
    } else if (score >= 70) {
      return {
        title: '💕 TRÈS BONNE COMPATIBILITÉ!',
        message: hasPartner
          ? `${score}%! Belle harmonie entre vous! 🥰💫`
          : `${score}%! Bonne compatibilité! 💕`,
        emoji: '💕'
      };
    } else if (score >= 60) {
      return {
        title: '💗 BONNE COMPATIBILITÉ!',
        message: hasPartner
          ? `${score}%! Vous vous complétez bien! 💖`
          : `${score}%! Compatibilité positive! 💗`,
        emoji: '💗'
      };
    } else if (score >= 50) {
      return {
        title: '💫 COMPATIBILITÉ CORRECTE!',
        message: hasPartner
          ? `${score}%! Vos différences vous enrichissent! 🌈`
          : `${score}%! Compatibilité moyenne! 💫`,
        emoji: '💫'
      };
    } else {
      return {
        title: '🌱 PLACE À LA DÉCOUVERTE!',
        message: hasPartner
          ? `${score}%! Tant de choses à apprendre ensemble! 💕`
          : `${score}%! Apprenez-vous mieux! 🌱`,
        emoji: '🌱'
      };
    }
  }
}

export default QuizCoupleMessagesService;
