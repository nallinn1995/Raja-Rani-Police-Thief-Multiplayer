import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, X } from "lucide-react";
import { authService, User as UserType } from "../../services/authService";
import { toast } from "react-toastify";
import { AuthGateway } from "./AuthGateway";
import { SignInForm } from "./SignInForm";
import { SignUpForm } from "./SignUpForm";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { PrivacyPolicyModal } from "./PrivacyPolicyModal";

interface AuthOverlayProps {
  onSuccess: (user: UserType) => void;
  onCancel: () => void;
  initialView?: AuthView;
}

export type AuthView = "gateway" | "signin" | "signup" | "forgot" | "privacy";

export const AuthOverlay: React.FC<AuthOverlayProps> = ({
  onSuccess,
  onCancel,
  initialView = "gateway",
}) => {
  const [view, setView] = useState<AuthView>(initialView);
  const [forgotInitialIdentifier, setForgotInitialIdentifier] = useState<string>("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const modalContentRef = useRef<HTMLDivElement>(null);

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

  // Google Identity Services (GSI) Setup
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

        const container = document.getElementById("googleSignInFallback");
        if (container) {
          container.innerHTML = "";
          window.google.accounts.id.renderButton(container, {
            type: "standard",
            theme: "outline",
            size: "large",
            text: "continue_with",
            shape: "pill",
            width: "340",
          });
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGsi();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          initGsi();
          clearInterval(interval);
        }
      }, 300);
      return () => clearInterval(interval);
    }
  }, [GOOGLE_CLIENT_ID]);

  // Handle Google Sign-In button click
  const handleGoogleClick = () => {
    if (!GOOGLE_CLIENT_ID) {
      toast.info(
        "Google Sign-In is enabled! Set VITE_GOOGLE_CLIENT_ID in your environment variables to connect live Google OAuth."
      );
      return;
    }

    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification: any) => {
        if (notification?.isNotDisplayed?.() || notification?.isSkippedMoment?.()) {
          const container = document.getElementById("googleSignInFallback");
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

  // Guest login handler
  const handleGuestLogin = () => {
    const guestUser = authService.loginGuest();
    toast.info(`Playing as ${guestUser.username}`);
    onSuccess(guestUser);
  };

  // Keyboard accessibility: ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalContentRef.current && !modalContentRef.current.contains(e.target as Node)) {
      onCancel();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Authentication"
    >
      {/* Centered Royal Modal Container */}
      <div
        ref={modalContentRef}
        className="relative w-full max-w-[440px] sm:max-w-[460px] auth-modal-card rounded-[26px] p-4 sm:p-6 text-white overflow-hidden my-auto transition-all duration-300 select-none shadow-[0_0_60px_rgba(168,38,178,0.45)]"
      >
        {/* Ornate Royal Corner Embellishments with Purple Gemstones */}
        <img
          src="/assets/images/Auth/corner-top-left.png"
          alt=""
          aria-hidden="true"
          className="absolute -top-1 -left-1 w-14 sm:w-16 pointer-events-none z-10 opacity-95 object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
          draggable={false}
        />
        <img
          src="/assets/images/Auth/corner-top-left.png"
          alt=""
          aria-hidden="true"
          className="absolute -top-1 -right-1 w-14 sm:w-16 pointer-events-none z-10 scale-x-[-1] opacity-95 object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
          draggable={false}
        />
        <img
          src="/assets/images/Auth/corner-top-left.png"
          alt=""
          aria-hidden="true"
          className="absolute -bottom-1 -left-1 w-14 sm:w-16 pointer-events-none z-10 scale-y-[-1] opacity-95 object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
          draggable={false}
        />
        <img
          src="/assets/images/Auth/corner-top-left.png"
          alt=""
          aria-hidden="true"
          className="absolute -bottom-1 -right-1 w-14 sm:w-16 pointer-events-none z-10 scale-[-1] opacity-95 object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
          draggable={false}
        />

        {/* Ambient subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#A81EB6]/20 blur-3xl pointer-events-none" />

        {/* Navigation Bar: Back button (if not in Gateway) */}
        {view !== "gateway" && (
          <button
            onClick={() => {
              if (view === "signin" || view === "signup") {
                setView("gateway");
              } else if (view === "forgot") {
                setView("signin");
              } else if (view === "privacy") {
                setView("gateway");
              }
            }}
            type="button"
            className="absolute top-3 sm:top-4 left-3 sm:left-4 w-8 h-8 rounded-full bg-[#200A45] border-2 border-[#F4C542] flex items-center justify-center text-[#F4C542] hover:scale-110 hover:border-white hover:text-white transition-all shadow-[0_0_12px_rgba(244,197,66,0.5)] z-30 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#F4C542]"
            title="Go Back"
            aria-label="Go Back"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          </button>
        )}

        {/* Top-Right Royal Close Button */}
        <button
          onClick={onCancel}
          type="button"
          className="absolute top-3 sm:top-4 right-3 sm:right-4 w-8 h-8 rounded-full bg-[#200A45] border-2 border-[#F4C542] flex items-center justify-center text-[#F4C542] hover:scale-110 hover:border-white hover:text-white transition-all shadow-[0_0_12px_rgba(244,197,66,0.5)] z-30 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#F4C542]"
          title="Close Dialog"
          aria-label="Close Dialog"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Dynamic View Router */}
        <div className="relative z-20 pt-1">
          {view === "gateway" && (
            <AuthGateway
              onSelectSignIn={() => setView("signin")}
              onSelectSignUp={() => setView("signup")}
              onPlayAsGuest={handleGuestLogin}
              onGoogleSignIn={handleGoogleClick}
              googleLoading={googleLoading}
              onOpenPrivacy={() => setView("privacy")}
            />
          )}

          {view === "signin" && (
            <SignInForm
              onSuccess={onSuccess}
              onSwitchToSignUp={() => setView("signup")}
              onForgotPassword={(user) => {
                setForgotInitialIdentifier(user || "");
                setView("forgot");
              }}
              onGoogleSignIn={handleGoogleClick}
              googleLoading={googleLoading}
            />
          )}

          {view === "signup" && (
            <SignUpForm
              onSuccess={onSuccess}
              onSwitchToSignIn={() => setView("signin")}
              onGoogleSignIn={handleGoogleClick}
              googleLoading={googleLoading}
            />
          )}

          {view === "forgot" && (
            <ForgotPasswordForm
              initialIdentifier={forgotInitialIdentifier}
              onSuccessReturnToSignIn={(_identifier) => {
                setView("signin");
              }}
              onBackToSignIn={() => setView("signin")}
            />
          )}

          {view === "privacy" && (
            <PrivacyPolicyModal onClose={() => setView("gateway")} />
          )}
        </div>

        {/* Hidden Fallback Container for Google Identity Services Button */}
        <div id="googleSignInFallback" className="hidden" aria-hidden="true" />
      </div>
    </div>
  );
};
