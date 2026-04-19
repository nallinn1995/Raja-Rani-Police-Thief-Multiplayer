import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

interface CreateRoomProps {
  onBack: () => void;
  onRoomCreated: (roomCode: string, playerId: string) => void;
  createRoom: (roomName: string, playerName: string, totalRounds: number) => Promise<{ roomCode: string; playerId: string }>;
}

export const CreateRoom: React.FC<CreateRoomProps> = ({ onBack, onRoomCreated, createRoom }) => {
  const [roomName, setRoomName] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [totalRounds, setTotalRounds] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roomName.trim() || !playerName.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await createRoom(roomName.trim(), playerName.trim(), totalRounds);
      console.log(response)
      onRoomCreated(response.roomCode, response.playerId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#11052C] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#3A1054] via-[#11052C] to-[#0A0217] flex flex-col items-center justify-center p-4 relative overflow-y-auto overflow-x-hidden text-white font-sans">
      {/* Background Particles/Stars */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              width: Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              animationDuration: Math.random() * 3 + 2 + 's',
              animationDelay: Math.random() * 2 + 's',
              opacity: Math.random() * 0.7 + 0.3,
            }}
          />
        ))}
      </div>

      <div className="bg-[#1D0C3A]/95 backdrop-blur-xl rounded-[calc(2rem-2px)] p-6 sm:p-8 border border-[#3A1C61] w-full max-w-md shadow-[0_0_40px_rgba(147,51,234,0.3)] relative z-10">
        <div className="flex items-center mb-8">
          <button
            onClick={onBack}
            className="p-2 text-gray-400 hover:text-white transition-colors bg-[#11052C] rounded-full border border-[#3A1C61]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#fff6d6] via-[#ffd700] to-[#b8860b] ml-4 title-font tracking-wide" style={{ filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.8))' }}>Create Room</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2 font-sans tracking-wide">
              <img src="/assets/crown.png" className="w-5 h-5 inline mr-2 align-middle drop-shadow-md" alt="icon" />
              Room Name
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full px-4 py-3 bg-[#11052C] border border-[#5A2C81] text-white rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter room name"
              maxLength={30}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2 font-sans tracking-wide">
              <img src="/assets/police.png" className="w-5 h-5 inline mr-2 align-middle drop-shadow-md" alt="icon" />
              Your Name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-4 py-3 bg-[#11052C] border border-[#5A2C81] text-white rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter your name"
              maxLength={20}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2 font-sans tracking-wide">
              <img src="/assets/coins.png" className="w-5 h-5 inline mr-2 align-middle drop-shadow-md" alt="icon" />
              Number of Rounds: <span className="text-yellow-400 font-bold">{totalRounds}</span>
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={totalRounds}
              onChange={(e) => setTotalRounds(parseInt(e.target.value))}
              className="w-full h-2 bg-[#11052C] border border-[#5A2C81] rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>1</span>
              <span>10</span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-900/50 border border-red-500/50 text-red-200 rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
             className="w-full relative group mt-4"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-fuchsia-600 to-purple-600 rounded-2xl blur opacity-60 group-hover:opacity-100 transition duration-200"></div>
            <div className="relative w-full bg-gradient-to-r from-[#7B1FA2] to-[#4A148C] border border-[#9C27B0]/50 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 transform group-hover:scale-105 disabled:opacity-75 disabled:hover:scale-100 shadow-xl flex justify-center items-center gap-2">
              <img src="/assets/crown.png" className="w-5 h-5" alt="crown" />
              <span className="text-xl tracking-wide font-sans">{loading ? 'Creating...' : 'Create Room'}</span>
            </div>
          </button>
        </form>
      </div>
    </div>
  );
};