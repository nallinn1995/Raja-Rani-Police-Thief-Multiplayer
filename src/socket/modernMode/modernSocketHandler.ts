import { Socket } from 'socket.io-client';

export const modernSocketHandler = {
  toggleRuleReady(socket: Socket, roomCode: string, playerId: string, isReady: boolean) {
    socket.emit('modern:ruleReady', { roomCode, playerId, isReady });
  },

  startGame(socket: Socket, roomCode: string, playerId: string) {
    socket.emit('modern:startGame', { roomCode, playerId });
  },

  nextRound(socket: Socket, roomCode: string, playerId: string) {
    socket.emit('modern:nextRound', { roomCode, playerId });
  },

  submitMantriShield(socket: Socket, roomCode: string, playerId: string, targetId: string | null) {
    socket.emit('modern:submitMantriShield', { roomCode, playerId, targetId });
  },

  submitRajaGuess(socket: Socket, roomCode: string, playerId: string, targetId: string) {
    socket.emit('modern:submitRajaGuess', { roomCode, playerId, targetId });
  },

  submitRaniGuess(socket: Socket, roomCode: string, playerId: string, targetId: string) {
    socket.emit('modern:submitRaniGuess', { roomCode, playerId, targetId });
  },

  submitPoliceGuess(socket: Socket, roomCode: string, playerId: string, targetId: string) {
    socket.emit('modern:submitPoliceGuess', { roomCode, playerId, targetId });
  },

  submitVillagerWitness(socket: Socket, roomCode: string, playerId: string, choice: 'agree' | 'disagree') {
    socket.emit('modern:submitVillagerWitness', { roomCode, playerId, choice });
  },
};
