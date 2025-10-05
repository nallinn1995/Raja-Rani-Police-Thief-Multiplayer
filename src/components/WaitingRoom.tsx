import React, { useState } from 'react';
import { Users, Share2, Crown, MessageCircle, Copy } from 'lucide-react';
import { Player, ChatMessage } from '../types/game';
import { Chat } from './Chat';
import { Bounce, ToastContainer, toast } from "react-toastify";


interface WaitingRoomProps {
  room: {
    id: string;
    name: string;
    totalRounds: number;
    players: Player[];
  };
  currentPlayerId: string;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({ 
  room, 
  currentPlayerId, 
  messages, 
  onSendMessage 
}) => {
  const [showChat, setShowChat] = useState(false);

  const shareRoom = () => {
    const message = `Join my Raja Rani Police Thief game!%0A%0ARoom: ${room.name}%0ACode: ${room.id}%0A%0AClick here to join: ${window.location.origin}`;
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(room.id);
    toast.success("Code Copied");

    // Could add a toast notification here
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-purple-100 flex flex-col items-center justify-center p-4">
       <ToastContainer 
        position="top-center"
        transition={Bounce}
        theme="dark"/>
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{room.name}</h1>
          <div className="flex items-center justify-center space-x-2 mb-4">
            <span className="text-gray-600">Room Code:</span>
            <code 
              className="bg-gray-100 px-3 py-1 rounded-lg font-mono text-lg cursor-pointer hover:bg-gray-200 transition-colors"
              onClick={copyRoomCode}
            >
              {room.id}
            </code>
             <Copy className="w-6 h-6 cursor-pointer text-purple-600 hover:text-purple-700"  onClick={copyRoomCode}/>
          </div>
          <p className="text-gray-600">Rounds: {room.totalRounds}</p>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Players ({room.players.length}/4)
            </h2>
            <button
              onClick={() => setShowChat(!showChat)}
              className="p-2 text-purple-600 hover:text-purple-700 transition-colors relative"
            >
              <MessageCircle className="w-5 h-5" />
              {messages.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">
                  {messages.length > 9 ? '9+' : messages.length}
                </span>
              )}
            </button>
          </div>
          
          <div className="space-y-3">
            {room.players.map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 ${
                  player.id === currentPlayerId 
                    ? 'bg-gradient-to-r from-purple-100 to-blue-100 border-2 border-purple-300' 
                    : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                    index === 0 ? 'bg-yellow-500' : 
                    index === 1 ? 'bg-blue-500' : 
                    index === 2 ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-gray-800">{player.name}</span>
                </div>
                {player.isHost && (
                  <Crown className="w-5 h-5 text-yellow-500" />
                )}
              </div>
            ))}
            
            {/* Empty slots */}
            {[...Array(4 - room.players.length)].map((_, index) => (
              <div key={index} className="flex items-center justify-center p-3 border-2 border-dashed border-gray-300 rounded-xl">
                <span className="text-gray-400">Waiting for player...</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={shareRoom}
          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 shadow-lg"
        >
          <Share2 className="w-5 h-5" />
          <span>Share via WhatsApp</span>
        </button>

        {room.players.length < 4 && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center space-x-2 text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
              <span>Waiting for players...</span>
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