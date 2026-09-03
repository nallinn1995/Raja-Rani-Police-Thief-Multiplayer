import React from 'react';
import { Smartphone, Check } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { IOSInstallModal } from './IOSInstallModal';

interface PWAHeaderButtonProps {
  className?: string;
}

export const PWAHeaderButton: React.FC<PWAHeaderButtonProps> = ({ className = '' }) => {
  const {
    canInstall,
    isInstalled,
    showIOSModal,
    triggerInstall,
    closeIOSModal,
  } = usePWAInstall();

  if (isInstalled) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-[#3F1152]/50 border border-[#36D978]/60 rounded-full text-[10px] sm:text-xs font-semibold text-[#36D978] shadow-sm select-none ${className}`}
        title="Running as installed standalone application"
      >
        <Check className="w-3 h-3 text-[#36D978]" />
        <span className="hidden sm:inline">Raja Rani App Installed</span>
        <span className="sm:hidden">Installed</span>
      </div>
    );
  }

  if (!canInstall) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => triggerInstall()}
        className={`inline-flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3.5 py-1.5 bg-gradient-to-r from-[#21073F] to-[#3F1152] hover:from-[#3F1152] hover:to-[#55186E] border border-[#FFD700]/70 rounded-full text-[11px] sm:text-xs font-bold text-[#FBE278] hover:text-white shadow-[0_0_12px_rgba(251,226,120,0.25)] hover:shadow-[0_0_18px_rgba(251,226,120,0.5)] transition-all duration-200 cursor-pointer active:scale-95 whitespace-nowrap flex-shrink-0 ${className}`}
        title="Install App to Home Screen"
      >
        <Smartphone className="w-3.5 h-3.5 text-[#FBE278]" />
        <span>Install App</span>
      </button>

      <IOSInstallModal
        isOpen={showIOSModal}
        onClose={closeIOSModal}
      />
    </>
  );
};
