import firestore from '@react-native-firebase/firestore';
import { QuizGame, QuizPlayer, QuizAnswer, QuizQuestion, QuizGameMode, PredictionQuestion, CustomQuestion } from '../../types/quizCouple.types';
import { PlayerProfile } from '../../types/wordSearch.types';
import { getRandomQuestions } from '../../data/quiz/questions';
import { withRetry, getErrorMessage } from '../../utils/networkUtils';

const QUIZ_COUPLE_GAMES_COLLECTION = 'quiz_couple_games';

export class QuizCoupleService {
  /**
   * Générer un code de room unique (6 caractères)
   */
  static generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Vérifier si un code de room est déjà utilisé
   */
  static async isRoomCodeTaken(roomCode: string): Promise<boolean> {
    try {
      const snapshot = await firestore()
        .collection(QUIZ_COUPLE_GAMES_COLLECTION)
        .where('roomCode', '==', roomCode)
        .where('status', 'in', ['waiting', 'playing']) // Seulement les parties actives
        .limit(1)
        .get();

      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking room code:', error);
      return false; // En cas d'erreur, on considère que le code n'est pas pris
    }
  }

  /**
   * Générer un code de room unique en vérifiant qu'il n'existe pas déjà
   */
  static async generateUniqueRoomCode(maxAttempts: number = 5): Promise<string> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const code = this.generateRoomCode();
      const isTaken = await this.isRoomCodeTaken(code);

      if (!isTaken) {
        return code;
      }

