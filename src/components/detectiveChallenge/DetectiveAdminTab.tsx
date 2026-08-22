import React, { useEffect, useState } from "react";
import { detectiveChallengeService } from "../../services/detectiveChallengeService";
import { Trophy, Timer, Target, Users, Activity, BarChart2 } from "lucide-react";

export const DetectiveAdminTab: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
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

      {/* Top Detectives Leaderboard Table */}
      <div className="p-6 rounded-3xl bg-[#14082e]/90 border border-purple-800/50 space-y-4">
        <h3 className="font-extrabold text-white text-base flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <span>Top Detectives (Highest Accuracy)</span>
        </h3>

        <div className="space-y-2">
          {topLeaderboard.map((item: any) => (
            <div key={item.rank} className="p-3.5 rounded-xl bg-[#0e0422] border border-purple-900/40 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3">
                <span className="w-6 h-6 rounded-lg bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">
                  #{item.rank}
                </span>
                <span className="font-extrabold text-white">{item.username}</span>
                <span className="text-[10px] text-purple-300 bg-purple-950 px-2 py-0.5 rounded">{item.title}</span>
              </div>

              <div className="flex items-center space-x-4">
                <span className="text-emerald-400 font-bold">Accuracy: {item.metrics?.accuracy}%</span>
                <span className="text-cyan-300 font-bold">Wins: {item.metrics?.totalWins}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
