import React from 'react';
import { Smartphone } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { InstallConfirmModal } from './InstallConfirmModal';

interface PWAHeaderButtonProps {
  className?: string;
  compact?: boolean;
  showTextOnMd?: boolean;
  asMenuItem?: boolean;
  onActionTriggered?: () => void;
}

export const PWAHeaderButton: React.FC<PWAHeaderButtonProps> = ({
  className = '',
  compact = false,
  showTextOnMd = false,
  asMenuItem = false,
  onActionTriggered,
}) => {
  const {
    isInstalled,
    isInstalling,
    showConfirmModal,
    requestInstallConfirmation,
    confirmAndInstall,
    closeConfirmModal,
  } = usePWAInstall();

  // Hide button from header once application is installed
  if (isInstalled) {
    return null;
  }

  const handleClick = () => {
    requestInstallConfirmation();
    if (onActionTriggered) onActionTriggered();
  };

  if (asMenuItem) {
    return (
      <>
        <button
          onClick={handleClick}
          className={`w-full px-3.5 py-2.5 text-left text-xs sm:text-sm text-yellow-300 hover:text-white hover:bg-yellow-500/15 rounded-xl font-bold flex items-center gap-2.5 transition-all cursor-pointer ${className}`}
          title="Install App"
        >
          <Smartphone className="w-4 h-4 text-yellow-400 shrink-0" />
          <span>Install App</span>
        </button>

        <InstallConfirmModal
          isOpen={showConfirmModal}
          isInstalling={isInstalling}
          onConfirm={confirmAndInstall}
          onClose={closeConfirmModal}
        />
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleClick}
        className={`inline-flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3.5 py-1.5 bg-gradient-to-r from-[#21073F] to-[#3F1152] hover:from-[#3F1152] hover:to-[#55186E] border border-[#FFD700]/70 rounded-full text-[11px] sm:text-xs font-bold text-[#FBE278] hover:text-white shadow-[0_0_12px_rgba(251,226,120,0.25)] hover:shadow-[0_0_18px_rgba(251,226,120,0.5)] transition-all duration-200 cursor-pointer active:scale-95 whitespace-nowrap flex-shrink-0 ${className}`}
        title="Install App"
      >
        <Smartphone className="w-3.5 h-3.5 text-[#FBE278] shrink-0" />
        {!compact && (
          <span className={showTextOnMd ? 'hidden md:inline' : 'inline'}>Install App</span>
        )}
      </button>

      <InstallConfirmModal
        isOpen={showConfirmModal}
        isInstalling={isInstalling}
        onConfirm={confirmAndInstall}
        onClose={closeConfirmModal}
      />
    </>
  );
};
