import React, { useState } from "react";
import { Mail, KeyRound, Lock, CheckCircle2 } from "lucide-react";
import { AuthHeader } from "./components/AuthHeader";
import { AuthInput } from "./components/AuthInput";
import { AuthButton } from "./components/AuthButton";
import { authService } from "../../services/authService";
import { toast } from "react-toastify";

interface ForgotPasswordFormProps {
  initialIdentifier?: string;
  onSuccessReturnToSignIn: (usernameOrEmail?: string) => void;
  onBackToSignIn: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  initialIdentifier = "",
  onSuccessReturnToSignIn,
  onBackToSignIn,
}) => {
  const [step, setStep] = useState<"step1" | "step2" | "success">("step1");
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError("Please enter your username or registered email");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await authService.forgotPassword(identifier.trim());
      toast.success(res.message || "A 6-digit OTP reset code was sent to your email!");
      setStep("step2");
    } catch (err: any) {
      setError(err.message || "Failed to find account or send reset code.");
      toast.error(err.message || "Could not request password reset");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and set new password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setError("Please enter the 6-digit OTP code");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await authService.resetPassword(
        identifier.trim(),
        otpCode.trim(),
        newPassword
      );
      toast.success(res.message || "Password successfully reset!");
      setStep("success");
    } catch (err: any) {
      setError(err.message || "Invalid or expired OTP code.");
      toast.error(err.message || "Password reset failed");
    } finally {
      setLoading(false);
    }
  };

  if (step === "success") {
    return (
      <div className="flex flex-col items-center justify-center py-4 text-center space-y-4 relative z-20">
        <div className="w-14 h-14 rounded-full bg-[#3B176B] border-2 border-[#F4C542] flex items-center justify-center text-[#F4C542] shadow-[0_0_20px_rgba(244,197,66,0.4)]">
          <CheckCircle2 className="w-8 h-8 text-[#F4C542]" />
        </div>

        <div className="space-y-1">
          <h3 className="text-xl font-bold font-royal auth-gold-gradient-text">
            Password Reset Complete!
          </h3>
          <p className="text-xs text-[#D8C7E0] font-body max-w-xs">
            Your new password is now active. You may now return to the throne room and sign in.
          </p>
        </div>

        <AuthButton
          variant="primary"
          onClick={() => onSuccessReturnToSignIn(identifier)}
        >
          SIGN IN WITH NEW PASSWORD
        </AuthButton>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-3.5 relative z-20">
      <AuthHeader
        title={step === "step1" ? "Reset Password" : "Enter Verification Code"}
        subtitle={
          step === "step1"
            ? "Enter your email address or username and we'll send you a secure 6-digit OTP code."
            : `Enter the 6-digit code sent for ${identifier} and your new password.`
        }
        showLogo={true}
      />

      {step === "step1" ? (
        <form onSubmit={handleRequestOtp} className="space-y-3.5">
          <AuthInput
            id="reset-identifier"
            label="USERNAME OR EMAIL"
            type="text"
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              setError(null);
            }}
            placeholder="Enter username or email"
            icon={<Mail className="w-4 h-4" />}
            error={error || undefined}
            required
            autoFocus
          />

          <AuthButton
            variant="primary"
            type="submit"
            loading={loading}
          >
            SEND RESET CODE
          </AuthButton>

          <div className="text-center pt-2 select-none border-t border-[#4A186D]/40">
            <button
              type="button"
              onClick={onBackToSignIn}
              className="text-xs text-[#D8C7E0] hover:text-[#F4C542] font-body transition-colors cursor-pointer"
            >
              Remembered your password? <span className="text-[#F4C542] font-bold font-royal underline">Sign In</span>
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-3">
          {/* OTP Code with large spaced font */}
          <div>
            <label
              htmlFor="otp-code"
              className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#F4C542] font-royal mb-1 select-none"
            >
              6-DIGIT OTP CODE
            </label>
            <div className="relative flex items-center auth-input-box rounded-xl">
              <div className="pl-3 pr-2 text-[#F4C542] flex items-center justify-center pointer-events-none">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                id="otp-code"
                type="text"
                value={otpCode}
                onChange={(e) => {
                  setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setError(null);
                }}
                placeholder="• • • • • •"
                maxLength={6}
                required
                autoFocus
                className="w-full py-2 bg-transparent text-[#F4C542] font-mono text-center text-lg tracking-[0.3em] placeholder-gray-500 focus:outline-none"
              />
            </div>
          </div>

          {/* New Password */}
          <AuthInput
            id="reset-new-password"
            label="NEW PASSWORD"
            type="password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setError(null);
            }}
            placeholder="Min 8 characters"
            icon={<Lock className="w-4 h-4" />}
            required
            minLength={8}
          />

          {/* Confirm Password */}
          <AuthInput
            id="reset-confirm-password"
            label="CONFIRM NEW PASSWORD"
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setError(null);
            }}
            placeholder="Confirm new password"
            icon={<Lock className="w-4 h-4" />}
            error={error || undefined}
            required
            minLength={8}
          />

          <AuthButton
            variant="primary"
            type="submit"
            loading={loading}
          >
            RESET PASSWORD
          </AuthButton>

          <div className="flex justify-between items-center pt-2 select-none border-t border-[#4A186D]/40 text-xs font-body">
            <button
              type="button"
              onClick={() => setStep("step1")}
              className="text-[#D8C7E0] hover:text-white transition-colors cursor-pointer"
            >
              Resend code
            </button>
            <button
              type="button"
              onClick={onBackToSignIn}
              className="text-[#F4C542] hover:text-[#FFF6BD] font-bold font-royal underline transition-colors cursor-pointer"
            >
              Back to Sign In
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
