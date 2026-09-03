import React, { useState } from "react";
import { User, Mail, Lock, UserPlus } from "lucide-react";
import { AuthHeader } from "./components/AuthHeader";
import { AuthInput } from "./components/AuthInput";
import { AuthButton } from "./components/AuthButton";
import { AuthDivider } from "./components/AuthDivider";
import { authService, User as UserType } from "../../services/authService";
import { toast } from "react-toastify";

interface SignUpFormProps {
  onSuccess: (user: UserType) => void;
  onSwitchToSignIn: () => void;
  onGoogleSignIn: () => void;
  googleLoading?: boolean;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({
  onSuccess,
  onSwitchToSignIn,
  onGoogleSignIn,
  googleLoading = false,
}) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validate = () => {
    const errs: typeof errors = {};
    if (!username.trim()) {
      errs.username = "Username is required";
    } else if (username.trim().length < 2 || username.trim().length > 20) {
      errs.username = "Username must be 2 to 20 characters";
    }

    if (!email.trim()) {
      errs.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = "Please enter a valid email address";
    }

    if (!password) {
      errs.password = "Password is required";
    } else if (password.length < 8) {
      errs.password = "Password must be at least 8 characters";
    }

    if (password && confirmPassword !== password) {
      errs.confirmPassword = "Passwords do not match";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const user = await authService.signUp(username.trim(), email.trim(), password);
      toast.success(
        `Account created! Welcome email with your credentials was sent to ${email.trim()}`
      );
      onSuccess(user);
    } catch (err: any) {
      toast.error(err.message || "Registration failed. Username or email may already be registered.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-3 sm:space-y-3.5 relative z-20">
      {/* Header */}
      <AuthHeader
        title="Create Account"
        subtitle="Join the realm and engrave your name in the Hall of Kings."
        showLogo={true}
      />

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-2.5" noValidate>
        {/* Username */}
        <AuthInput
          id="signup-username"
          label="USERNAME"
          type="text"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            if (errors.username) setErrors((prev) => ({ ...prev, username: undefined }));
          }}
          placeholder="Choose a royal name"
          icon={<User className="w-4 h-4" />}
          error={errors.username}
          required
          autoComplete="username"
          autoFocus
        />

        {/* Email */}
        <AuthInput
          id="signup-email"
          label="EMAIL"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
          }}
          placeholder="Enter your email address"
          icon={<Mail className="w-4 h-4" />}
          error={errors.email}
          required
          autoComplete="email"
          helperText="Credentials confirmation will be sent here."
        />

        {/* Password & Confirm Password (2-column on sm+ screens for optimal vertical rhythm) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <AuthInput
            id="signup-password"
            label="PASSWORD"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            placeholder="Min 8 characters"
            icon={<Lock className="w-4 h-4" />}
            error={errors.password}
            required
            autoComplete="new-password"
            minLength={8}
          />

          <AuthInput
            id="signup-confirm-password"
            label="CONFIRM PASSWORD"
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (errors.confirmPassword)
                setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
            }}
            placeholder="Re-enter password"
            icon={<Lock className="w-4 h-4" />}
            error={errors.confirmPassword}
            required
            autoComplete="new-password"
            minLength={8}
          />
        </div>

        {/* Primary CTA: CREATE ACCOUNT */}
        <div className="pt-1.5">
          <AuthButton
            variant="primary"
            type="submit"
            loading={loading}
            icon={<UserPlus className="w-4 h-4 stroke-[2.5]" />}
          >
            CREATE ACCOUNT
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

      {/* Already have an account? Sign In */}
      <div className="text-center pt-2 select-none border-t border-[#4A186D]/40">
        <p className="text-xs text-gray-300 font-body">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToSignIn}
            className="text-[#F4C542] hover:text-[#FFF6BD] font-bold font-royal underline transition-colors cursor-pointer ml-1 focus:outline-none"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
};
