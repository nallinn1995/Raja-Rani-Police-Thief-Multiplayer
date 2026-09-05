import React, { useState, useEffect } from 'react';
import { Users, Share2, Crown, MessageCircle, Copy } from 'lucide-react';
import { Player, ChatMessage } from '../types/game';
import { Chat } from './Chat';
import { toast } from "react-toastify";


interface WaitingRoomProps {
  room: {
    id: string;
    name: string;
    totalRounds: number;
    gameMode?: string;
    winCondition?: string;
    targetScore?: number;
    players: Player[];
  };
  currentPlayerId: string;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
}

const WAITING_ROOM_PARTICLES = [
  { id: 0, width: '3px', height: '3px', top: '12%', left: '18%', animationDuration: '3.2s', animationDelay: '0.5s', opacity: 0.8 },
  { id: 1, width: '2px', height: '2px', top: '25%', left: '75%', animationDuration: '4.1s', animationDelay: '1.2s', opacity: 0.6 },
  { id: 2, width: '4px', height: '4px', top: '40%', left: '10%', animationDuration: '2.8s', animationDelay: '0.2s', opacity: 0.75 },
  { id: 3, width: '2px', height: '2px', top: '55%', left: '88%', animationDuration: '3.5s', animationDelay: '1.8s', opacity: 0.5 },
  { id: 4, width: '3px', height: '3px', top: '70%', left: '22%', animationDuration: '4.5s', animationDelay: '0.8s', opacity: 0.9 },
  { id: 5, width: '2px', height: '2px', top: '85%', left: '65%', animationDuration: '3.0s', animationDelay: '1.5s', opacity: 0.65 },
  { id: 6, width: '3px', height: '3px', top: '15%', left: '45%', animationDuration: '3.8s', animationDelay: '0.3s', opacity: 0.7 },
  { id: 7, width: '4px', height: '4px', top: '32%', left: '92%', animationDuration: '4.2s', animationDelay: '1.1s', opacity: 0.85 },
  { id: 8, width: '2px', height: '2px', top: '48%', left: '35%', animationDuration: '2.9s', animationDelay: '0.7s', opacity: 0.6 },
  { id: 9, width: '3px', height: '3px', top: '62%', left: '78%', animationDuration: '3.6s', animationDelay: '1.4s', opacity: 0.75 },
  { id: 10, width: '2px', height: '2px', top: '78%', left: '8%', animationDuration: '4.0s', animationDelay: '0.4s', opacity: 0.55 },
  { id: 11, width: '3px', height: '3px', top: '92%', left: '48%', animationDuration: '3.3s', animationDelay: '1.7s', opacity: 0.8 },
  { id: 12, width: '2px', height: '2px', top: '8%', left: '82%', animationDuration: '3.9s', animationDelay: '0.9s', opacity: 0.6 },
  { id: 13, width: '4px', height: '4px', top: '28%', left: '28%', animationDuration: '4.4s', animationDelay: '0.1s', opacity: 0.85 },
  { id: 14, width: '2px', height: '2px', top: '65%', left: '5%', animationDuration: '2.7s', animationDelay: '1.3s', opacity: 0.7 },
  { id: 15, width: '3px', height: '3px', top: '82%', left: '90%', animationDuration: '3.7s', animationDelay: '0.6s', opacity: 0.75 },
  { id: 16, width: '2px', height: '2px', top: '5%', left: '30%', animationDuration: '4.3s', animationDelay: '1.6s', opacity: 0.5 },
  { id: 17, width: '3px', height: '3px', top: '95%', left: '25%', animationDuration: '3.1s', animationDelay: '0.2s', opacity: 0.85 },
  { id: 18, width: '2px', height: '2px', top: '38%', left: '60%', animationDuration: '3.4s', animationDelay: '1.0s', opacity: 0.65 },
  { id: 19, width: '3px', height: '3px', top: '75%', left: '52%', animationDuration: '4.6s', animationDelay: '0.5s', opacity: 0.7 },
];

