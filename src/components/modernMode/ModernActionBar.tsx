import React from 'react';
import { Shield, CheckCircle2, ThumbsUp, ThumbsDown } from 'lucide-react';
import { ModernRole, MODERN_ROLES_CONFIG } from '../../types/modernMode';

interface ModernActionBarProps {
  myRole: ModernRole | null;
  currentPhase: string;
  selectedPlayerId: string | null;
  selectedPlayerName: string | null;
  hasSubmittedAction: boolean;
  mantriDecision: 'yes' | 'no' | null;
  onMantriDecisionChange: (decision: 'yes' | 'no') => void;
  onConfirmAction: (targetId?: string) => void;
  onVillagerWitnessChoice?: (choice: 'agree' | 'disagree') => void;
  onMantriShieldChoice?: (targetId: string | null) => void;
}

export const ModernActionBar: React.FC<ModernActionBarProps> = ({
  myRole,
  currentPhase,
  selectedPlayerId,
  selectedPlayerName,
  hasSubmittedAction,
  mantriDecision,
  onMantriDecisionChange,
  onConfirmAction,
  onVillagerWitnessChoice,
  onMantriShieldChoice,
}) => {
  if (!myRole) return null;

  const roleConfig = myRole ? MODERN_ROLES_CONFIG[myRole] : null;

  // Render role objective content
  const renderContent = () => {
    // 1. MANTRI SHIELD PHASE
    if (currentPhase === 'mantri-shield') {
      if (myRole === 'Mantri') {
        if (hasSubmittedAction) {
          return (
            <div className="text-center text-xs text-emerald-300 font-bold flex items-center justify-center gap-2 py-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Royal Shield Choice Submitted & Locked ✓</span>
            </div>
          );
        }

        if (mantriDecision === null) {
          return (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-left">
                <div className="w-12 h-12 rounded-2xl bg-indigo-900 border border-indigo-400 flex items-center justify-center p-1 shrink-0">
                  {roleConfig?.image ? (
                    <img src={roleConfig.image} alt="Mantri" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-2xl">🏛️</span>
                  )}
                </div>
                <div>
                  <h4 className="font-black text-yellow-300 text-sm sm:text-base tracking-wide">
                    🏛️ Royal Protection Order
                  </h4>
                  <p className="text-xs text-purple-200">
                    "The Kingdom depends on your wisdom. Choose ONE player to receive Royal Protection."
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => onMantriDecisionChange('yes')}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-black text-xs uppercase tracking-wider shadow-lg transition cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  <Shield className="w-4 h-4 text-yellow-300 fill-current" />
                  <span>YES, PROTECT MEMBER</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onMantriDecisionChange('no');
                    if (onMantriShieldChoice) onMantriShieldChoice(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs uppercase tracking-wider transition cursor-pointer active:scale-95"
                >
                  <span>NO, SKIP</span>
                </button>
              </div>
            </div>
          );
        }

        if (mantriDecision === 'yes') {
          return (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-xl bg-indigo-900 border border-indigo-400 flex items-center justify-center text-xl shrink-0 p-1">
                  {roleConfig?.image ? (
                    <img src={roleConfig.image} alt="Mantri" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-xl">🏛️</span>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-yellow-300 text-sm">
                    Select Kingdom Member to Protect
                  </h4>
                  <p className="text-xs text-purple-200">
                    Click the <span className="text-yellow-300 font-bold">"🛡️ PROTECT"</span> button on any player card above!
                  </p>
                </div>
              </div>

              {selectedPlayerId && (
                <button
                  onClick={() => selectedPlayerId && onMantriShieldChoice && onMantriShieldChoice(selectedPlayerId)}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-700 text-white hover:scale-105 shadow-[0_0_20px_rgba(99,102,241,0.5)] cursor-pointer"
                >
                  Confirm Protect {selectedPlayerName}
                </button>
              )}
            </div>
          );
        }
      }

      return (
        <div className="text-center text-xs text-purple-300 flex items-center justify-center gap-2 py-1">
          <span className="animate-spin text-indigo-400">🏛️</span>
          <span>Mantri is secretly choosing whether to protect a kingdom member with the Royal Shield...</span>
        </div>
      );
    }

    // 2. ROYAL PHASE
    if (currentPhase === 'royal-phase') {
      if (myRole === 'Raja') {
        return (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-left">
              <div className="w-12 h-12 rounded-2xl bg-amber-900 border border-yellow-400 flex items-center justify-center p-1 shrink-0">
                {roleConfig?.image ? (
                  <img src={roleConfig.image} alt="Raja" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-2xl">👑</span>
                )}
              </div>
              <div>
                <h4 className="font-bold text-yellow-300 text-sm">
                  Identify the Queen (Rani)
                </h4>
                <p className="text-xs text-purple-200">
                  Select who you believe is the Rani. Correct choice earns <span className="text-green-400 font-bold">+100 Bonus</span>.
                </p>
              </div>
            </div>

            <button
              disabled={!selectedPlayerId || hasSubmittedAction}
              onClick={() => selectedPlayerId && onConfirmAction(selectedPlayerId)}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition ${
                selectedPlayerId && !hasSubmittedAction
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-black hover:scale-105 shadow-[0_0_20px_rgba(234,179,8,0.5)] cursor-pointer'
                  : 'bg-gray-800 text-gray-400 cursor-not-allowed opacity-60'
              }`}
            >
              {hasSubmittedAction ? 'Choice Locked ✓' : selectedPlayerId ? `Select ${selectedPlayerName}` : 'Click Suspect Below'}
            </button>
          </div>
        );
      }

      if (myRole === 'Rani') {
        return (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-left">
              <div className="w-12 h-12 rounded-2xl bg-pink-900 border border-pink-400 flex items-center justify-center p-1 shrink-0">
                {roleConfig?.image ? (
                  <img src={roleConfig.image} alt="Rani" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-2xl">👸</span>
                )}
              </div>
              <div>
                <h4 className="font-bold text-pink-300 text-sm">
                  Identify the King (Raja)
                </h4>
                <p className="text-xs text-purple-200">
                  Select who you believe is the Raja. Correct choice earns <span className="text-green-400 font-bold">+100 Bonus</span>.
                </p>
              </div>
            </div>

            <button
              disabled={!selectedPlayerId || hasSubmittedAction}
              onClick={() => selectedPlayerId && onConfirmAction(selectedPlayerId)}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition ${
                selectedPlayerId && !hasSubmittedAction
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:scale-105 shadow-[0_0_20px_rgba(236,72,153,0.5)] cursor-pointer'
                  : 'bg-gray-800 text-gray-400 cursor-not-allowed opacity-60'
              }`}
            >
              {hasSubmittedAction ? 'Choice Locked ✓' : selectedPlayerId ? `Select ${selectedPlayerName}` : 'Click Suspect Below'}
            </button>
          </div>
        );
      }

      return (
        <div className="text-center text-xs text-purple-300 flex items-center justify-center gap-2 py-1">
          <span className="animate-pulse text-yellow-400">🏰</span>
          <span>Raja and Rani are secretly identifying each other. Please wait...</span>
        </div>
      );
    }

    // 3. INVESTIGATION PHASE
    if (currentPhase === 'investigation-phase') {
      if (myRole === 'Police') {
        return (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-left">
              <div className="w-12 h-12 rounded-2xl bg-blue-900 border border-blue-400 flex items-center justify-center p-1 shrink-0">
                {roleConfig?.image ? (
                  <img src={roleConfig.image} alt="Police" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-2xl">👮</span>
                )}
              </div>
              <div>
                <h4 className="font-bold text-cyan-300 text-sm">
                  Identify & Accuse the Thief
                </h4>
                <p className="text-xs text-purple-200">
                  Catch the Thief to earn <span className="text-green-400 font-bold">500 + 100 Bonus</span> and restore stolen kingdom loot!
                </p>
              </div>
            </div>

            <button
              disabled={!selectedPlayerId || hasSubmittedAction}
              onClick={() => selectedPlayerId && onConfirmAction(selectedPlayerId)}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition ${
                selectedPlayerId && !hasSubmittedAction
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white hover:scale-105 shadow-[0_0_20px_rgba(59,130,246,0.5)] cursor-pointer'
                  : 'bg-gray-800 text-gray-400 cursor-not-allowed opacity-60'
              }`}
            >
              {hasSubmittedAction ? 'Accusation Submitted ✓' : selectedPlayerId ? `Accuse ${selectedPlayerName}` : 'Click Suspect Below'}
            </button>
          </div>
        );
      }

      return (
        <div className="text-center text-xs text-purple-300 flex items-center justify-center gap-2 py-1">
          <span className="animate-pulse text-cyan-400">🚨</span>
          <span>Police is actively investigating who stole the kingdom loot...</span>
        </div>
      );
    }

    // 4. VILLAGER WITNESS PHASE
    if (currentPhase === 'witness-phase') {
      if (myRole === 'Villager') {
        return (
          <div className="flex flex-col items-center justify-center gap-3 text-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg overflow-hidden">
                {roleConfig?.image ? (
                  <img src={roleConfig.image} alt="Villager" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-xl">👨</span>
                )}
              </div>
              <h4 className="font-bold text-amber-300 text-sm">
                Witness Statement Popup
              </h4>
            </div>
            <p className="text-xs text-purple-200 max-w-md">
              Do you trust the Police investigation? Select your choice:
            </p>

            <div className="flex gap-4 mt-1">
              <button
                disabled={hasSubmittedAction}
                onClick={() => onVillagerWitnessChoice && onVillagerWitnessChoice('agree')}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition"
              >
                <ThumbsUp className="w-4 h-4" />
                <span>👍 Agree (+100 if Police Correct)</span>
              </button>

              <button
                disabled={hasSubmittedAction}
                onClick={() => onVillagerWitnessChoice && onVillagerWitnessChoice('disagree')}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition"
              >
                <ThumbsDown className="w-4 h-4" />
                <span>👎 Disagree (+100 if Police Wrong)</span>
              </button>
            </div>
          </div>
        );
      }

      return (
        <div className="text-center text-xs text-purple-300 flex items-center justify-center gap-2 py-1">
          <span className="animate-bounce text-amber-400">👨</span>
          <span>Villager is submitting witness statement...</span>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="w-full max-w-4xl mx-auto z-30 px-4 py-3 bg-[#16092B]/95 backdrop-blur-xl border-2 border-purple-500/40 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.6)] mt-1 mb-1">
      <div className="w-full">{renderContent()}</div>
    </div>
  );
};
