import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface AuthInputProps {
  id: string;
  label: string;
  type?: "text" | "email" | "password";
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  error?: string;
  required?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
  maxLength?: number;
  minLength?: number;
  helperText?: string;
  trailingElement?: React.ReactNode;
}

export const AuthInput: React.FC<AuthInputProps> = ({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  icon,
  error,
  required = false,
  autoComplete,
  autoFocus = false,
  maxLength,
  minLength,
  helperText,
  trailingElement,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="space-y-1">
      {/* Label and optional helper/action link */}
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#F4C542] font-royal select-none"
        >
          {label}
        </label>
        {trailingElement && <div>{trailingElement}</div>}
      </div>

      {/* Input container */}
      <div
        className={`relative flex items-center auth-input-box rounded-xl transition-all duration-200 ${
          error
            ? "border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]"
            : ""
        }`}
      >
        {/* Leading Icon */}
        {icon && (
          <div className="pl-3 pr-2 text-[#F4C542] flex items-center justify-center pointer-events-none opacity-90">
            {icon}
          </div>
        )}

        {/* Real Input */}
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          maxLength={maxLength}
          minLength={minLength}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
          className={`w-full py-2.5 ${icon ? "pl-1" : "pl-3"} ${
            isPassword ? "pr-10" : "pr-3"
          } bg-transparent text-white placeholder-gray-400/60 text-xs sm:text-sm focus:outline-none font-body`}
        />

        {/* Password toggle button */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2.5 p-1 text-gray-400 hover:text-[#F4C542] transition-colors cursor-pointer rounded focus:outline-none focus:ring-1 focus:ring-[#F4C542]"
            title={showPassword ? "Hide password" : "Show password"}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p id={`${id}-error`} className="text-[11px] text-red-400 flex items-center gap-1 font-body">
          <span>⚠</span> {error}
        </p>
      )}

      {/* Helper text if no error */}
      {!error && helperText && (
        <p id={`${id}-helper`} className="text-[10px] text-[#D8C7E0]/70 font-body">
          {helperText}
        </p>
      )}
    </div>
  );
};
