import React, { useState } from 'react';
import { X, ShieldCheck, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type LegalDocType = 'terms' | 'privacy';

interface LegalModalProps {
  isOpen: boolean;
  initialTab?: LegalDocType;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  initialTab = 'terms',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<LegalDocType>(initialTab);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl bg-[#0D0420] border-2 border-[#FFD700]/60 text-white shadow-[0_0_50px_rgba(120,34,135,0.6)] overflow-hidden select-none"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[#3F1152]/80 bg-[#160731]/90 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#782287] via-[#AC41D7] to-[#F9C933] p-0.5 shadow-md flex items-center justify-center">
                <div className="w-full h-full bg-[#080320] rounded-[9px] flex items-center justify-center text-[#FBE278]">
                  {activeTab === 'terms' ? <FileText className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                </div>
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-[#FBE278] font-serif uppercase tracking-wider">
                  {activeTab === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
                </h3>
                <p className="text-[10px] sm:text-xs text-purple-200">
                  Raja Rani Police Thief • https://rajaranigame.online
                </p>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 hover:text-white transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Selection */}
          <div className="flex border-b border-[#3F1152]/70 bg-[#120527] px-4 pt-2">
            <button
              onClick={() => setActiveTab('terms')}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                activeTab === 'terms'
                  ? 'border-[#FFD700] text-[#FFD700]'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Terms of Service</span>
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                activeTab === 'privacy'
                  ? 'border-[#FFD700] text-[#FFD700]'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Privacy Policy</span>
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-xs text-gray-200 space-y-4 font-sans leading-relaxed">
            {activeTab === 'terms' ? (
              <div className="space-y-4">
                <p className="text-[11px] text-purple-300">
                  Last Updated: September 2026
                </p>

                <section className="space-y-1.5">
                  <h4 className="font-bold text-[#FBE278] text-sm">1. Acceptance of Terms</h4>
                  <p>
                    By accessing or using Raja Rani Police Thief (accessible via https://rajaranigame.online, progressive web applications, and related services), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our application.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h4 className="font-bold text-[#FBE278] text-sm">2. Description of Service</h4>
                  <p>
                    Raja Rani Police Thief provides online multiplayer and offline social deduction party card gaming experiences, including Classic Mode, Modern Kingdom Mode, Detective Challenge, and AI bot offline play. The service is provided free of charge for entertainment purposes.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h4 className="font-bold text-[#FBE278] text-sm">3. User Conduct & Fair Play</h4>
                  <p>
                    Users must adhere to respectful conduct during gameplay and in public or private game rooms. You agree NOT to:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-300">
                    <li>Use abusive, obscene, harassing, or hate speech in room chat, voice chat, or user profiles.</li>
                    <li>Cheat, exploit bugs, reverse-engineer game synchronization, or manipulate role distributions.</li>
                    <li>Attempt unauthorized access to server infrastructure, database records, or other player accounts.</li>
                    <li>Impersonate administrators, staff, or other players.</li>
                  </ul>
                </section>

                <section className="space-y-1.5">
                  <h4 className="font-bold text-[#FBE278] text-sm">4. Accounts and Guest Access</h4>
                  <p>
                    You may play as a registered user or an anonymous guest. Registered users are responsible for maintaining the confidentiality of their credentials. You are responsible for all activities that occur under your account. We reserve the right to suspend or terminate accounts that violate our community guidelines.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h4 className="font-bold text-[#FBE278] text-sm">5. Intellectual Property</h4>
                  <p>
                    All proprietary logos, branding, game design, code, graphics, audio, and visual assets are the property of Raja Rani Police Thief. You may not copy, modify, distribute, or reverse engineer any part of the service without prior written permission.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h4 className="font-bold text-[#FBE278] text-sm">6. Disclaimer of Warranties</h4>
                  <p>
                    The service is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, whether express or implied, including but not limited to uninterrupted multiplayer connectivity, latency fluctuations, or device compatibility.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h4 className="font-bold text-[#FBE278] text-sm">7. Limitation of Liability</h4>
                  <p>
                    In no event shall the creators or operators of Raja Rani Police Thief be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use the game.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h4 className="font-bold text-[#FBE278] text-sm">8. Contact</h4>
                  <p>
                    For inquiries regarding these Terms of Service, please reach out via our official website at https://rajaranigame.online.
                  </p>
                </section>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-[11px] text-purple-300">
                  Last Updated: September 2026
                </p>

                <section className="space-y-1.5">
                  <h4 className="font-bold text-[#FBE278] text-sm">1. Introduction</h4>
                  <p>
                    Raja Rani Police Thief ("we", "our", or "us") is dedicated to protecting your privacy. This Privacy Policy explains how your information is collected, used, and safeguarded when you play our game online or via our Progressive Web App (PWA).
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h4 className="font-bold text-[#FBE278] text-sm">2. Information We Collect</h4>
                  <p>
                    We collect minimal information necessary to deliver multiplayer gameplay, progression, and statistics:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-300">
                    <li>
                      <strong className="text-white">Registered Users:</strong> Username, email address, password (stored strictly as cryptographic bcrypt hashes), avatar selection, profile description.
                    </li>
                    <li>
                      <strong className="text-white">Google Sign-In:</strong> Public profile name, email, and avatar provided via Google OAuth 2.0.
                    </li>
                    <li>
                      <strong className="text-white">Guest Users:</strong> Anonymous device identifier generated and stored locally in your browser for session continuity.
                    </li>
                    <li>
                      <strong className="text-white">Gameplay Records:</strong> XP points, level progression, match summaries, role win statistics (Raja, Rani, Police, Thief), and unlocked achievements.
                    </li>
                  </ul>
                </section>

                <section className="space-y-1.5">
                  <h4 className="font-bold text-[#FBE278] text-sm">3. How We Use Information</h4>
                  <p>
                    Your data is used solely to:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-300">
                    <li>Authenticate accounts and synchronize active multiplayer rooms.</li>
                    <li>Maintain global leaderboards, achievements, and player profiles.</li>
                    <li>Prevent abusive behavior and enforce fair play.</li>
                    <li>Improve server performance and game stability.</li>
                  </ul>
                </section>

                <section className="space-y-1.5">
                  <h4 className="font-bold text-[#FBE278] text-sm">4. Data Security & Storage</h4>
                  <p>
                    We implement industry-standard security measures including HTTPS/TLS encryption, salted password hashing, and token-based authentication. We do NOT sell, rent, or trade user data to third-party advertisers or behavioral data brokers.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h4 className="font-bold text-[#FBE278] text-sm">5. Cookies & Local Storage</h4>
                  <p>
                    We use browser local storage and session storage exclusively for essential operational purposes: remembering your login token, active room code, sound preferences, and PWA installation prompts. We do not use third-party tracking cookies.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h4 className="font-bold text-[#FBE278] text-sm">6. User Rights & Data Deletion</h4>
                  <p>
                    You may update your profile details or request account deletion and profile record purging at any time through your Profile Dashboard or by contacting administrators.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h4 className="font-bold text-[#FBE278] text-sm">7. Children's Privacy</h4>
                  <p>
                    Raja Rani Police Thief is a family-friendly game. We do not knowingly harvest personally identifiable information from children under 13 without appropriate consent.
                  </p>
                </section>
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="p-3 sm:p-4 border-t border-[#3F1152]/80 bg-[#120527] flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#EB9C09] via-[#F9C933] to-[#EB9C09] hover:opacity-95 text-black font-extrabold text-xs uppercase tracking-wider shadow-md transition-transform active:scale-95 cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
