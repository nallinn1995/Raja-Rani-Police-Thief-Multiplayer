import React, { useState, useEffect } from "react";
import { User, Lock, ShieldCheck } from "lucide-react";
import { AuthHeader } from "./components/AuthHeader";
import { AuthInput } from "./components/AuthInput";
import { AuthButton } from "./components/AuthButton";
import { AuthDivider } from "./components/AuthDivider";
import { authService, User as UserType } from "../../services/authService";
import { adminService } from "../../services/adminService";
import { toast } from "react-toastify";

interface SignInFormProps {
  onSuccess: (user: UserType) => void;
  onSwitchToSignUp: () => void;
  onForgotPassword: (initialUsername?: string) => void;
  onGoogleSignIn: () => void;
  googleLoading?: boolean;
}

export const SignInForm: React.FC<SignInFormProps> = ({
  onSuccess,
  onSwitchToSignUp,
  onForgotPassword,
  onGoogleSignIn,
  googleLoading = false,
}) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});

  // Prefill if remember me was saved
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

    const newErrors: { username?: string; password?: string } = {};
    if (!username.trim()) newErrors.username = "Username is required";
    if (!password) newErrors.password = "Password is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
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
      toast.error(err.message || "Sign in failed. Check your username and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-3 sm:space-y-3.5 relative z-20">
      {/* Header */}
      <AuthHeader
        title="Welcome Back!"
        subtitle="Enter your credentials to access your palace throne."
        showLogo={true}
      />

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        {/* Username */}
        <AuthInput
          id="signin-username"
          label="USERNAME"
          type="text"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            if (errors.username) setErrors((prev) => ({ ...prev, username: undefined }));
          }}
          placeholder="Enter your username"
          icon={<User className="w-4 h-4" />}
          error={errors.username}
          required
          autoComplete="username"
          autoFocus
        />

        {/* Password */}
        <AuthInput
          id="signin-password"
          label="PASSWORD"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
          }}
          placeholder="Enter your password"
          icon={<Lock className="w-4 h-4" />}
          error={errors.password}
          required
          autoComplete="current-password"
          trailingElement={
            <button
              type="button"
              onClick={() => onForgotPassword(username)}
              className="text-[11px] text-[#D878F0] hover:text-[#F4C542] font-semibold font-body transition-colors cursor-pointer focus:outline-none"
            >
              Forgot password?
            </button>
          }
        />

        {/* Remember Me & Secure indicator */}
        <div className="flex items-center justify-between pt-0.5 select-none">
          <label className="flex items-center space-x-2 cursor-pointer text-xs text-gray-300 hover:text-white font-body">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-[#782287] bg-[#0A041A] text-[#AC41D7] focus:ring-[#F4C542] accent-[#AC41D7] cursor-pointer"
            />
            <span className="font-medium">Remember me</span>
          </label>

          <span className="text-[11px] text-[#F4C542]/80 flex items-center gap-1 font-body">
            <ShieldCheck className="w-3.5 h-3.5 text-[#F4C542]" /> Saved securely
          </span>
        </div>

        {/* Primary CTA: SIGN IN */}
        <div className="pt-1">
          <AuthButton
            variant="primary"
            type="submit"
            loading={loading}
            icon={<User className="w-4 h-4 stroke-[2.5]" />}
          >
            SIGN IN
          </AuthButton>
        </div>
      </form>

      {/* ──────── ✦ OR ✦ ──────── */}
      <AuthDivider text="OR" className="my-1 sm:my-1.5" />

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

      {/* Don't have an account? Create Account */}
      <div className="text-center pt-2 select-none border-t border-[#4A186D]/40">
        <p className="text-xs text-gray-300 font-body">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToSignUp}
            className="text-[#F4C542] hover:text-[#FFF6BD] font-bold font-royal underline transition-colors cursor-pointer ml-1 focus:outline-none"
          >
            Create Account
          </button>
        </p>
      </div>
    </div>
  );
};
