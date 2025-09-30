export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  score: number;
  role?: string | null;
  rank?: number;
}

export interface Room {
  id: string;
  name: string;
  totalRounds: number;
  currentRound: number;
  gameState: 'waiting' | 'role-assignment' | 'police-reveal' | 'guessing' | 'results' | 'finished';
  players: Player[];
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: string;
}

export interface RoundResult {
  isCorrect: boolean;
  thief: Player;
  guessedPlayer: Player;
  players: Player[];
  currentRound: number;
  totalRounds: number;
}