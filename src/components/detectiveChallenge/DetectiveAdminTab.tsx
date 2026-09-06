import React, { useEffect, useState, useCallback } from "react";
import { detectiveChallengeService } from "../../services/detectiveChallengeService";
import { adminService } from "../../services/adminService";
import { Trophy, Timer, Target, Users, Activity, BarChart2, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

export const DetectiveAdminTab: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const loadDashboard = useCallback(() => {
    setLoading(true);
    detectiveChallengeService
      .getAdminDashboard()
      .then((res) => {
        setData(res);
        setError("");
      })
      .catch((err) => {
        setError(err.message || "Failed to load Detective Challenge analytics.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleDeleteLeaderboard = async (item: any) => {
    const id = item._id || item.userId;
    if (!window.confirm(`Are you sure you want to delete ${item.username}'s Detective Challenge leaderboard record?`)) {
      return;
    }
    try {
      await detectiveChallengeService.deleteDetectiveLeaderboardRecord(id);
      toast.success(`Deleted ${item.username}'s detective record.`);
      loadDashboard();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete detective record");
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!window.confirm("Are you sure you want to delete this Detective Challenge match record?")) {
      return;
    }
    try {
      await adminService.deleteMatch(matchId);
      toast.success("Detective Challenge match record deleted.");
      loadDashboard();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete match record");
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-purple-300 animate-pulse">
        Loading Detective Challenge Admin Analytics...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-purple-800/40 text-center text-purple-300">
        <p>{error || "No Detective Challenge analytics available."}</p>
      </div>
    );
  }

  const metrics = data.metrics || {};
  const topLeaderboard = data.topLeaderboard || [];
  const recentMatches = data.recentMatches || [];
  const matchesPerDay = data.matchesPerDay || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Overview Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#14082e] border border-cyan-500/30">
          <div className="flex items-center justify-between text-cyan-400 mb-1">
            <span className="text-[11px] font-bold uppercase">Total Matches</span>
            <Activity className="w-4 h-4" />
          </div>
          <span className="text-3xl font-black text-white">{metrics.totalMatches || 0}</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#14082e] border border-purple-500/30">
          <div className="flex items-center justify-between text-purple-400 mb-1">
            <span className="text-[11px] font-bold uppercase">Active Detectives</span>
            <Users className="w-4 h-4" />
          </div>
          <span className="text-3xl font-black text-white">{metrics.activePlayers || 0}</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#14082e] border border-emerald-500/30">
          <div className="flex items-center justify-between text-emerald-400 mb-1">
            <span className="text-[11px] font-bold uppercase">Average Accuracy</span>
            <Target className="w-4 h-4" />
          </div>
          <span className="text-3xl font-black text-emerald-300">{metrics.avgAccuracy || 0}%</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#14082e] border border-yellow-500/30">
          <div className="flex items-center justify-between text-yellow-400 mb-1">
            <span className="text-[11px] font-bold uppercase">Fastest Catch Ever</span>
            <Timer className="w-4 h-4" />
          </div>
          <span className="text-3xl font-black text-yellow-300">
            {metrics.fastestGuessEver ? `${metrics.fastestGuessEver.toFixed(2)}s` : "—"}
          </span>
        </div>
      </div>

      {/* Matches per day chart bars */}
      <div className="p-6 rounded-3xl bg-[#14082e]/90 border border-purple-800/50 space-y-4">
        <h3 className="font-extrabold text-white text-base flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-cyan-400" />
          <span>Matches Per Day (Last 7 Days)</span>
        </h3>

        <div className="grid grid-cols-7 gap-2 pt-2 text-center">
          {matchesPerDay.map((d: any, idx: number) => (
            <div key={idx} className="space-y-2">
              <div className="h-24 bg-purple-950/60 rounded-xl flex items-end justify-center p-1 border border-purple-800/30">
                <div
                  className="w-full bg-gradient-to-t from-cyan-500 to-blue-600 rounded-lg transition-all"
                  style={{ height: `${Math.min(100, (d.count / (metrics.totalMatches || 1)) * 100 + 10)}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-purple-300 block">{d.date.slice(5)}</span>
              <span className="text-xs font-black text-cyan-300">{d.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Detective Challenge Matches Table */}
      <div className="bg-[#14082e]/90 border border-purple-800/50 rounded-3xl overflow-hidden">
        <div className="p-5 border-b border-purple-900/50 flex items-center justify-between">
          <h3 className="font-extrabold text-white text-base flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <span>Recent Detective Challenge Matches</span>
          </h3>
          <span className="text-xs text-purple-400 font-semibold">Latest 10 Games</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#0e0422] text-purple-300 uppercase tracking-wider font-extrabold border-b border-purple-900/40">
              <tr>
                <th className="p-3.5">Room Code</th>
                <th className="p-3.5">Champion Detective</th>
                <th className="p-3.5 text-center">Detectives</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-900/30 font-medium">
              {recentMatches.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-purple-400/60">
                    No Detective Challenge matches recorded yet.
                  </td>
                </tr>
              ) : (
                recentMatches.map((m: any) => (
                  <tr key={m._id} className="hover:bg-purple-950/40 transition-colors">
                    <td className="p-3.5 font-bold text-cyan-400">{m.roomCode}</td>
                    <td className="p-3.5 font-bold text-emerald-400">{m.championUsername || "None"}</td>
                    <td className="p-3.5 text-center text-purple-200">{m.players?.length || 0} Detectives</td>
                    <td className="p-3.5 text-purple-300/70">
                      {new Date(m.endedAt || m.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleDeleteMatch(m._id)}
                        className="p-1.5 text-red-400 hover:text-red-300 bg-purple-950/80 hover:bg-red-500/20 rounded-lg transition-colors"
                        title="Delete Match Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Detectives Leaderboard Table */}
      <div className="bg-[#14082e]/90 border border-purple-800/50 rounded-3xl overflow-hidden">
        <div className="p-5 border-b border-purple-900/50 flex items-center justify-between">
          <h3 className="font-extrabold text-white text-base flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>Top Detectives (Highest Accuracy)</span>
          </h3>
          <span className="text-xs text-amber-400 font-semibold">Ranked Leaderboard</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#0e0422] text-purple-300 uppercase tracking-wider font-extrabold border-b border-purple-900/40">
              <tr>
                <th className="p-3.5 text-center w-14">Rank</th>
                <th className="p-3.5">Detective</th>
                <th className="p-3.5">Title</th>
                <th className="p-3.5 text-center">Accuracy</th>
                <th className="p-3.5 text-center">Wins</th>
                <th className="p-3.5 text-center">Correct Catches</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-900/30 font-medium">
              {topLeaderboard.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-purple-400/60">
                    No detective leaderboard entries found.
                  </td>
                </tr>
              ) : (
                topLeaderboard.map((item: any) => (
                  <tr key={item.rank} className="hover:bg-purple-950/40 transition-colors">
                    <td className="p-3.5 text-center">
                      <span className="w-6 h-6 rounded-lg bg-amber-400 text-slate-950 font-black text-xs inline-flex items-center justify-center">
                        #{item.rank}
                      </span>
                    </td>
                    <td className="p-3.5 font-extrabold text-white">{item.username}</td>
                    <td className="p-3.5">
                      <span className="text-[10px] text-purple-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-800/40">
                        {item.title}
                      </span>
                    </td>
                    <td className="p-3.5 text-center font-bold text-emerald-400">
                      {item.metrics?.accuracy || 0}%
                    </td>
                    <td className="p-3.5 text-center font-bold text-cyan-300">
                      {item.metrics?.totalWins || 0}
                    </td>
                    <td className="p-3.5 text-center font-mono text-purple-200">
                      {item.metrics?.correctCount || 0}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleDeleteLeaderboard(item)}
                        className="p-1.5 text-red-400 hover:text-red-300 bg-purple-950/80 hover:bg-red-500/20 rounded-lg transition-colors"
                        title="Delete Detective Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
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
