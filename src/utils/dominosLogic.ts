import { DominosGame, DominoTile, DominosPlayer } from '../types/dominos.types';

export interface PossibleMove {
  tile: DominoTile;
  side: 'left' | 'right';
  reversed?: boolean;
}

export function getAllPossibleMoves(
  hand: DominoTile[],
  leftEnd: number | null,
  rightEnd: number | null
): PossibleMove[] {
  const moves: PossibleMove[] = [];

  if (leftEnd === null && rightEnd === null) {
    // First move - any tile can be played
    return hand.map(tile => ({ tile, side: 'left' as const }));
  }

  hand.forEach(tile => {
    // Check left end
    if (leftEnd !== null) {
      if (tile.left === leftEnd) {
        moves.push({ tile, side: 'left', reversed: false });
      } else if (tile.right === leftEnd) {
        moves.push({ tile, side: 'left', reversed: true });
      }
    }

    // Check right end
    if (rightEnd !== null) {
      if (tile.right === rightEnd) {
        moves.push({ tile, side: 'right', reversed: false });
      } else if (tile.left === rightEnd) {
        moves.push({ tile, side: 'right', reversed: true });
      }
    }
  });

  return moves;
}

export function calculateScore(player: DominosPlayer): number {
  // Calculate score based on remaining tiles
  const totalPips = player.hand.reduce((sum, tile) => sum + tile.left + tile.right, 0);
  return totalPips;
}

export function findHighestDouble(hand: DominoTile[]): DominoTile | null {
  const doubles = hand.filter(tile => tile.left === tile.right);
  if (doubles.length === 0) return null;

  // Sort by value (highest first)
  doubles.sort((a, b) => b.left - a.left);
  return doubles[0];
}

export function determineStartingPlayer(players: DominosPlayer[]): {
  startingPlayerId: string;
  highestDouble: DominoTile | null;
} {
  let highestDouble: DominoTile | null = null;
  let startingPlayerId = players[0].id;

  for (const player of players) {
    const playerHighestDouble = findHighestDouble(player.hand);
    if (playerHighestDouble) {
      if (!highestDouble || playerHighestDouble.left > highestDouble.left) {
        highestDouble = playerHighestDouble;
        startingPlayerId = player.id;
      }
    }
  }

  return { startingPlayerId, highestDouble };
}

export function generateDominoSet(maxValue: number = 6): DominoTile[] {
  const tiles: DominoTile[] = [];
  let id = 0;

  for (let i = 0; i <= maxValue; i++) {
    for (let j = i; j <= maxValue; j++) {
      tiles.push({
        id: `domino-${id++}`,
        left: i,
        right: j,
      });
    }
  }

  return tiles;
}

export function shuffleTiles(tiles: DominoTile[]): DominoTile[] {
  const shuffled = [...tiles];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function initializeDeck(): DominoTile[] {
  return shuffleTiles(generateDominoSet(6));
}

export function distributeTiles(deck: DominoTile[]): {
  player1Hand: DominoTile[];
  player2Hand: DominoTile[];
  drawPile: DominoTile[];
} {
  const player1Hand = deck.slice(0, 7);
  const player2Hand = deck.slice(7, 14);
  const drawPile = deck.slice(14);

  return {
    player1Hand,
    player2Hand,
    drawPile,
  };
}

export function canPlaceTile(
  tile: DominoTile,
  leftEnd: number | null,
  rightEnd: number | null
): { canPlaceLeft: boolean; canPlaceRight: boolean } {
  // First tile can be placed anywhere
  if (leftEnd === null && rightEnd === null) {
    return { canPlaceLeft: true, canPlaceRight: true };
  }

  const canPlaceLeft = leftEnd !== null && (tile.left === leftEnd || tile.right === leftEnd);
  const canPlaceRight = rightEnd !== null && (tile.right === rightEnd || tile.left === rightEnd);

  return { canPlaceLeft, canPlaceRight };
}

export function getConnectingValue(
  tile: DominoTile,
  endValue: number
): number {
  if (tile.left === endValue) return tile.right;
  if (tile.right === endValue) return tile.left;
  return -1;
}

export function isGameBlocked(
  players: DominosPlayer[],
  leftEnd: number | null,
  rightEnd: number | null,
  drawPileCount: number
): boolean {
  if (drawPileCount > 0) return false;

  return players.every(player => {
    const moves = getAllPossibleMoves(player.hand, leftEnd, rightEnd);
    return moves.length === 0;
  });
}

export function getWinnerByScore(players: DominosPlayer[]): DominosPlayer | null {
  if (players.length === 0) return null;

  let winner = players[0];
  let lowestScore = calculateScore(winner);

  for (let i = 1; i < players.length; i++) {
    const score = calculateScore(players[i]);
    if (score < lowestScore) {
      lowestScore = score;
      winner = players[i];
    }
  }

  return winner;
}
