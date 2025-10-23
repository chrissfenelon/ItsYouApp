import firestore from '@react-native-firebase/firestore';
import {
  DominosGame,
  DominosPlayer,
  DominoTile,
  TilePlacement,
} from '../../types/dominos.types';
import { PlayerProfile } from '../../types/wordSearch.types';
import {
  initializeDeck,
  distributeTiles,
  canPlaceTile,
  getConnectingValue,
  getAllPossibleMoves,
  calculateScore,
  isGameBlocked,
  getWinnerByScore,
  determineStartingPlayer,
} from '../../utils/dominosLogic';

const DOMINOS_GAMES_COLLECTION = 'dominos_games';

export class DominosService {
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
   * Créer une nouvelle partie
   */
  static async createGame(hostProfile: PlayerProfile): Promise<string> {
    console.log('Creating dominos game for host:', hostProfile);
    const roomCode = this.generateRoomCode();
    console.log('Generated room code:', roomCode);
    const deck = initializeDeck();
    const { player1Hand, drawPile } = distributeTiles(deck);

    const hostPlayer: DominosPlayer = {
      id: hostProfile.id,
      profile: hostProfile,
      hand: player1Hand,
      tilesCount: 7,
      hasDrawn: false,
      hasPassed: false,
      score: 0,
      isReady: false,
    };

    const gameData: Omit<DominosGame, 'id'> = {
      roomCode: roomCode,
      hostId: hostProfile.id,
      players: [hostPlayer],
      maxPlayers: 2,
      status: 'waiting' as const,
      currentPlayerId: '',
      board: [],
      drawPile: drawPile,
      drawPileCount: drawPile.length,
      leftEnd: null,
      rightEnd: null,
      isBlocked: false,
      winnerId: null,
      winReason: null,
      createdAt: Date.now(),
      startedAt: null,
      completedAt: null,
      updatedAt: Date.now(),
    };

    // Verify no undefined values
    Object.keys(gameData).forEach(key => {
      if ((gameData as any)[key] === undefined) {
        console.error(`Field ${key} is undefined!`);
      }
    });

    try {
      console.log('Attempting to add game to Firestore...');
      console.log('Game data:', JSON.stringify(gameData, null, 2));
      const docRef = await firestore()
        .collection(DOMINOS_GAMES_COLLECTION)
        .add(gameData);

      console.log('Dominos game created successfully:', {
        gameId: docRef.id,
        roomCode,
      });

      return docRef.id;
    } catch (error) {
      console.error('Error adding game to Firestore:', error);
      throw error;
    }
  }

