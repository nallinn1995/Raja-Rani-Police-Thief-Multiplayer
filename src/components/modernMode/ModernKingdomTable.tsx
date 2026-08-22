import React from 'react';
import { ModernRoleCard } from './ModernRoleCard';
import { ModernPlayerState, ModernRole } from '../../types/modernMode';
import { Crown } from 'lucide-react';

interface ModernKingdomTableProps {
  players: ModernPlayerState[];
  currentPlayerId: string;
  myRole: ModernRole | null;
  currentPhase: string;
  selectablePlayerIds?: string[];
  selectedPlayerId?: string | null;
  mantriShowProtectButtons?: boolean;
  onSelectPlayer?: (playerId: string) => void;
  onMantriProtectPlayer?: (playerId: string) => void;
}

export const ModernKingdomTable: React.FC<ModernKingdomTableProps> = ({
  players,
  currentPlayerId,
  myRole,
  currentPhase,
  selectablePlayerIds = [],
  selectedPlayerId = null,
  mantriShowProtectButtons = false,
  onSelectPlayer,
  onMantriProtectPlayer,
}) => {
  return (
    <div className="relative w-full max-w-5xl mx-auto my-2 p-2 sm:p-4 flex flex-col items-center justify-center">
      {/* 3D Royal Velvet Felt Table Top Graphic */}
      <div className="relative w-full min-h-[380px] sm:min-h-[440px] flex items-center justify-center p-4 sm:p-8 rounded-[40px] sm:rounded-[60px] bg-gradient-to-b from-[#3E0B19] via-[#2A0510] to-[#150207] border-4 border-amber-600/70 shadow-[0_0_90px_rgba(180,83,9,0.35)] overflow-hidden">
        
        {/* Subtle Radial Table Felt Highlight */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />

        {/* Outer Ring Trim Line */}
        <div className="absolute inset-3 sm:inset-5 rounded-[32px] sm:rounded-[50px] border border-amber-400/20 pointer-events-none" />

        {/* Center Royal Crown Emblem (Matching Reference UI Center Crest) */}
        <div className="absolute z-10 text-center pointer-events-none flex flex-col items-center justify-center p-3 rounded-full bg-[#1A060C]/90 border-2 border-amber-400/50 shadow-[0_0_35px_rgba(234,179,8,0.3)]">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-700 border-2 border-yellow-200 flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(250,204,21,0.6)]">
            <Crown className="w-6 h-6 text-black fill-black" />
          </div>
          <span className="text-[10px] font-black text-amber-300 tracking-widest uppercase mt-1">
            ROYAL COURT
          </span>
        </div>

        {/* 6 Seats Layout Grid (Seats 1-3 Top Row, Seats 4-6 Bottom Row) */}
        <div className="w-full h-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 relative z-20">
          {players.map((player, index) => {
            const isCurrent = player.id === currentPlayerId;
            const isSelectable = selectablePlayerIds.includes(player.id);
            const isSelected = selectedPlayerId === player.id;
            const showProtect = mantriShowProtectButtons && currentPhase === 'mantri-shield' && myRole === 'Mantri' && !isCurrent;

            return (
              <div key={player.id} className="w-full">
                <ModernRoleCard
                  player={player}
                  seatNumber={index + 1}
                  isCurrentPlayer={isCurrent}
                  myRole={myRole}
                  currentPhase={currentPhase}
                  isSelectable={isSelectable}
                  isSelected={isSelected}
                  showProtectButton={showProtect}
                  onSelect={() => onSelectPlayer && onSelectPlayer(player.id)}
                  onProtect={() => onMantriProtectPlayer && onMantriProtectPlayer(player.id)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
