import React, { useEffect, useState } from 'react';
import { Crown, Target, Flame, Award, CheckCircle2 } from 'lucide-react';
import { modernModeService } from '../../services/modernMode/modernModeService';
import type { ModernPlayerStatsData, ModernAchievementData } from '../../types/modernMode';

interface ModernProfileTabProps {
  userId: string;
}

export const ModernProfileTab: React.FC<ModernProfileTabProps> = ({ userId }) => {
  const [stats, setStats] = useState<ModernPlayerStatsData | null>(null);
  const [achievements, setAchievements] = useState<ModernAchievementData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [statsData, achData] = await Promise.all([
        modernModeService.getProfileStats(userId),
        modernModeService.getAchievements(userId),
      ]);
      setStats(statsData);
      setAchievements(achData);
      setLoading(false);
    }
    if (userId) {
      loadData();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-purple-300 gap-3">
        <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        <span>Loading Modern Mode Profile Statistics...</span>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8 text-center text-gray-400 bg-purple-950/40 rounded-2xl border border-purple-800/40">
        No Modern Mode statistics recorded yet. Play a 6-player Modern Mode match to unlock your kingdom profile!
      </div>
    );
  }

  const winRate = stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0;
  const averageFinalScore = stats.gamesPlayed > 0 ? Math.round(stats.totalScore / stats.gamesPlayed) : 0;
  const totalPoliceAttempts = stats.policeCatches + stats.policeWrongGuesses;
  const policeSuccessRate = totalPoliceAttempts > 0 ? Math.round((stats.policeCatches / totalPoliceAttempts) * 100) : 0;
  const thiefEscapeRate = stats.timesThief > 0 ? Math.round((stats.thiefEscapes / stats.timesThief) * 100) : 0;

  return (
    <div className="space-y-6 font-sans text-white">
      {/* Top Stat Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-purple-950/70 border border-yellow-500/40 shadow-lg">
          <div className="flex items-center gap-2 text-xs text-yellow-300 font-semibold mb-1 uppercase tracking-wider">
            <img src="/assets/images/trophy.png" className="w-4 h-4 object-contain" alt="Trophy" />
            Games Won
          </div>
          <div className="text-2xl font-black font-mono text-yellow-400">
            {stats.gamesWon} <span className="text-xs text-gray-400">({winRate}%)</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-purple-950/70 border border-purple-500/40 shadow-lg">
          <div className="flex items-center gap-2 text-xs text-purple-300 font-semibold mb-1 uppercase tracking-wider">
            <Target className="w-4 h-4 text-purple-400" />
            Avg Final Score
          </div>
          <div className="text-2xl font-black font-mono text-white">
            {averageFinalScore} pts
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-purple-950/70 border border-emerald-500/40 shadow-lg">
          <div className="flex items-center gap-2 text-xs text-emerald-300 font-semibold mb-1 uppercase tracking-wider">
            <Flame className="w-4 h-4 text-emerald-400" />
            Highest Score
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400">
            {stats.highestScore} pts
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-purple-950/70 border border-blue-500/40 shadow-lg">
          <div className="flex items-center gap-2 text-xs text-blue-300 font-semibold mb-1 uppercase tracking-wider">
            <Crown className="w-4 h-4 text-blue-400" />
            Win Streak
          </div>
          <div className="text-2xl font-black font-mono text-blue-300">
            {stats.currentWinStreak} <span className="text-xs text-gray-400">(Max {stats.longestWinStreak})</span>
          </div>
        </div>
      </div>

      {/* Role Counts & Efficiencies Grid */}
      <div className="p-6 rounded-2xl bg-[#1A0B2E]/90 border border-purple-800/50 shadow-xl space-y-4">
        <h3 className="text-lg font-bold text-yellow-400 flex items-center gap-2 title-font">
          <Crown className="w-5 h-5 text-yellow-400" />
          Kingdom Role Performance
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-center">
          <div className="p-3 rounded-xl bg-purple-950/80 border border-amber-500/30 flex flex-col items-center">
            <img src="/assets/images/raja.png" alt="Raja" className="w-10 h-10 object-contain mb-1" />
            <div className="text-xs font-bold text-yellow-300">Raja</div>
            <div className="text-sm font-black font-mono text-white mt-0.5">{stats.timesRaja}</div>
            <div className="text-[10px] text-green-400 font-semibold mt-1">{stats.correctRajaGuesses} Queen Guesses</div>
          </div>

          <div className="p-3 rounded-xl bg-purple-950/80 border border-pink-500/30 flex flex-col items-center">
            <img src="/assets/images/rani.png" alt="Rani" className="w-10 h-10 object-contain mb-1" />
            <div className="text-xs font-bold text-pink-300">Rani</div>
            <div className="text-sm font-black font-mono text-white mt-0.5">{stats.timesRani}</div>
            <div className="text-[10px] text-green-400 font-semibold mt-1">{stats.correctRaniGuesses} King Guesses</div>
          </div>

          <div className="p-3 rounded-xl bg-purple-950/80 border border-blue-500/30 flex flex-col items-center">
            <img src="/assets/images/police.png" alt="Police" className="w-10 h-10 object-contain mb-1" />
            <div className="text-xs font-bold text-cyan-300">Police</div>
            <div className="text-sm font-black font-mono text-white mt-0.5">{stats.timesPolice}</div>
            <div className="text-[10px] text-cyan-400 font-semibold mt-1">{policeSuccessRate}% Catch Rate</div>
          </div>

          <div className="p-3 rounded-xl bg-purple-950/80 border border-emerald-500/30 flex flex-col items-center">
            <img src="/assets/images/thief.png" alt="Thief" className="w-10 h-10 object-contain mb-1" />
            <div className="text-xs font-bold text-emerald-300">Thief</div>
            <div className="text-sm font-black font-mono text-white mt-0.5">{stats.timesThief}</div>
            <div className="text-[10px] text-emerald-400 font-semibold mt-1">{thiefEscapeRate}% Escape Rate</div>
          </div>

          <div className="p-3 rounded-xl bg-purple-950/80 border border-indigo-500/30 flex flex-col items-center">
            <img src="/assets/images/mantri.png" alt="Mantri" className="w-10 h-10 object-contain mb-1" />
            <div className="text-xs font-bold text-indigo-300">Mantri</div>
            <div className="text-sm font-black font-mono text-white mt-0.5">{stats.timesMantri}</div>
            <div className="text-[10px] text-indigo-300 font-semibold mt-1">{stats.mantriShieldSuccesses} Shields Saved</div>
          </div>

          <div className="p-3 rounded-xl bg-purple-950/80 border border-amber-600/30 flex flex-col items-center">
            <img src="/assets/images/villager.png" alt="Villager" className="w-10 h-10 object-contain mb-1" />
            <div className="text-xs font-bold text-amber-300">Villager</div>
            <div className="text-sm font-black font-mono text-white mt-0.5">{stats.timesVillager}</div>
            <div className="text-[10px] text-amber-400 font-semibold mt-1">{stats.villagerWitnessBonuses + stats.villagerInsightBonuses} Bonuses</div>
          </div>
        </div>
      </div>

      {/* Modern Achievements Section - ONLY UNLOCKED ACHIEVEMENTS DISPLAYED */}
      {(() => {
        const unlockedList = achievements.filter((a) => a.unlocked);
        return (
          <div className="p-6 rounded-2xl bg-[#1A0B2E]/90 border border-purple-800/50 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-yellow-400 flex items-center gap-2 title-font">
              <Award className="w-5 h-5 text-yellow-400" />
              Unlocked Modern Mode Achievements ({unlockedList.length})
            </h3>

            {unlockedList.length === 0 ? (
              <div className="text-center py-4 space-y-1">
                <p className="text-xs text-purple-300">No unlocked Modern Mode achievements yet.</p>
                <p className="text-[11px] text-purple-400">
                  (View and track all achievement progress in the main <strong className="text-amber-300">Achievements</strong> menu)
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {unlockedList.map((ach) => (
                  <div
                    key={ach.id}
                    className="p-3.5 rounded-xl border flex items-center gap-3 bg-gradient-to-r from-yellow-950/60 to-purple-950/60 border-yellow-500/50"
                  >
                    <div className="text-3xl shrink-0">{ach.icon}</div>
                    <div className="overflow-hidden text-left">
                      <div className="font-bold text-xs text-white flex items-center gap-1.5 truncate">
                        <span>{ach.title}</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                      </div>
                      <div className="text-[11px] text-gray-400 truncate">{ach.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
};
