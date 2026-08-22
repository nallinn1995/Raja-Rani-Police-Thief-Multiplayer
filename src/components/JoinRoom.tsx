import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { authService } from '../services/authService';

interface JoinRoomProps {
  onBack: () => void;
  onRoomJoined: (roomCode: string, playerId: string, playerToken?: string) => void;
  joinRoom: (roomCode: string, playerName: string, userId?: string) => Promise<{ playerId: string; roomCode?: string; playerToken?: string }>;
}

export const JoinRoom: React.FC<JoinRoomProps> = ({ onBack, onRoomJoined, joinRoom }) => {
  const currentUser = authService.getCurrentUser();
  const isGuest = !currentUser || currentUser.isGuest;

  const [roomCode, setRoomCode] = useState(() => {
    const pendingCode = sessionStorage.getItem('pendingJoinRoomCode');
    if (pendingCode) return pendingCode;
    const params = new URLSearchParams(window.location.search);
    return (params.get('room') || '').toUpperCase();
  });

  const [playerName, setPlayerName] = useState(() => {
    return currentUser?.username || '';
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const pendingCode = sessionStorage.getItem('pendingJoinRoomCode');
    if (pendingCode && !roomCode) {
      setRoomCode(pendingCode);
    }
    sessionStorage.removeItem('pendingJoinRoomCode');

    if (currentUser?.username && !playerName) {
      setPlayerName(currentUser.username);
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
      const response = await joinRoom(roomCode.trim().toUpperCase(), playerName.trim(), currentUser?.id || currentUser?._id);
      onRoomJoined(roomCode.trim().toUpperCase(), response.playerId, response.playerToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center p-4 relative overflow-y-auto overflow-x-hidden text-white font-sans"
      style={{ backgroundImage: "url('/assets/images/background.png')" }}
    >
      {/* Subtle Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-950/25 via-transparent to-purple-950/35 pointer-events-none" />
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

      {/* Main Container with Dedicated Join Room Gold Frame */}
      <div className="join-room-gold-frame backdrop-blur-2xl relative z-10 my-2 max-w-[440px] sm:max-w-[480px] w-full shadow-2xl">
        <div className="flex items-center mt-2 sm:mt-4 mb-3 sm:mb-6 pb-2 sm:pb-3 border-b border-purple-800/40">
          <button
            onClick={onBack}
            className="p-2 text-gray-400 hover:text-white transition-colors bg-[#11052C] rounded-full border border-[#3A1C61] shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#fff6d6] via-[#ffd700] to-[#b8860b] ml-3.5 title-font tracking-wide" style={{ filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.8))' }}>Join Room</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2 font-sans tracking-wide">
              <img src="/assets/images/trophy.png" className="w-5 h-5 inline mr-2 align-middle drop-shadow-md object-contain" alt="Trophy icon" />
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
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-200 font-sans tracking-wide">
                <img src="/assets/robber.png" className="w-5 h-5 inline mr-2 align-middle drop-shadow-md" alt="icon" />
                Your Name
              </label>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-900/60 text-purple-300 border border-purple-500/30">
                {isGuest ? "Guest Mode" : "Registered User"}
              </span>
            </div>
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

          {/* Join Room Graphic Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center relative group mt-6 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {/* Ambient Gold/Purple Glow Backdrop */}
            <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 h-10 bg-gradient-to-r from-amber-500 via-purple-500 to-amber-600 rounded-full blur-lg opacity-70 group-hover:opacity-100 group-hover:blur-xl transition-all duration-300 pointer-events-none" />

            <div className="relative transform group-hover:scale-[1.04] group-active:scale-[0.98] transition-all duration-300 drop-shadow-[0_4px_20px_rgba(234,179,8,0.5)] group-hover:drop-shadow-[0_6px_30px_rgba(250,204,21,0.85)]">
              <img
                src="/assets/images/join_romm_btn.png"
                alt="Join Room"
                className="w-full max-w-[460px] sm:max-w-[520px] h-auto object-contain block mx-auto pointer-events-none"
              />
              {loading && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center gap-2 text-yellow-300 font-bold text-base sm:text-lg">
                  <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                  <span>Joining Room...</span>
                </div>
              )}
            </div>
          </button>
        </form>
      </div>
    </div>
  );
};