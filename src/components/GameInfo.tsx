import React, { useState } from "react";
import {
  Crown,
  Shield,
  BookOpen,
  Trophy,
  Users,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Mic,
  Zap,
  HelpCircle,
  Award,
  Radio,
  Star,
  Clock,
  Layers,
  Search,
  Eye,
  FileText,
  Building2,
  UserCheck,
  ShieldAlert,
  Bot,
  Heart,
} from "lucide-react";
import { XP_CONFIG } from "../config/xpConfig";

interface GameInfoProps {
  onBack: () => void;
  onStartGame?: () => void;
}

export const GameInfo: React.FC<GameInfoProps> = ({ onBack, onStartGame }) => {

  const [activeTab, setActiveTab] = useState<
    "about" | "roles" | "how-to-play" | "modes" | "xp-system" | "features"
  >("about");

  // Sub-tab for How to Play mode guide: Classic, Modern Kingdom, or Detective Challenge
  const [howToPlayMode, setHowToPlayMode] = useState<"classic" | "modern" | "detective">("classic");

  return (
    <div className="min-h-screen bg-[#0E0320] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#350E54] via-[#0E0320] to-[#06010D] text-white font-sans selection:bg-amber-400 selection:text-black relative overflow-x-hidden pb-16">
      {/* Dynamic Background Particles */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-amber-300 animate-pulse"
            style={{
              width: Math.random() * 3 + 1 + "px",
              height: Math.random() * 3 + 1 + "px",
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
              animationDuration: Math.random() * 3 + 2 + "s",
              animationDelay: Math.random() * 2 + "s",
              opacity: Math.random() * 0.7 + 0.3,
            }}
          />
        ))}
      </div>

      {/* Top Header Navigation Bar */}
      <header className="sticky top-0 z-50 bg-[#160830]/90 backdrop-blur-xl border-b border-[#3B1967] px-4 sm:px-8 py-3 flex items-center justify-between shadow-2xl">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2.5 bg-[#251048] hover:bg-[#38186D] border border-purple-500/40 rounded-xl text-slate-200 hover:text-white transition-all duration-200 flex items-center space-x-2 shadow-md cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs sm:text-sm font-semibold hidden sm:inline">
              Back
            </span>
          </button>

          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center">
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black bg-gradient-to-r from-amber-300 to-yellow-100 bg-clip-text text-transparent leading-none">
                Raja Rani Police Thief
              </h1>
              <p className="text-[10px] text-purple-300 font-medium">
                Game Guide & Rules
              </p>
            </div>
          </div>
        </div>

        {onStartGame && (
          <button
            onClick={onStartGame}
            className="px-4 py-2 text-xs sm:text-sm font-bold text-black bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 rounded-xl shadow-lg shadow-amber-500/25 transition-all duration-200 active:scale-95 cursor-pointer flex items-center space-x-1.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>Play Now</span>
          </button>
        )}
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 relative z-10">
        {/* Hero Title Section */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-300 text-xs font-bold uppercase tracking-wider mb-4">
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Official Rulebook & Overview</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black bg-gradient-to-r from-amber-300 via-yellow-100 to-white bg-clip-text text-transparent tracking-tight mb-3">
            Game Information & How to Play
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Everything you need to know about Classic Mode, Modern Kingdom Mode (6-Player), Detective Challenge, rules, XP calculation, and level progression!
          </p>
        </div>

        {/* Tab Selection Bar (Scrollbar-Free with Active Pill & Gold Indicator) */}
        <div className="flex items-center justify-start sm:justify-center space-x-2 overflow-x-auto pb-3 mb-8 no-scrollbar scroll-smooth border-b border-purple-900/50 touch-pan-x select-none">
          {[
            { id: "about", label: "About Game", icon: Crown },
            { id: "roles", label: "Roles & Points", icon: Shield },
            { id: "how-to-play", label: "How to Play", icon: HelpCircle },
            { id: "modes", label: "Game Modes", icon: Trophy },
            { id: "xp-system", label: "XP & Levels", icon: Star },
            { id: "features", label: "Key Features", icon: Zap },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`relative flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-300 cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 shadow-[0_4px_20px_rgba(251,191,36,0.35)] scale-[1.03] ring-1 ring-amber-300/80"
                    : "bg-[#1C0B3A]/80 hover:bg-[#2A1157] text-slate-300 border border-purple-800/40 hover:border-amber-400/50 hover:text-white"
                }`}
              >
                <Icon className={`w-4 h-4 transition-colors ${isActive ? "text-slate-950" : "text-amber-400"}`} />
                <span>{tab.label}</span>
                {isActive && (
                  <span className="absolute -bottom-1.5 inset-x-2 h-0.5 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 rounded-full shadow-[0_0_10px_#f59e0b] animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: ABOUT THE GAME */}
        {activeTab === "about" && (
          <div className="space-y-6 animate-fade-in">
            <div className="p-6 sm:p-8 rounded-3xl bg-[#180933]/90 border border-[#3E1D6B] backdrop-blur-xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
              
              <h2 className="text-xl sm:text-2xl font-black text-amber-300 mb-4 flex items-center space-x-2">
                <Crown className="w-6 h-6 text-amber-400" />
                <span>What is Raja Rani Police Thief?</span>
              </h2>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
                <strong>Raja Rani Police Thief</strong> (traditionally known as <em>Raja Rani Chor Police</em>) is a famous social deduction game digitized for real-time online multiplayer action with <strong>Three Thrilling Game Modes</strong>!
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-[#100524] border border-amber-500/30 rounded-2xl">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-3 font-bold text-lg">
                    👑
                  </div>
                  <h3 className="font-bold text-amber-200 text-sm mb-1">Classic Points Mode</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Traditional 4-player paper chit game with Raja (1000), Rani (800), Police (500/0), and Thief (800/0).
                  </p>
                </div>

                <div className="p-4 bg-[#100524] border border-purple-500/30 rounded-2xl">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-3 font-bold text-lg">
                    🏛️
                  </div>
                  <h3 className="font-bold text-purple-200 text-sm mb-1">Modern Kingdom Mode</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Strategic 6-player kingdom RPG featuring Mantri secret shield, Thief automatic loot vault, Royal & Police phases, and Villager witness statements!
                  </p>
                </div>

                <div className="p-4 bg-[#100524] border border-cyan-500/30 rounded-2xl">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-3 font-bold text-lg">
                    🔍
                  </div>
                  <h3 className="font-bold text-cyan-200 text-sm mb-1">Detective Mystery Room</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    The Door of Mystery! 10 dynamic doors hide 1 Mastermind Thief, 4 Safe chambers, 3 Trapped bombs, 1 Secret Clue riddle, and 1 Extra Life. Survive with 3 lives under a 60s countdown!
                  </p>
                </div>
              </div>

              <div className="p-4 bg-[#0F0421] border-l-4 border-amber-400 rounded-r-2xl text-xs sm:text-sm text-slate-300">
                <p className="font-semibold text-amber-300">Objective of the Game:</p>
                <p className="mt-1">
                  Accumulate maximum score and XP over multiple rounds by maintaining your royal title, protecting your kingdom, or solving crime cases as the Police Detective!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ROLES & POINTS */}
        {activeTab === "roles" && (
          <div className="space-y-8 animate-fade-in">
            {/* Classic Mode Roles */}
            <div>
              <div className="text-left mb-4 flex items-center space-x-2 border-b border-purple-800/50 pb-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg sm:text-xl font-black text-amber-300">
                  Classic Points Mode Roles (4 Players)
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* RAJA */}
                <div className="p-5 rounded-2xl bg-[#180933] border border-amber-500/30 flex items-start space-x-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex flex-shrink-0 items-center justify-center">
                    <img src="/assets/crown.png" alt="Raja" className="w-10 h-10 object-contain drop-shadow" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-black text-lg text-amber-300">Raja (King)</h3>
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-xs font-bold rounded-full">
                        1000 PTS
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      The supreme ruler. Raja secures 1000 points automatically each round regardless of Police guesses.
                    </p>
                  </div>
                </div>

                {/* RANI */}
                <div className="p-5 rounded-2xl bg-[#180933] border border-pink-500/30 flex items-start space-x-4">
                  <div className="w-14 h-14 rounded-2xl bg-pink-500/20 border border-pink-400/50 flex flex-shrink-0 items-center justify-center">
                    <img src="/assets/queen.png" alt="Rani" className="w-10 h-10 object-contain drop-shadow" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-black text-lg text-fuchsia-300">Rani (Queen)</h3>
                      <span className="px-2 py-0.5 bg-pink-500/20 text-pink-300 text-xs font-bold rounded-full">
                        800 PTS
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      The royal queen. Rani earns a guaranteed 800 points each round.
                    </p>
                  </div>
                </div>

                {/* POLICE */}
                <div className="p-5 rounded-2xl bg-[#180933] border border-blue-500/30 flex items-start space-x-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-400/50 flex flex-shrink-0 items-center justify-center">
                    <img src="/assets/police.png" alt="Police" className="w-10 h-10 object-contain drop-shadow" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-black text-lg text-blue-300">Police (Detective)</h3>
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs font-bold rounded-full">
                        500 or 0 PTS
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      The detective! Must reveal badge and identify who holds the Thief card. Correct guess yields <strong>500 PTS</strong>; wrong guess yields <strong>0 PTS</strong>.
                    </p>
                  </div>
                </div>

                {/* THIEF */}
                <div className="p-5 rounded-2xl bg-[#180933] border border-emerald-500/30 flex items-start space-x-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex flex-shrink-0 items-center justify-center">
                    <img src="/assets/robber.png" alt="Thief" className="w-10 h-10 object-contain drop-shadow" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-black text-lg text-emerald-300">Thief (Chor)</h3>
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-full">
                        800 or 0 PTS
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Must act natural and trick the Police! If Police guesses wrong, Thief escapes with <strong>800 PTS</strong>. If caught, Thief gets <strong>0 PTS</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modern Kingdom Mode Roles (6 Distinct Players Cards) */}
            <div className="pt-2">
              <div className="text-left mb-4 flex items-center space-x-2 border-b border-purple-800/50 pb-2">
                <Building2 className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg sm:text-xl font-black text-purple-300">
                  Modern Kingdom Mode Roles (6 Players)
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 1. RAJA */}
                <div className="p-5 rounded-2xl bg-[#180933] border border-amber-500/40 flex items-start space-x-3.5">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/50 flex flex-shrink-0 items-center justify-center">
                    <img src="/assets/images/raja.png" alt="Raja" className="w-9 h-9 object-contain drop-shadow" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5 flex-wrap">
                      <h3 className="font-black text-base text-amber-300">Raja (King)</h3>
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded-full">
                        1000 PTS
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Royal ruler of the kingdom. Participates in the Royal Phase to identify Rani across the table for a <strong>+100 PTS Mutual Bonus</strong>!
                    </p>
                  </div>
                </div>

                {/* 2. RANI */}
                <div className="p-5 rounded-2xl bg-[#180933] border border-pink-500/40 flex items-start space-x-3.5">
                  <div className="w-12 h-12 rounded-xl bg-pink-500/20 border border-pink-400/50 flex flex-shrink-0 items-center justify-center">
                    <img src="/assets/images/rani.png" alt="Rani" className="w-9 h-9 object-contain drop-shadow" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5 flex-wrap">
                      <h3 className="font-black text-base text-fuchsia-300">Rani (Queen)</h3>
                      <span className="px-2 py-0.5 bg-pink-500/20 text-pink-300 text-[10px] font-bold rounded-full">
                        800 PTS
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Royal queen of the court. Secretly seeks out Raja during the Royal Phase to claim the <strong>+100 PTS Royal Match Bonus</strong>!
                    </p>
                  </div>
                </div>

                {/* 3. POLICE */}
                <div className="p-5 rounded-2xl bg-[#180933] border border-blue-500/40 flex items-start space-x-3.5">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-400/50 flex flex-shrink-0 items-center justify-center">
                    <img src="/assets/images/police.png" alt="Police" className="w-9 h-9 object-contain drop-shadow" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5 flex-wrap">
                      <h3 className="font-black text-base text-blue-300">Police (Detective)</h3>
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] font-bold rounded-full">
                        500 or 0 PTS
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Publicly revealed inspector. Interrogates suspects and accuses the Thief. Catching Thief earns <strong>500 PTS + 100 Catch Bonus</strong>!
                    </p>
                  </div>
                </div>

                {/* 4. THIEF */}
                <div className="p-5 rounded-2xl bg-[#180933] border border-emerald-500/40 flex items-start space-x-3.5">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex flex-shrink-0 items-center justify-center">
                    <img src="/assets/images/thief.png" alt="Thief" className="w-9 h-9 object-contain drop-shadow" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5 flex-wrap">
                      <h3 className="font-black text-base text-emerald-300">Thief (Chor)</h3>
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-full">
                        Loot Vault
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Automatically loots 100 PTS from each unshielded member. If Police misses, Thief keeps all stolen loot!
                    </p>
                  </div>
                </div>

                {/* 5. MANTRI */}
                <div className="p-5 rounded-2xl bg-[#180933] border border-indigo-500/40 flex items-start space-x-3.5">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-400/50 flex flex-shrink-0 items-center justify-center">
                    <img src="/assets/images/mantri.png" alt="Mantri" className="w-9 h-9 object-contain drop-shadow" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5 flex-wrap">
                      <h3 className="font-black text-base text-indigo-300">Mantri (Minister)</h3>
                      <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] font-bold rounded-full">
                        500 PTS
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Pre-game secret protection! Shields 1 player from Thief loot. Preventing theft earns a <strong>+100 Support Bonus</strong>!
                    </p>
                  </div>
                </div>

                {/* 6. VILLAGER */}
                <div className="p-5 rounded-2xl bg-[#180933] border border-orange-500/40 flex items-start space-x-3.5">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/20 border border-orange-400/50 flex flex-shrink-0 items-center justify-center">
                    <img src="/assets/images/villager.png" alt="Villager" className="w-9 h-9 object-contain drop-shadow" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5 flex-wrap">
                      <h3 className="font-black text-base text-orange-300">Villager (Citizen)</h3>
                      <span className="px-2 py-0.5 bg-orange-500/20 text-orange-300 text-[10px] font-bold rounded-full">
                        400 PTS
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Witnesses Police interrogation! Casts a verdict (Agree/Disagree). Correct verdict yields <strong>+100 Witness/Insight Bonus</strong>!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Detective Mystery Room Sectors & Points */}
            <div className="pt-2">
              <div className="text-left mb-4 flex items-center space-x-2 border-b border-purple-800/50 pb-2">
                <Search className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg sm:text-xl font-black text-cyan-300">
                  Detective Mystery Room: 10 Doors & Scoring
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {/* 1: Mastermind Thief */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#180933] border border-purple-500/40 flex items-start space-x-3.5 shadow-md">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-400/50 flex flex-shrink-0 items-center justify-center text-2xl">
                    🦹
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-black text-base text-purple-300">Mastermind Thief</h3>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/40">1 Door</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      The primary investigation target! Opening this door catches the Thief, concludes the round with victory, and awards <strong className="text-amber-300">+1000 PTS</strong>.
                    </p>
                  </div>
                </div>

                {/* 2: Safe Chambers */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#180933] border border-emerald-500/40 flex items-start space-x-3.5 shadow-md">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex flex-shrink-0 items-center justify-center text-2xl">
                    🛡️
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-black text-base text-emerald-300">Safe Chambers</h3>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/40">4 Doors</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Clean sectors with zero hazards! Can be safely opened and closed again at any time. Each safe door cleared awards <strong className="text-emerald-300">+100 PTS</strong>.
                    </p>
                  </div>
                </div>

                {/* 3: Traps */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#180933] border border-red-500/40 flex items-start space-x-3.5 shadow-md">
                  <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-400/50 flex flex-shrink-0 items-center justify-center text-2xl">
                    💣
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-black text-base text-red-300">Explosive Traps</h3>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-red-500/30 text-red-200 border border-red-400/40">3 Doors</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Lethal bomb traps hidden behind 3 doors! Detonates upon opening and deducts <strong className="text-red-400">-1 Life (Heart)</strong>. Losing all 3 lives eliminates you!
                    </p>
                  </div>
                </div>

                {/* 4: Secret Clue */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#180933] border border-cyan-500/40 flex items-start space-x-3.5 shadow-md">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex flex-shrink-0 items-center justify-center text-2xl">
                    💡
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-black text-base text-cyan-300">Secret Clue</h3>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-500/30 text-cyan-200 border border-cyan-400/40">1 Door</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Reveals an encrypted riddle hinting whether the Thief is hiding in a specific row or column without giving away the exact door! Awards <strong className="text-cyan-300">+150 PTS</strong>.
                    </p>
                  </div>
                </div>

                {/* 5: Extra Life */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#180933] border border-pink-500/40 flex items-start space-x-3.5 shadow-md">
                  <div className="w-12 h-12 rounded-xl bg-pink-500/20 border border-pink-400/50 flex flex-shrink-0 items-center justify-center text-2xl">
                    ❤️
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-black text-base text-pink-300">Extra Life</h3>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-pink-500/30 text-pink-200 border border-pink-400/40">1 Door</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Vitality chamber that restores/grants <strong className="text-pink-300">+1 Heart (Life)</strong> to withstand additional trap detonations, plus awards <strong className="text-pink-300">+150 PTS</strong>.
                    </p>
                  </div>
                </div>

                {/* 6: Surviving Hearts Bonus */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#180933] border border-amber-500/40 flex items-start space-x-3.5 shadow-md">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/50 flex flex-shrink-0 items-center justify-center text-2xl">
                    ⭐
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-black text-base text-amber-300">Heart Bonus</h3>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-200 border border-amber-400/40">Round End</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Every remaining life heart held when the Thief is captured earns a massive <strong className="text-amber-300">+300 PTS per Heart</strong> end-of-round bonus!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: HOW TO PLAY */}
        {activeTab === "how-to-play" && (
          <div className="space-y-6 animate-fade-in">
            <div className="p-6 sm:p-8 rounded-3xl bg-[#180933]/90 border border-[#3E1D6B] backdrop-blur-xl shadow-2xl">
              <h2 className="text-xl sm:text-2xl font-black text-amber-300 mb-6 text-center">
                Step-by-Step Gameplay Guide
              </h2>

              {/* Mode Toggle Switcher */}
              <div className="flex items-center justify-start sm:justify-center gap-2 mb-8 bg-[#100424] p-1.5 rounded-2xl border border-purple-900/60 max-w-xl mx-auto overflow-x-auto no-scrollbar scroll-smooth touch-pan-x">
                <button
                  onClick={() => setHowToPlayMode("classic")}
                  className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 cursor-pointer whitespace-nowrap ${
                    howToPlayMode === "classic"
                      ? "bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md scale-[1.02] ring-1 ring-amber-300/80"
                      : "text-purple-300 hover:text-white"
                  }`}
                >
                  <Crown className="w-4 h-4" />
                  <span>👑 Classic (4P)</span>
                </button>

                <button
                  onClick={() => setHowToPlayMode("modern")}
                  className={`flex-1 min-w-[150px] py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 cursor-pointer whitespace-nowrap ${
                    howToPlayMode === "modern"
                      ? "bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-600 text-white shadow-md scale-[1.02] ring-1 ring-purple-300/80"
                      : "text-purple-300 hover:text-white"
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>🏛️ Modern Kingdom</span>
                </button>

                <button
                  onClick={() => setHowToPlayMode("detective")}
                  className={`flex-1 min-w-[150px] py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 cursor-pointer whitespace-nowrap ${
                    howToPlayMode === "detective"
                      ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-md scale-[1.02] ring-1 ring-cyan-300/80"
                      : "text-purple-300 hover:text-white"
                  }`}
                >
                  <Search className="w-4 h-4" />
                  <span>🔍 Detective Mystery Room</span>
                </button>
              </div>

              {/* CLASSIC MODE GUIDE */}
              {howToPlayMode === "classic" && (
                <div className="space-y-4 animate-fade-in">
                  {[
                    {
                      step: 1,
                      title: "Room Creation & Lobby Setup",
                      desc: "Host creates a room and invites 3 friends via a 6-digit room code. Set the total number of rounds (e.g. 5, 10 rounds).",
                      icon: Users,
                    },
                    {
                      step: 2,
                      title: "Secret Chit Distribution",
                      desc: "When the round starts, 4 digital chits (Raja, Rani, Police, Thief) are shuffled secretly and assigned to all 4 players.",
                      icon: Sparkles,
                    },
                    {
                      step: 3,
                      title: "Police Badge Reveal",
                      desc: "The player holding the Police card is automatically revealed to everyone with a glowing detective badge.",
                      icon: Shield,
                    },
                    {
                      step: 4,
                      title: "Interrogation & Guessing Phase",
                      desc: "The Police player observes player behavior, uses live voice or text chat to interrogate, and selects who they suspect is the Thief.",
                      icon: Mic,
                    },
                    {
                      step: 5,
                      title: "Resolution & Score Allocation",
                      desc: "If Police guesses correctly, Police gains 500 PTS. If Police guesses wrongly, Thief escapes with 800 PTS!",
                      icon: Award,
                    },
                  ].map((item) => {
                    const StepIcon = item.icon;
                    return (
                      <div
                        key={item.step}
                        className="p-4 bg-[#100424] border border-purple-800/40 rounded-2xl flex items-start space-x-4 shadow-sm"
                      >
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/50 flex flex-shrink-0 items-center justify-center font-black text-amber-300 text-sm">
                          {item.step}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-100 text-sm sm:text-base flex items-center space-x-2">
                            <span>{item.title}</span>
                            <StepIcon className="w-4 h-4 text-amber-400" />
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* MODERN KINGDOM MODE GUIDE */}
              {howToPlayMode === "modern" && (
                <div className="space-y-4 animate-fade-in">
                  {[
                    {
                      step: 1,
                      title: "6-Player Royal Court Setup",
                      desc: "Accommodates 6 players with expanded roles: Raja, Rani, Mantri, Police, Thief, and Villager.",
                      icon: Building2,
                    },
                    {
                      step: 2,
                      title: "Mantri Secret Shield Action",
                      desc: "Mantri secretly casts a Royal Protection Shield on 1 vulnerable player before investigations begin.",
                      icon: ShieldAlert,
                    },
                    {
                      step: 3,
                      title: "Police Investigation & Interrogation",
                      desc: "Police leads the courtroom investigation, questions witnesses, and identifies the Thief.",
                      icon: Search,
                    },
                    {
                      step: 4,
                      title: "Witness Testimony & Villager Clues",
                      desc: "Villager can give truthful clues or bluff to throw off suspicion and claim bonus witness points.",
                      icon: Mic,
                    },
                    {
                      step: 5,
                      title: "Royal Judgment & Score Allocation",
                      desc: "Thief caught yields 600 PTS to Police; Shielded defense protects player points; Wrong guess awards 900 PTS to Thief!",
                      icon: Award,
                    },
                  ].map((item) => {
                    const StepIcon = item.icon;
                    return (
                      <div
                        key={item.step}
                        className="p-4 bg-[#100424] border border-indigo-800/40 rounded-2xl flex items-start space-x-4 shadow-sm"
                      >
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/50 flex flex-shrink-0 items-center justify-center font-black text-purple-300 text-sm">
                          {item.step}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-100 text-sm sm:text-base flex items-center space-x-2">
                            <span>{item.title}</span>
                            <StepIcon className="w-4 h-4 text-purple-400" />
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* DETECTIVE MYSTERY ROOM (DOOR OF MYSTERY) GUIDE */}
              {howToPlayMode === "detective" && (
                <div className="space-y-4 animate-fade-in">
                  {[
                    {
                      step: 1,
                      title: "Room Capacity & Waiting Lobby",
                      desc: "Host selects the room player capacity (1 to 6 players). Waiting room shows joined players in a responsive accordion view that works smoothly whether you play solo or with a team.",
                      icon: Users,
                    },
                    {
                      step: 2,
                      title: "Mandatory Rules Confirmation",
                      desc: "Once all players join, a mandatory Investigation Briefing modal appears. All detectives must read and check the confirmation box before the Host's 'Start Investigation' button unlocks.",
                      icon: CheckCircle2,
                    },
                    {
                      step: 3,
                      title: "10-Door Dynamic Matrix (5x2 / 2x5)",
                      desc: "10 ancient wooden doors automatically arrange based on screen size (5 columns × 2 rows on desktop, 2 columns × 5 rows on mobile). Click any door to open; click an opened door again to close it safely!",
                      icon: Layers,
                    },
                    {
                      step: 4,
                      title: "3 Lives System & Explosive Traps",
                      desc: "Every player starts with 3 Lives (Hearts ❤️❤️❤️). Opening any of the 3 Trap doors detonates a bomb, deducting 1 life (-1 Heart). Losing all 3 lives eliminates you! Discover the Life door to gain +1 bonus heart (+150 PTS).",
                      icon: ShieldAlert,
                    },
                    {
                      step: 5,
                      title: "Decipher Secret Clue Riddles",
                      desc: "Opening the Secret Clue door (+150 PTS) broadcasts a cryptic clue indicating the Mastermind's row or column (e.g. 'The Thief is lurking in the First Row') without giving away the exact door.",
                      icon: Search,
                    },
                    {
                      step: 6,
                      title: "Catch the Thief & 60-Second Timer",
                      desc: "Locate and open the 1 hidden Mastermind Thief door before the synchronized 60-second timer runs out! Unmasking the Thief wins the case (+1000 PTS), plus grants +300 PTS for each surviving heart!",
                      icon: Trophy,
                    },
                  ].map((item) => {
                    const StepIcon = item.icon;
                    return (
                      <div
                        key={item.step}
                        className="p-4 bg-[#100424] border border-cyan-800/40 rounded-2xl flex items-start space-x-4 shadow-sm"
                      >
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex flex-shrink-0 items-center justify-center font-black text-cyan-300 text-sm">
                          {item.step}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-100 text-sm sm:text-base flex items-center space-x-2">
                            <span>{item.title}</span>
                            <StepIcon className="w-4 h-4 text-cyan-400" />
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {/* Detective Rules & Sector Matrix Summary Card */}
                  <div className="mt-6 p-5 sm:p-6 bg-gradient-to-br from-[#180933] via-[#120527] to-[#0A0218] border border-cyan-500/40 rounded-3xl shadow-xl">
                    <div className="flex items-center space-x-2 mb-4 border-b border-cyan-500/30 pb-3">
                      <Search className="w-5 h-5 text-cyan-400" />
                      <h4 className="text-base sm:text-lg font-black text-cyan-200">
                        Official Door of Mystery: Sector Breakdown & Game Rules
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
                      <div className="p-3 bg-[#1C0B3A] rounded-xl border border-purple-500/30 text-center">
                        <div className="text-2xl mb-1">🦹</div>
                        <div className="text-xs font-black text-purple-300">1 Thief Door</div>
                        <div className="text-[11px] text-amber-300 font-bold mt-0.5">+1000 PTS</div>
                      </div>
                      <div className="p-3 bg-[#1C0B3A] rounded-xl border border-emerald-500/30 text-center">
                        <div className="text-2xl mb-1">🛡️</div>
                        <div className="text-xs font-black text-emerald-300">4 Safe Doors</div>
                        <div className="text-[11px] text-emerald-300 font-bold mt-0.5">+100 PTS each</div>
                      </div>
                      <div className="p-3 bg-[#1C0B3A] rounded-xl border border-red-500/30 text-center">
                        <div className="text-2xl mb-1">💣</div>
                        <div className="text-xs font-black text-red-300">3 Trap Doors</div>
                        <div className="text-[11px] text-red-400 font-bold mt-0.5">-1 Heart (Life)</div>
                      </div>
                      <div className="p-3 bg-[#1C0B3A] rounded-xl border border-cyan-500/30 text-center">
                        <div className="text-2xl mb-1">💡</div>
                        <div className="text-xs font-black text-cyan-300">1 Clue Door</div>
                        <div className="text-[11px] text-cyan-300 font-bold mt-0.5">+150 PTS (Riddle)</div>
                      </div>
                      <div className="p-3 bg-[#1C0B3A] rounded-xl border border-pink-500/30 text-center">
                        <div className="text-2xl mb-1">❤️</div>
                        <div className="text-xs font-black text-pink-300">1 Life Door</div>
                        <div className="text-[11px] text-pink-300 font-bold mt-0.5">+1 Life (+150 PTS)</div>
                      </div>
                      <div className="p-3 bg-[#1C0B3A] rounded-xl border border-amber-500/30 text-center">
                        <div className="text-2xl mb-1">⏱️</div>
                        <div className="text-xs font-black text-amber-300">60s Timer</div>
                        <div className="text-[11px] text-amber-300 font-bold mt-0.5">+300 PTS / Heart</div>
                      </div>
                    </div>

                    <div className="text-xs text-slate-300 space-y-1.5 leading-relaxed bg-[#0F0421] p-3.5 rounded-xl border border-cyan-500/20">
                      <p>• <strong>Door Mechanics:</strong> All 10 doors start closed. Click any door to open it. Click any opened door again to close it safely. Reopening shows the discovered sector.</p>
                      <p>• <strong>Dynamic Resolution Matrix:</strong> Desktop displays a 5x2 grid; Mobile displays an ergonomic 2x5 grid with full collapseable UI responsiveness.</p>
                      <p>• <strong>Room Starting:</strong> In multiplayer, all players must check the rules acknowledgment checkbox before the host can trigger the synchronized start.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: GAME MODES */}
        {activeTab === "modes" && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Classic Points Mode */}
              <div className="p-6 rounded-3xl bg-[#180933] border border-amber-500/30 flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-400">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-amber-300">Classic Points Mode</h3>
                      <span className="text-[11px] text-amber-400 font-medium">Standard 4-Player Paper Game</span>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                    Play traditional Raja, Rani, Police, and Thief rounds online with friends or offline. Points accumulate every round. Scores earn normalized XP (+Score / 10), participation XP, and winner bonuses!
                  </p>
                </div>
                <div className="p-3 bg-[#0F0422] rounded-xl border border-purple-800/40 text-xs text-slate-400">
                  👑 Traditional 4-player social deduction game with friends or AI.
                </div>
              </div>

              {/* Offline AI Mode */}
              <div className="p-6 rounded-3xl bg-[#180933] border border-emerald-500/40 flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400">
                      <Bot className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-emerald-300">Offline AI Mode</h3>
                      <span className="text-[11px] text-emerald-400 font-medium">Instant Single Player against Smart Bots</span>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                    Play anytime, anywhere without an internet connection. Challenge 3 intelligent royal AI bots (Vikram, Arjun, Kabir) with customizable rounds (1-10) or target score goals (1000-10,000 PTS).
                  </p>
                </div>
                <div className="p-3 bg-[#0F0422] rounded-xl border border-emerald-800/40 text-xs text-slate-400">
                  🎮 Instant solo play with intelligent bot deduction and local state.
                </div>
              </div>

              {/* Modern Kingdom Mode */}
              <div className="p-6 rounded-3xl bg-[#180933] border border-purple-500/40 flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-3 rounded-2xl bg-purple-500/20 border border-purple-400/40 text-purple-400">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-purple-300">Modern Kingdom Mode</h3>
                      <span className="text-[11px] text-purple-400 font-medium">6-Player Kingdom RPG</span>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                    Featuring 6 active roles (Raja, Rani, Police, Thief, Mantri, Villager). Includes Mantri secret shield, Thief automatic loot vault, Royal & Police phases, and interactive Villager witness verdicts!
                  </p>
                </div>
                <div className="p-3 bg-[#0F0422] rounded-xl border border-purple-800/40 text-xs text-slate-400">
                  🏛️ 6-player RPG with secret shields & witness statements.
                </div>
              </div>

              {/* Detective Mystery Room (Door of Mystery) */}
              <div className="p-6 rounded-3xl bg-[#180933] border border-cyan-500/40 flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-3 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-400">
                      <Search className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-cyan-300">The Door of Mystery</h3>
                      <span className="text-[11px] text-cyan-400 font-medium">Detective Mystery Room Mode</span>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                    Enter the chamber of 10 ancient doors arranged dynamically (5x2 on desktop, 2x5 on mobile). 1 door conceals the Mastermind Thief (+1000 PTS), 4 are Safe (+100 PTS), 3 are explosive Traps (-1 Life), 1 holds a Secret Clue riddle, and 1 holds an Extra Life. Manage 3 lives and deduce the Thief before the 60s timer expires!
                  </p>
                </div>
                <div className="p-3 bg-[#0F0422] rounded-xl border border-cyan-500/30 text-xs text-cyan-300 flex items-center justify-between flex-wrap gap-1">
                  <span>🚪 10 Dynamic Doors</span>
                  <span>❤️ 3 Lives System</span>
                  <span>⏱️ 60s Synchronized</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: XP & LEVEL PROGRESSION */}
        {activeTab === "xp-system" && (
          <div className="space-y-6 animate-fade-in">
            <div className="p-6 sm:p-8 rounded-3xl bg-[#180933]/90 border border-[#3E1D6B] backdrop-blur-xl shadow-2xl">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-md">
                  <Star className="w-6 h-6 fill-amber-400" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-amber-300">
                    Global XP & Level Progression System
                  </h2>
                  <p className="text-xs text-purple-300 font-medium">
                    One unified progression system across Classic, Modern Kingdom, and Detective modes
                  </p>
                </div>
              </div>

              {/* Level Progression Table */}
              <div className="mb-8">
                <h3 className="text-sm font-black text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>Configurable Level Progression Table</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {XP_CONFIG.LEVEL_TABLE.map((lvl) => (
                    <div
                      key={lvl.level}
                      className="bg-[#100524] border border-purple-800/40 p-3 rounded-2xl text-center shadow-sm"
                    >
                      <span className="text-[10px] font-bold text-amber-400 block uppercase">Level {lvl.level}</span>
                      <span className="text-sm font-black text-white">{lvl.minXp.toLocaleString()} XP</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* XP Formulas Breakdown Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                {/* Classic Mode XP Formula */}
                <div className="p-4 rounded-2xl bg-[#100524] border border-amber-500/30 space-y-2.5">
                  <div className="flex items-center space-x-2 text-amber-300 font-black text-sm border-b border-purple-800/50 pb-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>👑 Classic Mode XP</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    <li className="flex justify-between items-center bg-[#180933] p-2 rounded-xl border border-purple-900/40">
                      <span>Participation XP</span>
                      <strong className="text-emerald-400">+20 XP</strong>
                    </li>
                    <li className="flex justify-between items-center bg-[#180933] p-2 rounded-xl border border-purple-900/40">
                      <span>Completion XP</span>
                      <strong className="text-emerald-400">+30 XP</strong>
                    </li>
                    <li className="flex justify-between items-center bg-[#180933] p-2 rounded-xl border border-purple-900/40">
                      <span>Normalized Score</span>
                      <strong className="text-emerald-400">Score / 10</strong>
                    </li>
                    <li className="flex justify-between items-center bg-[#180933] p-2 rounded-xl border border-purple-900/40">
                      <span>Winner Bonus</span>
                      <strong className="text-amber-400">+100 XP</strong>
                    </li>
                  </ul>
                </div>

                {/* Modern Kingdom Mode XP Formula */}
                <div className="p-4 rounded-2xl bg-[#100524] border border-purple-500/40 space-y-2.5">
                  <div className="flex items-center space-x-2 text-purple-300 font-black text-sm border-b border-purple-800/50 pb-2">
                    <Building2 className="w-4 h-4 text-purple-400" />
                    <span>🏛️ Modern Kingdom XP</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    <li className="flex justify-between items-center bg-[#180933] p-2 rounded-xl border border-purple-900/40">
                      <span>Participation & Complete</span>
                      <strong className="text-emerald-400">+50 XP</strong>
                    </li>
                    <li className="flex justify-between items-center bg-[#180933] p-2 rounded-xl border border-purple-900/40">
                      <span>Mantri Shield Bonus</span>
                      <strong className="text-indigo-300">+40 XP</strong>
                    </li>
                    <li className="flex justify-between items-center bg-[#180933] p-2 rounded-xl border border-purple-900/40">
                      <span>Villager Verdict Bonus</span>
                      <strong className="text-orange-300">+30 XP</strong>
                    </li>
                    <li className="flex justify-between items-center bg-[#180933] p-2 rounded-xl border border-purple-900/40">
                      <span>Royal Intuition Match</span>
                      <strong className="text-amber-300">+35 XP</strong>
                    </li>
                  </ul>
                </div>

                {/* Detective Challenge XP Formula */}
                <div className="p-4 rounded-2xl bg-[#100524] border border-cyan-500/30 space-y-2.5">
                  <div className="flex items-center space-x-2 text-cyan-300 font-black text-sm border-b border-purple-800/50 pb-2">
                    <Search className="w-4 h-4 text-cyan-400" />
                    <span>🔍 Detective Mode XP</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    <li className="flex justify-between items-center bg-[#180933] p-2 rounded-xl border border-purple-900/40">
                      <span>Participation & Complete</span>
                      <strong className="text-emerald-400">+50 XP</strong>
                    </li>
                    <li className="flex justify-between items-center bg-[#180933] p-2 rounded-xl border border-purple-900/40">
                      <span>Correct Guess Bonus</span>
                      <strong className="text-cyan-300">40 × Catches</strong>
                    </li>
                    <li className="flex justify-between items-center bg-[#180933] p-2 rounded-xl border border-purple-900/40">
                      <span>Champion Bonus</span>
                      <strong className="text-amber-400">+120 XP</strong>
                    </li>
                    <li className="flex justify-between items-center bg-[#180933] p-2 rounded-xl border border-purple-900/40">
                      <span>Fast Guess (≤ 5s)</span>
                      <strong className="text-yellow-300">+15 XP</strong>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Achievements XP Rewards Note */}
              <div className="p-4 bg-[#100524] border border-purple-800/40 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <span className="font-bold text-white">Achievement Milestones:</span>
                  <span className="text-slate-[#D8C7E0]">Unlocking achievements across Classic, Modern, and Detective modes awards +100 to +1000 XP instantly!</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: KEY FEATURES */}
        {activeTab === "features" && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  title: "Play with Friends (Online)",
                  desc: "Create custom private rooms, share room codes, and enjoy live synchronized multiplayer with voice chat.",
                  icon: Users,
                  color: "text-amber-400",
                },
                {
                  title: "Offline Mode (Smart AI)",
                  desc: "Play instantly without an internet connection or waiting for players against 3 intelligent royal AI bots.",
                  icon: Bot,
                  color: "text-emerald-400",
                },
                {
                  title: "Real-time Voice Chat",
                  desc: "Integrated WebRTC voice communication for natural bluffs, interrogations, and royal strategy.",
                  icon: Mic,
                  color: "text-purple-400",
                },
                {
                  title: "Modern Kingdom RPG (6P)",
                  desc: "Mantri secret shield, Thief automatic loot vault, Royal & Police phases, and Villager witness statements.",
                  icon: Building2,
                  color: "text-indigo-400",
                },
                {
                  title: "The Door of Mystery (10 Doors)",
                  desc: "Dynamic 10-door interactive chamber with 1 Thief, 4 Safe, 3 Traps, 1 Clue, 1 Life, 3-heart system, and 60s timer.",
                  icon: Search,
                  color: "text-cyan-400",
                },
                {
                  title: "Global Leaderboards & XP",
                  desc: "Track total wins, detective accuracy, and escape streaks on global leaderboards.",
                  icon: Award,
                  color: "text-amber-400",
                },
                {
                  title: "Sound Effects & Ambience",
                  desc: "Immersive audio triggers for card dealing, Police sirens, and victory cheer.",
                  icon: Radio,
                  color: "text-pink-400",
                },
                {
                  title: "Fair Play & Anti-Cheat",
                  desc: "Server-side role distribution prevents card inspection before reveal.",
                  icon: CheckCircle2,
                  color: "text-emerald-400",
                },
              ].map((feat, idx) => {
                const FeatIcon = feat.icon;
                return (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-[#180933] border border-purple-800/40 hover:border-purple-600/60 transition-all duration-200"
                  >
                    <FeatIcon className={`w-7 h-7 ${feat.color} mb-3`} />
                    <h3 className="font-bold text-slate-100 text-sm mb-1">{feat.title}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">{feat.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Guarantee Note */}
        <div className="mt-12 p-4 rounded-2xl bg-[#120629] border border-purple-900/60 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Safe & Secure Gaming Environment • Fair Play Guaranteed</span>
          </div>
          <p className="text-slate-500">
            © 2026 Raja Rani Multiplayer Team
          </p>
        </div>
      </main>
    </div>
  );
};
