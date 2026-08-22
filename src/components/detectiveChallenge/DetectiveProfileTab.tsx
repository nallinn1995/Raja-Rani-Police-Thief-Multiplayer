import React, { useEffect, useState } from "react";
import { detectiveChallengeService } from "../../services/detectiveChallengeService";
import { Search, Award, TrendingUp } from "lucide-react";

interface DetectiveProfileTabProps {
  userId: string;
}

export const DetectiveProfileTab: React.FC<DetectiveProfileTabProps> = ({ userId }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    detectiveChallengeService
      .getProfile(userId)
      .then((res) => {
        setData(res);
        setError("");
      })
      .catch((err) => {
        setError(err.message || "Failed to load Detective Challenge statistics.");
      })
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="p-8 text-center text-purple-300 animate-pulse">
        Loading Detective Challenge Statistics...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-purple-800/40 text-center text-purple-300">
        <p>{error || "No Detective Challenge stats available yet."}</p>
        <p className="text-xs text-purple-400 mt-1">Play your first Detective Challenge match to unlock stats!</p>
      </div>
    );
  }

  const stats = data.stats || {};
  const achievements = data.achievements || [];
  const recentMatches = data.recentMatches || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner Card */}
      <div className="bg-gradient-to-r from-blue-950/60 via-purple-950/80 to-slate-950/60 border border-cyan-500/40 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-xl">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shrink-0 shadow-lg">
            <Search className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl sm:text-2xl font-black text-cyan-300">Detective Challenge Statistics</h2>
              <span className="px-3 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 text-xs font-bold rounded-full uppercase">
                Tactical Mode
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Current Title: <strong className="text-amber-300">{stats.title || "Junior Detective"}</strong> | Level <strong className="text-cyan-300">{stats.level || 1}</strong>
            </p>
          </div>
        </div>

        <div className="text-right sm:text-right w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-cyan-500/20">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Investigation Accuracy</span>
          <span className="text-3xl font-black text-emerald-400">{stats.overallAccuracy || 0}%</span>
        </div>
      </div>

      {/* 8 Stat Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-[#14082e] border border-purple-800/40 rounded-2xl">
          <span className="text-[11px] font-bold text-purple-300 block uppercase">Games Played</span>
          <span className="text-2xl font-black text-white mt-1 block">{stats.gamesPlayed || 0}</span>
        </div>

        <div className="p-4 bg-[#14082e] border border-amber-500/30 rounded-2xl">
          <span className="text-[11px] font-bold text-amber-400 block uppercase">Detective Wins</span>
          <span className="text-2xl font-black text-amber-300 mt-1 block">{stats.gamesWon || 0}</span>
        </div>

        <div className="p-4 bg-[#14082e] border border-emerald-500/30 rounded-2xl">
          <span className="text-[11px] font-bold text-emerald-400 block uppercase">🎯 Correct Guesses</span>
          <span className="text-2xl font-black text-emerald-300 mt-1 block">{stats.totalCorrectGuesses || 0}</span>
        </div>

        <div className="p-4 bg-[#14082e] border border-rose-500/30 rounded-2xl">
          <span className="text-[11px] font-bold text-rose-400 block uppercase">❌ Wrong Guesses</span>
          <span className="text-2xl font-black text-rose-300 mt-1 block">{stats.totalWrongGuesses || 0}</span>
        </div>

        <div className="p-4 bg-[#14082e] border border-cyan-500/30 rounded-2xl">
          <span className="text-[11px] font-bold text-cyan-400 block uppercase">⚡ Average Speed</span>
          <span className="text-2xl font-black text-cyan-300 mt-1 block">
            {stats.averageGuessTime ? `${stats.averageGuessTime.toFixed(2)}s` : "—"}
          </span>
        </div>

        <div className="p-4 bg-[#14082e] border border-yellow-500/30 rounded-2xl">
          <span className="text-[11px] font-bold text-yellow-400 block uppercase">⚡ Fastest Guess</span>
          <span className="text-2xl font-black text-yellow-300 mt-1 block">
            {stats.fastestGuessTime ? `${stats.fastestGuessTime.toFixed(2)}s` : "—"}
          </span>
        </div>

        <div className="p-4 bg-[#14082e] border border-indigo-500/30 rounded-2xl">
          <span className="text-[11px] font-bold text-indigo-400 block uppercase">🔥 Longest Streak</span>
          <span className="text-2xl font-black text-indigo-300 mt-1 block">{stats.longestStreak || 0}</span>
        </div>

        <div className="p-4 bg-[#14082e] border border-fuchsia-500/30 rounded-2xl">
          <span className="text-[11px] font-bold text-fuchsia-400 block uppercase">Peak Accuracy</span>
          <span className="text-2xl font-black text-fuchsia-300 mt-1 block">{stats.highestAccuracy || 0}%</span>
        </div>
      </div>

      {/* Unlocked Achievements */}
      <div className="p-6 rounded-3xl bg-[#14082e]/90 border border-purple-800/50 space-y-4">
        <h3 className="font-extrabold text-white text-base flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" />
          <span>Unlocked Detective Achievements ({achievements.length})</span>
        </h3>

        {achievements.length === 0 ? (
          <p className="text-xs text-purple-400 italic">No achievements unlocked yet. Play matches to earn badges!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {achievements.map((ach: any) => (
              <div key={ach._id || ach.code} className="p-3.5 rounded-2xl bg-[#0e0422] border border-purple-700/40 flex items-center space-x-3">
                <span className="text-3xl shrink-0">{ach.icon || "🔍"}</span>
                <div>
                  <h4 className="font-extrabold text-sm text-cyan-300">{ach.title}</h4>
                  <p className="text-[11px] text-purple-300 mt-0.5">{ach.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Matches Log */}
      <div className="p-6 rounded-3xl bg-[#14082e]/90 border border-purple-800/50 space-y-4">
        <h3 className="font-extrabold text-white text-base flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          <span>Recent Detective Challenge Matches</span>
        </h3>

        {recentMatches.length === 0 ? (
          <p className="text-xs text-purple-400 italic">No recent match history found.</p>
        ) : (
          <div className="space-y-2">
            {recentMatches.map((m: any, idx: number) => (
              <div key={m._id || idx} className="p-3.5 rounded-xl bg-[#0e0422] border border-purple-900/40 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-0.5 rounded font-black text-[10px] uppercase ${m.matchResult === "win" ? "bg-amber-500/20 text-amber-300 border border-amber-400/40" : "bg-purple-900/40 text-purple-300"}`}>
                    {m.matchResult === "win" ? "Champion" : `Rank #${m.rank}`}
                  </span>
                  <span className="font-bold text-white">Room {m.roomCode}</span>
                </div>

                <div className="flex items-center space-x-4">
                  <span className="text-emerald-400 font-bold">Accuracy: {m.accuracy || 0}%</span>
                  <span className="text-cyan-300 font-bold">Avg Speed: {(m.avgGuessTime || 0).toFixed(2)}s</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
