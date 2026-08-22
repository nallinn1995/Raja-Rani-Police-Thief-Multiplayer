import React from "react";
import { Clock } from "lucide-react";
import { RoundSummaryLog } from "../../types/game";

interface TimelineProps {
  roundSummaries: RoundSummaryLog[];
}

export const Timeline: React.FC<TimelineProps> = ({ roundSummaries }) => {
  if (!roundSummaries || roundSummaries.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-purple-300 font-medium">
        No round history logs recorded yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2 text-xs font-bold text-blue-300 uppercase tracking-widest">
        <Clock className="w-4 h-4 text-blue-400" />
        <span>Round Investigation Timeline</span>
      </div>

      <div className="space-y-2 relative border-l-2 border-purple-800/60 ml-3 pl-4">
        {roundSummaries.map((log, idx) => (
          <div key={idx} className="relative group">
            {/* Timeline Dot */}
            <div
              className={`absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-[#11052C] ${
                log.isCorrect ? "bg-emerald-400" : "bg-rose-400"
              }`}
            />

            <div className="p-3 rounded-xl bg-[#12072B] border border-[#3A1C61] hover:border-[#5A2C81] transition-all text-xs flex items-center justify-between gap-3 shadow-inner">
              <div>
                <span className="font-extrabold text-amber-400 mr-2">Round {log.roundNumber}</span>
                <span className="text-purple-200">
                  <strong>{log.policeName}</strong> guessed <strong>{log.policeSelected}</strong>
                </span>
                <div className="text-[11px] text-purple-400 mt-0.5">
                  Actual Thief: <strong className="text-red-400">{log.actualThief}</strong>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span
                  className={`font-black text-xs px-2 py-0.5 rounded ${
                    log.isCorrect ? "bg-emerald-950 text-emerald-300 border border-emerald-500/40" : "bg-rose-950 text-rose-300 border border-rose-500/40"
                  }`}
                >
                  {log.isCorrect ? "SUCCESS" : "FAILED"}
                </span>
                <p className="text-[10px] text-slate-400 mt-1 flex items-center justify-end gap-1">
                  <Clock className="w-3 h-3 text-slate-400 inline" />
                  <span>{log.guessTime || 0}s</span>
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
