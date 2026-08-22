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
                  <h3 className="font-bold text-cyan-200 text-sm mb-1">Detective Challenge</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Interactive suspect showdown! Inspect suspect avatars, read speech bubble clues & alibis, and catch guilty Masterminds.
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

            {/* Detective Challenge Mode Roles */}
            <div className="pt-2">
              <div className="text-left mb-4 flex items-center space-x-2 border-b border-purple-800/50 pb-2">
                <Search className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg sm:text-xl font-black text-cyan-300">
                  Detective Challenge Roles
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-[#180933] border border-cyan-500/30 flex items-start space-x-4">
                  <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex flex-shrink-0 items-center justify-center font-black text-cyan-300 text-xl">
                    🕵️
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-cyan-300">Detective Inspector</h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      All players act as Detectives analyzing 4 suspect cards. Compete for accuracy %, fast guess speed, and Champion Trophy!
                    </p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#180933] border border-purple-500/30 flex items-start space-x-4">
                  <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-400/50 flex flex-shrink-0 items-center justify-center font-black text-purple-300 text-xl">
                    🦹
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-purple-300">Mastermind Suspects</h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Animated suspects with custom occupations, alibis, and speech bubbles. Exactly 1 suspect is the guilty Mastermind Thief!
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
                  <span>🏛️ Modern Kingdom (6P)</span>
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
                  <span>🔍 Detective Challenge</span>
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
                      title: "Score & Global XP Tally",
                      desc: "Roles are revealed! Raja gets 1000 PTS, Rani gets 800 PTS. Police gets 500 PTS if correct (Thief gets 0). If Police is wrong, Thief escapes with 800 PTS! Scores convert into Global XP & Level progression.",
                      icon: Award,
                    },
                  ].map((item) => {
                    const StepIcon = item.icon;
                    return (
                      <div
                        key={item.step}
                        className="p-4 bg-[#100424] border border-amber-500/30 rounded-2xl flex items-start space-x-4 shadow-sm"
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
                      title: "Mantri Secret Shielding Phase",
                      desc: "Before Thief loot begins, Mantri secretly selects 1 kingdom member (Raja, Rani, Police, or Villager) to protect with the Royal Shield. Preventing theft yields +100 Support Bonus!",
                      icon: ShieldAlert,
                      color: "border-indigo-500/40 text-indigo-300",
                    },
                    {
                      step: 2,
                      title: "Thief Automatic Loot Phase",
                      desc: "Thief automatically loots 100 points from every unshielded kingdom member into the temporary loot vault.",
                      icon: Sparkles,
                      color: "border-emerald-500/40 text-emerald-300",
                    },
                    {
                      step: 3,
                      title: "Royal Court Session (Raja & Rani)",
                      desc: "Raja and Rani analyze and identify each other during the Royal Phase across the 6-player table. Matching earns +100 PTS Mutual Bonus!",
                      icon: Crown,
                      color: "border-amber-500/40 text-amber-300",
                    },
                    {
                      step: 4,
                      title: "Police Investigation & Accusation",
                      desc: "Police is publicly revealed to interrogate suspects. Catching Thief earns 500 PTS + 100 Catch Bonus and returns stolen loot to victims!",
                      icon: Shield,
                      color: "border-blue-500/40 text-blue-300",
                    },
                    {
                      step: 5,
                      title: "Villager Witness Statement & Settlement",
                      desc: "Villager gets a popup modal to Agree (👍) or Disagree (👎) with Police accusation. Correct verdict earns +100 Witness/Insight Bonus!",
                      icon: UserCheck,
                      color: "border-orange-500/40 text-orange-300",
                    },
                  ].map((item) => {
                    const StepIcon = item.icon;
                    return (
                      <div
                        key={item.step}
                        className={`p-4 bg-[#100424] border ${item.color.split(" ")[0]} rounded-2xl flex items-start space-x-4 shadow-sm`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-purple-900/40 border border-purple-400/40 flex flex-shrink-0 items-center justify-center font-black text-amber-300 text-sm">
                          {item.step}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-100 text-sm sm:text-base flex items-center space-x-2">
                            <span>{item.title}</span>
                            <StepIcon className={`w-4 h-4 ${item.color.split(" ")[1]}`} />
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

              {/* DETECTIVE CHALLENGE GUIDE */}
              {howToPlayMode === "detective" && (
                <div className="space-y-4 animate-fade-in">
                  {[
                    {
                      step: 1,
                      title: "Case Briefing & Case Rounds",
                      desc: "Select a Detective Challenge room or singleplayer investigation. Each match consists of 5 active suspect cases.",
                      icon: FileText,
                    },
                    {
                      step: 2,
                      title: "Suspect Inspection & Clues",
                      desc: "Examine 4 suspect cards featuring animated avatars, occupations, alibis, and speech bubble statements.",
                      icon: Eye,
                    },
                    {
                      step: 3,
                      title: "Alibi & Statement Deduction",
                      desc: "Analyze suspicious clues in speech bubbles and cross-check alibis to identify the guilty Mastermind Thief.",
                      icon: Search,
                    },
                    {
                      step: 4,
                      title: "Accusation & Speed Bonus",
                      desc: "Select your suspect before the timer runs out! Submitting correct guesses in under 5 seconds awards +15 XP Speed Bonus.",
                      icon: Clock,
                    },
                    {
                      step: 5,
                      title: "Detective Champion Standings",
                      desc: "Unveil the Thief! Earn accuracy milestone XP bonuses (+10 to +100 XP) and climb the Detective Champion Leaderboard!",
                      icon: Trophy,
                    },
                  ].map((item) => {
                    const StepIcon = item.icon;
                    return (
                      <div
                        key={item.step}
                        className="p-4 bg-[#100424] border border-cyan-500/30 rounded-2xl flex items-start space-x-4 shadow-sm"
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
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: GAME MODES */}
        {activeTab === "modes" && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    Play traditional Raja, Rani, Police, and Thief rounds. Points accumulate every round. Scores earn normalized XP (+Score / 10), participation XP, and winner bonuses!
                  </p>
                </div>
                <div className="p-3 bg-[#0F0422] rounded-xl border border-purple-800/40 text-xs text-slate-400">
                  👑 Traditional 4-player social deduction game.
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

              {/* Detective Challenge Mode */}
              <div className="p-6 rounded-3xl bg-[#180933] border border-cyan-500/30 flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-3 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-400">
                      <Search className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-cyan-300">Detective Challenge Mode</h3>
                      <span className="text-[11px] text-cyan-400 font-medium">Suspect Inspection Showdown</span>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                    Inspect animated suspect cards, analyze alibis and speech bubbles! All players compete as Detectives to catch suspects. Earn high accuracy bonuses, fast-guess speed bonuses, and champion awards!
                  </p>
                </div>
                <div className="p-3 bg-[#0F0422] rounded-xl border border-purple-800/40 text-xs text-slate-400">
                  🔍 Animated suspect interrogation & deduction mode.
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
                  title: "Detective Suspect Inspection",
                  desc: "Examine animated suspect cards, speech bubble clues, and alibis in Detective Challenge.",
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
