import React from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle2, Lock, Clock } from 'lucide-react';
import { ModernRole, MODERN_ROLES_CONFIG } from '../../types/modernMode';

interface ModernRoleCardProps {
  player: {
    id: string;
    name: string;
    score: number;
    role?: ModernRole | null;
    isRoleRevealed?: boolean;
    isHost?: boolean;
    hasSubmittedAction?: boolean;
    isShielded?: boolean;
  };
  seatNumber?: number;
  isCurrentPlayer: boolean;
  myRole: ModernRole | null;
  currentPhase: string;
  isSelectable?: boolean;
  isSelected?: boolean;
  showProtectButton?: boolean;
  onSelect?: () => void;
  onProtect?: () => void;
}

export const ModernRoleCard: React.FC<ModernRoleCardProps> = ({
  player,
  seatNumber,
  isCurrentPlayer,
  currentPhase,
  isSelectable = false,
  isSelected = false,
  showProtectButton = false,
  onSelect,
  onProtect,
}) => {
  const roleKey = player.role as ModernRole;
  const roleConfig = roleKey ? MODERN_ROLES_CONFIG[roleKey] : null;

  // Determine if role is visible to current client
  const canSeeRole =
    isCurrentPlayer ||
    player.isRoleRevealed ||
    (currentPhase === 'investigation-phase' && player.role === 'Police') ||
    currentPhase === 'result-phase';

  const displayTitle = canSeeRole && roleConfig ? roleConfig.title : 'Secret Role';

  // Card status text
  const getStatusBadge = () => {
    if (currentPhase === 'mantri-shield') {
      if (player.role === 'Mantri') {
        return { label: 'Selecting Shield...', icon: Clock, bg: 'bg-indigo-950/90 text-indigo-200 border border-indigo-500/40' };
      }
    }
    if (currentPhase === 'royal-phase') {
      if (player.role === 'Raja' || player.role === 'Rani') {
        return player.hasSubmittedAction
          ? { label: 'Locked', icon: Lock, bg: 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/40' }
          : { label: 'Thinking...', icon: Clock, bg: 'bg-amber-950/90 text-amber-200 border border-amber-500/40 animate-pulse' };
      }
      return { label: 'Waiting...', icon: Clock, bg: 'bg-purple-950/90 text-purple-300 border border-purple-500/30' };
    }
    if (currentPhase === 'investigation-phase') {
      if (player.role === 'Police') {
        return player.hasSubmittedAction
          ? { label: 'Investigated', icon: CheckCircle2, bg: 'bg-blue-950/90 text-blue-300 border border-blue-500/40' }
          : { label: 'Investigating...', icon: Clock, bg: 'bg-cyan-950/90 text-cyan-200 border border-cyan-500/40 animate-pulse' };
      }
      return { label: 'Waiting...', icon: Clock, bg: 'bg-purple-950/90 text-purple-300 border border-purple-500/30' };
    }
    if (currentPhase === 'witness-phase') {
      if (player.role === 'Villager') {
        return player.hasSubmittedAction
          ? { label: 'Statement Saved', icon: CheckCircle2, bg: 'bg-amber-950/90 text-amber-300 border border-amber-500/40' }
          : { label: 'Judging...', icon: Clock, bg: 'bg-amber-950/90 text-amber-200 border border-amber-500/40 animate-pulse' };
      }
    }
    if (player.isShielded) {
      return { label: 'Protected by Shield', icon: Shield, bg: 'bg-yellow-950/90 text-yellow-300 border border-yellow-500/60' };
    }
    return { label: 'Waiting...', icon: Clock, bg: 'bg-purple-950/90 text-purple-300 border border-purple-500/30' };
  };

  const statusBadge = getStatusBadge();

  return (
    <motion.div
      whileHover={isSelectable ? { scale: 1.04, y: -4 } : { scale: 1.01 }}
      whileTap={isSelectable ? { scale: 0.98 } : undefined}
      onClick={isSelectable ? onSelect : undefined}
      className={`relative rounded-3xl p-3 transition-all duration-300 backdrop-blur-xl flex flex-col items-center justify-between text-center overflow-visible border-2 ${
        isSelected
          ? 'bg-gradient-to-b from-amber-950/95 via-[#2A0E05]/95 to-[#170602]/95 border-yellow-400 shadow-[0_0_35px_rgba(250,204,21,0.7)] ring-2 ring-yellow-400'
          : isSelectable
          ? 'bg-gradient-to-b from-[#1C0933]/95 via-[#140626]/95 to-[#0D031A]/95 border-amber-500/70 hover:border-yellow-400 hover:shadow-[0_0_25px_rgba(234,179,8,0.5)] cursor-pointer'
          : isCurrentPlayer
          ? 'bg-gradient-to-b from-[#240C40]/95 via-[#190730]/95 to-[#100320]/95 border-yellow-400/80 shadow-[0_0_30px_rgba(234,179,8,0.4)]'
          : 'bg-gradient-to-b from-[#180A2E]/95 via-[#110524]/95 to-[#0A0218]/95 border-amber-600/40 shadow-[0_10px_30px_rgba(0,0,0,0.8)]'
      }`}
    >
      {/* Top Seat Number Badge (Matching Reference UI) */}
      {seatNumber !== undefined && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30">
          <div className="px-3 py-0.5 bg-gradient-to-b from-purple-800 via-indigo-900 to-purple-950 border border-amber-400/90 rounded-b-lg text-yellow-300 font-black text-xs shadow-[0_3px_10px_rgba(0,0,0,0.8)] flex items-center justify-center min-w-[28px]">
            {seatNumber}
          </div>
        </div>
      )}

      {/* "YOU" Tag Badge */}
      {isCurrentPlayer && (
        <div className="absolute -top-3.5 right-2 z-30 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-[0_0_12px_rgba(168,85,247,0.8)] border border-purple-300 tracking-wider">
          YOU
        </div>
      )}

      {/* Arched Avatar Portrait Window */}
      <div className="relative mt-3 mb-2">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-b from-[#0E041A] via-[#17092B] to-[#0A0214] border-2 border-amber-500/60 flex items-center justify-center overflow-hidden shadow-inner p-1.5 relative group">
          {canSeeRole && roleConfig?.image ? (
            <img
              src={roleConfig.image}
              alt={displayTitle}
              className="w-full h-full object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.7)]"
            />
          ) : (
            <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-amber-300 to-yellow-500 drop-shadow-[0_0_12px_rgba(250,204,21,0.8)] select-none">
              ?
            </span>
          )}
          {canSeeRole && (
            <div className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 rounded-full border border-black flex items-center justify-center text-[10px] text-black font-black shadow-md">
              ✓
            </div>
          )}
        </div>
      </div>

      {/* Player Details Plaque */}
      <div className="w-full px-1 mb-2">
        <h3 className="font-black text-sm text-white truncate drop-shadow-sm">
          {player.name}
        </h3>
        <p className={`text-[11px] font-bold tracking-wide truncate ${canSeeRole ? 'text-emerald-400' : 'text-amber-300/80'}`}>
          {displayTitle}
        </p>
      </div>

      {/* Ornate Pedestal Base with Status Pill */}
      <div className="w-full pt-1.5 pb-1 px-1.5 bg-gradient-to-r from-amber-950/90 via-yellow-900/30 to-amber-950/90 rounded-b-2xl border-t border-amber-500/30">
        {statusBadge && (
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold w-full justify-center shadow-inner ${statusBadge.bg}`}
          >
            <statusBadge.icon className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{statusBadge.label}</span>
          </div>
        )}

        {currentPhase === 'result-phase' && (
          <div className="flex items-center justify-between text-xs py-1 px-1">
            <span className="text-gray-400 font-sans">Score</span>
            <span className="font-mono font-bold text-yellow-300 text-sm">
              {player.score} pts
            </span>
          </div>
        )}

        {/* Mantri Protect Action Button */}
        {showProtectButton && !isCurrentPlayer && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onProtect) onProtect();
            }}
            className="w-full mt-1.5 py-1.5 px-2 rounded-xl bg-gradient-to-r from-emerald-500 via-green-600 to-emerald-700 hover:from-emerald-400 hover:to-green-500 text-white font-black text-[11px] uppercase tracking-wider shadow-lg flex items-center justify-center gap-1 transition cursor-pointer active:scale-95 border border-emerald-300/50"
          >
            <Shield className="w-3.5 h-3.5 text-yellow-300 fill-current" />
            <span>PROTECT PLAYER</span>
          </button>
        )}
      </div>

      {/* Hover Ring Highlight */}
      {isSelectable && !isSelected && !showProtectButton && (
        <div className="absolute inset-0 rounded-3xl border-2 border-dashed border-yellow-400/50 opacity-0 hover:opacity-100 transition pointer-events-none" />
      )}
    </motion.div>
  );
};
