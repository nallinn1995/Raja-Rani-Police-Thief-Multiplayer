import React, { useState, useEffect } from 'react';
import { Crown, Shield, Eye, Zap, MessageCircle } from 'lucide-react';
import { Player, ChatMessage } from '../types/game';
import { Chat } from './Chat';

interface GameBoardProps {
  room: {
    id: string;
    name: string;
    currentRound: number;
    totalRounds: number;
    gameState: string;
    players: Player[];
  };
  currentPlayerId: string;
  myRole?: string;
  policeId?: string;
  allRoles?: Player[];
  messages: ChatMessage[];
  onPoliceReveal: () => void;
  onMakeGuess: (guessedThiefId: string) => void;
  onSendMessage: (message: string) => void;
}

const roleIcons = {
  Raja: Crown,
  Rani: Crown,
  Police: Shield,
  Thief: Zap
};

const roleColors = {
  Raja: 'from-yellow-400 to-yellow-600',
  Rani: 'from-pink-400 to-pink-600',
  Police: 'from-blue-400 to-blue-600',
  Thief: 'from-red-400 to-red-600'
};

export const GameBoard: React.FC<GameBoardProps> = ({
  room,
  currentPlayerId,
  myRole,
  policeId,
  allRoles,
  messages,
  onPoliceReveal,
  onMakeGuess,
  onSendMessage
}) => {
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());
  const [showChat, setShowChat] = useState(false);
  
  useEffect(() => {
    if (room.gameState === 'role-assignment') {
      // Animate card flips
      room.players.forEach((player, index) => {
        setTimeout(() => {
          setFlippedCards(prev => new Set([...prev, player.id]));
        }, index * 500 + 1000);
      });
    }
  }, [room.gameState, room.players]);

  const isPolice = myRole === 'Police';
  const canRevealPolice = room.gameState === 'police-reveal' && isPolice;
  const canMakeGuess = room.gameState === 'guessing' && currentPlayerId === policeId;

  const getRoleIcon = (role: string) => {
    const IconComponent = roleIcons[role as keyof typeof roleIcons];
    return IconComponent ? <IconComponent className="w-6 h-6" /> : null;
  };

  const getPlayerRole = (playerId: string) => {
    if (playerId === currentPlayerId) return myRole;
    
    if (allRoles) {
      const player = allRoles.find(p => p.id === playerId);
      return player?.role;
    }
    return null;
  };

  const showRole = (role: string) => {
    console.log(role,myRole);

    if(role === myRole){
      return myRole;
    } else {
      return '?';
    } 
    
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-purple-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-800">{room.name}</h1>
            <button
              onClick={() => setShowChat(!showChat)}
              className="p-2 text-purple-600 hover:text-purple-700 transition-colors relative"
            >
              <MessageCircle className="w-6 h-6" />
              {messages.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">
                  {messages.length > 9 ? '9+' : messages.length}
                </span>
              )}
            </button>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Round {room.currentRound} of {room.totalRounds}</span>
            <span>Game State: {room.gameState}</span>
          </div>
        </div>

        {/* Player Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {room.players.map((player, index) => {
            const playerRole = getPlayerRole(player.id);
            console.log(playerRole);
            const isFlipped = flippedCards.has(player.id);
            const canClick = canMakeGuess && playerRole && playerRole !== 'Police';
            
            return (
              <div
                key={player.id}
                className={`relative h-40 transition-all duration-500 ${
                  canClick ? 'cursor-pointer hover:scale-105' : ''
                }`}
                onClick={canClick ? () => onMakeGuess(player.id) : undefined}
              >
                <div className={`card ${isFlipped ? 'flipped' : ''}`}>
                  {/* Card Back */}
                  <div className="card-face card-back">
                    <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl h-full flex flex-col items-center justify-center text-white shadow-lg">
                      <Eye className="w-8 h-8 mb-2" />
                      <span className="text-sm font-medium">{player.name}</span>
                    </div>
                  </div>
                  
                  {/* Card Front */}
                  <div className="card-face card-front">
                    <div className={`bg-gradient-to-br ${
                      playerRole ? roleColors[playerRole as keyof typeof roleColors] : 'from-gray-400 to-gray-600'
                    } rounded-xl h-full flex flex-col items-center justify-center text-white shadow-lg ${
                      canClick ? 'hover:shadow-2xl hover:brightness-110' : ''
                    }`}>
                      {playerRole && getRoleIcon(playerRole)}
                      <span className="text-lg font-bold mt-2">{showRole(playerRole)}</span>
                      <span className="text-sm mt-1">{player.name}</span>
                      <span className="text-xs mt-1">Score: {player.score}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Game Actions */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          {canRevealPolice && (
            <div className="text-center">
              <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <Shield className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-blue-800 mb-2">
                  You are the Police!
                </h3>
                <p className="text-blue-700 text-sm">
                  Click below to reveal yourself and start finding the thief
                </p>
              </div>
              <button
                onClick={onPoliceReveal}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                I am Police
              </button>
            </div>
          )}

          {room.gameState === 'guessing' && !canMakeGuess && (
            <div className="text-center p-4 bg-yellow-50 rounded-xl border border-yellow-200">
              <Shield className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-yellow-800">
                {policeId === currentPlayerId 
                  ? "Click on a player card to make your guess!"
                  : `Waiting for ${room.players.find(p => p.id === policeId)?.name} to make their guess...`
                }
              </p>
            </div>
          )}

          {room.gameState === 'role-assignment' && (
            <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="animate-pulse">
                <p className="text-gray-700">Assigning roles...</p>
              </div>
            </div>
          )}

          {room.gameState === 'waiting' && (
            <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
              <p className="text-purple-700">Waiting for game to start...</p>
            </div>
          )}
        </div>
      </div>

      {showChat && (
        <Chat
          messages={messages}
          currentPlayerId={currentPlayerId}
          onSendMessage={onSendMessage}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
};