export const WaitingRoom: React.FC<WaitingRoomProps> = ({ 
  room, 
  currentPlayerId, 
  messages, 
  onSendMessage 
}) => {
  const [showChat, setShowChat] = useState(false);
  const [unreadMsgs, setUnreadMsgs] = useState(0);
  const [lastReadMessageCount, setLastReadMessageCount] = useState(0);

  useEffect(() => {
    if (!showChat) {
      setUnreadMsgs(messages.length - lastReadMessageCount);
    }
  }, [messages.length, showChat, lastReadMessageCount]);

  const handleShowChat = () => {
    setShowChat(true);
    setUnreadMsgs(0);
    setLastReadMessageCount(messages.length);
  };

  const shareRoom = () => {
    const inviteLink = `${window.location.origin}/?room=${room.id}`;
    const message = `Join my Raja Rani Police Thief game!%0A%0ARoom: ${room.name}%0ACode: ${room.id}%0A%0AClick here to join: ${inviteLink}`;
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(room.id);
    toast.success("Code Copied");

    // Could add a toast notification here
  };

  const maxPlayers = (room as any).gameMode === 'MODERN_MODE' ? 6 : 4;

  return (
    <div
      className="min-h-screen bg-[#0A041A] bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center p-4 relative overflow-y-auto overflow-x-hidden text-white font-sans"
      style={{ backgroundImage: "url('/assets/images/background.jpg'), url('/assets/images/background.png')" }}
    >
      {/* Dark Royal Vignette & Shadow Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A021A]/70 via-transparent to-[#0A021A]/85 pointer-events-none" />
      {/* Background Particles/Stars - Static positions to prevent shaking */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        {WAITING_ROOM_PARTICLES.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              width: p.width,
              height: p.height,
              top: p.top,
              left: p.left,
              animationDuration: p.animationDuration,
              animationDelay: p.animationDelay,
              opacity: p.opacity,
            }}
          />
        ))}
      </div>

      <div className="bg-[#1D0C3A]/95 backdrop-blur-xl rounded-[calc(2rem-2px)] p-6 sm:p-8 border border-[#3A1C61] w-full max-w-md shadow-[0_0_40px_rgba(147,51,234,0.3)] relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#fff6d6] via-[#ffd700] to-[#b8860b] mb-4 title-font tracking-wide" style={{ filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.8))' }}>{room.name}</h1>
          <div className="flex items-center justify-center space-x-3 mb-4">
            <span className="text-gray-300 font-sans tracking-wide">Room Code:</span>
            <code 
              className="bg-[#11052C] border border-[#5A2C81] px-4 py-1.5 rounded-lg font-mono text-xl text-yellow-400 cursor-pointer hover:bg-[#2A1154] transition-colors drop-shadow-md font-bold tracking-widest"
              onClick={copyRoomCode}
            >
              {room.id}
            </code>
             <Copy className="w-6 h-6 cursor-pointer text-fuchsia-400 hover:text-fuchsia-300 transition-colors drop-shadow-md" onClick={copyRoomCode} />
          </div>
          <p className="text-gray-400 font-sans tracking-wider">
            {room.winCondition === 'target_score' ? (
              <>Target Score: <span className="text-yellow-400 font-bold">{(room.targetScore || 5000).toLocaleString()} pts</span></>
            ) : (
              <>Rounds: <span className="text-yellow-400 font-bold">{room.totalRounds}</span></>
            )}
          </p>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-200 flex items-center tracking-wide">
              <Users className="w-5 h-5 mr-2 text-fuchsia-400" />
              Players ({room.players.length}/{maxPlayers})
            </h2>
            <button
              onClick={handleShowChat}
              className="p-2 text-fuchsia-400 hover:text-white transition-colors relative bg-[#11052C] border border-[#3A1C61] rounded-full drop-shadow-md"
            >
              <MessageCircle className="w-5 h-5" />
              {unreadMsgs > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold border border-[#1D0C3A]">
                  {unreadMsgs > 9 ? '9+' : unreadMsgs}
                </span>
              )}
            </button>
          </div>
          
          <div className="space-y-3 font-sans">
            {room.players.map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-3.5 rounded-xl transition-all duration-300 shadow-md ${
                  player.id === currentPlayerId 
                    ? 'bg-gradient-to-r from-[#3A1054] to-[#1A0B2E] border-2 border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.3)]' 
                    : 'bg-[#11052C] border border-[#3A1C61]'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner ${
                    index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : 
                    index === 1 ? 'bg-gradient-to-br from-blue-400 to-blue-600' : 
                    index === 2 ? 'bg-gradient-to-br from-green-400 to-green-600' : 'bg-gradient-to-br from-red-400 to-red-600'
                  }`}>
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <span className={`font-bold tracking-wide ${player.id === currentPlayerId ? 'text-white' : 'text-gray-200'}`}>{player.name}</span>
                </div>
                {player.isHost && (
                  <Crown className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]" />
                )}
              </div>
            ))}
            
            {/* Empty slots */}
            {Math.max(0, maxPlayers - room.players.length) > 0 && [...Array(maxPlayers - room.players.length)].map((_, index) => (
              <div key={index} className="flex items-center justify-center p-4 border-2 border-dashed border-[#3A1C61] bg-[#11052C]/50 rounded-xl">
                <span className="text-gray-500 font-medium tracking-wide">Waiting for player...</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={shareRoom}
          className="w-full relative group mt-2"
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-green-400 to-emerald-600 rounded-2xl blur opacity-60 group-hover:opacity-100 transition duration-200"></div>
          <div className="relative w-full bg-gradient-to-r from-[#064E3B] to-[#065F46] border border-[#10B981]/50 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 transform group-hover:scale-105 shadow-xl flex items-center justify-center space-x-2">
            <Share2 className="w-5 h-5 text-emerald-300" />
            <span className="tracking-wide">Share via WhatsApp</span>
          </div>
        </button>

        {room.players.length < maxPlayers && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center space-x-3 text-fuchsia-300 drop-shadow-sm">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-fuchsia-400"></div>
              <span className="font-medium tracking-wide">Waiting for {maxPlayers} Players... ({room.players.length}/{maxPlayers})</span>
            </div>
          </div>
        )}
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