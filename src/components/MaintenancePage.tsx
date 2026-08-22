import React, { useState } from "react";
import {
  RefreshCw,
  Wrench,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";

interface MaintenancePageProps {
  message?: string;
  onRefreshStatus?: () => Promise<void>;
}

export const MaintenancePage: React.FC<MaintenancePageProps> = ({
  message = "We are currently working on making the game better and fixing some issues.",
  onRefreshStatus,
}) => {
  const [checking, setChecking] = useState(false);

  const handleRefresh = async () => {
    if (onRefreshStatus) {
      setChecking(true);
      try {
        await onRefreshStatus();
      } finally {
        setTimeout(() => setChecking(false), 800);
      }
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-[#070913] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1b153b] via-[#090b16] to-[#04050a] flex flex-col items-center justify-center p-3 sm:p-6 relative overflow-hidden text-white font-sans selection:bg-cyan-500 selection:text-black">
      {/* Dynamic Ambient Grid & Glow Effects */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1a3a15_1px,transparent_1px),linear-gradient(to_bottom,#1f1a3a15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Ambient Neon Lights */}
      <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/10 w-96 h-96 bg-purple-600/15 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-indigo-500/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Floating Sparkles & Light Particles */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        {[...Array(25)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-cyan-300 animate-pulse"
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

      {/* Outer Border Outer Card (Matching Uploaded Image Frame) */}
      <div className="max-w-6xl w-full relative z-10 p-[1.5px] rounded-[2.5rem] bg-gradient-to-b from-indigo-500/30 via-purple-500/10 to-indigo-900/30 shadow-[0_0_70px_rgba(79,70,229,0.15)] my-auto">
        <div className="bg-[#0b0d1b]/90 backdrop-blur-2xl rounded-[calc(2.5rem-1.5px)] p-6 sm:p-10 border border-[#1d203b] relative overflow-hidden flex flex-col items-center">
          
          {/* Top Decorative Header Lights */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

          {/* Main Content Layout Grid */}
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            {/* LEFT CHARACTER: POLICE OFFICER */}
            <div className="hidden lg:flex lg:col-span-3 flex-col items-center justify-end relative h-[420px]">
              <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
                <img
                  src="/assets/3d_police.png"
                  alt="Police Officer"
                  className="max-h-[380px] object-contain drop-shadow-[0_15px_35px_rgba(0,0,0,0.7)] mix-blend-screen hover:scale-105 transition-transform duration-300"
                />
                
                {/* Traffic Cone & Alarm Prop Element */}
                <div className="absolute bottom-2 left-4 flex items-center space-x-2">
                  <div className="w-6 h-8 bg-gradient-to-t from-orange-600 via-amber-500 to-orange-400 [clip-path:polygon(30%_0%,70%_0%,100%_100%,0%_100%)] shadow-lg shadow-orange-500/30 relative">
                    <div className="absolute top-2 left-0 right-0 h-1.5 bg-white/90" />
                  </div>
                  <div className="w-4 h-4 rounded-full bg-purple-500/40 border border-purple-400 flex items-center justify-center animate-ping">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
                  </div>
                </div>
              </div>
            </div>

            {/* CENTER MAINTENANCE CONTENT */}
            <div className="col-span-1 lg:col-span-6 flex flex-col items-center text-center px-2 sm:px-4">
              
              {/* Game Logo Emblem */}
              <div className="flex flex-col items-center mb-4">
                <div className="relative mb-1">
                  <img
                    src="/assets/header_crown.png"
                    alt="Royal Crown"
                    className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-[0_0_20px_rgba(234,179,8,0.5)]"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </div>

                {/* Styled Logo Banner */}
                <div className="bg-gradient-to-b from-[#19153a] to-[#0f0c24] border border-[#2d2757] rounded-xl px-5 py-2 shadow-xl shadow-black/40 flex flex-col items-center">
                  <span className="text-xl sm:text-2xl font-black bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent tracking-wider uppercase drop-shadow">
                    RAJA RANI
                  </span>
                  <div className="flex items-center space-x-1.5 text-[10px] sm:text-xs font-bold tracking-widest text-cyan-400 uppercase">
                    <span>POLICE</span>
                    <span className="text-white">THIEF</span>
                  </div>
                  <div className="text-[9px] text-amber-400 font-semibold tracking-widest uppercase mt-0.5">
                    ★ MULTIPLAYER ★
                  </div>
                </div>
              </div>

              {/* Maintenance Main Title */}
              <div className="mb-4">
                <div className="inline-flex items-center space-x-2 px-3.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>ROYAL KINGDOM UNDER MAINTENANCE</span>
                </div>
                <h2 className="text-lg sm:text-xl font-black tracking-[0.25em] text-slate-200 uppercase mb-1">
                  WE'RE UNDER
                </h2>
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black bg-gradient-to-r from-indigo-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent tracking-wider filter drop-shadow-[0_0_30px_rgba(129,140,248,0.5)]">
                  MAINTENANCE
                </h1>
              </div>

              {/* Subtext */}
              <p className="text-slate-300 text-xs sm:text-sm max-w-md mx-auto mb-6 leading-relaxed">
                {message}
              </p>

              {/* Center Info Box with Wrench / Gear */}
              <div className="w-full max-w-md p-4 bg-[#121029]/80 border border-purple-900/50 rounded-2xl mb-6 shadow-inner flex items-center space-x-4 text-left">
                <div className="relative flex-shrink-0">
                  <div className="absolute -inset-1 bg-purple-500/30 rounded-xl blur-md animate-pulse" />
                  <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-800 p-0.5 shadow-lg flex items-center justify-center">
                    <div className="w-full h-full bg-[#150d2c] rounded-[calc(0.75rem-2px)] flex items-center justify-center">
                      <Wrench className="w-6 h-6 text-purple-300 animate-spin-slow" />
                    </div>
                  </div>
                </div>
                <div className="text-xs sm:text-sm">
                  <p className="text-slate-300 font-medium">
                    Our team is working hard to get things back to normal.
                  </p>
                  <p className="text-purple-300 font-bold mt-0.5">
                    Please check back soon!
                  </p>
                </div>
              </div>

              {/* Re-check Status Action Button */}
              <button
                onClick={handleRefresh}
                disabled={checking}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-3 text-sm font-bold text-black bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 rounded-xl shadow-lg shadow-amber-500/25 transition-all duration-200 active:scale-95 disabled:opacity-50 cursor-pointer mb-6"
              >
                <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
                <span>{checking ? "Checking Server Status..." : "Check Status Now"}</span>
              </button>

              {/* Social Media Stay Connected Section */}
              <div className="flex flex-col items-center">
                <span className="text-[11px] font-bold text-indigo-300/80 tracking-widest uppercase mb-3">
                  STAY CONNECTED
                </span>
                <div className="flex items-center justify-center space-x-3">
                  {/* Discord */}
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="w-9 h-9 rounded-full bg-[#16172e] border border-indigo-500/30 hover:border-cyan-400 flex items-center justify-center text-slate-300 hover:text-cyan-300 hover:bg-indigo-900/40 transition-all duration-200 shadow-md"
                    title="Discord"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                  </a>
                  {/* YouTube */}
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="w-9 h-9 rounded-full bg-[#16172e] border border-indigo-500/30 hover:border-red-400 flex items-center justify-center text-slate-300 hover:text-red-400 hover:bg-red-950/30 transition-all duration-200 shadow-md"
                    title="YouTube"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
                  {/* Instagram */}
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="w-9 h-9 rounded-full bg-[#16172e] border border-indigo-500/30 hover:border-pink-400 flex items-center justify-center text-slate-300 hover:text-pink-300 hover:bg-pink-950/30 transition-all duration-200 shadow-md"
                    title="Instagram"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                  {/* Twitter / X */}
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="w-9 h-9 rounded-full bg-[#16172e] border border-indigo-500/30 hover:border-blue-400 flex items-center justify-center text-slate-300 hover:text-blue-300 hover:bg-blue-950/30 transition-all duration-200 shadow-md"
                    title="Twitter / X"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* RIGHT CHARACTER: THIEF */}
            <div className="hidden lg:flex lg:col-span-3 flex-col items-center justify-end relative h-[420px]">
              <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
                <img
                  src="/assets/3d_thief.png"
                  alt="Thief Character"
                  className="max-h-[380px] object-contain drop-shadow-[0_15px_35px_rgba(0,0,0,0.7)] mix-blend-screen hover:scale-105 transition-transform duration-300"
                />

                {/* Warning Sign & Crates Prop Element */}
                <div className="absolute bottom-2 right-4 flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-red-950/80 border border-red-500/60 flex items-center justify-center text-red-400 shadow-lg shadow-red-500/20">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="w-5 h-5 rounded bg-amber-950/80 border border-amber-600/50 flex items-center justify-center text-amber-400 text-[10px] font-bold">
                    📦
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Footer Note */}
          <div className="mt-8 pt-4 border-t border-[#1d203b] w-full text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="flex items-center justify-center space-x-1">
              <span className="text-red-400">♥</span>
              <span>Thank you for your patience and support!</span>
            </p>
            <p className="text-indigo-300 font-medium">
              – Raja Rani Multiplayer Team
            </p>
          </div>

          {/* Admin Portal Direct Link */}
          <div className="mt-3 text-center text-[11px] text-slate-500">
            Are you an Administrator? Access control portal via{" "}
            <code className="bg-[#15122e] px-2 py-0.5 rounded text-cyan-400 border border-purple-900/60">
              /admin
            </code>
          </div>

        </div>
      </div>
    </div>
  );
};

