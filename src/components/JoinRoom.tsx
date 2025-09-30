import React, { useState } from 'react';
import { ArrowLeft, Users, Hash } from 'lucide-react';

interface JoinRoomProps {
  onBack: () => void;
  onRoomJoined: (roomCode: string, playerId: string) => void;
  joinRoom: (roomCode: string, playerName: string) => Promise<any>;
}

export const JoinRoom: React.FC<JoinRoomProps> = ({ onBack, onRoomJoined, joinRoom }) => {
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roomCode.trim() || !playerName.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (roomCode.trim().length !== 6) {
      setError('Room code must be 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await joinRoom(roomCode.trim().toUpperCase(), playerName.trim());
      console.log(response);
      onRoomJoined(roomCode.trim().toUpperCase(), response.playerId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-purple-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="flex items-center mb-6">
          <button
            onClick={onBack}
            className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800 ml-2">Join Room</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Hash className="w-4 h-4 inline mr-1" />
              Room Code
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-mono text-center text-lg tracking-widest"
              placeholder="ABC123"
              maxLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="w-4 h-4 inline mr-1" />
              Your Name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter your name"
              maxLength={20}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-lg"
          >
            {loading ? 'Joining Room...' : 'Join Room'}
          </button>
        </form>
      </div>
    </div>
  );
};