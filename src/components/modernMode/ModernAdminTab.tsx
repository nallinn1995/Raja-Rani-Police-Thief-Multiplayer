import React, { useEffect, useState } from "react";
import { Crown, Trophy, Users, RefreshCw, Activity, Award, Sparkles } from "lucide-react";
import { adminService, ModernAdminDashboardData } from "../../services/adminService";
import { toast } from "react-toastify";

export const ModernAdminTab: React.FC = () => {
  const [data, setData] = useState<ModernAdminDashboardData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchModernAdminData = async () => {
    try {
      setLoading(true);
      const res = await adminService.getModernModeAdminData();
      setData(res);
    } catch (err: any) {
      toast.error(err.message || "Failed to load Modern Mode admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModernAdminData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Crown className="w-5 h-5 text-purple-400" />
              <span>Modern Kingdom Mode Admin Dashboard</span>
            </h2>
            <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-full">
              6 Roles
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time analytics, 6-role assignments, match logs, and top Kingdom leaderboards
          </p>
        </div>

        <button
          onClick={fetchModernAdminData}
          disabled={loading}
          className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-purple-400" : ""}`} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Kingdom Matches</span>
            <Trophy className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-3xl font-black text-white">{data?.metrics?.totalMatches || 0}</p>
          <p className="text-[11px] text-slate-500 mt-1">Recorded match logs</p>
        </div>

        <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Kingdom Players</span>
            <Users className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-3xl font-black text-white">{data?.metrics?.totalPlayers || 0}</p>
          <p className="text-[11px] text-slate-500 mt-1">Active player records</p>
        </div>

        <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Score / Player</span>
            <Award className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-white">{data?.metrics?.avgScorePerPlayer || 0} pts</p>
          <p className="text-[11px] text-slate-500 mt-1">Lifetime score average</p>
        </div>

        <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Game Structure</span>
            <Sparkles className="w-5 h-5 text-cyan-400" />
          </div>
          <p className="text-3xl font-black text-white">6 Roles</p>
          <p className="text-[11px] text-slate-500 mt-1">Raja, Rani, Mantri, Police, Thief, Villager</p>
        </div>
      </div>

      {/* 6 Kingdom Roles Assignments Distribution */}
      <div className="bg-slate-950/70 border border-purple-500/30 rounded-2xl p-4 space-y-3">
        <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center space-x-2">
          <Crown className="w-4 h-4" />
          <span>Kingdom Role Assignments Breakdown</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          <div className="p-3 bg-slate-900/80 border border-amber-500/30 rounded-xl text-center">
            <span className="text-lg block">👑</span>
            <span className="text-[10px] font-bold text-amber-400 uppercase block mt-1">Raja</span>
            <span className="text-xl font-extrabold text-white block mt-0.5">
              {data?.metrics?.rolesCount?.raja || 0}
            </span>
          </div>
          <div className="p-3 bg-slate-900/80 border border-pink-500/30 rounded-xl text-center">
            <span className="text-lg block">👸</span>
            <span className="text-[10px] font-bold text-pink-400 uppercase block mt-1">Rani</span>
            <span className="text-xl font-extrabold text-white block mt-0.5">
              {data?.metrics?.rolesCount?.rani || 0}
            </span>
          </div>
          <div className="p-3 bg-slate-900/80 border border-indigo-500/30 rounded-xl text-center">
            <span className="text-lg block">🏛️</span>
            <span className="text-[10px] font-bold text-indigo-400 uppercase block mt-1">Mantri</span>
            <span className="text-xl font-extrabold text-white block mt-0.5">
              {data?.metrics?.rolesCount?.mantri || 0}
            </span>
          </div>
          <div className="p-3 bg-slate-900/80 border border-blue-500/30 rounded-xl text-center">
            <span className="text-lg block">👮</span>
            <span className="text-[10px] font-bold text-blue-400 uppercase block mt-1">Police</span>
            <span className="text-xl font-extrabold text-white block mt-0.5">
              {data?.metrics?.rolesCount?.police || 0}
            </span>
          </div>
          <div className="p-3 bg-slate-900/80 border border-amber-500/30 rounded-xl text-center">
            <span className="text-lg block">🕵️</span>
            <span className="text-[10px] font-bold text-amber-400 uppercase block mt-1">Thief</span>
            <span className="text-xl font-extrabold text-white block mt-0.5">
              {data?.metrics?.rolesCount?.thief || 0}
            </span>
          </div>
          <div className="p-3 bg-slate-900/80 border border-emerald-500/30 rounded-xl text-center">
            <span className="text-lg block">👨</span>
            <span className="text-[10px] font-bold text-emerald-400 uppercase block mt-1">Villager</span>
            <span className="text-xl font-extrabold text-white block mt-0.5">
              {data?.metrics?.rolesCount?.villager || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Modern Kingdom Matches */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-white flex items-center space-x-2">
            <Activity className="w-4 h-4 text-purple-400" />
            <span>Recent Modern Kingdom Matches</span>
          </h3>
          <span className="text-xs text-slate-400 font-semibold">Latest 10 Games</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-extrabold border-b border-slate-800">
              <tr>
                <th className="p-3">Room Code</th>
                <th className="p-3">Winner</th>
                <th className="p-3">Rounds</th>
                <th className="p-3">Duration</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {(!data?.recentMatches || data.recentMatches.length === 0) ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500">
                    No Modern Kingdom match logs recorded yet.
                  </td>
                </tr>
              ) : (
                data.recentMatches.map((m) => (
                  <tr key={m._id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="p-3 font-bold text-purple-400">{m.roomCode}</td>
                    <td className="p-3 font-bold text-emerald-400">{m.winnerName || "None"}</td>
                    <td className="p-3 text-slate-300">{m.totalRounds || 5}</td>
                    <td className="p-3 text-slate-400">{m.duration || 0}s</td>
                    <td className="p-3 text-slate-400">{new Date(m.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Modern Kingdom Leaderboard Snapshot */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-white flex items-center space-x-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Top Modern Kingdom Leaderboard</span>
          </h3>
          <span className="text-xs text-purple-400 font-semibold">Ranked by Wins & Total Score</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-extrabold border-b border-slate-800">
              <tr>
                <th className="p-3 text-center w-12">Rank</th>
                <th className="p-3">Player</th>
                <th className="p-3 text-center">Level</th>
                <th className="p-3 text-center">Wins</th>
                <th className="p-3 text-center">Total Score</th>
                <th className="p-3 text-center">Highest Score</th>
                <th className="p-3 text-center">Streak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {(!data?.topLeaderboard || data.topLeaderboard.length === 0) ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500">
                    No Modern Mode leaderboard entries found.
                  </td>
                </tr>
              ) : (
                data.topLeaderboard.map((item) => (
                  <tr key={item.userId || item.rank} className="hover:bg-slate-900/60 transition-colors">
                    <td className="p-3 text-center">
                      <span className="font-extrabold text-amber-400">#{item.rank}</span>
                    </td>
                    <td className="p-3 font-bold text-white">{item.username}</td>
                    <td className="p-3 text-center font-bold text-purple-400">Lvl {item.level}</td>
                    <td className="p-3 text-center font-bold text-emerald-400">{item.gamesWon} W</td>
                    <td className="p-3 text-center font-mono font-bold text-amber-300">{item.totalScore} pts</td>
                    <td className="p-3 text-center font-mono text-cyan-300">{item.highestScore} pts</td>
                    <td className="p-3 text-center font-bold text-purple-300">{item.currentWinStreak} (Best: {item.longestWinStreak})</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
