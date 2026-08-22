import React, { useState, useEffect } from "react";
import { X, Award, Save, RotateCcw, AlertCircle, Search, Crown } from "lucide-react";
import { PlayerStatsRecord, adminService } from "../../services/adminService";
import { toast } from "react-toastify";

interface AdminStatsModalProps {
  isOpen: boolean;
  statsRecord: PlayerStatsRecord | null;
  onClose: () => void;
  onSaveSuccess: () => void;
}

export const AdminStatsModal: React.FC<AdminStatsModalProps> = ({
  isOpen,
  statsRecord,
  onClose,
  onSaveSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<"classic" | "detective" | "modern">("classic");

  // Classic stats
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [title, setTitle] = useState("Rookie");
  const [totalGames, setTotalGames] = useState(0);
  const [totalWins, setTotalWins] = useState(0);
  const [totalLosses, setTotalLosses] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [currentWinStreak, setCurrentWinStreak] = useState(0);

  // Classic role stats
  const [rajaAssigned, setRajaAssigned] = useState(0);
  const [raniAssigned, setRaniAssigned] = useState(0);
  const [policeCatches, setPoliceCatches] = useState(0);
  const [thiefEscaped, setThiefEscaped] = useState(0);

  // Detective Challenge stats
  const [dcGamesPlayed, setDcGamesPlayed] = useState(0);
  const [dcGamesWon, setDcGamesWon] = useState(0);
  const [dcAccuracy, setDcAccuracy] = useState(0);
  const [dcXp, setDcXp] = useState(0);
  const [dcLevel, setDcLevel] = useState(1);
  const [dcTitle, setDcTitle] = useState("Junior Detective");

  // Modern Mode stats
  const [modernGamesPlayed, setModernGamesPlayed] = useState(0);
  const [modernGamesWon, setModernGamesWon] = useState(0);
  const [modernTotalScore, setModernTotalScore] = useState(0);
  const [modernHighestScore, setModernHighestScore] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (statsRecord) {
      setLevel(statsRecord.level || 1);
      setXp(statsRecord.xp || 0);
      setTitle(statsRecord.title || "Rookie");
      setTotalGames(statsRecord.totalGames || 0);
      setTotalWins(statsRecord.totalWins || 0);
      setTotalLosses(statsRecord.totalLosses || 0);
      setTotalScore(statsRecord.totalScore || 0);
      setCurrentWinStreak(statsRecord.currentWinStreak || 0);

      setRajaAssigned(statsRecord.roleStats?.raja?.timesAssigned || 0);
      setRaniAssigned(statsRecord.roleStats?.rani?.timesAssigned || 0);
      setPoliceCatches(statsRecord.roleStats?.police?.correctCatches || 0);
      setThiefEscaped(statsRecord.roleStats?.thief?.escaped || 0);

      const dc = statsRecord.detectiveStats;
      setDcGamesPlayed(dc?.gamesPlayed || 0);
      setDcGamesWon(dc?.gamesWon || 0);
      setDcAccuracy(dc?.overallAccuracy || 0);
      setDcXp(dc?.xp || 0);
      setDcLevel(dc?.level || 1);
      setDcTitle(dc?.title || "Junior Detective");

      const md = statsRecord.modernStats;
      setModernGamesPlayed(md?.gamesPlayed || 0);
      setModernGamesWon(md?.gamesWon || 0);
      setModernTotalScore(md?.totalScore || 0);
      setModernHighestScore(md?.highestScore || 0);
    }
    setError("");
  }, [statsRecord, isOpen]);

  if (!isOpen || !statsRecord) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await adminService.updatePlayerStats(statsRecord._id, {
        level: Number(level),
        xp: Number(xp),
        title: title.trim(),
        totalGames: Number(totalGames),
        totalWins: Number(totalWins),
        totalLosses: Number(totalLosses),
        totalScore: Number(totalScore),
        currentWinStreak: Number(currentWinStreak),
        roleStats: {
          raja: { timesAssigned: Number(rajaAssigned), totalPoints: Number(rajaAssigned) * 1000 },
          rani: { timesAssigned: Number(raniAssigned), totalPoints: Number(raniAssigned) * 800 },
          police: { timesAssigned: Number(policeCatches), correctCatches: Number(policeCatches), wrongGuesses: 0 },
          thief: { timesAssigned: Number(thiefEscaped), escaped: Number(thiefEscaped), caught: 0 },
        },
        detectiveStats: {
          gamesPlayed: Number(dcGamesPlayed),
          gamesWon: Number(dcGamesWon),
          overallAccuracy: Number(dcAccuracy),
          xp: Number(dcXp),
          level: Number(dcLevel),
          title: dcTitle.trim(),
        },
        modernStats: {
          gamesPlayed: Number(modernGamesPlayed),
          gamesWon: Number(modernGamesWon),
          totalScore: Number(modernTotalScore),
          highestScore: Number(modernHighestScore),
        },
      });
      toast.success(`Stats for ${statsRecord.username} updated across all modes!`);
      onSaveSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update stats.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm(`Are you sure you want to reset all mode stats for ${statsRecord.username} to zero baseline?`)) {
      return;
    }
    setLoading(true);
    try {
      await adminService.resetPlayerStats(statsRecord._id);
      toast.success(`All mode stats for ${statsRecord.username} have been reset.`);
      onSaveSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to reset stats.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Player Multi-Mode Stats Editor: {statsRecord.username}
              </h2>
              <p className="text-xs text-slate-400">Tune stats for Classic Points, Detective Challenge & Modern Kingdom</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab("classic")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "classic"
                ? "bg-amber-500 text-black shadow-md"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Classic Points</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("detective")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "detective"
                ? "bg-cyan-500 text-black shadow-md"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Detective Challenge</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("modern")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "modern"
                ? "bg-purple-500 text-white shadow-md"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Modern Kingdom</span>
          </button>
        </div>

        {error && (
          <div className="flex items-center space-x-2 p-3 mb-4 text-sm bg-red-500/10 border border-red-500/30 rounded-xl text-red-300">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* TAB 1: CLASSIC POINTS STATS */}
          {activeTab === "classic" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Classic Level
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={level}
                    onChange={(e) => setLevel(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Classic XP
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={xp}
                    onChange={(e) => setXp(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Games Played
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={totalGames}
                    onChange={(e) => setTotalGames(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Total Wins
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={totalWins}
                    onChange={(e) => setTotalWins(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Total Losses
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={totalLosses}
                    onChange={(e) => setTotalLosses(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Win Streak
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={currentWinStreak}
                    onChange={(e) => setCurrentWinStreak(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Role Counts & Metrics
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Raja Roles</label>
                    <input
                      type="number"
                      min="0"
                      value={rajaAssigned}
                      onChange={(e) => setRajaAssigned(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Rani Roles</label>
                    <input
                      type="number"
                      min="0"
                      value={raniAssigned}
                      onChange={(e) => setRaniAssigned(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Police Catches</label>
                    <input
                      type="number"
                      min="0"
                      value={policeCatches}
                      onChange={(e) => setPoliceCatches(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Thief Escapes</label>
                    <input
                      type="number"
                      min="0"
                      value={thiefEscaped}
                      onChange={(e) => setThiefEscaped(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DETECTIVE CHALLENGE STATS */}
          {activeTab === "detective" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 p-4 bg-slate-950/60 rounded-xl border border-cyan-500/30">
                <div>
                  <label className="block text-xs font-semibold text-cyan-300 uppercase tracking-wider mb-1">
                    Detective Level
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={dcLevel}
                    onChange={(e) => setDcLevel(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-cyan-300 uppercase tracking-wider mb-1">
                    Detective XP
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={dcXp}
                    onChange={(e) => setDcXp(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-cyan-300 uppercase tracking-wider mb-1">
                    Detective Title
                  </label>
                  <input
                    type="text"
                    value={dcTitle}
                    onChange={(e) => setDcTitle(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 p-4 bg-slate-950/60 rounded-xl border border-cyan-500/30">
                <div>
                  <label className="block text-xs font-semibold text-cyan-300 uppercase tracking-wider mb-1">
                    Detective Matches
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={dcGamesPlayed}
                    onChange={(e) => setDcGamesPlayed(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-cyan-300 uppercase tracking-wider mb-1">
                    Detective Wins
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={dcGamesWon}
                    onChange={(e) => setDcGamesWon(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-cyan-300 uppercase tracking-wider mb-1">
                    Accuracy %
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={dcAccuracy}
                    onChange={(e) => setDcAccuracy(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MODERN KINGDOM STATS */}
          {activeTab === "modern" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-950/60 rounded-xl border border-purple-500/30">
                <div>
                  <label className="block text-xs font-semibold text-purple-300 uppercase tracking-wider mb-1">
                    Modern Matches
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={modernGamesPlayed}
                    onChange={(e) => setModernGamesPlayed(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-purple-300 uppercase tracking-wider mb-1">
                    Kingdom Wins
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={modernGamesWon}
                    onChange={(e) => setModernGamesWon(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-purple-300 uppercase tracking-wider mb-1">
                    Total Score
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={modernTotalScore}
                    onChange={(e) => setModernTotalScore(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-purple-300 uppercase tracking-wider mb-1">
                    Highest Match Score
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={modernHighestScore}
                    onChange={(e) => setModernHighestScore(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Modes</span>
            </button>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 px-5 py-2 text-sm font-semibold text-black bg-amber-400 hover:bg-amber-300 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save All Mode Stats</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
