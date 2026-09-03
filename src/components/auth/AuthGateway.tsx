import React from "react";
import {
  User,
  ChevronRight,
  Gamepad2,
  Shield,
  Lock,
  Cloud,
  Trophy,
  Award,
} from "lucide-react";
import { AuthHeader } from "./components/AuthHeader";
import { AuthDivider } from "./components/AuthDivider";
import { AuthButton } from "./components/AuthButton";

interface AuthGatewayProps {
  onSelectSignIn: () => void;
  onSelectSignUp: () => void;
  onPlayAsGuest: () => void;
  onGoogleSignIn: () => void;
  googleLoading?: boolean;
  onOpenPrivacy?: () => void;
}

export const AuthGateway: React.FC<AuthGatewayProps> = ({
  onSelectSignIn,
  onSelectSignUp,
  onPlayAsGuest,
  onGoogleSignIn,
  googleLoading = false,
  onOpenPrivacy,
}) => {
  return (
    <div className="flex flex-col space-y-3.5 sm:space-y-4 relative z-20">
      {/* Royal Header with 3D Crown Logo & Flourishes */}
      <AuthHeader
        title="Welcome Back!"
        subtitle="Sign in to save your progress, stats, achievements & leaderboards."
        showLogo={true}
      />

      {/* Continue with Google */}
      <div>
        <AuthButton
          variant="google"
          onClick={onGoogleSignIn}
          loading={googleLoading}
        >
          {googleLoading ? "Connecting to Google..." : "Continue with Google"}
        </AuthButton>
      </div>

      {/* ──────── ✦ OR ✦ ──────── */}
      <AuthDivider text="OR" className="my-1 sm:my-1.5" />

      {/* CTAs Stack (Clear hierarchy: Primary > Secondary > Guest) */}
      <div className="space-y-2.5">
        {/* Dominant Primary CTA: SIGN IN */}
        <AuthButton
          variant="primary"
          onClick={onSelectSignIn}
          icon={<User className="w-4 h-4 stroke-[2.5]" />}
        >
          SIGN IN
        </AuthButton>

        {/* Secondary CTA: CREATE ACCOUNT */}
        <AuthButton
          variant="secondary"
          onClick={onSelectSignUp}
          icon={<User className="w-4 h-4" />}
          trailingIcon={<ChevronRight className="w-4 h-4" />}
        >
          CREATE ACCOUNT
        </AuthButton>

        {/* Tertiary CTA: PLAY AS GUEST */}
        <AuthButton
          variant="guest"
          onClick={onPlayAsGuest}
          icon={<Gamepad2 className="w-4 h-4" />}
        >
          PLAY AS GUEST
        </AuthButton>
      </div>

      {/* Security Reassurance Badge */}
      <div className="auth-security-badge rounded-xl py-2 px-3 flex items-center justify-center gap-2.5 text-center shadow-inner">
        <div className="w-6 h-6 rounded-full bg-[#3B176B]/60 border border-[#F4C542]/40 flex items-center justify-center shrink-0">
          <Shield className="w-3.5 h-3.5 text-[#F4C542]" />
        </div>
        <p className="text-[11px] sm:text-xs text-[#E6D7EE] font-medium font-body leading-tight">
          Your game progress is safer when you sign in.
        </p>
      </div>

      {/* Privacy Note & Policy Link */}
      <div className="flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] text-gray-400 font-body select-none">
        <Lock className="w-3 h-3 text-gray-400 shrink-0" />
        <span>We respect your privacy & keep your data secure.</span>
        <button
          type="button"
          onClick={onOpenPrivacy}
          className="text-[#F4C542] hover:text-[#FFF6BD] underline transition-colors cursor-pointer font-semibold ml-0.5 focus:outline-none"
        >
          Privacy Policy
        </button>
      </div>

      {/* Bottom 3-Column Feature Cards: Save Progress | Achievements | Leaderboards */}
      <div className="pt-2 border-t border-[#4A186D]/40 grid grid-cols-3 gap-2 text-center select-none">
        {/* Perk 1: Save Progress */}
        <div className="auth-perk-card rounded-xl p-2 flex flex-col items-center justify-start hover:border-[#F4C542]/40 transition-colors">
          <div className="w-7 h-7 rounded-lg bg-[#270E44] border border-[#F4C542]/30 flex items-center justify-center mb-1 text-[#F4C542]">
            <Cloud className="w-3.5 h-3.5 text-[#F4C542]" />
          </div>
          <span className="text-[10px] font-bold text-[#F4C542] uppercase tracking-wider font-royal">
            SAVE PROGRESS
          </span>
          <span className="text-[9px] text-[#C9B9D4] font-body leading-tight mt-0.5">
            Keep your game progress safe
          </span>
        </div>

        {/* Perk 2: Achievements */}
        <div className="auth-perk-card rounded-xl p-2 flex flex-col items-center justify-start hover:border-[#F4C542]/40 transition-colors">
          <div className="w-7 h-7 rounded-lg bg-[#270E44] border border-[#F4C542]/30 flex items-center justify-center mb-1 text-[#F4C542]">
            <Trophy className="w-3.5 h-3.5 text-[#F4C542]" />
          </div>
          <span className="text-[10px] font-bold text-[#F4C542] uppercase tracking-wider font-royal">
            ACHIEVEMENTS
          </span>
          <span className="text-[9px] text-[#C9B9D4] font-body leading-tight mt-0.5">
            Unlock achievements & rewards
          </span>
        </div>

        {/* Perk 3: Leaderboards */}
        <div className="auth-perk-card rounded-xl p-2 flex flex-col items-center justify-start hover:border-[#F4C542]/40 transition-colors">
          <div className="w-7 h-7 rounded-lg bg-[#270E44] border border-[#F4C542]/30 flex items-center justify-center mb-1 text-[#F4C542]">
            <Award className="w-3.5 h-3.5 text-[#F4C542]" />
          </div>
          <span className="text-[10px] font-bold text-[#F4C542] uppercase tracking-wider font-royal">
            LEADERBOARDS
          </span>
          <span className="text-[9px] text-[#C9B9D4] font-body leading-tight mt-0.5">
            Compete with players worldwide
          </span>
        </div>
      </div>
    </div>
  );
};