      console.warn(`Room code ${code} already exists, generating a new one (attempt ${attempt + 1}/${maxAttempts})`);
    }

    // Si après plusieurs tentatives on n'a pas trouvé de code unique,
    // on retourne quand même un code (la probabilité de collision est très faible)
    return this.generateRoomCode();
  }

  /**
   * Créer une nouvelle partie de quiz couple
   */
  static async createQuizGame(
    hostProfile: PlayerProfile,
    gameMode: QuizGameMode = 'competitive',
    difficulty?: 'facile' | 'moyen' | 'difficile'
  ): Promise<string> {
    return withRetry(async () => {
      const roomCode = await this.generateUniqueRoomCode();

      // Sélectionner 10 questions aléatoires
      const questions = getRandomQuestions(10);

      // Nettoyer le profil pour éviter les valeurs undefined
      const cleanProfile = {
        ...hostProfile,
        photoURL: hostProfile.photoURL || null,
      };

      const hostPlayer: QuizPlayer = {
        id: cleanProfile.id,
        profile: cleanProfile,
        isReady: false,
        score: 0,
        answers: [],
        hasAnsweredCurrent: false,
        correctAnswersCount: 0,
        averageTime: 0,
      };

      const gameData: Omit<QuizGame, 'id'> = {
        roomCode,
        hostId: hostProfile.id,
        gameMode,
        players: [hostPlayer],
        maxPlayers: 2,
        status: 'waiting',
        currentQuestionIndex: 0,
        questions,
        totalQuestions: 10,
        timePerQuestion: 15,
        winnerId: null,
        createdAt: Date.now(),
        startedAt: null,
        completedAt: null,
        updatedAt: Date.now(),
      };

      const docRef = await firestore()
        .collection(QUIZ_COUPLE_GAMES_COLLECTION)
        .add(gameData);

      console.log('Quiz game created:', {
        gameId: docRef.id,
        roomCode,
        questionsCount: questions.length,
      });

      return docRef.id;
    }, { maxRetries: 3 }, 'createQuizGame');
  }

  /**
   * Rejoindre une partie via le code room
   */
  static async joinGameByCode(
    roomCode: string,
    playerProfile: PlayerProfile
  ): Promise<string> {
    const snapshot = await firestore()
      .collection(QUIZ_COUPLE_GAMES_COLLECTION)
      .where('roomCode', '==', roomCode)
      .where('status', '==', 'waiting')
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new Error('Partie non trouvée ou déjà commencée');
    }

    const gameDoc = snapshot.docs[0];
    const game = { id: gameDoc.id, ...gameDoc.data() } as QuizGame;

    // Vérifier qu'il n'y a qu'un seul joueur
    if (game.players.length >= 2) {
      throw new Error('La partie est complète (2 joueurs maximum)');
    }

    // Vérifier que le joueur n'est pas déjà dans la partie
    if (game.players.some(p => p.id === playerProfile.id)) {
      throw new Error('Vous êtes déjà dans cette partie');
    }

    // Nettoyer le profil pour éviter les valeurs undefined
    const cleanProfile = {
      ...playerProfile,
      photoURL: playerProfile.photoURL || null,
    };

    const newPlayer: QuizPlayer = {
      id: cleanProfile.id,
      profile: cleanProfile,
      isReady: false,
      score: 0,
      answers: [],
      hasAnsweredCurrent: false,
      correctAnswersCount: 0,
      averageTime: 0,
    };

    await gameDoc.ref.update({
      players: firestore.FieldValue.arrayUnion(newPlayer),
      updatedAt: Date.now(),
    });

    console.log('Player joined game:', {
      gameId: gameDoc.id,
      playerId: playerProfile.id,
      playerName: playerProfile.name,
    });

    return gameDoc.id;
  }

  /**
   * Définir le statut ready d'un joueur
   */
  static async setPlayerReady(
    gameId: string,
    playerId: string,
    isReady: boolean
  ): Promise<void> {
    const gameRef = firestore().collection(QUIZ_COUPLE_GAMES_COLLECTION).doc(gameId);
    const gameDoc = await gameRef.get();

    if (!gameDoc.exists) {
      throw new Error('Partie non trouvée');
    }

    const game = { id: gameDoc.id, ...gameDoc.data() } as QuizGame;
    const updatedPlayers = game.players.map(p =>
      p.id === playerId ? { ...p, isReady } : p
    );

    await gameRef.update({
      players: updatedPlayers,
      updatedAt: Date.now(),
    });

    console.log('Player ready status updated:', {
      gameId,
      playerId,
      isReady,
    });
  }

  /**
   * Démarrer la partie (hôte seulement)
   */
  static async startGame(gameId: string, hostId: string): Promise<void> {
    const gameRef = firestore().collection(QUIZ_COUPLE_GAMES_COLLECTION).doc(gameId);
    const gameDoc = await gameRef.get();

    if (!gameDoc.exists) {
      throw new Error('Partie non trouvée');
    }

    const game = { id: gameDoc.id, ...gameDoc.data() } as QuizGame;

    if (!game.players || !Array.isArray(game.players)) {
      throw new Error('Données de joueurs invalides');
    }

    if (game.hostId !== hostId) {
      throw new Error('Seul l\'hôte peut démarrer la partie');
    }

    if (game.players.length !== 2) {
      throw new Error('Exactement 2 joueurs sont nécessaires');
    }

    if (!game.players.every(p => p.isReady)) {
      throw new Error('Tous les joueurs doivent être prêts');
    }

    // Préparer les questions de prédiction si mode prédiction
    const updateData: any = {
      status: 'playing',
      startedAt: Date.now(),
      currentQuestionIndex: 0,
      updatedAt: Date.now(),
    };

    if (game.gameMode === 'prediction') {
      const predictionQuestions = this.preparePredictionQuestions(game);
      updateData.predictionQuestions = predictionQuestions;
    } else if (game.gameMode === 'custom') {
      // Initialiser le mode custom avec un tableau vide de questions
      updateData.customQuestions = [];
    }

    await gameRef.update(updateData);

    console.log('Quiz game started:', { gameId, gameMode: game.gameMode });
  }

  /**
   * Soumettre une réponse en mode compétitif
   * En mode compétitif, les joueurs gagnent des points quand leurs réponses correspondent (compatibilité)
   */
  static async submitAnswer(
    gameId: string,
    playerId: string,
    questionIndex: number,
    answerId: string,
    timeSpent: number
  ): Promise<void> {
    return withRetry(async () => {
      const gameRef = firestore().collection(QUIZ_COUPLE_GAMES_COLLECTION).doc(gameId);
      const gameDoc = await gameRef.get();

    if (!gameDoc.exists) {
      throw new Error('Partie non trouvée');
    }

    const game = { id: gameDoc.id, ...gameDoc.data() } as QuizGame;

    if (game.status !== 'playing') {
      throw new Error('La partie n\'est pas en cours');
    }

    const question = game.questions[questionIndex];
    if (!question) {
      throw new Error('Question non trouvée');
    }

    // En mode compétitif, on mesure la compatibilité des réponses
    const answer: QuizAnswer = {
      questionId: question.id,
      questionIndex,
      answerId,
      isCorrect: false, // Sera calculé après que les deux aient répondu
      timeSpent,
      points: 0, // Sera calculé après que les deux aient répondu
      timestamp: Date.now(),
    };

    // Mettre à jour le joueur
    const updatedPlayers = game.players.map(p => {
      if (p.id === playerId) {
        const newAnswers = [...p.answers, answer];
        const totalTime = newAnswers.reduce((sum, a) => sum + a.timeSpent, 0);
        const avgTime = totalTime / newAnswers.length;

        return {
          ...p,
          answers: newAnswers,
          score: p.score, // Score sera mis à jour quand les deux auront répondu
          hasAnsweredCurrent: true,
          correctAnswersCount: p.correctAnswersCount,
          averageTime: avgTime,
        };
      }
      return p;
    });

    // Vérifier si les deux joueurs ont répondu
    const bothAnswered = updatedPlayers.every(p => p.hasAnsweredCurrent);

    if (bothAnswered) {
      // Calculer la compatibilité et les points
      const player1 = updatedPlayers[0];
      const player2 = updatedPlayers[1];

      const player1Answer = player1.answers[questionIndex];
      const player2Answer = player2.answers[questionIndex];

      if (player1Answer && player2Answer) {
        // Vérifier si les réponses correspondent (compatibilité)
        const sameAnswer = player1Answer.answerId === player2Answer.answerId;

        if (sameAnswer) {
          // Points basés sur la difficulté de la question
          const basePoints = question.points;

          // Bonus de temps (répondre rapidement montre une forte conviction)
          const player1TimeBonus = Math.max(0, 1 - (player1Answer.timeSpent / game.timePerQuestion));
          const player2TimeBonus = Math.max(0, 1 - (player2Answer.timeSpent / game.timePerQuestion));

          const player1Points = Math.round(basePoints * (1 + player1TimeBonus * 0.5));
          const player2Points = Math.round(basePoints * (1 + player2TimeBonus * 0.5));

          // Mettre à jour les points - isCorrect = compatibilité des réponses
          updatedPlayers[0].answers[questionIndex].isCorrect = true;
          updatedPlayers[0].answers[questionIndex].points = player1Points;
          updatedPlayers[0].score += player1Points;
          updatedPlayers[0].correctAnswersCount += 1;

          updatedPlayers[1].answers[questionIndex].isCorrect = true;
          updatedPlayers[1].answers[questionIndex].points = player2Points;
          updatedPlayers[1].score += player2Points;
          updatedPlayers[1].correctAnswersCount += 1;
        }
      }
    }

    await gameRef.update({
      players: updatedPlayers,
      updatedAt: Date.now(),
    });

    console.log('Answer submitted:', {
      gameId,
      playerId,
      questionIndex,
      answerId,
      timeSpent,
      bothAnswered,
    });
    }, { maxRetries: 2 }, 'submitAnswer');
  }

  /**
   * Passer à la question suivante
   */
  static async nextQuestion(gameId: string): Promise<void> {
    const gameRef = firestore().collection(QUIZ_COUPLE_GAMES_COLLECTION).doc(gameId);
    const gameDoc = await gameRef.get();

    if (!gameDoc.exists) {
      throw new Error('Partie non trouvée');
    }

    const game = { id: gameDoc.id, ...gameDoc.data() } as QuizGame;

    const nextIndex = game.currentQuestionIndex + 1;

    // Si c'était la dernière question, finir le jeu
    if (nextIndex >= game.totalQuestions) {
      await this.finishGame(gameId);
      return;
    }

    // Reset hasAnsweredCurrent pour tous les joueurs
    const updatedPlayers = game.players.map(p => ({
      ...p,
      hasAnsweredCurrent: false,
    }));

    await gameRef.update({
      currentQuestionIndex: nextIndex,
      players: updatedPlayers,
      updatedAt: Date.now(),
    });

    console.log('Next question:', {
      gameId,
      questionIndex: nextIndex,
    });
  }

  /**
   * Finir la partie et déterminer le gagnant
   */
  static async finishGame(gameId: string): Promise<void> {
    const gameRef = firestore().collection(QUIZ_COUPLE_GAMES_COLLECTION).doc(gameId);
    const gameDoc = await gameRef.get();

    if (!gameDoc.exists) {
      throw new Error('Partie non trouvée');
    }

    const game = { id: gameDoc.id, ...gameDoc.data() } as QuizGame;

    // Déterminer le gagnant (score le plus élevé)
    const sortedPlayers = [...game.players].sort((a, b) => b.score - a.score);
    const winnerId = sortedPlayers[0].id;

    await gameRef.update({
      status: 'finished',
      winnerId,
      completedAt: Date.now(),
      updatedAt: Date.now(),
    });

    console.log('Quiz game finished:', {
      gameId,
      winnerId,
      scores: sortedPlayers.map(p => ({ id: p.id, score: p.score })),
    });
  }

  /**
   * Quitter la partie
   */
  static async leaveGame(gameId: string, playerId: string): Promise<void> {
    const gameRef = firestore().collection(QUIZ_COUPLE_GAMES_COLLECTION).doc(gameId);
    const gameDoc = await gameRef.get();

    if (!gameDoc.exists) {
      return;
    }

    const game = { id: gameDoc.id, ...gameDoc.data() } as QuizGame;
    const updatedPlayers = game.players.filter(p => p.id !== playerId);

    if (updatedPlayers.length === 0) {
      // Supprimer la partie si plus de joueurs
      await gameRef.delete();
      console.log('Quiz game deleted (no players left):', { gameId });
    } else {
      // Si l'hôte quitte, assigner un nouvel hôte
      const newHostId = game.hostId === playerId ? updatedPlayers[0].id : game.hostId;

      await gameRef.update({
        players: updatedPlayers,
        hostId: newHostId,
        updatedAt: Date.now(),
      });

      console.log('Player left game:', {
        gameId,
        playerId,
        newHostId: newHostId !== game.hostId ? newHostId : undefined,
      });
    }
  }

  /**
   * S'abonner aux changements de la partie
   */
  static subscribeToGame(
    gameId: string,
    onUpdate: (game: QuizGame) => void,
    onError?: (error: Error) => void
  ): () => void {
    return firestore()
      .collection(QUIZ_COUPLE_GAMES_COLLECTION)
      .doc(gameId)
      .onSnapshot(
        (snapshot) => {
          if (snapshot.exists) {
            const game = { id: snapshot.id, ...snapshot.data() } as QuizGame;
            onUpdate(game);
          }
        },
        (error) => {
          console.error('Error subscribing to quiz game:', error);
          if (onError) {
            onError(error);
          }
        }
      );
  }

  /**
   * Vérifier si les deux joueurs ont répondu à la question actuelle
   */
  static haveBothPlayersAnswered(game: QuizGame): boolean {
    return game.players.every(p => p.hasAnsweredCurrent);
  }

  /**
   * Obtenir les statistiques d'un joueur dans la partie
   */
  static getPlayerStats(game: QuizGame, playerId: string) {
    const player = game.players.find(p => p.id === playerId);
    if (!player) return null;

    // Trouver la meilleure catégorie
    const categoryScores: Record<string, { correct: number; total: number }> = {};

    player.answers.forEach((answer, index) => {
      const question = game.questions[index];
      if (question) {
        if (!categoryScores[question.categoryId]) {
          categoryScores[question.categoryId] = { correct: 0, total: 0 };
        }
        categoryScores[question.categoryId].total++;
        if (answer.isCorrect) {
          categoryScores[question.categoryId].correct++;
        }
      }
    });

    let bestCategory = '';
    let bestScore = 0;
    Object.entries(categoryScores).forEach(([category, stats]) => {
      const score = stats.total > 0 ? stats.correct / stats.total : 0;
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
      }
    });

    return {
      score: player.score,
      correctAnswers: player.correctAnswersCount,
      averageTime: player.averageTime,
      bestCategory,
      answers: player.answers,
    };
  }

  /**
   * Préparer les questions pour le mode prédiction
   * Alterner : Q1 pour joueur1 (joueur2 devine), Q2 pour joueur2 (joueur1 devine), etc.
   */
  static preparePredictionQuestions(
    game: QuizGame
  ): PredictionQuestion[] {
    if (!game.players || !Array.isArray(game.players) || game.players.length !== 2) {
      throw new Error('Le mode prédiction nécessite exactement 2 joueurs');
    }

    const player1 = game.players[0];
    const player2 = game.players[1];

    if (!player1 || !player2) {
      throw new Error('Joueurs invalides');
    }

    const predictionQuestions: PredictionQuestion[] = [];

    game.questions.forEach((question, index) => {
      // Questions paires pour player1, impaires pour player2
      const answeringPlayer = index % 2 === 0 ? player1 : player2;
      const predictingPlayer = index % 2 === 0 ? player2 : player1;

      predictionQuestions.push({
        originalQuestion: question,
        predictionText: `Qu'a répondu ${answeringPlayer.profile.name} ?`,
        targetPlayerId: predictingPlayer.id,
        answeringPlayerId: answeringPlayer.id,
        partnerAnswer: null,
      });
    });

    return predictionQuestions;
  }

  /**
   * Soumettre une réponse en mode prédiction (première étape : le joueur répond à sa question)
   */
  static async submitPredictionAnswer(
    gameId: string,
    playerId: string,
    questionIndex: number,
    answerId: string
  ): Promise<void> {
    const gameRef = firestore().collection(QUIZ_COUPLE_GAMES_COLLECTION).doc(gameId);
    const gameDoc = await gameRef.get();

    if (!gameDoc.exists) {
      throw new Error('Partie non trouvée');
    }

    const game = { id: gameDoc.id, ...gameDoc.data() } as QuizGame;

    if (game.gameMode !== 'prediction') {
      throw new Error('Cette méthode est réservée au mode prédiction');
    }

    if (!game.predictionQuestions) {
      throw new Error('Questions de prédiction non initialisées');
    }

    const predictionQuestion = game.predictionQuestions[questionIndex];

    if (predictionQuestion.answeringPlayerId !== playerId) {
      throw new Error('Ce n\'est pas votre tour de répondre');
    }

    // Enregistrer la réponse du partenaire
    const updatedPredictionQuestions = game.predictionQuestions.map((pq, idx) =>
      idx === questionIndex ? { ...pq, partnerAnswer: answerId } : pq
    );

    // Trouver le joueur qui a répondu pour obtenir son nom
    const answeringPlayer = game.players.find(p => p.id === playerId);
    const playerName = answeringPlayer?.profile.name || 'Votre partenaire';

    // Créer une notification pour le joueur qui doit deviner
    const notification = {
      type: 'partner_answered',
      message: `${playerName} a répondu ! C'est à vous de deviner 🔮`,
      timestamp: Date.now(),
      questionIndex,
    };

    await gameRef.update({
      predictionQuestions: updatedPredictionQuestions,
      lastNotification: notification,
      updatedAt: Date.now(),
    });

    console.log('Prediction answer submitted:', {
      gameId,
      playerId,
      questionIndex,
      answerId,
      notificationSent: true,
    });
  }

  /**
   * Soumettre une prédiction (deuxième étape : l'autre joueur devine la réponse)
   */
  static async submitPrediction(
    gameId: string,
    playerId: string,
    questionIndex: number,
    predictedAnswerId: string,
    timeSpent: number
  ): Promise<boolean> {
    const gameRef = firestore().collection(QUIZ_COUPLE_GAMES_COLLECTION).doc(gameId);
    const gameDoc = await gameRef.get();

    if (!gameDoc.exists) {
      throw new Error('Partie non trouvée');
    }

    const game = { id: gameDoc.id, ...gameDoc.data() } as QuizGame;

    if (game.gameMode !== 'prediction') {
      throw new Error('Cette méthode est réservée au mode prédiction');
    }

    if (!game.predictionQuestions) {
      throw new Error('Questions de prédiction non initialisées');
    }

    const predictionQuestion = game.predictionQuestions[questionIndex];

    if (predictionQuestion.targetPlayerId !== playerId) {
      throw new Error('Ce n\'est pas votre tour de deviner');
    }

    if (!predictionQuestion.partnerAnswer) {
      throw new Error('Le partenaire n\'a pas encore répondu');
    }

    // Vérifier si la prédiction est correcte
    const isCorrect = predictionQuestion.partnerAnswer === predictedAnswerId;

    // Calculer les points
    let points = 0;
    if (isCorrect) {
      const basePoints = predictionQuestion.originalQuestion.points;
      const timeRatio = timeSpent / game.timePerQuestion;

      // Bonus de vitesse
      let speedBonus = 0;
      if (timeRatio <= 0.33) {
        speedBonus = 0.5;
      } else if (timeRatio <= 0.66) {
        speedBonus = 0.25;
      }

      points = Math.round(basePoints * (1 + speedBonus));
    }

    const answer: QuizAnswer = {
      questionId: predictionQuestion.originalQuestion.id,
      questionIndex,
      answerId: predictedAnswerId,
      isCorrect,
      timeSpent,
      points,
      timestamp: Date.now(),
    };

    // Mettre à jour le joueur qui a deviné
    const updatedPlayers = game.players.map(p => {
      if (p.id === playerId) {
        const newAnswers = [...p.answers, answer];
        const correctAnswers = newAnswers.filter(a => a.isCorrect).length;
        const totalTime = newAnswers.reduce((sum, a) => sum + a.timeSpent, 0);
        const avgTime = totalTime / newAnswers.length;

        return {
          ...p,
          answers: newAnswers,
          score: p.score + points,
          hasAnsweredCurrent: true,
          correctAnswersCount: correctAnswers,
          averageTime: avgTime,
        };
      }
      return p;
    });

    await gameRef.update({
      players: updatedPlayers,
      updatedAt: Date.now(),
    });

    console.log('Prediction submitted:', {
      gameId,
      playerId,
      questionIndex,
      isCorrect,
      points,
    });

    return isCorrect;
  }

  /**
   * Calculer le score de compatibilité entre deux joueurs
   */
  static calculateCompatibilityScore(game: QuizGame): number {
    if (!game.players || game.players.length !== 2) {
      return 0;
    }

    const player1 = game.players[0];
    const player2 = game.players[1];

    if (!player1.answers || !player2.answers) {
      return 0;
    }

    const totalQuestions = Math.min(player1.answers.length, player2.answers.length);
    if (totalQuestions === 0) {
      return 0;
    }

    let matchingAnswers = 0;

    for (let i = 0; i < totalQuestions; i++) {
      const answer1 = player1.answers[i];
      const answer2 = player2.answers[i];

      if (answer1 && answer2 && answer1.answerId === answer2.answerId) {
        matchingAnswers++;
      }
    }

    const compatibilityPercentage = Math.round((matchingAnswers / totalQuestions) * 100);
    return compatibilityPercentage;
  }

  /**
   * Obtenir des statistiques détaillées du jeu
   */
  static getGameStatistics(game: QuizGame) {
    if (!game.players || game.players.length !== 2) {
      return null;
    }

    const player1 = game.players[0];
    const player2 = game.players[1];

    const compatibilityScore = this.calculateCompatibilityScore(game);

    // Trouver les catégories où ils sont compatibles
    const categoryCompatibility: Record<string, { matching: number; total: number }> = {};

    const totalQuestions = Math.min(player1.answers?.length || 0, player2.answers?.length || 0);

    for (let i = 0; i < totalQuestions; i++) {
      const answer1 = player1.answers?.[i];
      const answer2 = player2.answers?.[i];
      const question = game.questions[i];

      if (question && answer1 && answer2) {
        const categoryId = question.categoryId;

        if (!categoryCompatibility[categoryId]) {
          categoryCompatibility[categoryId] = { matching: 0, total: 0 };
        }

        categoryCompatibility[categoryId].total++;

        if (answer1.answerId === answer2.answerId) {
          categoryCompatibility[categoryId].matching++;
        }
      }
    }

    // Calculer le pourcentage de compatibilité par catégorie
    const categoryPercentages: Record<string, number> = {};
    Object.entries(categoryCompatibility).forEach(([categoryId, stats]) => {
      categoryPercentages[categoryId] = Math.round((stats.matching / stats.total) * 100);
    });

    // Trouver la meilleure et la pire catégorie
    let bestCategory = '';
    let bestScore = 0;
    let worstCategory = '';
    let worstScore = 100;

    Object.entries(categoryPercentages).forEach(([categoryId, score]) => {
      if (score > bestScore) {
        bestScore = score;
        bestCategory = categoryId;
      }
      if (score < worstScore) {
        worstScore = score;
        worstCategory = categoryId;
      }
    });

    return {
      compatibilityScore,
      totalQuestions,
      categoryCompatibility: categoryPercentages,
      bestCategory,
      bestCategoryScore: bestScore,
      worstCategory,
      worstCategoryScore: worstScore,
      player1Stats: {
        score: player1.score,
        correctAnswers: player1.correctAnswersCount,
        averageTime: player1.averageTime,
      },
      player2Stats: {
        score: player2.score,
        correctAnswers: player2.correctAnswersCount,
        averageTime: player2.averageTime,
      },
    };
  }

  /**
   * MODE CUSTOM - Poser une question personnalisée
   */
  static async askCustomQuestion(
    gameId: string,
    playerId: string,
    questionText: string
  ): Promise<void> {
    const gameRef = firestore().collection(QUIZ_COUPLE_GAMES_COLLECTION).doc(gameId);
    const gameDoc = await gameRef.get();

    if (!gameDoc.exists) {
      throw new Error('Partie non trouvée');
    }

    const game = { id: gameDoc.id, ...gameDoc.data() } as QuizGame;

    if (game.gameMode !== 'custom') {
      throw new Error('Cette méthode est réservée au mode custom');
    }

    if (game.status !== 'playing') {
      throw new Error('La partie n\'est pas en cours');
    }

    // Trouver l'autre joueur
    const otherPlayer = game.players.find(p => p.id !== playerId);
    if (!otherPlayer) {
      throw new Error('Joueur adverse non trouvé');
    }

    const customQuestion: CustomQuestion = {
      id: `custom_${Date.now()}_${Math.random()}`,
      text: questionText,
      askedBy: playerId,
      answeredBy: otherPlayer.id,
      textAnswer: null,
      judgment: null,
      points: 0,
      timestamp: Date.now(),
    };

    // Ajouter la question aux customQuestions
    const currentCustomQuestions = game.customQuestions || [];
    const updatedCustomQuestions = [...currentCustomQuestions, customQuestion];

    await gameRef.update({
      customQuestions: updatedCustomQuestions,
      updatedAt: Date.now(),
    });

    console.log('Custom question asked:', {
      gameId,
      playerId,
      questionText,
    });
  }

  /**
   * MODE CUSTOM - Répondre à une question personnalisée
   */
  static async answerCustomQuestion(
    gameId: string,
    playerId: string,
    questionId: string,
    textAnswer: string
  ): Promise<void> {
    const gameRef = firestore().collection(QUIZ_COUPLE_GAMES_COLLECTION).doc(gameId);
    const gameDoc = await gameRef.get();

    if (!gameDoc.exists) {
      throw new Error('Partie non trouvée');
    }

    const game = { id: gameDoc.id, ...gameDoc.data() } as QuizGame;

    if (game.gameMode !== 'custom') {
      throw new Error('Cette méthode est réservée au mode custom');
    }

    if (!game.customQuestions) {
      throw new Error('Aucune question personnalisée trouvée');
    }

    // Trouver la question
    const questionIndex = game.customQuestions.findIndex(q => q.id === questionId);
    if (questionIndex === -1) {
      throw new Error('Question non trouvée');
    }

    const question = game.customQuestions[questionIndex];

    if (question.answeredBy !== playerId) {
      throw new Error('Ce n\'est pas votre question à répondre');
    }

    if (question.textAnswer !== null) {
      throw new Error('Vous avez déjà répondu à cette question');
    }

    // Mettre à jour la réponse
    const updatedCustomQuestions = [...game.customQuestions];
    updatedCustomQuestions[questionIndex] = {
      ...question,
      textAnswer,
    };

    await gameRef.update({
      customQuestions: updatedCustomQuestions,
      updatedAt: Date.now(),
    });

    console.log('Custom question answered:', {
      gameId,
      playerId,
      questionId,
      textAnswer,
    });
  }

  /**
   * MODE CUSTOM - Juger une réponse
   */
  static async judgeCustomAnswer(
    gameId: string,
    playerId: string,
    questionId: string,
    judgment: 'correct' | 'incorrect' | 'almost'
  ): Promise<void> {
    const gameRef = firestore().collection(QUIZ_COUPLE_GAMES_COLLECTION).doc(gameId);
    const gameDoc = await gameRef.get();

    if (!gameDoc.exists) {
      throw new Error('Partie non trouvée');
    }

    const game = { id: gameDoc.id, ...gameDoc.data() } as QuizGame;

    if (game.gameMode !== 'custom') {
      throw new Error('Cette méthode est réservée au mode custom');
    }

    if (!game.customQuestions) {
      throw new Error('Aucune question personnalisée trouvée');
    }

    // Trouver la question
    const questionIndex = game.customQuestions.findIndex(q => q.id === questionId);
    if (questionIndex === -1) {
      throw new Error('Question non trouvée');
    }

    const question = game.customQuestions[questionIndex];

    if (question.askedBy !== playerId) {
      throw new Error('Vous ne pouvez juger que vos propres questions');
    }

    if (question.textAnswer === null) {
      throw new Error('Le joueur n\'a pas encore répondu');
    }

    if (question.judgment !== null) {
      throw new Error('Cette réponse a déjà été jugée');
    }

    // Calculer les points selon le jugement
    let points = 0;
    if (judgment === 'correct') {
      points = 10;
    } else if (judgment === 'almost') {
      points = 5;
    } else {
      points = 0;
    }

    // Mettre à jour le jugement et les points
    const updatedCustomQuestions = [...game.customQuestions];
    updatedCustomQuestions[questionIndex] = {
      ...question,
      judgment,
      points,
    };

    // Mettre à jour le score du joueur qui a répondu
    const updatedPlayers = game.players.map(p => {
      if (p.id === question.answeredBy) {
        return {
          ...p,
          score: p.score + points,
          correctAnswersCount: judgment === 'correct' ? p.correctAnswersCount + 1 : p.correctAnswersCount,
        };
      }
      return p;
    });

    // Créer une notification pour le joueur qui a répondu
    const notification = {
      type: 'judgment',
      judgment,
      points,
      question: question.text,
      timestamp: Date.now(),
      read: false,
    };

    await gameRef.update({
      customQuestions: updatedCustomQuestions,
      players: updatedPlayers,
      lastNotification: notification, // Notification pour le joueur qui a répondu
      updatedAt: Date.now(),
    });

    console.log('Custom answer judged:', {
      gameId,
      playerId,
      questionId,
      judgment,
      points,
    });
  }

  /**
   * MODE CUSTOM - Initialiser le mode custom au démarrage
   */
  static async initializeCustomMode(gameId: string): Promise<void> {
    const gameRef = firestore().collection(QUIZ_COUPLE_GAMES_COLLECTION).doc(gameId);

    await gameRef.update({
      customQuestions: [],
      updatedAt: Date.now(),
    });

    console.log('Custom mode initialized:', { gameId });
  }
}
