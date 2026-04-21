import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';

interface JoinRoomProps {
  onBack: () => void;
  onRoomJoined: (roomCode: string, playerId: string) => void;
  joinRoom: (roomCode: string, playerName: string) => Promise<{ playerId: string; roomCode?: string }>;
}

export const JoinRoom: React.FC<JoinRoomProps> = ({ onBack, onRoomJoined, joinRoom }) => {
  const [roomCode, setRoomCode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('room') || '';
  });
  const [playerName, setPlayerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Clear the URL parameter so it doesn't persist on refresh
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('room')) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

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
      onRoomJoined(roomCode.trim().toUpperCase(), response.playerId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join room');
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
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#fff6d6] via-[#ffd700] to-[#b8860b] ml-4 title-font tracking-wide" style={{ filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.8))' }}>Join Room</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2 font-sans tracking-wide">
              <img src="/assets/trophy.png" className="w-5 h-5 inline mr-2 align-middle drop-shadow-md" alt="icon" />
              Room Code
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 bg-[#11052C] border border-[#5A2C81] text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-mono text-center text-2xl tracking-[0.5em] placeholder-gray-600 uppercase font-black text-yellow-500 drop-shadow-md"
              placeholder="ABC123"
              maxLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2 font-sans tracking-wide">
              <img src="/assets/robber.png" className="w-5 h-5 inline mr-2 align-middle drop-shadow-md" alt="icon" />
              Your Name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-4 py-3 bg-[#11052C] border border-[#5A2C81] text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter your name"
              maxLength={20}
            />
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
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl blur opacity-60 group-hover:opacity-100 transition duration-200"></div>
            <div className="relative w-full bg-gradient-to-r from-[#1E3A8A] to-[#1e1b4b] border border-[#3B82F6]/50 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 transform group-hover:scale-105 disabled:opacity-75 disabled:hover:scale-100 shadow-xl flex justify-center items-center gap-2">
              <img src="/assets/police.png" className="w-5 h-5" alt="police" />
              <span className="text-xl tracking-wide font-sans">{loading ? 'Joining...' : 'Join Room'}</span>
            </div>
          </button>
        </form>
      </div>
    </div>
  );
};