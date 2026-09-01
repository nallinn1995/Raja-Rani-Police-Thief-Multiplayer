import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Lock,
  UserPlus,
  UserCheck,
  ChevronRight,
  X,
  ArrowLeft,
  Eye,
  EyeOff,
  ShieldCheck,
  KeyRound,
} from "lucide-react";
import { authService, User as UserType } from "../../services/authService";
import { adminService } from "../../services/adminService";
import { toast } from "react-toastify";

interface AuthOverlayProps {
  onSuccess: (user: UserType) => void;
  onCancel: () => void;
}

type AuthMode = "signin" | "signup" | "forgot_step1" | "forgot_step2";

export const AuthOverlay: React.FC<AuthOverlayProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Forgot password states
  const [resetInput, setResetInput] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

  // Initialize Google Identity Services (GSI)
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || typeof window === "undefined") return;

    const handleGoogleResponse = async (response: any) => {
      if (!response?.credential) {
        toast.error("Google authentication failed. Please try again.");
        return;
      }
      setGoogleLoading(true);
      try {
        const user = await authService.loginGoogle(response.credential);
        toast.success(`Welcome ${user.username}!`);
        onSuccess(user);
      } catch (err: any) {
        toast.error(err.message || "Google sign in failed");
      } finally {
        setGoogleLoading(false);
      }
    };

    const initGsi = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        const container = document.getElementById("googleSignInContainer");
        if (container) {
          container.innerHTML = "";
          window.google.accounts.id.renderButton(container, {
            type: "standard",
            theme: "outline",
            size: "large",
            text: "continue_with",
            shape: "pill",
            width: "360",
          });
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGsi();
    } else {
      const checkInterval = setInterval(() => {
        if (window.google?.accounts?.id) {
          initGsi();
          clearInterval(checkInterval);
        }
      }, 300);
      return () => clearInterval(checkInterval);
    }
  }, [GOOGLE_CLIENT_ID, mode]);

  // Load saved credentials if "Remember Me" was previously checked
  useEffect(() => {
    const savedUser = localStorage.getItem("remember_username");
    const savedPass = localStorage.getItem("remember_password");
    if (savedUser && savedPass) {
      setUsername(savedUser);
      setPassword(savedPass);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "signin") {
      if (!username.trim() || !password) {
        toast.error("Please enter both username and password");
        return;
      }
      setLoading(true);
      try {
        let user: UserType;
        try {
          user = await authService.signIn(username.trim(), password);
        } catch (signInErr: any) {
          // Fallback check for admin bootstrap credentials or admin API login
          const adminRes = await adminService.login(password, username.trim()).catch(() => null);
          if (adminRes && adminRes.token) {
            user = {
              username: adminRes.admin?.username || username.trim() || "SuperAdmin",
              role: "admin",
              isGuest: false,
              createdAt: new Date().toISOString(),
            };
            authService.setCurrentUser(user);
          } else {
            throw signInErr;
          }
        }

        if (rememberMe) {
          localStorage.setItem("remember_username", username.trim());
          localStorage.setItem("remember_password", password);
        } else {
          localStorage.removeItem("remember_username");
          localStorage.removeItem("remember_password");
        }

        toast.success(`Welcome back ${user.username}!`);
        onSuccess(user);
      } catch (err: any) {
        toast.error(err.message || "Sign in failed");
      } finally {
        setLoading(false);
      }
    } else if (mode === "signup") {
      if (!username.trim()) {
        toast.error("Please enter a username");
        return;
      }
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        toast.error("Please enter a valid email address");
        return;
      }
      if (password.length < 8) {
        toast.error("Password must be at least 8 characters");
        return;
      }
      if (password !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }

      setLoading(true);
      try {
        const user = await authService.signUp(username.trim(), email.trim(), password);
        toast.success(`Account created! A welcome email with your credentials was sent to ${email.trim()}`);
        onSuccess(user);
      } catch (err: any) {
        toast.error(err.message || "Registration failed");
      } finally {
        setLoading(false);
      }
    } else if (mode === "forgot_step1") {
      if (!resetInput.trim()) {
        toast.error("Please enter your username or registered email");
        return;
      }

      setLoading(true);
      try {
        const res = await authService.forgotPassword(resetInput.trim());
        toast.success(res.message || "Verification OTP code sent to your email!");
        setMode("forgot_step2");
      } catch (err: any) {
        toast.error(err.message || "Failed to request reset code");
      } finally {
        setLoading(false);
      }
    } else if (mode === "forgot_step2") {
      if (!otpCode.trim()) {
        toast.error("Please enter the 6-digit OTP code");
        return;
      }
      if (newPassword.length < 8) {
        toast.error("New password must be at least 8 characters");
        return;
      }

      setLoading(true);
      try {
        const res = await authService.resetPassword(resetInput.trim(), otpCode.trim(), newPassword);
        toast.success(res.message || "Password reset successful!");
        setPassword(newPassword);
        setUsername(resetInput.trim());
        setMode("signin");
      } catch (err: any) {
        toast.error(err.message || "Failed to reset password");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGoogleClick = () => {
    if (!GOOGLE_CLIENT_ID) {
      toast.info("Google Sign-In is enabled! To connect your Google account, set VITE_GOOGLE_CLIENT_ID in your environment variables.");
      return;
    }

    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification: any) => {
        if (notification?.isNotDisplayed?.() || notification?.isSkippedMoment?.()) {
          const container = document.getElementById("googleSignInContainer");
          const btn = container?.querySelector('div[role="button"]') as HTMLElement;
          if (btn) {
            btn.click();
          }
        }
      });
    } else {
      toast.error("Google authentication is initializing. Please try again in a moment.");
    }
  };

  const handleGuest = () => {
    const guestUser = authService.loginGuest();
    toast.info(`Playing as ${guestUser.username}`);
    onSuccess(guestUser);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      {/* Compact Modal Container: Fits completely on screen with zero scrollbar */}
      <div className="relative w-full max-w-[460px] bg-gradient-to-b from-[#1E093D] via-[#0E0424] to-[#1E093D] rounded-[22px] border-2 border-[#FBE278] p-4 sm:p-5 text-white shadow-[0_0_50px_rgba(168,38,178,0.45)] outline outline-1 outline-[#FBE278]/30 overflow-hidden my-auto">
        
        {/* Ornate Corner Border Graphics (Pointer Events Disabled so clicks pass through) */}
        <img
          src="/assets/images/Auth/corner-top-left.png"
          alt=""
          className="absolute -top-1 -left-1 w-14 sm:w-16 pointer-events-none z-10 opacity-95 object-contain filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]"
        />
        <img
          src="/assets/images/Auth/corner-top-left.png"
          alt=""
          className="absolute -top-1 -right-1 w-14 sm:w-16 pointer-events-none z-10 scale-x-[-1] opacity-95 object-contain filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]"
        />
        <img
          src="/assets/images/Auth/corner-top-left.png"
          alt=""
          className="absolute -bottom-1 -left-1 w-14 sm:w-16 pointer-events-none z-10 scale-y-[-1] opacity-95 object-contain filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]"
        />
        <img
          src="/assets/images/Auth/corner-top-left.png"
          alt=""
          className="absolute -bottom-1 -right-1 w-14 sm:w-16 pointer-events-none z-10 scale-[-1] opacity-95 object-contain filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]"
        />

        {/* Back Button: Top Left (z-50 & cursor-pointer for instant response) */}
        {(mode === "signup" || mode === "forgot_step1" || mode === "forgot_step2") && (
          <button
            onClick={() => setMode("signin")}
            type="button"
            className="absolute top-3 left-3 w-8 h-8 rounded-full bg-[#200A45] border-2 border-[#FBE278] flex items-center justify-center text-[#FBE278] hover:scale-110 hover:border-white transition-all shadow-[0_0_12px_rgba(251,226,120,0.5)] z-50 cursor-pointer pointer-events-auto"
            title="Back to Sign In"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          </button>
        )}

        {/* Close Button: Top Right (z-50 & cursor-pointer for instant response) */}
        <button
          onClick={onCancel}
          type="button"
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#200A45] border-2 border-[#FBE278] flex items-center justify-center text-[#FBE278] hover:scale-110 hover:border-white transition-all shadow-[0_0_12px_rgba(251,226,120,0.5)] z-50 cursor-pointer pointer-events-auto"
          title="Close"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Header Section */}
        <div className="text-center mb-2 pt-0.5 relative z-20">
          {/* Crown Logo Badge */}
          <div className="flex justify-center mb-1">
            <img
              src="/assets/images/Auth/section_centered_iimage.png"
              alt="Raja Rani Police Thief Logo"
              className="h-12 sm:h-14 object-contain filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]"
            />
          </div>

          {/* Title with Decorative Wing Flourishes */}
          <div className="flex items-center justify-center gap-2 mb-0.5">
            <img
              src="/assets/images/Auth/title_decor.png"
              alt=""
              className="h-3 object-contain"
            />
            <h2 className="text-lg sm:text-xl font-black font-serif tracking-wide auth-gold-gradient-text">
              {mode === "signin" && "Welcome Back!"}
              {mode === "signup" && "Create Account"}
              {mode === "forgot_step1" && "Forgot Password?"}
              {mode === "forgot_step2" && "Reset Password"}
            </h2>
            <img
              src="/assets/images/Auth/title_decor.png"
              alt=""
              className="h-3 object-contain scale-x-[-1]"
            />
          </div>

          {/* Subtitle */}
          <p className="text-[10px] sm:text-[11px] text-[#D8C7E0] font-medium leading-tight max-w-xs mx-auto">
            {mode === "signin" && "Sign in to access your stats, achievements & leaderboards"}
            {mode === "signup" && "Sign up to receive credentials email & save your match stats!"}
            {mode === "forgot_step1" && "Enter your username or email to receive a 6-digit OTP code"}
            {mode === "forgot_step2" && "Enter the 6-digit code sent to your email and your new password"}
          </p>
        </div>

        {/* CONTINUE WITH GOOGLE (AVAILABLE ON SIGNIN & SIGNUP) */}
        {(mode === "signin" || mode === "signup") && (
          <div className="relative z-20 mb-2">
            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={googleLoading || loading}
              className="w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs flex items-center justify-center gap-2.5 transition-all shadow-md hover:shadow-lg active:scale-[0.99] border border-slate-200 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {/* Official Google G Logo SVG */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span className="tracking-wide text-slate-800 font-bold font-sans">
                {googleLoading ? "Connecting to Google..." : "Continue with Google"}
              </span>
            </button>

            {/* Hidden container for Google Identity Services standard rendered button fallback */}
            <div id="googleSignInContainer" className="hidden" />

            {/* OR DIVIDER */}
            <div className="flex items-center my-2">
              <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-[#782287] to-transparent" />
              <span className="px-2 text-[10px] font-bold text-[#FBE278] flex items-center gap-1">
                <span className="text-[8px]">✧</span> OR <span className="text-[8px]">✧</span>
              </span>
              <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-[#782287] to-transparent" />
            </div>
          </div>
        )}

        {/* Form Controls */}
        <form onSubmit={handleSubmit} className="space-y-2 relative z-20">
          
          {/* SIGN IN FORM */}
          {mode === "signin" && (
            <>
              {/* USERNAME */}
              <div>
                <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#FBE278] mb-0.5 font-serif">
                  USERNAME
                </label>
                <div className="relative flex items-center auth-input-box rounded-xl">
                  <div className="pl-2.5 pr-1.5 text-[#FBE278] flex items-center justify-center pointer-events-none">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    required
                    className="w-full py-1.5 pr-3 bg-transparent text-white placeholder-gray-400/60 text-xs focus:outline-none font-sans"
                    autoFocus
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#FBE278] font-serif">
                    PASSWORD
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetInput(username);
                      setMode("forgot_step1");
                    }}
                    className="text-[10px] text-[#C05BD6] hover:text-[#FBE278] font-semibold transition-colors cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative flex items-center auth-input-box rounded-xl">
                  <div className="pl-2.5 pr-1.5 text-[#FBE278] flex items-center justify-center pointer-events-none">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full py-1.5 pr-8 bg-transparent text-white placeholder-gray-400/60 text-xs focus:outline-none font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 text-gray-400 hover:text-[#FBE278] transition-colors p-0.5 cursor-pointer"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* REMEMBER ME & SAVED SECURELY */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center space-x-1.5 cursor-pointer text-[10px] sm:text-[11px] text-gray-200 hover:text-white select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-[#782287] bg-[#0A041A] text-[#AC41D7] focus:ring-purple-500 accent-[#AC41D7] cursor-pointer"
                  />
                  <span className="font-semibold text-gray-200">Remember Me</span>
                </label>

                <span className="text-[10px] text-[#FBE278] flex items-center gap-1 opacity-90 font-medium">
                  <ShieldCheck className="w-3 h-3 text-[#FBE278]" /> Saved securely
                </span>
              </div>
            </>
          )}

          {/* SIGN UP FORM (2-Column Grid Layout for Compact Vertical Height) */}
          {mode === "signup" && (
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* USERNAME */}
                <div>
                  <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#FBE278] mb-0.5 font-serif">
                    USERNAME
                  </label>
                  <div className="relative flex items-center auth-input-box rounded-xl">
                    <div className="pl-2.5 pr-1.5 text-[#FBE278] flex items-center justify-center pointer-events-none">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Username (2-20 chars)"
                      required
                      className="w-full py-1.5 pr-2 bg-transparent text-white placeholder-gray-400/60 text-xs focus:outline-none font-sans"
                      autoFocus
                    />
                  </div>
                </div>

                {/* EMAIL ADDRESS */}
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#FBE278] font-serif">
                      EMAIL
                    </label>
                    <span className="text-[9px] text-[#E879F9] font-medium tracking-tight">
                      Credentials destination
                    </span>
                  </div>
                  <div className="relative flex items-center auth-input-box rounded-xl">
                    <div className="pl-2.5 pr-1.5 text-[#FBE278] flex items-center justify-center pointer-events-none">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email address"
                      required
                      className="w-full py-1.5 pr-2 bg-transparent text-white placeholder-gray-400/60 text-xs focus:outline-none font-sans"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* PASSWORD */}
                <div>
                  <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#FBE278] mb-0.5 font-serif">
                    PASSWORD
                  </label>
                  <div className="relative flex items-center auth-input-box rounded-xl">
                    <div className="pl-2.5 pr-1.5 text-[#FBE278] flex items-center justify-center pointer-events-none">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      required
                      minLength={8}
                      className="w-full py-1.5 pr-7 bg-transparent text-white placeholder-gray-400/60 text-xs focus:outline-none font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 text-gray-400 hover:text-[#FBE278] transition-colors p-0.5 cursor-pointer"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* CONFIRM PASSWORD */}
                <div>
                  <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#FBE278] mb-0.5 font-serif">
                    CONFIRM PASSWORD
                  </label>
                  <div className="relative flex items-center auth-input-box rounded-xl">
                    <div className="pl-2.5 pr-1.5 text-[#FBE278] flex items-center justify-center pointer-events-none">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      required
                      minLength={8}
                      className="w-full py-1.5 pr-7 bg-transparent text-white placeholder-gray-400/60 text-xs focus:outline-none font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2 text-gray-400 hover:text-[#FBE278] transition-colors p-0.5 cursor-pointer"
                      title={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FORGOT PASSWORD STEP 1 */}
          {mode === "forgot_step1" && (
            <div>
              <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#FBE278] mb-0.5 font-serif">
                USERNAME OR EMAIL ADDRESS
              </label>
              <div className="relative flex items-center auth-input-box rounded-xl">
                <div className="pl-2.5 pr-1.5 text-[#FBE278] flex items-center justify-center pointer-events-none">
                  <KeyRound className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  value={resetInput}
                  onChange={(e) => setResetInput(e.target.value)}
                  placeholder="Enter username or email"
                  required
                  className="w-full py-1.5 pr-3 bg-transparent text-white placeholder-gray-400/60 text-xs focus:outline-none font-sans"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* FORGOT PASSWORD STEP 2 */}
          {mode === "forgot_step2" && (
            <div className="space-y-2">
              <div>
                <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#FBE278] mb-0.5 font-serif">
                  6-DIGIT OTP CODE
                </label>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  required
                  className="w-full py-2 bg-[#0A041A] border-2 border-[#FBE278] text-[#FBE278] text-center font-mono text-base tracking-widest rounded-xl placeholder-gray-600 focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#FBE278] mb-0.5 font-serif">
                  NEW PASSWORD
                </label>
                <div className="relative flex items-center auth-input-box rounded-xl">
                  <div className="pl-2.5 pr-1.5 text-[#FBE278] flex items-center justify-center pointer-events-none">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    minLength={8}
                    required
                    className="w-full py-1.5 pr-7 bg-transparent text-white placeholder-gray-400/60 text-xs focus:outline-none font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2 text-gray-400 hover:text-[#FBE278] transition-colors p-0.5 cursor-pointer"
                    title={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PRIMARY SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl auth-btn-primary text-white font-bold text-xs sm:text-sm tracking-wider shadow-[0_0_20px_rgba(185,35,206,0.6)] cursor-pointer mt-1.5 flex items-center justify-center gap-1.5"
          >
            {loading ? (
              "Processing..."
            ) : mode === "signin" ? (
              <>
                <span className="text-[#FBE278] text-[9px]">✧</span>
                <span>SIGN IN</span>
                <span className="text-[#FBE278] text-[9px]">✧</span>
              </>
            ) : mode === "signup" ? (
              <>
                <span className="text-[#FBE278] text-[9px]">✧</span>
                <span className="text-[11px] sm:text-xs">CREATE ACCOUNT & SEND CREDENTIALS</span>
                <span className="text-[#FBE278] text-[9px]">✧</span>
              </>
            ) : mode === "forgot_step1" ? (
              "SEND VERIFICATION OTP CODE"
            ) : (
              "RESET PASSWORD"
            )}
          </button>
        </form>

        {/* DIVIDERS & SECONDARY BUTTONS */}
        {mode === "signin" && (
          <div className="relative z-20">
            {/* OR DIVIDER 1 */}
            <div className="flex items-center my-2">
              <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-[#782287] to-transparent" />
              <span className="px-2 text-[10px] font-bold text-[#FBE278] flex items-center gap-1">
                <span className="text-[8px]">✧</span> OR <span className="text-[8px]">✧</span>
              </span>
              <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-[#782287] to-transparent" />
            </div>

            {/* CREATE NEW ACCOUNT BUTTON */}
            <button
              type="button"
              onClick={() => setMode("signup")}
              className="w-full py-2 px-3 rounded-xl bg-[#160830]/90 border border-[#521C78] hover:border-[#AC41D7] hover:bg-[#200A45] text-white flex items-center justify-between transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <UserPlus className="w-3.5 h-3.5 text-[#C05BD6] group-hover:scale-110 transition-transform" />
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gray-100 font-serif">
                  CREATE NEW ACCOUNT
                </span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-[#C05BD6] group-hover:translate-x-1 transition-transform" />
            </button>

            {/* OR DIVIDER 2 */}
            <div className="flex items-center my-1.5">
              <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-[#3F1152]/60 to-transparent" />
              <span className="px-2 text-[9px] font-semibold text-gray-400">OR</span>
              <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-[#3F1152]/60 to-transparent" />
            </div>

            {/* CONTINUE AS GUEST BUTTON */}
            <button
              type="button"
              onClick={handleGuest}
              className="w-full py-2 px-3 rounded-xl bg-[#0B1333]/90 border border-[#263778] hover:border-[#38BDF8] hover:bg-[#101D4B] text-[#38BDF8] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#38BDF8] font-serif">
                CONTINUE AS GUEST
              </span>
            </button>
          </div>
        )}

        {mode === "signup" && (
          <div className="relative z-20">
            {/* OR DIVIDER */}
            <div className="flex items-center my-2">
              <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-[#782287] to-transparent" />
              <span className="px-2 text-[10px] font-bold text-[#FBE278] flex items-center gap-1">
                <span className="text-[8px]">✧</span> OR <span className="text-[8px]">✧</span>
              </span>
              <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-[#782287] to-transparent" />
            </div>

            {/* TOGGLE TO SIGN IN */}
            <div className="text-center mb-1.5">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="text-[11px] text-gray-300 font-medium hover:underline cursor-pointer"
              >
                Already have an account? <span className="text-[#FBE278] font-bold">Sign In</span>
              </button>
            </div>

            {/* CONTINUE AS GUEST BUTTON */}
            <button
              type="button"
              onClick={handleGuest}
              className="w-full py-2 px-3 rounded-xl bg-[#0B1333]/90 border border-[#263778] hover:border-[#38BDF8] hover:bg-[#101D4B] text-[#38BDF8] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#38BDF8] font-serif">
                CONTINUE AS GUEST
              </span>
            </button>
          </div>
        )}

        {/* FOOTER NOTE */}
        <div className="mt-2 pt-1.5 px-10 text-center border-t border-[#3F1152]/50 relative z-20">
          <p className="text-[10px] text-gray-400 flex items-center justify-center gap-1 font-medium">
            <ShieldCheck className="w-3 h-3 text-gray-400 opacity-80" />
            <span>Your progress as guest will be temporary</span>
          </p>
        </div>

      </div>
    </div>
  );
};