  /**
   * Rejoindre une partie via le code
   */
  static async joinGameByCode(
    roomCode: string,
    playerProfile: PlayerProfile
  ): Promise<string> {
    console.log('Attempting to join game with code:', roomCode);
    const snapshot = await firestore()
      .collection(DOMINOS_GAMES_COLLECTION)
      .where('roomCode', '==', roomCode)
      .where('status', '==', 'waiting')
      .limit(1)
      .get();

    console.log('Games found with this code:', snapshot.size);
    if (snapshot.empty) {
      // Check if game exists with different status
      const allGamesSnapshot = await firestore()
        .collection(DOMINOS_GAMES_COLLECTION)
        .where('roomCode', '==', roomCode)
        .limit(1)
        .get();

      if (allGamesSnapshot.empty) {
        console.log('No game found with this code at all');
        throw new Error('Partie non trouvée');
      } else {
        const gameData = allGamesSnapshot.docs[0].data();
        console.log('Game exists but status is:', gameData.status);
        throw new Error('Partie déjà commencée ou terminée');
      }
    }

    const gameDoc = snapshot.docs[0];
    const game = { id: gameDoc.id, ...gameDoc.data() } as DominosGame;
    console.log('Game found:', { id: game.id, players: game.players.length, status: game.status });

    if (game.players.length >= 2) {
      console.log('Game is already full');
      throw new Error('La partie est complète (2 joueurs maximum)');
    }

    if (game.players.some((p) => p.id === playerProfile.id)) {
      console.log('Player already in game');
      throw new Error('Vous êtes déjà dans cette partie');
    }

    // Distribuer les tuiles pour le 2ème joueur depuis la pioche existante
    const drawPile = game.drawPile || [];
    if (drawPile.length < 7) {
      throw new Error('Pas assez de tuiles dans la pioche');
    }

    // Prendre 7 tuiles de la pioche pour le joueur 2
    const player2Hand = drawPile.slice(0, 7);
    const updatedDrawPile = drawPile.slice(7);

    const newPlayer: DominosPlayer = {
      id: playerProfile.id,
      profile: playerProfile,
      hand: player2Hand,
      tilesCount: 7,
      hasDrawn: false,
      hasPassed: false,
      score: 0,
      isReady: false,
    };

    await gameDoc.ref.update({
      players: firestore.FieldValue.arrayUnion(newPlayer),
      drawPile: updatedDrawPile,
      drawPileCount: updatedDrawPile.length,
      updatedAt: Date.now(),
    });

    console.log('Player joined dominos game:', {
      gameId: gameDoc.id,
      playerId: playerProfile.id,
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
    const gameRef = firestore().collection(DOMINOS_GAMES_COLLECTION).doc(gameId);
    const gameDoc = await gameRef.get();

    if (!gameDoc.exists) {
      throw new Error('Partie non trouvée');
    }

    const game = { id: gameDoc.id, ...gameDoc.data() } as DominosGame;
    const updatedPlayers = game.players.map((p) =>
      p.id === playerId ? { ...p, isReady } : p
    );

    await gameRef.update({
      players: updatedPlayers,
      updatedAt: Date.now(),
    });

    console.log('Player ready status updated:', { gameId, playerId, isReady });
  }

  /**
   * Démarrer la partie (hôte seulement)
   */
  static async startGame(gameId: string, hostId: string): Promise<void> {
    const gameRef = firestore().collection(DOMINOS_GAMES_COLLECTION).doc(gameId);
    const gameDoc = await gameRef.get();

    if (!gameDoc.exists) {
      throw new Error('Partie non trouvée');
    }

    const game = { id: gameDoc.id, ...gameDoc.data() } as DominosGame;

    if (game.hostId !== hostId) {
      throw new Error("Seul l'hôte peut démarrer la partie");
    }

    if (game.players.length !== 2) {
      throw new Error('Exactement 2 joueurs sont nécessaires');
    }

    if (!game.players.every((p) => p.isReady)) {
      throw new Error('Tous les joueurs doivent être prêts');
    }

    // Déterminer qui commence (joueur avec le double le plus haut)
    const { startingPlayerId, highestDouble } = determineStartingPlayer(game.players);

    // Si un joueur a un double, on place automatiquement le plus haut au centre
    let updatedBoard = game.board;
    let updatedPlayers = game.players;
    let leftEnd = null;
    let rightEnd = null;

    if (highestDouble) {
      // Placer le double le plus haut automatiquement
      const startingPlayer = game.players.find(p => p.id === startingPlayerId);
      if (startingPlayer) {
        // Retirer le double de la main du joueur
        const updatedHand = startingPlayer.hand.filter(t => t.id !== highestDouble.id);

        updatedPlayers = game.players.map(p =>
          p.id === startingPlayerId
            ? { ...p, hand: updatedHand, tilesCount: updatedHand.length }
            : p
        );

        // Placer le double au centre
        updatedBoard = [{
          tile: highestDouble,
          side: 'left',
          reversed: false,
        }];

        // Les deux extrémités sont la valeur du double
        leftEnd = highestDouble.left;
        rightEnd = highestDouble.right;

        console.log('Auto-placed highest double:', highestDouble, 'by player:', startingPlayerId);
      }
    }

    // Le prochain joueur sera l'autre joueur
    const nextPlayerId = game.players.find(p => p.id !== startingPlayerId)?.id || game.players[0].id;

    await gameRef.update({
      status: 'playing',
      startedAt: Date.now(),
      currentPlayerId: nextPlayerId, // Next player starts since first tile is placed
      board: updatedBoard,
      players: updatedPlayers,
      leftEnd,
      rightEnd,
      updatedAt: Date.now(),
    });

    console.log('Dominos game started:', {
      gameId,
      startingPlayerId,
      highestDouble,
      nextPlayerId,
      firstTilePlaced: !!highestDouble
    });
  }

  /**
   * Placer une tuile sur le plateau
   */
  static async placeTile(
    gameId: string,
    playerId: string,
    tileId: string,
    side: 'left' | 'right'
  ): Promise<void> {
    const gameRef = firestore().collection(DOMINOS_GAMES_COLLECTION).doc(gameId);
    const gameDoc = await gameRef.get();

    if (!gameDoc.exists) {
      throw new Error('Partie non trouvée');
    }

    const game = { id: gameDoc.id, ...gameDoc.data() } as DominosGame;

    if (game.status !== 'playing') {
      throw new Error("La partie n'est pas en cours");
    }

    if (game.currentPlayerId !== playerId) {
      throw new Error("Ce n'est pas votre tour");
    }

    // Trouver le joueur et la tuile
    const player = game.players.find((p) => p.id === playerId);
    if (!player) {
      throw new Error('Joueur non trouvé');
    }

    const tile = player.hand.find((t) => t.id === tileId);
    if (!tile) {
      throw new Error('Tuile non trouvée dans votre main');
    }

    // Vérifier si le coup est valide
    const { canPlaceLeft, canPlaceRight } = canPlaceTile(
      tile,
      game.leftEnd,
      game.rightEnd
    );

    if (side === 'left' && !canPlaceLeft) {
      throw new Error('Impossible de placer cette tuile à gauche');
    }

    if (side === 'right' && !canPlaceRight) {
      throw new Error('Impossible de placer cette tuile à droite');
    }

    // Déterminer la nouvelle orientation et les nouvelles extrémités
    let newLeftEnd = game.leftEnd;
    let newRightEnd = game.rightEnd;
    let orientation: 'horizontal' | 'vertical' = 'horizontal';

    if (game.board.length === 0) {
      // Premier coup
      newLeftEnd = tile.left;
      newRightEnd = tile.right;
      if (tile.isDouble) orientation = 'vertical';
    } else if (side === 'left') {
      newLeftEnd = getConnectingValue(tile, game.leftEnd!);
      if (tile.isDouble) orientation = 'vertical';
    } else {
      newRightEnd = getConnectingValue(tile, game.rightEnd!);
      if (tile.isDouble) orientation = 'vertical';
    }

    // Créer le placement
    const placement: TilePlacement = {
      tile: { ...tile, orientation },
      position: side === 'left' ? -game.board.length : game.board.length,
      side,
      timestamp: Date.now(),
      playerId,
    };

    // Retirer la tuile de la main du joueur
    const updatedHand = player.hand.filter((t) => t.id !== tileId);
    const updatedPlayers = game.players.map((p) =>
      p.id === playerId
        ? { ...p, hand: updatedHand, tilesCount: updatedHand.length, hasDrawn: false, hasPassed: false }
        : { ...p, hasDrawn: false, hasPassed: false }
    );

    // Vérifier si le joueur a gagné
    const hasWon = updatedHand.length === 0;
    let winnerId = game.winnerId;
    let winReason = game.winReason;
    let status = game.status;

    if (hasWon) {
      winnerId = playerId;
      winReason = 'emptied_hand';
      status = 'finished';
    }

    // Passer au joueur suivant
    const currentPlayerIndex = game.players.findIndex((p) => p.id === playerId);
    const nextPlayerId = game.players[(currentPlayerIndex + 1) % 2].id;

    // Vérifier si le jeu est bloqué
    if (!hasWon) {
      const player1 = updatedPlayers[0];
      const player2 = updatedPlayers[1];
      const blocked = isGameBlocked(
        player1.hand,
        player2.hand,
        newLeftEnd,
        newRightEnd,
        game.drawPileCount
      );

      if (blocked) {
        const winnerIndex = getWinnerByScore(player1.hand, player2.hand);
        if (winnerIndex >= 0) {
          winnerId = updatedPlayers[winnerIndex].id;
          winReason = 'lowest_score';
          status = 'finished';
        }
      }
    }

    await gameRef.update({
      players: updatedPlayers,
      board: [...game.board, placement],
      leftEnd: newLeftEnd,
      rightEnd: newRightEnd,
      currentPlayerId: hasWon ? playerId : nextPlayerId,
      winnerId,
      winReason,
      status,
      completedAt: status === 'finished' ? Date.now() : null,
      updatedAt: Date.now(),
    });

    console.log('Tile placed:', {
      gameId,
      playerId,
      tileId,
      side,
      hasWon,
    });
  }

  /**
   * Piocher une tuile
   */
  static async drawTile(gameId: string, playerId: string): Promise<void> {
    const gameRef = firestore().collection(DOMINOS_GAMES_COLLECTION).doc(gameId);
    const gameDoc = await gameRef.get();

    if (!gameDoc.exists) {
      throw new Error('Partie non trouvée');
    }

    const game = { id: gameDoc.id, ...gameDoc.data() } as DominosGame;

    if (game.currentPlayerId !== playerId) {
      throw new Error("Ce n'est pas votre tour");
    }

    if (game.drawPileCount <= 0 || !game.drawPile || game.drawPile.length === 0) {
      throw new Error('La pioche est vide');
    }

    const player = game.players.find((p) => p.id === playerId);
    if (!player) {
      throw new Error('Joueur non trouvé');
    }

    if (player.hasDrawn) {
      throw new Error('Vous avez déjà pioché ce tour');
    }

    // Piocher la première tuile de la pioche
    const drawnTile = game.drawPile[0];
    const updatedDrawPile = game.drawPile.slice(1);

    const updatedPlayers = game.players.map((p) =>
      p.id === playerId
        ? {
            ...p,
            hand: [...p.hand, drawnTile],
            tilesCount: p.hand.length + 1,
            hasDrawn: true,
          }
        : p
    );

    await gameRef.update({
      players: updatedPlayers,
      drawPile: updatedDrawPile,
      drawPileCount: updatedDrawPile.length,
      updatedAt: Date.now(),
    });

    console.log('Tile drawn:', { gameId, playerId, tile: drawnTile });
  }

  /**
   * Passer son tour
   */
  static async passTurn(gameId: string, playerId: string): Promise<void> {
    const gameRef = firestore().collection(DOMINOS_GAMES_COLLECTION).doc(gameId);
    const gameDoc = await gameRef.get();

    if (!gameDoc.exists) {
      throw new Error('Partie non trouvée');
    }

    const game = { id: gameDoc.id, ...gameDoc.data() } as DominosGame;

    if (game.currentPlayerId !== playerId) {
      throw new Error("Ce n'est pas votre tour");
    }

    const player = game.players.find((p) => p.id === playerId);
    if (!player) {
      throw new Error('Joueur non trouvé');
    }

    // Vérifier qu'il n'y a vraiment aucun coup possible
    const possibleMoves = getAllPossibleMoves(player.hand, game.leftEnd, game.rightEnd);
    if (possibleMoves.length > 0) {
      throw new Error('Vous avez encore des coups possibles');
    }

    // Vérifier que la pioche est vide ou que le joueur a pioché
    if (game.drawPileCount > 0 && !player.hasDrawn) {
      throw new Error('Vous devez piocher avant de passer');
    }

    const updatedPlayers = game.players.map((p) =>
      p.id === playerId ? { ...p, hasPassed: true, hasDrawn: false } : { ...p, hasDrawn: false }
    );

    // Passer au joueur suivant
    const currentPlayerIndex = game.players.findIndex((p) => p.id === playerId);
    const nextPlayerId = game.players[(currentPlayerIndex + 1) % 2].id;

    await gameRef.update({
      players: updatedPlayers,
      currentPlayerId: nextPlayerId,
      updatedAt: Date.now(),
    });

    console.log('Turn passed:', { gameId, playerId });
  }

  /**
   * Quitter la partie
   */
  static async leaveGame(gameId: string, playerId: string): Promise<void> {
    const gameRef = firestore().collection(DOMINOS_GAMES_COLLECTION).doc(gameId);
    const gameDoc = await gameRef.get();

    if (!gameDoc.exists) {
      return;
    }

    const game = { id: gameDoc.id, ...gameDoc.data() } as DominosGame;
    const updatedPlayers = game.players.filter((p) => p.id !== playerId);

    if (updatedPlayers.length === 0) {
      // Supprimer la partie si plus de joueurs
      await gameRef.delete();
      console.log('Dominos game deleted (no players left):', { gameId });
    } else {
      // Si en cours de partie, l'autre joueur gagne
      const updates: any = {
        players: updatedPlayers,
        updatedAt: Date.now(),
      };

      if (game.status === 'playing') {
        updates.status = 'finished';
        updates.winnerId = updatedPlayers[0].id;
        updates.winReason = 'opponent_left';
        updates.completedAt = Date.now();
      } else {
        // Si l'hôte quitte, assigner un nouvel hôte
        if (game.hostId === playerId) {
          updates.hostId = updatedPlayers[0].id;
        }
      }

      await gameRef.update(updates);

      console.log('Player left dominos game:', {
        gameId,
        playerId,
      });
    }
  }

  /**
   * S'abonner aux changements de la partie
   */
  static subscribeToGame(
    gameId: string,
    onUpdate: (game: DominosGame) => void,
    onError?: (error: Error) => void
  ): () => void {
    return firestore()
      .collection(DOMINOS_GAMES_COLLECTION)
      .doc(gameId)
      .onSnapshot(
        (snapshot) => {
          if (snapshot.exists) {
            const game = { id: snapshot.id, ...snapshot.data() } as DominosGame;
            onUpdate(game);
          }
        },
        (error) => {
          console.error('Error subscribing to dominos game:', error);
          if (onError) {
            onError(error);
          }
        }
      );
  }
}
