import React from "react";
import { ShieldCheck, Lock, Check } from "lucide-react";
import { AuthHeader } from "./components/AuthHeader";
import { AuthButton } from "./components/AuthButton";

interface PrivacyPolicyModalProps {
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  onClose,
}) => {
  return (
    <div className="flex flex-col space-y-3.5 relative z-20">
      <AuthHeader
        title="Privacy & Security"
        subtitle="Our commitment to safeguarding your royal realm identity & game progress."
        showLogo={false}
      />

      <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1 text-xs text-[#E1D4E9] font-body leading-relaxed">
        <div className="p-2.5 rounded-xl bg-[#1D0938]/80 border border-[#5F2282]/60 flex items-start gap-2.5">
          <div className="w-6 h-6 rounded-full bg-[#3B176B] border border-[#F4C542]/40 flex items-center justify-center shrink-0 mt-0.5">
            <Lock className="w-3.5 h-3.5 text-[#F4C542]" />
          </div>
          <div>
            <h4 className="font-bold font-royal text-[#F4C542] text-[11px] sm:text-xs">
              Account Security & Passwords
            </h4>
            <p className="text-[11px] text-[#C9B9D4] mt-0.5">
              Passwords are salted and cryptographically hashed with industry-standard bcrypt. Your raw credentials are never logged or exposed.
            </p>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-[#1D0938]/80 border border-[#5F2282]/60 flex items-start gap-2.5">
          <div className="w-6 h-6 rounded-full bg-[#3B176B] border border-[#F4C542]/40 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#F4C542]" />
          </div>
          <div>
            <h4 className="font-bold font-royal text-[#F4C542] text-[11px] sm:text-xs">
              Player Stats & Leaderboards
            </h4>
            <p className="text-[11px] text-[#C9B9D4] mt-0.5">
              We store match rankings, role wins (Raja, Rani, Police, Thief), and unlocked achievements to provide cross-device gameplay and global leaderboards.
            </p>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-[#1D0938]/80 border border-[#5F2282]/60 flex items-start gap-2.5">
          <div className="w-6 h-6 rounded-full bg-[#3B176B] border border-[#F4C542]/40 flex items-center justify-center shrink-0 mt-0.5">
            <Check className="w-3.5 h-3.5 text-[#F4C542]" />
          </div>
          <div>
            <h4 className="font-bold font-royal text-[#F4C542] text-[11px] sm:text-xs">
              Zero Third-Party Ad Tracking
            </h4>
            <p className="text-[11px] text-[#C9B9D4] mt-0.5">
              We do not sell personal data to advertisers or trackers. Guest sessions use an anonymous device identifier stored strictly on your local browser.
            </p>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <AuthButton variant="primary" onClick={onClose}>
          RETURN TO REALM
        </AuthButton>
      </div>
    </div>
  );
};
