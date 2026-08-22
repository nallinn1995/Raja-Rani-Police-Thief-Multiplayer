import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Trophy,
  Clock,
  Target,
  Swords,
  User as UserIcon,
  Gamepad2,
  Frown,
  RotateCw,
  Flame,
  Crown,
  LayoutDashboard,
  BarChart3,
  Theater,
  History,
  Award,
  Users,
  Shield,
  ChevronRight,
  Menu,
  X,
  Calendar,
  Edit3,
  UserCheck,
  Zap,
  Sparkles
} from 'lucide-react';
import { toast } from 'react-toastify';
import { profileService } from '../services/profileService';
import { authService, User as UserType } from '../services/authService';
import { calculateLevel } from '../config/xpConfig';
import { DetectiveProfileTab } from './detectiveChallenge/DetectiveProfileTab';
import { ModernProfileTab } from './modernMode/ModernProfileTab';
import { AchievementsView, AchievementBadgeIcon } from './AchievementsView';
import { Search } from 'lucide-react';
import { PRESET_AVATARS, getAvatarSrc } from '../utils/avatarUtils';

interface ProfileDashboardProps {
  user: UserType;
  onBack: () => void;
  onUpdateUser?: (updatedUser: UserType) => void;
}

export type ActiveTab = 'overview' | 'classic-mode' | 'detective-challenge' | 'modern-mode' | 'police-mode' | 'statistics' | 'xp-breakdown' | 'roles' | 'achievements' | 'history' | 'records' | 'friends' | 'edit-profile';

// Avatar rendering helper utilizing PRESET_AVATARS

const renderAvatarById = (avatarId: string, size = "w-14 h-14") => {
  const src = getAvatarSrc(avatarId);
  return (
    <img
      src={src}
      alt="Profile Avatar"
      className={`${size} rounded-full object-cover border-2 border-yellow-400/80 shadow-md shrink-0`}
    />
  );
};

const formatPlayTime = (totalSeconds: number): string => {
  if (!totalSeconds || totalSeconds <= 0) return "0 min";
  const totalMins = Math.floor(totalSeconds / 60);
  if (totalMins < 1) {
    return `${totalSeconds} sec`;
  }
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins} min`;
};

export const ProfileDashboard: React.FC<ProfileDashboardProps> = ({ user, onBack, onUpdateUser }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [roleModeFilter, setRoleModeFilter] = useState<'all' | 'classic' | 'modern' | 'detective'>('all');
  const [historyModeFilter, setHistoryModeFilter] = useState<'all' | 'classic' | 'modern' | 'detective'>('all');

  // Edit Profile Form State
  const [editUsername, setEditUsername] = useState(user.username || '');
  const [editDescription, setEditDescription] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('1');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const targetUserId = user?.id || user?._id || user?.username;
    if (!user || !targetUserId) return;
    if (!data) {
      setStatus('Loading profile...');
      setLoading(true);
    }
    setError('');
    profileService.getProfile(targetUserId)
      .then((res) => {
        setData(res);
        if (res?.user) {
          setEditUsername(res.user.username || user.username || '');
          setEditDescription(res.user.description || '');
          setSelectedAvatar(res.user.avatar || '1');

          if (
            res.user.avatar !== user.avatar ||
            res.user.username !== user.username ||
            res.user.description !== user.description
          ) {
            const updatedUser = {
              ...user,
              username: res.user.username || user.username,
              avatar: res.user.avatar || '1',
              description: res.user.description || '',
            };
            authService.setCurrentUser(updatedUser);
            if (onUpdateUser) {
              onUpdateUser(updatedUser);
            }
          }
        }
        setStatus('Profile loaded.');
      })
      .catch((e) => {
        console.warn("[ProfileDashboard] Could not fetch profile from server, initializing default fresh profile:", e);
        const defaultLevelInfo = calculateLevel(0);
        const fallbackData = {
          user: {
            id: targetUserId,
            username: user.username || 'Detective',
            avatar: '1',
            description: '',
            country: 'IN',
            level: 1,
            xp: 0,
            levelInfo: defaultLevelInfo,
            title: 'Junior Detective',
            createdAt: new Date().toISOString(),
            lastPlayedAt: new Date().toISOString(),
          },
          stats: {
            avatar: '1',
            description: '',
            username: user.username || 'Detective',
            playerLevel: 1,
            xp: 0,
            levelInfo: defaultLevelInfo,
            xpBreakdown: {
              totalXp: 0,
              overallLevelInfo: defaultLevelInfo,
              classicMode: { xp: 0, levelInfo: defaultLevelInfo },
              modernMode: { xp: 0, levelInfo: defaultLevelInfo },
              detectiveChallenge: { xp: 0, levelInfo: defaultLevelInfo },
            },
            title: 'Junior Detective',
            joinDate: new Date().toISOString(),
            lastPlayedDate: new Date().toISOString(),
            overallStats: {
              totalGames: 0, gamesPlayed: 0, totalWins: 0, gamesWon: 0,
              totalLosses: 0, gamesLost: 0, totalRoundsPlayed: 0, totalScore: 0,
              winRate: 0, totalTimePlayed: 0, totalPlayTime: 0,
              currentWinStreak: 0, longestWinStreak: 0,
            },
            roleStats: {},
            classicMode: { xp: 0, levelInfo: defaultLevelInfo },
            modernMode: { xp: 0, levelInfo: defaultLevelInfo },
            policeMode: {},
            detectiveChallenge: { xp: 0, levelInfo: defaultLevelInfo },
            records: { fastestCatch: 0, longestWinStreak: 0 },
            socialStats: { roomsCreated: 0, roomsJoined: 0, friendsAdded: 0, recentFriends: [] },
            social: { roomsCreated: 0, roomsJoined: 0, friendsAdded: 0, recentFriends: [] },
            daily: { gamesPlayed: 0, wins: 0, losses: 0, winRate: 0 },
            weekly: { gamesPlayed: 0, wins: 0, losses: 0, winRate: 0 },
          },
          achievements: [],
          recentMatches: [],
        };
        setData(fallbackData);
        setStatus('Profile initialized.');
      })
      .finally(() => setLoading(false));
  }, [user?.id, user?._id, user?.username]);

  const handleSaveProfile = async () => {
    if (!editUsername.trim() || editUsername.trim().length < 2) {
      toast.error("Username must be at least 2 characters.");
      return;
    }
    setIsSaving(true);
    try {
      const targetUserId = user.id || user._id || '';
      if (!targetUserId) {
        toast.error("User ID missing");
        return;
      }
      const res = await profileService.updateProfile({
        userId: targetUserId,
        username: editUsername.trim(),
        description: editDescription.trim(),
        avatar: selectedAvatar,
      });

      const updatedProfileData = res?.user ? res : (res?.data || res);
      if (updatedProfileData && (updatedProfileData.user || updatedProfileData._id)) {
        if (updatedProfileData.user) {
          setData(updatedProfileData);
        } else {
          setData((prev: any) => ({ ...prev, user: updatedProfileData }));
        }

        const updatedUser = {
          ...user,
          username: editUsername.trim(),
          avatar: selectedAvatar,
          description: editDescription.trim(),
        };

        authService.setCurrentUser(updatedUser);
        if (onUpdateUser) {
          onUpdateUser(updatedUser);
        }

        toast.success("Profile updated successfully!");
        setActiveTab('overview');
      } else {
        toast.error("Failed to parse updated profile data.");
      }
    } catch (err: any) {
      console.error("[ProfileDashboard] Save profile error:", err);
      toast.error(err.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (!user || user.isGuest) {
    return (
      <div className="min-h-screen bg-[#11052C] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#3A1054] via-[#11052C] to-[#0A0217] flex items-center justify-center p-4">
        <div className="text-center bg-[#1D0C3A]/95 border border-[#3A1C61] p-8 rounded-3xl max-w-md shadow-2xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-yellow-400 flex items-center justify-center mx-auto mb-2">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white">Registered Account Required</h2>
          <p className="text-sm text-purple-200 leading-relaxed">
            Profile Dashboard & Mode Statistics tracking are available exclusively for registered accounts.
            Please sign up or log in to track your wins, trophies, and match history!
          </p>
          <button
            onClick={onBack}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-extrabold rounded-xl shadow-lg hover:from-amber-400 hover:to-yellow-400 transition-all cursor-pointer"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#11052C] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#3A1054] via-[#11052C] to-[#0A0217] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-purple-200 font-sans tracking-wide">{status}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#11052C] flex items-center justify-center p-4">
        <div className="text-center bg-[#1D0C3A] border border-red-500/40 p-6 rounded-2xl max-w-md">
          <p className="text-red-400 font-semibold mb-4">{error}</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-[#2A1154] text-white rounded-xl hover:bg-purple-800 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const userObj = data?.user || {};
  const stats = data?.stats || {};
  const achievements = data?.achievements || [];
  const recentMatches = data?.recentMatches || [];
  const overallStats = stats?.overallStats || {};
  const roleStats = stats?.roleStats || {};
  const classicMode = stats?.classicMode || {};
  const modernMode = stats?.modernMode || {};
  const detectiveChallenge = stats?.detectiveChallenge || {};
  const policeMode = stats?.policeMode || {};
  const records = stats?.records || {};
  const xpBreakdown = stats?.xpBreakdown || {};

  const classicXp = classicMode.xp ?? (xpBreakdown?.classicMode?.xp ?? 0);
  const modernXp = modernMode.xp ?? (xpBreakdown?.modernMode?.xp ?? 0);
  const detectiveXp = detectiveChallenge.xp ?? (xpBreakdown?.detectiveChallenge?.xp ?? 0);

  const ACHIEVEMENT_XP_MAP: Record<string, number> = {
    FIRST_STEPS: 100,
    VICTORIOUS: 100,
    MASTER_DETECTIVE: 500,
    SHARP_SHOOTER: 300,
    GHOST_HUNTER: 200,
    GHOST_THIEF: 300,
    SHADOW_ESCAPE: 250,
    OBSERVATION_KING: 200,
    SPEED_DETECTIVE: 300,
    ROYAL_SOVEREIGN: 500,
    RAJAS_BOUNTY: 200,
    ULTIMATE_DETECTIVE: 500,
  };

  const achievementXp = xpBreakdown?.achievements?.xp ?? achievements.reduce(
    (sum: number, a: any) => sum + (Number(a.xpReward) || ACHIEVEMENT_XP_MAP[a.code] || 100),
    0
  );

  const totalXp = stats.xpBreakdown?.totalXp || (classicXp + modernXp + detectiveXp + achievementXp);
  const globalLevelInfo = userObj.levelInfo || stats.levelInfo || calculateLevel(totalXp);
  const classicLevelInfo = classicMode.levelInfo || calculateLevel(classicXp);
  const modernLevelInfo = modernMode.levelInfo || calculateLevel(modernXp);
  const detectiveLevelInfo = detectiveChallenge.levelInfo || calculateLevel(detectiveXp);

  const currentAvatar = userObj.avatar || stats.avatar || selectedAvatar || '1';
  const currentDescription = userObj.description || stats.description || 'Detective in the making';

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '—';
      return (
        d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
        ', ' +
        d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
      );
    } catch {
      return '—';
    }
  };

  const formatMatchDate = (dateStr?: string) => {
    if (!dateStr) return { day: '—', month: '—', time: '—' };
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return { day: '—', month: '—', time: '—' };
      const day = d.getDate().toString();
      const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
      const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      return { day, month, time };
    } catch {
      return { day: '—', month: '—', time: '—' };
    }
  };

  type ActiveTab = 'overview' | 'classic-mode' | 'detective-challenge' | 'modern-mode' | 'police-mode' | 'statistics' | 'xp-breakdown' | 'roles' | 'achievements' | 'history' | 'records' | 'friends' | 'edit-profile';

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'xp-breakdown', label: 'XP Breakdown', icon: <Zap className="w-5 h-5 text-yellow-400" /> },
    { id: 'modern-mode', label: 'Modern Mode', icon: <Crown className="w-5 h-5 text-yellow-400" /> },
    { id: 'classic-mode', label: 'Classic Mode', icon: <Crown className="w-5 h-5 text-amber-400" /> },
    { id: 'detective-challenge', label: 'Detective Challenge', icon: <Search className="w-5 h-5 text-cyan-400" /> },
    { id: 'statistics', label: 'Statistics', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'roles', label: 'Role Performance', icon: <Theater className="w-5 h-5" /> },
    { id: 'achievements', label: 'Achievements', icon: <Trophy className="w-5 h-5" /> },
    { id: 'history', label: 'Match History', icon: <History className="w-5 h-5" /> },
    { id: 'records', label: 'Records', icon: <Award className="w-5 h-5" /> },
    { id: 'friends', label: 'Friends', icon: <Users className="w-5 h-5" /> },
    { id: 'edit-profile', label: 'Update Profile', icon: <Edit3 className="w-5 h-5 text-amber-400" /> },
  ];

  return (
    <div className="min-h-screen bg-[#0E0522] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#2D0B4E] via-[#0E0522] to-[#070212] text-white font-sans flex flex-col lg:flex-row overflow-x-hidden">

      {/* Mobile Top Navigation Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-[#140730]/95 border-b border-[#3A1C61] sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <img src="/assets/crown.png" className="w-6 h-6 object-contain" alt="Crown" />
          <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500 title-font text-lg">
            RAJA RANI
          </span>
        </div>

        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="p-2 text-purple-300 hover:text-white bg-[#1D0C3A] border border-[#5A2C81] rounded-xl"
        >
          {isMobileSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Left Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-[#12072B]/95 backdrop-blur-2xl border-r border-[#3A1C61]/80 flex flex-col justify-between transition-transform duration-300 overflow-y-auto max-h-screen scrollbar-none ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
      >
        <div className="p-6">
          {/* Logo Brand */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.4)]">
              <Crown className="w-6 h-6 text-[#12072B] fill-current" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 title-font leading-tight">
                RAJA RANI
              </h1>
              <p className="text-xs font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-pink-500 uppercase">
                POLICE THIEF
              </p>
            </div>
          </div>

          {/* User Profile Badge */}
          <div className="mb-6 p-4 rounded-2xl bg-[#1A0B3B]/80 border border-[#3A1C61] flex flex-col items-center text-center shadow-lg relative group">
            {/* Medium Profile Icon with Level Badge */}
            <div className="relative mb-2.5">
              {renderAvatarById(currentAvatar, "w-16 h-16")}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 text-[#12072B] font-black text-xs flex items-center justify-center border-2 border-[#12072B] shadow-md">
                {globalLevelInfo.level}
              </div>
            </div>

            {/* Username */}
            <h3 className="font-extrabold text-white text-base tracking-wide truncate max-w-[200px]">
              {userObj.username || stats.username || user.username}
            </h3>

            {/* Description */}
            <p className="text-purple-300 text-xs font-medium mt-0.5 mb-3 line-clamp-2 max-w-[210px]">
              {currentDescription}
            </p>

            {/* Edit Option Button */}
            <button
              onClick={() => {
                setActiveTab('edit-profile');
                setIsMobileSidebarOpen(false);
              }}
              className="w-full py-1.5 px-3 rounded-xl bg-[#2A1154] hover:bg-[#3D1A7A] text-amber-300 hover:text-white transition-all text-xs font-bold border border-[#5A2C81] flex items-center justify-center gap-1.5 shadow-sm"
              title="Edit Profile"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${isActive
                      ? 'bg-gradient-to-r from-[#2E1058] to-[#210B43] text-white border-l-4 border-fuchsia-500 shadow-[0_0_20px_rgba(168,85,247,0.25)]'
                      : 'text-purple-300 hover:text-white hover:bg-[#1A0B3B]/60'
                    }`}
                >
                  <span className={isActive ? 'text-fuchsia-400' : 'text-purple-400'}>{item.icon}</span>
                  <span className="tracking-wide">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Level Card Footer */}
        <div className="p-6 border-t border-[#2D1352]/60">
          <div className="p-4 rounded-2xl bg-[#1A0C38]/90 border border-[#3A1C61] shadow-inner">
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-900/50 border border-purple-500/30 flex items-center justify-center text-purple-300">
                <Shield className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-white font-bold text-sm tracking-wide">Level {globalLevelInfo.level}</p>
                <p className="text-purple-300 text-xs font-medium">{globalLevelInfo.xpInCurrentLevel} / {globalLevelInfo.xpNeededForNextLevel} XP</p>
              </div>
            </div>
            <div className="w-full h-2 rounded-full bg-[#11052C] overflow-hidden p-0.5 border border-[#3A1C61]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 transition-all duration-500"
                style={{ width: `${globalLevelInfo.progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Dashboard Workspace Content */}
      <main className="flex-1 w-full max-w-full min-w-0 p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto overflow-y-auto overflow-x-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-3.5 py-2 bg-[#1C0B3B]/90 hover:bg-[#2A1154] border border-[#5A2C81] text-purple-200 hover:text-white rounded-xl transition-all duration-200 text-xs sm:text-sm font-semibold shadow-lg group"
              title="Back to Home"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform text-fuchsia-400" />
              <span>Back to Home</span>
            </button>
            <h2 className="text-xl sm:text-3xl font-black text-white title-font tracking-wide">
              Profile Dashboard
            </h2>
          </div>
        </div>

        {/* Tab Content Display */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Top Grid: User Info Banner + Quick Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* User Info Banner Card (7 Cols) */}
              <div className="lg:col-span-7 bg-[#1A0C3B]/90 backdrop-blur-xl border border-[#3A1C61] rounded-3xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.5),0_0_20px_rgba(147,51,234,0.15)] flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
                <div className="space-y-4 text-xs sm:text-sm text-purple-200 text-center sm:text-left">
                  <div className="flex items-center gap-2.5 justify-center sm:justify-start">
                    <Calendar className="w-4 h-4 text-purple-400 shrink-0" />
                    <div>
                      <p className="text-purple-400 text-[11px] font-medium">Join Date</p>
                      <p className="font-semibold text-white">{formatDateTime(stats.joinDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 justify-center sm:justify-start">
                    <Clock className="w-4 h-4 text-purple-400 shrink-0" />
                    <div>
                      <p className="text-purple-400 text-[11px] font-medium">Last Played</p>
                      <p className="font-semibold text-white">{formatDateTime(stats.lastPlayedDate)}</p>
                    </div>
                  </div>
                </div>

                {/* Level Badge Center Shield */}
                <div className="flex flex-col items-center justify-center">
                  <div className="relative w-24 h-24 flex items-center justify-center mb-2">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400/20 to-amber-600/10 animate-pulse" />
                    {/* Golden Crest */}
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-b from-[#4A2508] to-[#211003] border-2 border-yellow-400 rotate-45 flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.3)]">
                      <div className="-rotate-45 text-center">
                        <p className="text-[10px] font-extrabold tracking-widest text-yellow-300 uppercase">LEVEL</p>
                        <p className="text-2xl font-black text-white title-font">{globalLevelInfo.level}</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs font-bold text-purple-200 mb-1">
                    {globalLevelInfo.xpInCurrentLevel.toLocaleString()} / {globalLevelInfo.xpNeededForNextLevel.toLocaleString()} XP
                  </p>
                  <div className="w-28 h-2 rounded-full bg-[#11052C] overflow-hidden p-0.5 border border-[#3A1C61]" title={`Total Lifetime XP: ${globalLevelInfo.xp.toLocaleString()} XP`}>
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 transition-all duration-500"
                      style={{ width: `${globalLevelInfo.progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-4 text-xs sm:text-sm text-purple-200 text-center sm:text-right">
                  <div>
                    <p className="text-purple-400 text-[11px] font-medium">Username</p>
                    <p className="font-bold text-yellow-400 text-base">{stats.username || user.username}</p>
                  </div>
                  <div className="flex items-center gap-2.5 justify-center sm:justify-end">
                    <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-purple-400 text-[11px] font-medium">Total Play Time</p>
                      <p className="font-semibold text-emerald-400">
                        {formatPlayTime(overallStats.totalPlayTime || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats Bar Card (5 Cols) */}
              <div className="lg:col-span-5 bg-[#1A0C3B]/90 backdrop-blur-xl border border-[#3A1C61] rounded-3xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.5),0_0_20px_rgba(147,51,234,0.15)] flex items-center justify-around text-center">
                <div className="space-y-1">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-purple-300">
                    <Gamepad2 className="w-5 h-5" />
                  </div>
                  <p className="text-xl font-extrabold text-white">{overallStats.gamesPlayed || 0}</p>
                  <p className="text-xs text-purple-300 font-medium">Games Played</p>
                </div>

                <div className="space-y-1">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-900/40 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <p className="text-xl font-extrabold text-white">{overallStats.gamesWon || 0}</p>
                  <p className="text-xs text-purple-300 font-medium">Games Won</p>
                </div>

                <div className="space-y-1">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-red-900/40 border border-red-500/30 flex items-center justify-center text-red-400">
                    <Frown className="w-5 h-5" />
                  </div>
                  <p className="text-xl font-extrabold text-white">{overallStats.gamesLost || 0}</p>
                  <p className="text-xs text-purple-300 font-medium">Games Lost</p>
                </div>

                <div className="space-y-1">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-cyan-900/40 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Target className="w-5 h-5" />
                  </div>
                  <p className="text-xl font-extrabold text-white">{overallStats.winRate || 0}%</p>
                  <p className="text-xs text-purple-300 font-medium">Win Rate</p>
                </div>
              </div>
            </div>

            {/* Mode-Wise XP & Level Breakdown Showcase (3-Col Grid) */}
            <div className="bg-[#1A0C3B]/90 backdrop-blur-xl border border-[#3A1C61] rounded-3xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.5),0_0_20px_rgba(147,51,234,0.1)] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-400" />
                  <span>Mode-Wise Level & XP Breakdown</span>
                </h3>
                <span className="text-xs font-extrabold text-amber-300 bg-amber-950/80 px-3 py-1 rounded-full border border-amber-500/40 font-mono">
                  Combined Total XP: {totalXp.toLocaleString()} XP
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Classic Mode XP */}
                <div className="bg-[#12072B] border border-amber-500/40 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span className="font-bold text-amber-300 text-sm">Classic Mode</span>
                    </div>
                    <span className="text-xs font-mono font-black text-white">Lvl {classicLevelInfo.level}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-purple-300 font-mono">
                    <span>{classicXp.toLocaleString()} XP</span>
                    <span>{classicLevelInfo.xpInCurrentLevel} / {classicLevelInfo.xpNeededForNextLevel}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#0A0217] overflow-hidden border border-amber-500/30">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500"
                      style={{ width: `${classicLevelInfo.progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Modern Mode XP */}
                <div className="bg-[#12072B] border border-yellow-500/40 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-yellow-400" />
                      <span className="font-bold text-yellow-300 text-sm">Modern Mode</span>
                    </div>
                    <span className="text-xs font-mono font-black text-white">Lvl {modernLevelInfo.level}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-purple-300 font-mono">
                    <span>{modernXp.toLocaleString()} XP</span>
                    <span>{modernLevelInfo.xpInCurrentLevel} / {modernLevelInfo.xpNeededForNextLevel}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#0A0217] overflow-hidden border border-yellow-500/30">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-500 to-amber-400 transition-all duration-500"
                      style={{ width: `${modernLevelInfo.progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Detective Challenge XP */}
                <div className="bg-[#12072B] border border-cyan-500/40 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-cyan-400" />
                      <span className="font-bold text-cyan-300 text-sm">Detective Challenge</span>
                    </div>
                    <span className="text-xs font-mono font-black text-white">Lvl {detectiveLevelInfo.level}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-purple-300 font-mono">
                    <span>{detectiveXp.toLocaleString()} XP</span>
                    <span>{detectiveLevelInfo.xpInCurrentLevel} / {detectiveLevelInfo.xpNeededForNextLevel}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#0A0217] overflow-hidden border border-cyan-500/30">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 transition-all duration-500"
                      style={{ width: `${detectiveLevelInfo.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Lifetime Statistics Box (Full Width 12 Cols) */}
            <div className="bg-[#1A0C3B]/90 backdrop-blur-xl border border-[#3A1C61] rounded-3xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.5),0_0_20px_rgba(147,51,234,0.1)] space-y-4">
              <div className="flex items-center justify-between border-b border-[#3A1C61] pb-3">
                <h3 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-fuchsia-400" />
                  <span>Lifetime Statistics</span>
                </h3>
                <span className="text-xs font-semibold text-purple-300 bg-[#12072B] border border-[#3A1C61] px-3 py-1 rounded-full">
                  Overall Career
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                <div className="bg-[#12072B] hover:bg-[#160836] border border-[#3A1C61] hover:border-[#5A2C81] rounded-2xl p-3.5 text-center transition-all shadow-sm">
                  <p className="text-[11px] font-semibold text-purple-300 mb-1 truncate">Games Played</p>
                  <div className="w-8 h-8 mx-auto rounded-xl bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-purple-300 mb-1.5">
                    <Gamepad2 className="w-4 h-4" />
                  </div>
                  <p className="text-xl font-extrabold text-white">{overallStats.gamesPlayed || 0}</p>
                </div>

                <div className="bg-[#12072B] hover:bg-[#160836] border border-[#3A1C61] hover:border-emerald-500/40 rounded-2xl p-3.5 text-center transition-all shadow-sm">
                  <p className="text-[11px] font-semibold text-emerald-400 mb-1 truncate">Games Won</p>
                  <div className="w-8 h-8 mx-auto rounded-xl bg-emerald-900/40 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-1.5">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <p className="text-xl font-extrabold text-white">{overallStats.gamesWon || 0}</p>
                </div>

                <div className="bg-[#12072B] hover:bg-[#160836] border border-[#3A1C61] hover:border-red-500/40 rounded-2xl p-3.5 text-center transition-all shadow-sm">
                  <p className="text-[11px] font-semibold text-red-400 mb-1 truncate">Games Lost</p>
                  <div className="w-8 h-8 mx-auto rounded-xl bg-red-900/40 border border-red-500/30 flex items-center justify-center text-red-400 mb-1.5">
                    <Frown className="w-4 h-4" />
                  </div>
                  <p className="text-xl font-extrabold text-white">{overallStats.gamesLost || 0}</p>
                </div>

                <div className="bg-[#12072B] hover:bg-[#160836] border border-[#3A1C61] hover:border-cyan-500/40 rounded-2xl p-3.5 text-center transition-all shadow-sm">
                  <p className="text-[11px] font-semibold text-cyan-400 mb-1 truncate">Win Rate</p>
                  <div className="w-8 h-8 mx-auto rounded-xl bg-cyan-900/40 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-1.5">
                    <Target className="w-4 h-4" />
                  </div>
                  <p className="text-xl font-extrabold text-white">{overallStats.winRate || 0}%</p>
                </div>

                <div className="bg-[#12072B] hover:bg-[#160836] border border-[#3A1C61] hover:border-amber-500/40 rounded-2xl p-3.5 text-center transition-all shadow-sm">
                  <p className="text-[11px] font-semibold text-purple-300 mb-1 truncate">Total Rounds</p>
                  <div className="w-8 h-8 mx-auto rounded-xl bg-amber-900/40 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-1.5">
                    <RotateCw className="w-4 h-4" />
                  </div>
                  <p className="text-xl font-extrabold text-white">{overallStats.totalRoundsPlayed || 0}</p>
                </div>

                <div className="bg-[#12072B] hover:bg-[#160836] border border-[#3A1C61] hover:border-blue-500/40 rounded-2xl p-3.5 text-center transition-all shadow-sm">
                  <p className="text-[11px] font-semibold text-purple-300 mb-1 truncate">Play Time</p>
                  <div className="w-8 h-8 mx-auto rounded-xl bg-blue-900/40 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-1.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <p className="text-xl font-extrabold text-white">{formatPlayTime(overallStats.totalPlayTime || 0)}</p>
                </div>

                <div className="bg-[#12072B] hover:bg-[#160836] border border-[#3A1C61] hover:border-orange-500/40 rounded-2xl p-3.5 text-center transition-all shadow-sm">
                  <p className="text-[11px] font-semibold text-purple-300 mb-1 truncate">Win Streak</p>
                  <div className="w-8 h-8 mx-auto rounded-xl bg-orange-900/40 border border-orange-500/30 flex items-center justify-center text-orange-400 mb-1.5">
                    <Flame className="w-4 h-4" />
                  </div>
                  <p className="text-xl font-extrabold text-white">{overallStats.currentWinStreak || 0}</p>
                </div>

                <div className="bg-[#12072B] hover:bg-[#160836] border border-[#3A1C61] hover:border-fuchsia-500/40 rounded-2xl p-3.5 text-center transition-all shadow-sm">
                  <p className="text-[11px] font-semibold text-purple-300 mb-1 truncate">Best Streak</p>
                  <div className="w-8 h-8 mx-auto rounded-xl bg-purple-900/40 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-400 mb-1.5">
                    <Crown className="w-4 h-4" />
                  </div>
                  <p className="text-xl font-extrabold text-white">{overallStats.longestWinStreak || 0}</p>
                </div>
              </div>
            </div>

            {/* Mode Performance & Personal Records (Full Width 12 Cols Showcase) */}
            <div className="bg-[#1A0C3B]/90 backdrop-blur-xl border border-[#3A1C61] rounded-3xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.5),0_0_20px_rgba(147,51,234,0.1)] space-y-5">
              <div className="flex items-center justify-between border-b border-[#3A1C61] pb-3">
                <div>
                  <h3 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-400" />
                    <span>Mode Performance & Records</span>
                  </h3>
                  <p className="text-xs text-purple-300 mt-0.5">
                    Mode highlights and peak stats across Classic, Modern & Detective Challenge
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('records')}
                  className="text-xs font-bold text-purple-200 hover:text-white bg-[#12072B] hover:bg-[#2A1154] border border-[#3A1C61] px-4 py-2 rounded-xl transition-all shadow-md shrink-0 cursor-pointer"
                >
                  View All Records →
                </button>
              </div>

              {/* 3 Spacious Mode Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Classic Mode Card */}
                <div className="bg-[#12072B] hover:bg-[#160836] border border-amber-500/30 hover:border-amber-400/60 rounded-2xl p-5 flex flex-col justify-between shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between mb-4 border-b border-[#251245] pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <Crown className="w-4 h-4" />
                      </div>
                      <span className="font-extrabold text-amber-400 text-base tracking-wide">Classic Mode</span>
                    </div>
                    <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 px-2.5 py-1 rounded-full border border-amber-500/40 uppercase tracking-wider shrink-0">
                      Points
                    </span>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-[#251245]/50 pb-2">
                      <span className="text-purple-300 font-medium">Highest Match Score</span>
                      <span className="font-extrabold text-yellow-400 text-sm">+{classicMode.highestScore || 0}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-[#251245]/50 pb-2">
                      <span className="text-purple-300 font-medium">Classic Wins</span>
                      <span className="font-extrabold text-emerald-400 text-sm">{classicMode.gamesWon || classicMode.wins || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-purple-300 font-medium">Classic Win Rate</span>
                      <span className="font-bold text-cyan-400 text-sm">
                        {classicMode.gamesPlayed ? Math.round(((classicMode.gamesWon || 0) / classicMode.gamesPlayed) * 100) : (classicMode.winRate || 0)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Modern Mode Card */}
                <div className="bg-[#12072B] hover:bg-[#160836] border border-yellow-500/30 hover:border-yellow-400/60 rounded-2xl p-5 flex flex-col justify-between shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between mb-4 border-b border-[#251245] pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400">
                        <Crown className="w-4 h-4" />
                      </div>
                      <span className="font-extrabold text-yellow-400 text-base tracking-wide">Modern Mode</span>
                    </div>
                    <span className="text-[10px] font-bold text-yellow-300 bg-yellow-950/80 px-2.5 py-1 rounded-full border border-yellow-500/40 uppercase tracking-wider shrink-0">
                      Kingdom
                    </span>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-[#251245]/50 pb-2">
                      <span className="text-purple-300 font-medium">Highest Kingdom Score</span>
                      <span className="font-extrabold text-yellow-400 text-sm">+{modernMode.highestScore || 0}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-[#251245]/50 pb-2">
                      <span className="text-purple-300 font-medium">Kingdom Wins</span>
                      <span className="font-extrabold text-emerald-400 text-sm">{modernMode.gamesWon || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-purple-300 font-medium">Longest Win Streak</span>
                      <span className="font-bold text-cyan-400 text-sm">{modernMode.longestWinStreak || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Detective Challenge Mode Card */}
                <div className="bg-[#12072B] hover:bg-[#160836] border border-cyan-500/30 hover:border-cyan-400/60 rounded-2xl p-5 flex flex-col justify-between shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between mb-4 border-b border-[#251245] pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                        <Search className="w-4 h-4" />
                      </div>
                      <span className="font-extrabold text-cyan-300 text-base tracking-wide">Detective Challenge</span>
                    </div>
                    <span className="text-[10px] font-bold text-cyan-300 bg-cyan-950/80 px-2.5 py-1 rounded-full border border-cyan-500/40 uppercase tracking-wider shrink-0">
                      Tactical
                    </span>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-[#251245]/50 pb-2">
                      <span className="text-purple-300 font-medium">Investigation Accuracy</span>
                      <span className="font-extrabold text-emerald-400 text-sm">{detectiveChallenge.overallAccuracy || 0}%</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-[#251245]/50 pb-2">
                      <span className="text-purple-300 font-medium">Detective Wins</span>
                      <span className="font-extrabold text-cyan-300 text-sm">{detectiveChallenge.gamesWon || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-purple-300 font-medium">Average Speed</span>
                      <span className="font-bold text-yellow-300 text-sm">
                        {detectiveChallenge.averageGuessTime ? `${detectiveChallenge.averageGuessTime.toFixed(2)}s` : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Role Summary Box (Full 12-Col Showcase) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-12 bg-[#1A0C3B]/90 backdrop-blur-xl border border-[#3A1C61] rounded-3xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.5),0_0_20px_rgba(147,51,234,0.1)] flex flex-col justify-between">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg sm:text-xl font-bold text-white tracking-wide">Role Performance & Summary</h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('roles')}
                    className="text-xs font-bold text-purple-200 hover:text-white bg-[#12072B] hover:bg-[#2A1154] border border-[#3A1C61] hover:border-purple-400 px-4 py-1.5 rounded-full transition-all shadow-md shrink-0 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>View All</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Raja Card */}
                  <div className="bg-[#12072B] hover:bg-[#160836] border border-yellow-500/40 hover:border-yellow-400 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-[0_0_15px_rgba(234,179,8,0.12)] transition-all duration-300">
                    <div className="flex flex-col items-center mb-3">
                      <div className="p-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 mb-2">
                        <img src="/assets/images/raja.png" alt="Raja" className="w-14 h-14 object-contain" />
                      </div>
                      <p className="font-extrabold text-yellow-400 text-base tracking-wide">Raja</p>
                      <p className="text-[10px] font-semibold text-yellow-600 uppercase tracking-widest">King</p>
                    </div>
                    <div className="w-full text-xs space-y-2 pt-3 border-t border-[#2A134A]">
                      <div className="flex items-center justify-between">
                        <span className="text-purple-300 font-medium text-[11px] sm:text-xs truncate">Times Assigned</span>
                        <span className="font-extrabold text-white text-xs sm:text-sm whitespace-nowrap">{roleStats.raja?.timesAssigned || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-purple-300 font-medium text-[11px] sm:text-xs truncate">Total Points</span>
                        <span className="font-extrabold text-yellow-400 text-xs sm:text-sm whitespace-nowrap">+{roleStats.raja?.totalPoints || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Police Card */}
                  <div className="bg-[#12072B] hover:bg-[#160836] border border-blue-500/40 hover:border-blue-400 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-[0_0_15px_rgba(59,130,246,0.12)] transition-all duration-300">
                    <div className="flex flex-col items-center mb-3">
                      <div className="p-1.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 mb-2">
                        <img src="/assets/images/police.png" alt="Police" className="w-14 h-14 object-contain" />
                      </div>
                      <p className="font-extrabold text-blue-400 text-base tracking-wide">Police</p>
                      <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-widest">Detective</p>
                    </div>
                    <div className="w-full text-xs space-y-2 pt-3 border-t border-[#2A134A]">
                      <div className="flex items-center justify-between">
                        <span className="text-purple-300 font-medium text-[11px] sm:text-xs truncate">Times Assigned</span>
                        <span className="font-extrabold text-white text-xs sm:text-sm whitespace-nowrap">{roleStats.police?.timesAssigned || policeMode.timesPlayedAsPolice || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-purple-300 font-medium text-[11px] sm:text-xs truncate">Correct Catches</span>
                        <span className="font-extrabold text-emerald-400 text-xs sm:text-sm whitespace-nowrap">{roleStats.police?.correctCatches || policeMode.totalCorrectCatches || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-purple-300 font-medium text-[11px] sm:text-xs truncate">Wrong Guesses</span>
                        <span className="font-extrabold text-red-400 text-xs sm:text-sm whitespace-nowrap">{roleStats.police?.wrongGuesses || policeMode.totalWrongGuesses || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-purple-300 font-medium text-[11px] sm:text-xs truncate">Accuracy</span>
                        <span className="font-extrabold text-cyan-400 text-xs sm:text-sm whitespace-nowrap">{roleStats.police?.accuracy || policeMode.policeAccuracy || 0}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Thief Card */}
                  <div className="bg-[#12072B] hover:bg-[#160836] border border-emerald-500/40 hover:border-emerald-400 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-[0_0_15px_rgba(16,185,129,0.12)] transition-all duration-300">
                    <div className="flex flex-col items-center mb-3">
                      <div className="p-1.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 mb-2">
                        <img src="/assets/images/thief.png" alt="Thief" className="w-14 h-14 object-contain" />
                      </div>
                      <p className="font-extrabold text-emerald-400 text-base tracking-wide">Thief</p>
                      <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-widest">Rogue</p>
                    </div>
                    <div className="w-full text-xs space-y-2 pt-3 border-t border-[#2A134A]">
                      <div className="flex items-center justify-between">
                        <span className="text-purple-300 font-medium text-[11px] sm:text-xs truncate">Times Assigned</span>
                        <span className="font-extrabold text-white text-xs sm:text-sm whitespace-nowrap">{roleStats.thief?.timesAssigned || (policeMode.thiefEscaped + policeMode.thiefCaught) || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-purple-300 font-medium text-[11px] sm:text-xs truncate">Escaped</span>
                        <span className="font-extrabold text-emerald-400 text-xs sm:text-sm whitespace-nowrap">{roleStats.thief?.escaped || policeMode.thiefEscaped || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-purple-300 font-medium text-[11px] sm:text-xs truncate">Caught</span>
                        <span className="font-extrabold text-red-400 text-xs sm:text-sm whitespace-nowrap">{roleStats.thief?.caught || policeMode.thiefCaught || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-purple-300 font-medium text-[11px] sm:text-xs truncate">Escape Rate</span>
                        <span className="font-extrabold text-cyan-400 text-xs sm:text-sm whitespace-nowrap">{roleStats.thief?.escapeRate || policeMode.escapeRate || 0}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Grid: Achievements + Recent Matches */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Achievements Summary Box (6 Cols) */}
              <div className="lg:col-span-6 bg-[#1A0C3B]/90 backdrop-blur-xl border border-[#3A1C61] rounded-3xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    <h3 className="text-lg font-bold text-white tracking-wide">Achievements</h3>
                    <span className="bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                      {achievements.length} / 18 Unlocked
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveTab('achievements')}
                    className="text-xs font-bold text-cyan-300 hover:text-white bg-[#12072B] border border-cyan-500/30 px-3.5 py-1.5 rounded-xl hover:bg-cyan-950/60 transition-all flex items-center gap-1 shadow"
                  >
                    <span>View All</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Progress bar */}
                <div className="bg-[#12072B] border border-[#3A1C61] p-3 rounded-2xl mb-4">
                  <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                    <span className="text-purple-300">Overall Completion</span>
                    <span className="text-amber-400">{((achievements.length / 18) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-[#0E0422] h-2 rounded-full overflow-hidden border border-[#3A1C61]">
                    <div
                      className="bg-gradient-to-r from-amber-400 to-yellow-300 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, (achievements.length / 18) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Latest Two Unlocked Achievements Display */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {(achievements.length > 0
                    ? achievements.slice(0, 2)
                    : [
                      { code: 'FIRST_STEPS', title: 'First Steps', description: 'Play your first match.', tier: 'Common', isUnlocked: false },
                      { code: 'VICTORIOUS', title: 'Victorious', description: 'Win your first match.', tier: 'Common', isUnlocked: false },
                    ]
                  ).map((ach: any) => {
                    const isUnlocked = ach.isUnlocked !== undefined ? ach.isUnlocked : (achievements.length > 0 ? true : false);
                    const tier = ach.tier || 'Common';

                    return (
                      <div
                        key={ach._id || ach.code || ach.title}
                        className={`bg-[#12072B] border p-3.5 rounded-2xl flex items-center space-x-3.5 transition-all duration-300 hover:-translate-y-0.5 ${isUnlocked
                            ? 'border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.15)] bg-gradient-to-r from-[#170938] to-[#12072B]'
                            : 'border-[#3A1C61] opacity-75'
                          }`}
                      >
                        {/* 3D Glowing Badge Icon */}
                        <div className="shrink-0">
                          <AchievementBadgeIcon code={ach.code} tier={tier} isUnlocked={isUnlocked} size="w-14 h-14" />
                        </div>

                        {/* Title & Status Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${tier === 'Legendary' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                                tier === 'Epic' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' :
                                  tier === 'Rare' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' :
                                    'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              }`}>
                              {tier}
                            </span>
                            {isUnlocked ? (
                              <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-md">
                                ✓ Unlocked
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                                Locked
                              </span>
                            )}
                          </div>

                          <h4 className="font-extrabold text-white text-xs truncate leading-tight">
                            {ach.title || ach.name}
                          </h4>

                          <p className="text-purple-300/80 text-[10px] truncate mt-0.5 leading-tight">
                            {ach.description || 'Achievement trophy'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Matches Box (6 Cols) */}
              <div className="lg:col-span-6 bg-[#1A0C3B]/90 backdrop-blur-xl border border-[#3A1C61] rounded-3xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-white tracking-wide">Recent Matches</h3>
                  <button
                    onClick={() => setActiveTab('history')}
                    className="text-xs font-semibold text-purple-300 hover:text-white bg-[#12072B] border border-[#3A1C61] px-3.5 py-1.5 rounded-xl hover:bg-[#250E4C] transition-colors"
                  >
                    View All
                  </button>
                </div>

                {recentMatches.length === 0 ? (
                  <div className="py-10 text-center flex flex-col items-center justify-center my-auto">
                    <div className="w-16 h-16 rounded-full bg-[#12072B] border border-[#3A1C61] flex items-center justify-center text-purple-400 mb-3 shadow-inner">
                      <Swords className="w-8 h-8 opacity-40 text-purple-300" />
                    </div>
                    <p className="text-white font-bold text-base mb-1">No matches played yet</p>
                    <p className="text-purple-300 text-xs font-medium">Join a game room to start earning match records!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentMatches.slice(0, 5).map((match: any) => {
                      const matchDate = formatMatchDate(match.date);
                      const isWin = match.matchResult === 'win';
                      const role = match.rolePlayed || 'Player';

                      return (
                        <div
                          key={match._id || match.matchId}
                          className="bg-[#12072B] border border-[#3A1C61] hover:border-[#5A2C81] p-3.5 rounded-2xl flex items-center justify-between gap-3 transition-colors"
                        >
                          <div className="flex items-center gap-3.5">
                            {/* Date Badge Box */}
                            <div className="bg-[#1A0C3B] border border-[#3A1C61] px-3 py-2 rounded-xl text-center shrink-0 min-w-[70px]">
                              <p className="text-base font-extrabold text-white leading-none mb-0.5">
                                {matchDate.day} <span className="text-xs text-purple-300">{matchDate.month}</span>
                              </p>
                              <p className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider">
                                {match.gameMode || 'CLASSIC'}
                              </p>
                            </div>

                            {/* Role Avatar & Details */}
                            <div className="flex items-center gap-2.5">
                              {role.toLowerCase().includes('police') || role.toLowerCase().includes('detective') ? (
                                <img src="/assets/images/police.png" alt="Police" className="w-9 h-9 object-contain" />
                              ) : role.toLowerCase() === 'thief' ? (
                                <img src="/assets/images/thief.png" alt="Thief" className="w-9 h-9 object-contain" />
                              ) : role.toLowerCase() === 'raja' ? (
                                <img src="/assets/images/raja.png" alt="Raja" className="w-9 h-9 object-contain" />
                              ) : role.toLowerCase() === 'rani' ? (
                                <img src="/assets/images/rani.png" alt="Rani" className="w-9 h-9 object-contain" />
                              ) : role.toLowerCase() === 'mantri' ? (
                                <img src="/assets/images/mantri.png" alt="Mantri" className="w-9 h-9 object-contain" />
                              ) : role.toLowerCase() === 'villager' ? (
                                <img src="/assets/images/villager.png" alt="Villager" className="w-9 h-9 object-contain" />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-purple-900/50 flex items-center justify-center text-purple-300">
                                  <UserIcon className="w-5 h-5" />
                                </div>
                              )}

                              <div>
                                <p className="text-sm font-bold text-white">
                                  Role: <span className="text-purple-200">{role}</span>
                                </p>
                                <p className="text-xs font-semibold">
                                  Result:{' '}
                                  <span className={isWin ? 'text-emerald-400' : 'text-red-400'}>
                                    {match.matchResult || 'loss'}
                                  </span>
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-xs text-purple-300 font-medium">Score</p>
                              <p className="text-sm font-extrabold text-yellow-400">{match.scoreEarned || 0}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-purple-400" />
                          </div>
                        </div>
                      );
                    })}

                    <button
                      onClick={() => setActiveTab('history')}
                      className="w-full mt-2 py-2 text-center text-xs font-semibold text-purple-300 hover:text-white flex items-center justify-center gap-1 transition-colors"
                    >
                      <span>View All Matches</span>
                      <span>→</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Quote */}
            <div className="pt-6 text-center">
              <p className="text-sm font-semibold text-purple-300 tracking-wide flex items-center justify-center gap-1.5">
                <span>Keep playing, keep improving!</span>
                <span>🔥</span>
              </p>
            </div>
          </div>
        )}

        {/* Dedicated Classic Mode Statistics View */}
        {activeTab === 'classic-mode' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header Banner Card */}
            <div className="bg-gradient-to-r from-amber-900/40 via-yellow-900/40 to-purple-900/40 border border-amber-500/40 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400 shrink-0">
                  <Crown className="w-8 h-8 fill-amber-400" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl sm:text-2xl font-black text-amber-300">Classic Mode Statistics</h2>
                    <span className="px-3 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-400/40 text-xs font-bold rounded-full uppercase">
                      Points Based Mode
                    </span>
                  </div>
                  <p className="text-xs text-purple-200 mt-1">
                    Classic Points Ranking & Lifetime Scoring Performance
                  </p>
                </div>
              </div>

              <div className="text-right sm:text-right w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-amber-500/20">
                <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block">Classic Win Rate</span>
                <span className="text-3xl font-black text-amber-400">
                  {classicMode.gamesPlayed ? Math.round(((classicMode.gamesWon || classicMode.wins || 0) / classicMode.gamesPlayed) * 100) : 0}%
                </span>
              </div>
            </div>

            {/* 8 Stat Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-[#14062e] border border-purple-800/40 rounded-2xl text-center">
                <span className="text-[11px] font-bold text-purple-300 uppercase block">Games Played</span>
                <span className="text-2xl font-black text-white mt-1 block">{classicMode.gamesPlayed || 0}</span>
              </div>

              <div className="p-4 bg-[#14062e] border border-emerald-500/30 rounded-2xl text-center">
                <span className="text-[11px] font-bold text-emerald-400 uppercase block">Classic Wins</span>
                <span className="text-2xl font-black text-emerald-300 mt-1 block">{classicMode.gamesWon || classicMode.wins || 0}</span>
              </div>

              <div className="p-4 bg-[#14062e] border border-amber-500/30 rounded-2xl text-center">
                <span className="text-[11px] font-bold text-amber-400 uppercase block">Highest Score</span>
                <span className="text-2xl font-black text-yellow-300 mt-1 block">{classicMode.highestScore || 0}</span>
              </div>

              <div className="p-4 bg-[#14062e] border border-cyan-500/30 rounded-2xl text-center">
                <span className="text-[11px] font-bold text-cyan-400 uppercase block">Average Score</span>
                <span className="text-2xl font-black text-cyan-300 mt-1 block">{classicMode.averageScore || 0}</span>
              </div>

              <div className="p-4 bg-[#14062e] border border-amber-500/30 rounded-2xl text-center">
                <span className="text-[11px] font-bold text-amber-400 uppercase block">Total Points Earned</span>
                <span className="text-2xl font-black text-amber-300 mt-1 block">+{classicMode.totalPointsEarned || 0}</span>
              </div>

              <div className="p-4 bg-[#14062e] border border-yellow-500/30 rounded-2xl text-center">
                <span className="text-[11px] font-bold text-yellow-400 uppercase block">Raja Points</span>
                <span className="text-2xl font-black text-yellow-300 mt-1 block">+{roleStats.raja?.totalPoints || 0}</span>
              </div>

              <div className="p-4 bg-[#14062e] border border-pink-500/30 rounded-2xl text-center">
                <span className="text-[11px] font-bold text-pink-400 uppercase block">Rani Points</span>
                <span className="text-2xl font-black text-pink-300 mt-1 block">+{roleStats.rani?.totalPoints || 0}</span>
              </div>

              <div className="p-4 bg-[#14062e] border border-fuchsia-500/30 rounded-2xl text-center">
                <span className="text-[11px] font-bold text-fuchsia-400 uppercase block">Win Streak</span>
                <span className="text-2xl font-black text-fuchsia-300 mt-1 block">{overallStats.longestWinStreak || 0}</span>
              </div>
            </div>

            {/* Classic Roles Scoring Rules */}
            <div className="p-6 rounded-3xl bg-[#14062e]/90 border border-amber-500/30 space-y-4">
              <h3 className="font-extrabold text-amber-300 text-base tracking-wide flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <span>Classic Mode Role Point Values</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                <div className="bg-[#0e0422] p-3 rounded-2xl border border-yellow-500/30">
                  <span className="font-bold text-yellow-400 block text-sm">Raja (King)</span>
                  <span className="text-base font-black text-white mt-1 block">+1000 pts</span>
                </div>
                <div className="bg-[#0e0422] p-3 rounded-2xl border border-pink-500/30">
                  <span className="font-bold text-pink-400 block text-sm">Rani (Queen)</span>
                  <span className="text-base font-black text-white mt-1 block">+800 pts</span>
                </div>
                <div className="bg-[#0e0422] p-3 rounded-2xl border border-blue-500/30">
                  <span className="font-bold text-blue-400 block text-sm">Police (Detective)</span>
                  <span className="text-base font-black text-white mt-1 block">+500 pts (Correct)</span>
                </div>
                <div className="bg-[#0e0422] p-3 rounded-2xl border border-emerald-500/30">
                  <span className="font-bold text-emerald-400 block text-sm">Thief (Rogue)</span>
                  <span className="text-base font-black text-white mt-1 block">+500 pts (Escape)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dedicated Modern Mode Statistics View */}
        {activeTab === 'modern-mode' && (
          <ModernProfileTab userId={user.id || user._id || ''} />
        )}

        {/* Dedicated Detective Challenge Statistics View */}
        {activeTab === 'detective-challenge' && (
          <DetectiveProfileTab userId={user.id || user._id || ''} />
        )}

        {/* Dedicated Police vs Thief Statistics View */}
        {activeTab === 'police-mode' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header Banner Card */}
            <div className="bg-gradient-to-r from-blue-900/40 via-purple-900/40 to-indigo-900/40 border border-blue-500/30 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-400/50 flex items-center justify-center text-blue-400 shrink-0">
                  <Shield className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl sm:text-2xl font-black text-blue-300">Police vs Thief Statistics</h2>
                    <span className="px-3 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-400/40 text-xs font-bold rounded-full uppercase">
                      Tactical Mode
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Current Title: <strong className="text-amber-300">{userObj.title || policeMode.title || 'Recruit Detective'}</strong>
                  </p>
                </div>
              </div>

              <div className="text-right sm:text-right w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-blue-500/20">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Detective Accuracy</span>
                <span className="text-3xl font-black text-emerald-400">{policeMode.policeAccuracy || 0}%</span>
              </div>
            </div>

            {/* 12 Stat Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-[#14062e] border border-purple-800/40 rounded-2xl">
                <span className="text-[11px] font-bold text-slate-400 block uppercase">Games Played</span>
                <span className="text-2xl font-black text-white mt-1 block">{policeMode.gamesPlayed || 0}</span>
              </div>

              <div className="p-4 bg-[#14062e] border border-amber-500/30 rounded-2xl">
                <span className="text-[11px] font-bold text-amber-400 block uppercase">Detective Wins</span>
                <span className="text-2xl font-black text-amber-300 mt-1 block">{policeMode.detectiveWins || 0}</span>
              </div>

              <div className="p-4 bg-[#14062e] border border-blue-500/30 rounded-2xl">
                <span className="text-[11px] font-bold text-blue-400 block uppercase">🎯 Correct Catches</span>
                <span className="text-2xl font-black text-blue-300 mt-1 block">{policeMode.totalCorrectCatches || 0}</span>
              </div>

              <div className="p-4 bg-[#14062e] border border-rose-500/30 rounded-2xl">
                <span className="text-[11px] font-bold text-rose-400 block uppercase">❌ Wrong Guesses</span>
                <span className="text-2xl font-black text-rose-300 mt-1 block">{policeMode.totalWrongGuesses || 0}</span>
              </div>

              <div className="p-4 bg-[#14062e] border border-emerald-500/30 rounded-2xl">
                <span className="text-[11px] font-bold text-emerald-400 block uppercase">📈 Police Accuracy</span>
                <span className="text-2xl font-black text-emerald-300 mt-1 block">{policeMode.policeAccuracy || 0}%</span>
              </div>

              <div className="p-4 bg-[#14062e] border border-yellow-500/30 rounded-2xl">
                <span className="text-[11px] font-bold text-yellow-400 block uppercase">⚡ Fastest Catch</span>
                <span className="text-2xl font-black text-yellow-300 mt-1 block">
                  {policeMode.fastestCorrectCatch ? `${policeMode.fastestCorrectCatch}s` : '—'}
                </span>
              </div>

              <div className="p-4 bg-[#14062e] border border-indigo-500/30 rounded-2xl">
                <span className="text-[11px] font-bold text-indigo-400 block uppercase">🏆 Win Streak</span>
                <span className="text-2xl font-black text-indigo-300 mt-1 block">{policeMode.longestDetectiveWinStreak || 0}</span>
              </div>

              <div className="p-4 bg-[#14062e] border border-teal-500/30 rounded-2xl">
                <span className="text-[11px] font-bold text-teal-400 block uppercase">🥷 Thief Escapes</span>
                <span className="text-2xl font-black text-teal-300 mt-1 block">{policeMode.thiefEscaped || 0}</span>
              </div>

              <div className="p-4 bg-[#14062e] border border-cyan-500/30 rounded-2xl">
                <span className="text-[11px] font-bold text-cyan-400 block uppercase">👻 Escape Streak</span>
                <span className="text-2xl font-black text-cyan-300 mt-1 block">{policeMode.longestEscapeStreak || 0}</span>
              </div>

              <div className="p-4 bg-[#14062e] border border-fuchsia-500/30 rounded-2xl">
                <span className="text-[11px] font-bold text-fuchsia-400 block uppercase">Escape Rate</span>
                <span className="text-2xl font-black text-fuchsia-300 mt-1 block">{policeMode.escapeRate || 0}%</span>
              </div>

              <div className="p-4 bg-[#14062e] border border-purple-800/40 rounded-2xl">
                <span className="text-[11px] font-bold text-purple-300 block uppercase">👮 Times Police</span>
                <span className="text-2xl font-black text-slate-100 mt-1 block">{policeMode.timesPlayedAsPolice || 0}</span>
              </div>

              <div className="p-4 bg-[#14062e] border border-purple-800/40 rounded-2xl">
                <span className="text-[11px] font-bold text-purple-300 block uppercase">🕵️ Times Thief</span>
                <span className="text-2xl font-black text-slate-100 mt-1 block">{policeMode.timesPlayedAsThief || 0}</span>
              </div>
            </div>

            {/* Performance Progress Bar */}
            <div className="p-6 rounded-3xl bg-[#14062e]/90 border border-purple-900/60 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-slate-200">Detective Mastery Rating</span>
                <span className="font-black text-amber-300">{policeMode.policeAccuracy || 0}% (Level {globalLevelInfo.level})</span>
              </div>
              <div className="w-full bg-[#0a0319] h-3 rounded-full overflow-hidden border border-purple-800/40">
                <div
                  className="bg-gradient-to-r from-blue-500 via-indigo-500 to-amber-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, policeMode.policeAccuracy || 0)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Dedicated XP Breakdown Screen */}
        {activeTab === 'xp-breakdown' && (
          <div className="space-y-6 animate-fade-in">
            {/* XP Overview Banner Card */}
            <div className="bg-gradient-to-r from-amber-950/80 via-purple-900/60 to-indigo-950/80 border border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
              <div className="flex items-center space-x-4 sm:space-x-5">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-500/20 border-2 border-yellow-400 flex items-center justify-center text-yellow-400 shrink-0 shadow-[0_0_25px_rgba(234,179,8,0.3)]">
                  <Zap className="w-7 h-7 sm:w-9 sm:h-9 fill-yellow-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl sm:text-3xl font-black text-white title-font">XP & Level Breakdown</h2>
                    <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 border border-yellow-400/40 text-xs font-black rounded-full uppercase tracking-wider shrink-0">
                      Level {globalLevelInfo.level}
                    </span>
                  </div>
                  <p className="text-xs text-purple-200 mt-1 max-w-xl leading-relaxed">
                    Complete mode-wise breakdown of all Experience Points (XP) earned from games played across Classic Mode, Modern Mode, Detective Challenge & Unlocked Achievements.
                  </p>
                </div>
              </div>

              {/* Total XP Badge */}
              <div className="bg-[#12072B] border border-amber-500/40 rounded-2xl p-4 text-center shrink-0 shadow-lg">
                <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">Total Lifetime XP</span>
                <span className="text-2xl sm:text-3xl font-black text-yellow-400 mt-0.5 block">
                  {globalLevelInfo.xp.toLocaleString()} <span className="text-xs sm:text-sm font-bold text-yellow-200">XP</span>
                </span>
                <div className="mt-1.5 text-[11px] font-semibold text-purple-300">
                  {globalLevelInfo.xpInCurrentLevel.toLocaleString()} / {globalLevelInfo.xpNeededForNextLevel.toLocaleString()} XP to Level {globalLevelInfo.level + 1}
                </div>
              </div>
            </div>

            {/* Total XP Equation Summary Pill Bar */}
            <div className="bg-[#12072B]/90 border border-[#3A1C61] rounded-2xl p-4 shadow-md flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="font-bold text-purple-300 uppercase tracking-wider text-[11px]">XP Formula Equation:</span>
              <div className="flex items-center gap-2 flex-wrap font-bold text-xs">
                <span className="px-3 py-1.5 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-300">
                  Classic: {xpBreakdown?.classicMode?.xp || 0} XP
                </span>
                <span className="text-purple-400">+</span>
                <span className="px-3 py-1.5 rounded-xl bg-yellow-950/80 border border-yellow-500/40 text-yellow-300">
                  Modern: {xpBreakdown?.modernMode?.xp || 0} XP
                </span>
                <span className="text-purple-400">+</span>
                <span className="px-3 py-1.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
                  Detective: {xpBreakdown?.detectiveChallenge?.xp || 0} XP
                </span>
                <span className="text-purple-400">+</span>
                <span className="px-3 py-1.5 rounded-xl bg-fuchsia-950/80 border border-fuchsia-500/40 text-fuchsia-300">
                  Achievements: {achievementXp} XP
                </span>
                <span className="text-amber-400 font-extrabold text-sm sm:ml-2">
                  = {globalLevelInfo.xp.toLocaleString()} XP
                </span>
              </div>
            </div>

            {/* Mode-Wise XP Breakdown Cards Grid (2 Columns per Row on Desktop) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {/* Classic Mode XP Card */}
              <div className="bg-[#1A0C3B]/90 border border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col justify-between space-y-4 hover:border-amber-400 transition-all">
                <div>
                  <div className="flex items-center justify-between border-b border-[#2E1458] pb-3 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                        <Crown className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-amber-300 text-base sm:text-lg leading-tight">Classic Mode</h3>
                        <p className="text-[10px] sm:text-[11px] text-purple-300">Raja Rani Match XP</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-yellow-400 bg-amber-950/80 border border-amber-500/40 px-2.5 py-1 rounded-xl shrink-0">
                      {xpBreakdown?.classicMode?.xp || 0} XP
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between items-center bg-[#12072B] p-2.5 rounded-xl border border-[#2E1458]">
                      <span className="text-purple-300 font-medium">Participation XP</span>
                      <span className="font-bold text-white">+20 XP / match</span>
                    </div>
                    <div className="flex justify-between items-center bg-[#12072B] p-2.5 rounded-xl border border-[#2E1458]">
                      <span className="text-purple-300 font-medium">Completion XP</span>
                      <span className="font-bold text-white">+30 XP / match</span>
                    </div>
                    <div className="flex justify-between items-center bg-[#12072B] p-2.5 rounded-xl border border-[#2E1458]">
                      <span className="text-purple-300 font-medium">Match Score XP</span>
                      <span className="font-bold text-yellow-400">Score ÷ 10</span>
                    </div>
                    <div className="flex justify-between items-center bg-[#12072B] p-2.5 rounded-xl border border-[#2E1458]">
                      <span className="text-purple-300 font-medium">1st Place Victory</span>
                      <span className="font-bold text-emerald-400">+100 XP / win</span>
                    </div>
                    <div className="flex justify-between items-center bg-[#12072B] p-2.5 rounded-xl border border-[#2E1458]">
                      <span className="text-purple-300 font-medium">Police Catch Bonus</span>
                      <span className="font-bold text-cyan-400">+30 XP / catch</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#2E1458] flex justify-between items-center text-xs">
                  <span className="font-bold text-purple-300">Games Played</span>
                  <span className="font-extrabold text-white">{classicMode.gamesPlayed || overallStats.totalGames || 0}</span>
                </div>
              </div>

              {/* Modern Mode XP Card */}
              <div className="bg-[#1A0C3B]/90 border border-yellow-500/40 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col justify-between space-y-4 hover:border-yellow-400 transition-all">
                <div>
                  <div className="flex items-center justify-between border-b border-[#2E1458] pb-3 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400 shrink-0">
                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-yellow-300 text-base sm:text-lg leading-tight">Modern Mode</h3>
                        <p className="text-[10px] sm:text-[11px] text-purple-300">Kingdom Roles XP</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-yellow-400 bg-amber-950/80 border border-yellow-500/40 px-2.5 py-1 rounded-xl shrink-0">
                      {xpBreakdown?.modernMode?.xp || 0} XP
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between items-center bg-[#12072B] p-2.5 rounded-xl border border-[#2E1458]">
                      <span className="text-purple-300 font-medium">Participation XP</span>
                      <span className="font-bold text-white">+20 XP / match</span>
                    </div>
                    <div className="flex justify-between items-center bg-[#12072B] p-2.5 rounded-xl border border-[#2E1458]">
                      <span className="text-purple-300 font-medium">Completion XP</span>
                      <span className="font-bold text-white">+30 XP / match</span>
                    </div>
                    <div className="flex justify-between items-center bg-[#12072B] p-2.5 rounded-xl border border-[#2E1458]">
                      <span className="text-purple-300 font-medium">Kingdom Points XP</span>
                      <span className="font-bold text-yellow-400">Score ÷ 10</span>
                    </div>
                    <div className="flex justify-between items-center bg-[#12072B] p-2.5 rounded-xl border border-[#2E1458]">
                      <span className="text-purple-300 font-medium">Shield & Witness Bonus</span>
                      <span className="font-bold text-indigo-300">+25 XP / save</span>
                    </div>
                    <div className="flex justify-between items-center bg-[#12072B] p-2.5 rounded-xl border border-[#2E1458]">
                      <span className="text-purple-300 font-medium">Victory Bonus</span>
                      <span className="font-bold text-emerald-400">+100 XP / win</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#2E1458] flex justify-between items-center text-xs">
                  <span className="font-bold text-purple-300">Games Played</span>
                  <span className="font-extrabold text-white">{modernMode.gamesPlayed || 0}</span>
                </div>
              </div>

              {/* Detective Challenge XP Card */}
              <div className="bg-[#1A0C3B]/90 border border-cyan-500/40 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col justify-between space-y-4 hover:border-cyan-400 transition-all">
                <div>
                  <div className="flex items-center justify-between border-b border-[#2E1458] pb-3 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                        <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-cyan-300 text-base sm:text-lg leading-tight">Detective Mode</h3>
                        <p className="text-[10px] sm:text-[11px] text-purple-300">Deduction Match XP</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-cyan-300 bg-cyan-950/80 border border-cyan-500/40 px-2.5 py-1 rounded-xl shrink-0">
                      {xpBreakdown?.detectiveChallenge?.xp || 0} XP
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between items-center bg-[#12072B] p-2.5 rounded-xl border border-[#2E1458]">
                      <span className="text-purple-300 font-medium">Participation XP</span>
                      <span className="font-bold text-white">+20 XP / match</span>
                    </div>
                    <div className="flex justify-between items-center bg-[#12072B] p-2.5 rounded-xl border border-[#2E1458]">
                      <span className="text-purple-300 font-medium">Completion XP</span>
                      <span className="font-bold text-white">+30 XP / match</span>
                    </div>
                    <div className="flex justify-between items-center bg-[#12072B] p-2.5 rounded-xl border border-[#2E1458]">
                      <span className="text-purple-300 font-medium">Correct Guess Bonus</span>
                      <span className="font-bold text-cyan-400">+40 XP / catch</span>
                    </div>
                    <div className="flex justify-between items-center bg-[#12072B] p-2.5 rounded-xl border border-[#2E1458]">
                      <span className="text-purple-300 font-medium">Champion Bonus</span>
                      <span className="font-bold text-emerald-400">+120 XP / champ</span>
                    </div>
                    <div className="flex justify-between items-center bg-[#12072B] p-2.5 rounded-xl border border-[#2E1458]">
                      <span className="text-purple-300 font-medium">Accuracy Milestone</span>
                      <span className="font-bold text-yellow-400">Up to +100 XP</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#2E1458] flex justify-between items-center text-xs">
                  <span className="font-bold text-purple-300">Games Played</span>
                  <span className="font-extrabold text-white">{detectiveChallenge.gamesPlayed || 0}</span>
                </div>
              </div>

              {/* Achievements Bonus XP Card */}
              <div className="bg-[#1A0C3B]/90 border border-fuchsia-500/40 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col justify-between space-y-4 hover:border-fuchsia-400 transition-all">
                <div>
                  <div className="flex items-center justify-between border-b border-[#2E1458] pb-3 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-400 shrink-0">
                        <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-fuchsia-300 text-base sm:text-lg leading-tight">Achievements</h3>
                        <p className="text-[10px] sm:text-[11px] text-purple-300">Milestone Rewards</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-fuchsia-300 bg-fuchsia-950/80 border border-fuchsia-500/40 px-2.5 py-1 rounded-xl shrink-0">
                      {achievementXp} XP
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between items-center bg-[#12072B] p-2.5 rounded-xl border border-[#2E1458]">
                      <span className="text-purple-300 font-medium">First Steps</span>
                      <span className="font-bold text-emerald-400">+100 XP</span>
                    </div>
                    <div className="flex justify-between items-center bg-[#12072B] p-2.5 rounded-xl border border-[#2E1458]">
                      <span className="text-purple-300 font-medium">Victorious</span>
                      <span className="font-bold text-emerald-400">+100 XP</span>
                    </div>
                    <div className="flex justify-between items-center bg-[#12072B] p-2.5 rounded-xl border border-[#2E1458]">
                      <span className="text-purple-300 font-medium">Master Detective</span>
                      <span className="font-bold text-amber-400">+500 XP</span>
                    </div>
                    <div className="flex justify-between items-center bg-[#12072B] p-2.5 rounded-xl border border-[#2E1458]">
                      <span className="text-purple-300 font-medium">Sharp Shooter</span>
                      <span className="font-bold text-purple-300">+300 XP</span>
                    </div>
                    <div className="flex justify-between items-center bg-[#12072B] p-2.5 rounded-xl border border-[#2E1458]">
                      <span className="text-purple-300 font-medium">Royal Sovereign</span>
                      <span className="font-bold text-yellow-400">+500 XP</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#2E1458] flex justify-between items-center text-xs">
                  <span className="font-bold text-purple-300">Unlocked</span>
                  <span className="font-extrabold text-amber-300">{achievements.length} / 18</span>
                </div>
              </div>
            </div>

            {/* Level Thresholds Reference Table */}
            <div className="bg-[#1A0C3B]/90 border border-[#3A1C61] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-wide flex items-center gap-2">
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                <span>Global Level Milestones Reference</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3.5 text-center text-xs">
                <div className="bg-[#12072B] p-3 rounded-2xl border border-[#3A1C61]">
                  <span className="font-bold text-purple-300 block text-xs">Level 1</span>
                  <span className="text-sm sm:text-base font-black text-amber-400 mt-0.5 block">0 - 500 XP</span>
                </div>
                <div className="bg-[#12072B] p-3 rounded-2xl border border-[#3A1C61]">
                  <span className="font-bold text-purple-300 block text-xs">Level 2</span>
                  <span className="text-sm sm:text-base font-black text-amber-400 mt-0.5 block">500 - 1,200 XP</span>
                </div>
                <div className="bg-[#12072B] p-3 rounded-2xl border border-[#3A1C61]">
                  <span className="font-bold text-purple-300 block text-xs">Level 3</span>
                  <span className="text-sm sm:text-base font-black text-amber-400 mt-0.5 block">1,200 - 2,100 XP</span>
                </div>
                <div className="bg-[#12072B] p-3 rounded-2xl border border-[#3A1C61]">
                  <span className="font-bold text-purple-300 block text-xs">Level 4</span>
                  <span className="text-sm sm:text-base font-black text-amber-400 mt-0.5 block">2,100 - 3,400 XP</span>
                </div>
                <div className="bg-[#12072B] p-3 rounded-2xl border border-[#3A1C61] col-span-2 sm:col-span-1">
                  <span className="font-bold text-purple-300 block text-xs">Level 5+</span>
                  <span className="text-sm sm:text-base font-black text-amber-400 mt-0.5 block">3,400+ XP</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dedicated Views for Sidebar Tabs */}
        {activeTab === 'statistics' && (
          <div className="bg-[#1A0C3B]/90 border border-[#3A1C61] rounded-3xl p-6 shadow-xl space-y-6">
            <h3 className="text-xl font-black text-white">Detailed Game Statistics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-[#12072B] border border-[#3A1C61] p-4 rounded-2xl">
                <p className="text-xs text-purple-300">Games Played</p>
                <p className="text-2xl font-bold text-white mt-1">{overallStats.gamesPlayed || 0}</p>
              </div>
              <div className="bg-[#12072B] border border-[#3A1C61] p-4 rounded-2xl">
                <p className="text-xs text-purple-300">Games Won</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">{overallStats.gamesWon || 0}</p>
              </div>
              <div className="bg-[#12072B] border border-[#3A1C61] p-4 rounded-2xl">
                <p className="text-xs text-purple-300">Games Lost</p>
                <p className="text-2xl font-bold text-red-400 mt-1">{overallStats.gamesLost || 0}</p>
              </div>
              <div className="bg-[#12072B] border border-[#3A1C61] p-4 rounded-2xl">
                <p className="text-xs text-purple-300">Win Rate</p>
                <p className="text-2xl font-bold text-cyan-400 mt-1">{overallStats.winRate || 0}%</p>
              </div>
              <div className="bg-[#12072B] border border-[#3A1C61] p-4 rounded-2xl">
                <p className="text-xs text-purple-300">Total Rounds Played</p>
                <p className="text-2xl font-bold text-yellow-400 mt-1">{overallStats.totalRoundsPlayed || 0}</p>
              </div>
              <div className="bg-[#12072B] border border-[#3A1C61] p-4 rounded-2xl">
                <p className="text-xs text-purple-300">Total Play Time</p>
                <p className="text-2xl font-bold text-purple-300 mt-1">
                  {formatPlayTime(overallStats.totalPlayTime || 0)}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'roles' && (
          <div className="bg-[#1A0C3B]/90 border border-[#3A1C61] rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#3A1C61] pb-4">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Theater className="w-6 h-6 text-fuchsia-400" />
                  <span>Role Performance Breakdown</span>
                </h3>
                <p className="text-xs text-purple-300 mt-0.5">
                  Detailed gameplay metrics for all roles across Classic Mode, Modern Mode & Detective Challenge
                </p>
              </div>

              {/* Mode Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 bg-[#12072B] p-1.5 rounded-2xl border border-[#3A1C61]">
                <button
                  onClick={() => setRoleModeFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${roleModeFilter === 'all'
                      ? 'bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-md'
                      : 'text-purple-300 hover:text-white'
                    }`}
                >
                  All Modes
                </button>
                <button
                  onClick={() => setRoleModeFilter('classic')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${roleModeFilter === 'classic'
                      ? 'bg-amber-500 text-black shadow-md'
                      : 'text-purple-300 hover:text-white'
                    }`}
                >
                  Classic Mode
                </button>
                <button
                  onClick={() => setRoleModeFilter('modern')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${roleModeFilter === 'modern'
                      ? 'bg-yellow-500 text-black shadow-md'
                      : 'text-purple-300 hover:text-white'
                    }`}
                >
                  Modern Mode
                </button>
                <button
                  onClick={() => setRoleModeFilter('detective')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${roleModeFilter === 'detective'
                      ? 'bg-cyan-500 text-black shadow-md'
                      : 'text-purple-300 hover:text-white'
                    }`}
                >
                  Detective Challenge
                </button>
              </div>
            </div>

            {/* Grid of All 6 Roles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Raja */}
              {(roleModeFilter === 'all' || roleModeFilter === 'classic' || roleModeFilter === 'modern') && (
                <div className="bg-[#12072B] hover:bg-[#160836] border border-yellow-500/50 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border-2 border-yellow-400 p-1.5 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(234,179,8,0.25)]">
                      <img src="/assets/images/raja.png" alt="Raja" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-yellow-400 text-lg">Raja</h4>
                      <p className="text-xs text-purple-300 font-medium">Supreme Sovereign (King)</p>
                    </div>
                  </div>
                  <div className="space-y-2.5 text-xs border-t border-[#251245] pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-purple-300">Times Assigned</span>
                      <span className="font-bold text-white">
                        {roleModeFilter === 'classic'
                          ? (roleStats.raja?.timesAssigned || 0)
                          : roleModeFilter === 'modern'
                            ? (modernMode.timesRaja || 0)
                            : (roleStats.raja?.timesAssigned || 0) + (modernMode.timesRaja || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-purple-300">Total Points</span>
                      <span className="font-extrabold text-yellow-400">
                        +
                        {roleModeFilter === 'classic'
                          ? (roleStats.raja?.totalPoints || 0)
                          : roleModeFilter === 'modern'
                            ? ((modernMode.timesRaja || 0) * 1000 + (modernMode.correctRajaGuesses || 0) * 100)
                            : (roleStats.raja?.totalPoints || 0) + ((modernMode.timesRaja || 0) * 1000 + (modernMode.correctRajaGuesses || 0) * 100)}
                      </span>
                    </div>
                    {roleModeFilter !== 'classic' && (
                      <div className="flex items-center justify-between">
                        <span className="text-purple-300">Modern Queen Guesses</span>
                        <span className="font-bold text-emerald-400">{modernMode.correctRajaGuesses || 0} Correct</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Rani */}
              {(roleModeFilter === 'all' || roleModeFilter === 'classic' || roleModeFilter === 'modern') && (
                <div className="bg-[#12072B] hover:bg-[#160836] border border-pink-500/50 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-pink-500/10 border-2 border-pink-400 p-1.5 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(236,72,153,0.25)]">
                      <img src="/assets/images/rani.png" alt="Rani" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-pink-400 text-lg">Rani</h4>
                      <p className="text-xs text-purple-300 font-medium">Royal Matriarch (Queen)</p>
                    </div>
                  </div>
                  <div className="space-y-2.5 text-xs border-t border-[#251245] pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-purple-300">Times Assigned</span>
                      <span className="font-bold text-white">
                        {roleModeFilter === 'classic'
                          ? (roleStats.rani?.timesAssigned || 0)
                          : roleModeFilter === 'modern'
                            ? (modernMode.timesRani || 0)
                            : (roleStats.rani?.timesAssigned || 0) + (modernMode.timesRani || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-purple-300">Total Points</span>
                      <span className="font-extrabold text-pink-400">
                        +
                        {roleModeFilter === 'classic'
                          ? (roleStats.rani?.totalPoints || 0)
                          : roleModeFilter === 'modern'
                            ? ((modernMode.timesRani || 0) * 800 + (modernMode.correctRaniGuesses || 0) * 100)
                            : (roleStats.rani?.totalPoints || 0) + ((modernMode.timesRani || 0) * 800 + (modernMode.correctRaniGuesses || 0) * 100)}
                      </span>
                    </div>
                    {roleModeFilter !== 'classic' && (
                      <div className="flex items-center justify-between">
                        <span className="text-purple-300">Modern King Guesses</span>
                        <span className="font-bold text-emerald-400">{modernMode.correctRaniGuesses || 0} Correct</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Police / Detective */}
              {(roleModeFilter === 'all' || roleModeFilter === 'classic' || roleModeFilter === 'modern' || roleModeFilter === 'detective') && (
                <div className="bg-[#12072B] hover:bg-[#160836] border border-blue-500/50 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border-2 border-blue-400 p-1.5 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.25)]">
                      <img src="/assets/images/police.png" alt="Police" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-blue-400 text-lg">Police</h4>
                      <p className="text-xs text-purple-300 font-medium">Chief Inspector / Detective</p>
                    </div>
                  </div>
                  <div className="space-y-2.5 text-xs border-t border-[#251245] pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-purple-300">Times Assigned</span>
                      <span className="font-bold text-white">
                        {roleModeFilter === 'classic'
                          ? (roleStats.police?.timesAssigned || 0)
                          : roleModeFilter === 'modern'
                            ? (modernMode.timesPolice || 0)
                            : roleModeFilter === 'detective'
                              ? (policeMode.timesPlayedAsPolice || detectiveChallenge.gamesPlayed || 0)
                              : (roleStats.police?.timesAssigned || 0) + (modernMode.timesPolice || 0) + (policeMode.timesPlayedAsPolice || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-purple-300">Correct Catches</span>
                      <span className="font-extrabold text-emerald-400">
                        {roleModeFilter === 'classic'
                          ? (roleStats.police?.correctCatches || 0)
                          : roleModeFilter === 'modern'
                            ? (modernMode.policeCatches || 0)
                            : roleModeFilter === 'detective'
                              ? (policeMode.totalCorrectCatches || 0)
                              : (roleStats.police?.correctCatches || 0) + (modernMode.policeCatches || 0) + (policeMode.totalCorrectCatches || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-purple-300">Accuracy</span>
                      <span className="font-extrabold text-cyan-400">
                        {roleModeFilter === 'classic'
                          ? `${roleStats.police?.accuracy || 0}%`
                          : roleModeFilter === 'modern'
                            ? `${modernMode.policeSuccessRate || (modernMode.timesPolice ? Math.round(((modernMode.policeCatches || 0) / modernMode.timesPolice) * 100) : 0)}%`
                            : roleModeFilter === 'detective'
                              ? `${policeMode.policeAccuracy || detectiveChallenge.overallAccuracy || 0}%`
                              : `${Math.round(
                                (((roleStats.police?.correctCatches || 0) + (modernMode.policeCatches || 0) + (policeMode.totalCorrectCatches || 0)) /
                                  Math.max(1, (roleStats.police?.timesAssigned || 0) + (modernMode.timesPolice || 0) + (policeMode.timesPlayedAsPolice || 0))) *
                                100
                              )}%`}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Thief */}
              {(roleModeFilter === 'all' || roleModeFilter === 'classic' || roleModeFilter === 'modern' || roleModeFilter === 'detective') && (
                <div className="bg-[#12072B] hover:bg-[#160836] border border-emerald-500/50 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border-2 border-emerald-400 p-1.5 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
                      <img src="/assets/images/thief.png" alt="Thief" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-emerald-400 text-lg">Thief</h4>
                      <p className="text-xs text-purple-300 font-medium">Shadow Outlaw / Rogue</p>
                    </div>
                  </div>
                  <div className="space-y-2.5 text-xs border-t border-[#251245] pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-purple-300">Times Assigned</span>
                      <span className="font-bold text-white">
                        {roleModeFilter === 'classic'
                          ? (roleStats.thief?.timesAssigned || 0)
                          : roleModeFilter === 'modern'
                            ? (modernMode.timesThief || 0)
                            : roleModeFilter === 'detective'
                              ? (policeMode.timesPlayedAsThief || 0)
                              : (roleStats.thief?.timesAssigned || 0) + (modernMode.timesThief || 0) + (policeMode.timesPlayedAsThief || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-purple-300">Total Escapes</span>
                      <span className="font-extrabold text-emerald-400">
                        {roleModeFilter === 'classic'
                          ? (roleStats.thief?.escaped || 0)
                          : roleModeFilter === 'modern'
                            ? (modernMode.thiefEscapes || 0)
                            : roleModeFilter === 'detective'
                              ? (policeMode.thiefEscaped || 0)
                              : (roleStats.thief?.escaped || 0) + (modernMode.thiefEscapes || 0) + (policeMode.thiefEscaped || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-purple-300">Escape Rate</span>
                      <span className="font-extrabold text-cyan-400">
                        {roleModeFilter === 'classic'
                          ? `${roleStats.thief?.escapeRate || 0}%`
                          : roleModeFilter === 'modern'
                            ? `${modernMode.thiefEscapeRate || (modernMode.timesThief ? Math.round(((modernMode.thiefEscapes || 0) / modernMode.timesThief) * 100) : 0)}%`
                            : roleModeFilter === 'detective'
                              ? `${policeMode.escapeRate || 0}%`
                              : `${Math.round(
                                (((roleStats.thief?.escaped || 0) + (modernMode.thiefEscapes || 0) + (policeMode.thiefEscaped || 0)) /
                                  Math.max(1, (roleStats.thief?.timesAssigned || 0) + (modernMode.timesThief || 0) + (policeMode.timesPlayedAsThief || 0))) *
                                100
                              )}%`}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Mantri (Modern Mode) */}
              {(roleModeFilter === 'all' || roleModeFilter === 'modern') && (
                <div className="bg-[#12072B] hover:bg-[#160836] border border-indigo-500/50 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border-2 border-indigo-400 p-1.5 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.25)]">
                      <img src="/assets/images/mantri.png" alt="Mantri" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-indigo-300 text-lg">Mantri</h4>
                      <p className="text-xs text-purple-300 font-medium">Royal Shield Advisor</p>
                    </div>
                  </div>
                  <div className="space-y-2.5 text-xs border-t border-[#251245] pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-purple-300">Times Assigned</span>
                      <span className="font-bold text-white">{modernMode.timesMantri || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-purple-300">Royal Shield Saved</span>
                      <span className="font-extrabold text-indigo-300">{modernMode.mantriShieldSuccesses || 0} Shields</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-purple-300">Kingdom Points Saved</span>
                      <span className="font-bold text-yellow-300">+{modernMode.mantriKingdomPointsSaved || 0} pts</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Villager (Modern Mode) */}
              {(roleModeFilter === 'all' || roleModeFilter === 'modern') && (
                <div className="bg-[#12072B] hover:bg-[#160836] border border-amber-600/50 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-amber-600/10 border-2 border-amber-500 p-1.5 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
                      <img src="/assets/images/villager.png" alt="Villager" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-amber-300 text-lg">Villager</h4>
                      <p className="text-xs text-purple-300 font-medium">Kingdom Witness</p>
                    </div>
                  </div>
                  <div className="space-y-2.5 text-xs border-t border-[#251245] pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-purple-300">Times Assigned</span>
                      <span className="font-bold text-white">{modernMode.timesVillager || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-purple-300">Witness & Insight Bonuses</span>
                      <span className="font-extrabold text-amber-400">
                        {(modernMode.villagerWitnessBonuses || 0) + (modernMode.villagerInsightBonuses || 0)} Earned
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-purple-300">Bonus Points Total</span>
                      <span className="font-bold text-yellow-300">
                        +{((modernMode.villagerWitnessBonuses || 0) + (modernMode.villagerInsightBonuses || 0)) * 100} pts
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <AchievementsView userAchievements={achievements} userStats={stats} />
        )}

        {activeTab === 'history' && (
          <div className="bg-[#1A0C3B]/90 border border-[#3A1C61] rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#3A1C61] pb-4">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Swords className="w-6 h-6 text-fuchsia-400" />
                  <span>Full Match History</span>
                </h3>
                <p className="text-xs text-purple-300 mt-0.5">
                  Complete battle records across Classic Mode, Modern Mode &amp; Detective Challenge
                </p>
              </div>

              {/* History Mode Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 bg-[#12072B] p-1.5 rounded-2xl border border-[#3A1C61]">
                <button
                  onClick={() => setHistoryModeFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${historyModeFilter === 'all'
                      ? 'bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-md'
                      : 'text-purple-300 hover:text-white'
                    }`}
                >
                  All Modes
                </button>
                <button
                  onClick={() => setHistoryModeFilter('classic')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${historyModeFilter === 'classic'
                      ? 'bg-amber-500 text-black shadow-md'
                      : 'text-purple-300 hover:text-white'
                    }`}
                >
                  Classic Mode
                </button>
                <button
                  onClick={() => setHistoryModeFilter('modern')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${historyModeFilter === 'modern'
                      ? 'bg-yellow-500 text-black shadow-md'
                      : 'text-purple-300 hover:text-white'
                    }`}
                >
                  Modern Mode
                </button>
                <button
                  onClick={() => setHistoryModeFilter('detective')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${historyModeFilter === 'detective'
                      ? 'bg-cyan-500 text-black shadow-md'
                      : 'text-purple-300 hover:text-white'
                    }`}
                >
                  Detective Challenge
                </button>
              </div>
            </div>

            {(() => {
              const filtered = recentMatches.filter((m: any) => {
                if (historyModeFilter === 'classic') return m.gameMode === 'CLASSIC' || !m.gameMode || m.gameMode === 'CLASSIC_POINTS';
                if (historyModeFilter === 'modern') return m.gameMode === 'MODERN_MODE';
                if (historyModeFilter === 'detective') return m.gameMode === 'DETECTIVE_CHALLENGE';
                return true;
              });

              if (filtered.length === 0) {
                return (
                  <div className="py-12 text-center text-purple-300">
                    <Swords className="w-12 h-12 mx-auto mb-3 opacity-30 text-purple-300" />
                    <p className="font-bold text-white text-lg">No Match Records Found</p>
                    <p className="text-xs text-purple-400 mt-1">
                      Play Classic Mode, Modern Mode, or Detective Challenge matches to build your match history!
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {filtered.map((m: any) => {
                    const isModern = m.gameMode === 'MODERN_MODE';
                    const isDetective = m.gameMode === 'DETECTIVE_CHALLENGE';
                    const modeLabel = isModern ? 'Modern Mode' : isDetective ? 'Detective Challenge' : 'Classic Mode';
                    const role = m.rolePlayed || 'Player';

                    return (
                      <div
                        key={m._id || m.matchId}
                        className="bg-[#12072B] border border-[#3A1C61] hover:border-[#5A2C81] p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all"
                      >
                        <div className="flex items-center gap-3.5">
                          {/* Role Icon Image */}
                          <div className="w-12 h-12 rounded-2xl bg-[#1A0C3B] border border-[#3A1C61] p-1.5 flex items-center justify-center shrink-0">
                            {role.toLowerCase().includes('police') || role.toLowerCase().includes('detective') ? (
                              <img src="/assets/images/police.png" alt="Police" className="w-full h-full object-contain" />
                            ) : role.toLowerCase() === 'thief' ? (
                              <img src="/assets/images/thief.png" alt="Thief" className="w-full h-full object-contain" />
                            ) : role.toLowerCase() === 'raja' ? (
                              <img src="/assets/images/raja.png" alt="Raja" className="w-full h-full object-contain" />
                            ) : role.toLowerCase() === 'rani' ? (
                              <img src="/assets/images/rani.png" alt="Rani" className="w-full h-full object-contain" />
                            ) : role.toLowerCase() === 'mantri' ? (
                              <img src="/assets/images/mantri.png" alt="Mantri" className="w-full h-full object-contain" />
                            ) : role.toLowerCase() === 'villager' ? (
                              <img src="/assets/images/villager.png" alt="Villager" className="w-full h-full object-contain" />
                            ) : (
                              <UserIcon className="w-6 h-6 text-purple-300" />
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-white text-base">{modeLabel}</p>
                              <span
                                className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${isModern
                                    ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                                    : isDetective
                                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                                      : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                                  }`}
                              >
                                {isModern ? 'Modern' : isDetective ? 'Detective' : 'Classic'}
                              </span>
                            </div>
                            <p className="text-xs text-purple-300 mt-1">
                              Role: <strong className="text-white">{role}</strong> | Rank <strong className="text-amber-300">#{m.rank || 1}</strong> | Room: <strong className="text-cyan-300">{m.roomCode || '—'}</strong> | Date: {formatDateTime(m.date)}
                            </p>
                          </div>
                        </div>

                        <div className="text-right w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-[#3A1C61] flex sm:flex-col items-center sm:items-end justify-between">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${m.matchResult === 'win'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                                : 'bg-red-950 text-red-400 border border-red-500/40'
                              }`}
                          >
                            {m.matchResult === 'win' ? 'VICTORY / WIN' : 'LOSS'}
                          </span>
                          {m.accuracy !== undefined ? (
                            <p className="text-xs text-emerald-400 font-bold mt-1">{m.accuracy}% Accuracy</p>
                          ) : (
                            <p className="text-xs text-yellow-400 font-bold mt-1">+{m.scoreEarned || 0} pts</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {activeTab === 'records' && (
          <div className="bg-[#1A0C3B]/90 border border-[#3A1C61] rounded-3xl p-6 shadow-xl space-y-6">
            <div>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-400" />
                <span>Lifetime Personal Records</span>
              </h3>
              <p className="text-xs text-purple-300 mt-1">
                Highest achievements, peak scores, and personal records across all game modes.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-[#12072B] border border-amber-500/30 p-4 rounded-2xl shadow">
                <p className="text-xs text-amber-300 font-semibold uppercase tracking-wider">Highest Classic Match Score</p>
                <p className="text-2xl font-black text-yellow-400 mt-1">
                  {records.highestScore || classicMode.highestScore || stats.lifetimeRecords?.highestSingleMatchScore || 0}
                </p>
              </div>

              <div className="bg-[#12072B] border border-yellow-500/30 p-4 rounded-2xl shadow">
                <p className="text-xs text-yellow-300 font-semibold uppercase tracking-wider">Highest Modern Kingdom Score</p>
                <p className="text-2xl font-black text-amber-400 mt-1">
                  {modernMode.highestScore || 0}
                </p>
              </div>

              <div className="bg-[#12072B] border border-emerald-500/30 p-4 rounded-2xl shadow">
                <p className="text-xs text-emerald-300 font-semibold uppercase tracking-wider">Modern Kingdom Wins</p>
                <p className="text-2xl font-black text-emerald-400 mt-1">
                  {modernMode.gamesWon || 0}
                </p>
              </div>

              <div className="bg-[#12072B] border border-cyan-500/30 p-4 rounded-2xl shadow">
                <p className="text-xs text-cyan-300 font-semibold uppercase tracking-wider">Fastest Detective Guess</p>
                <p className="text-2xl font-black text-cyan-400 mt-1">
                  {detectiveChallenge.fastestGuessTime ? `${detectiveChallenge.fastestGuessTime.toFixed(2)}s` : records.fastestCatch ? `${records.fastestCatch}s` : '—'}
                </p>
              </div>

              <div className="bg-[#12072B] border border-fuchsia-500/30 p-4 rounded-2xl shadow">
                <p className="text-xs text-fuchsia-300 font-semibold uppercase tracking-wider">Longest Win Streak</p>
                <p className="text-2xl font-black text-fuchsia-400 mt-1">
                  {Math.max(overallStats.longestWinStreak || 0, modernMode.longestWinStreak || 0, detectiveChallenge.longestStreak || 0)}
                </p>
              </div>

              <div className="bg-[#12072B] border border-indigo-500/30 p-4 rounded-2xl shadow">
                <p className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">Kingdom Shields Saved</p>
                <p className="text-2xl font-black text-indigo-300 mt-1">
                  {modernMode.mantriShieldSuccesses || 0}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'friends' && (
          <div className="bg-[#1A0C3B]/90 border border-[#3A1C61] rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-[#3A1C61] pb-4">
              <div>
                <h3 className="text-xl font-black text-white">Social &amp; Friends Stats</h3>
                <p className="text-purple-300 text-xs mt-1">
                  Track room activity and recent gaming companions played with across Classic, Modern &amp; Detective Challenge modes.
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Users className="w-5 h-5" />
              </div>
            </div>

            {/* Social Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#12072B] border border-[#3A1C61] p-4 rounded-2xl text-center shadow">
                <p className="text-xs text-purple-300 uppercase tracking-wider font-semibold">Rooms Created</p>
                <p className="text-2xl font-black text-cyan-400 mt-1">
                  {stats.socialStats?.roomsCreated || stats.social?.roomsCreated || 0}
                </p>
              </div>
              <div className="bg-[#12072B] border border-[#3A1C61] p-4 rounded-2xl text-center shadow">
                <p className="text-xs text-purple-300 uppercase tracking-wider font-semibold">Rooms Joined</p>
                <p className="text-2xl font-black text-amber-400 mt-1">
                  {stats.socialStats?.roomsJoined || stats.social?.roomsJoined || overallStats.totalGames || 0}
                </p>
              </div>
              <div className="bg-[#12072B] border border-[#3A1C61] p-4 rounded-2xl text-center shadow">
                <p className="text-xs text-purple-300 uppercase tracking-wider font-semibold">Gaming Companions</p>
                <p className="text-2xl font-black text-emerald-400 mt-1">
                  {stats.socialStats?.friendsAdded || stats.social?.friendsAdded || (stats.socialStats?.recentFriends?.length || 0)}
                </p>
              </div>
            </div>

            {/* Recent Friends & Gaming Companions List */}
            <div className="space-y-4 pt-2">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-cyan-400" />
                <span>Recent Gaming Companions ({stats.socialStats?.recentFriends?.length || 0})</span>
              </h4>

              {stats.socialStats?.recentFriends && stats.socialStats.recentFriends.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {stats.socialStats.recentFriends.map((friend: any, index: number) => {
                    const mode = friend.lastPlayedMode || "Classic Mode";
                    const isModern = mode.toLowerCase().includes("modern");
                    const isDetective = mode.toLowerCase().includes("detective");

                    return (
                      <div
                        key={index}
                        className="bg-[#12072B] border border-[#3A1C61] hover:border-cyan-500/50 p-4 rounded-2xl flex items-center justify-between transition-all"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-600 to-purple-800 p-0.5 shadow">
                            <div className="w-full h-full rounded-full bg-[#0A0217] flex items-center justify-center font-black text-cyan-300 text-sm">
                              {friend.username.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{friend.username}</p>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${isModern
                                  ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                                  : isDetective
                                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                                }`}
                            >
                              {mode}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="inline-block text-xs font-black text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-1 rounded-full">
                            {friend.matchesTogether} {friend.matchesTogether === 1 ? "Match" : "Matches"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-[#12072B] border border-[#3A1C61] p-6 rounded-2xl text-center space-y-2">
                  <p className="text-sm text-purple-200 font-semibold">No recent gaming companions logged yet.</p>
                  <p className="text-xs text-purple-400">
                    Play Classic Mode, Modern Mode, or Detective Challenge matches with other players to automatically build your friends &amp; gaming companions list!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'edit-profile' && (
          <div className="bg-[#1A0C3B]/90 border border-[#3A1C61] rounded-3xl p-6 sm:p-8 shadow-2xl max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between border-b border-[#3A1C61] pb-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-wide">Update Profile</h3>
                <p className="text-purple-300 text-xs sm:text-sm mt-1">
                  Customize your avatar picture, display username, and profile bio slogan.
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Edit3 className="w-5 h-5" />
              </div>
            </div>

            {/* Avatar Gallery (6 Preset Avatars from public/assets/images/avatars) */}
            <div>
              <label className="block text-sm font-bold text-white mb-2">
                Select Profile Avatar <span className="text-purple-400 font-normal">(Choose from 6 presets)</span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4 p-4 bg-[#12072B] border border-[#3A1C61] rounded-2xl">
                {PRESET_AVATARS.map((av) => {
                  const isSelected = selectedAvatar === av.id || selectedAvatar === av.src;
                  return (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setSelectedAvatar(av.id)}
                      className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${isSelected
                          ? "bg-[#250E4C] border-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.4)] scale-105"
                          : "bg-[#1A0C38]/60 border-[#3A1C61] hover:border-purple-400 hover:bg-[#200E44]"
                        }`}
                    >
                      <img
                        src={av.src}
                        alt="Avatar Preset"
                        className="w-12 h-12 rounded-full object-cover border border-yellow-400/50 shadow-sm"
                      />
                      {isSelected && (
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-yellow-400 text-[#12072B] flex items-center justify-center font-black text-xs shadow-md">
                          ✓
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Username Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-bold text-white">
                  Display Username <span className="text-red-400">*</span>
                </label>
                <span className={`text-xs font-semibold ${editUsername.length >= 20 ? "text-amber-400" : "text-purple-300"}`}>
                  {editUsername.length} / 20 chars
                </span>
              </div>
              <input
                type="text"
                value={editUsername}
                maxLength={20}
                onChange={(e) => setEditUsername(e.target.value)}
                placeholder="Enter display username..."
                className="w-full bg-[#12072B] border border-[#5A2C81] focus:border-yellow-400 focus:outline-none px-4 py-3 rounded-xl text-white font-medium text-sm transition-colors shadow-inner"
              />
              <p className="text-[11px] text-purple-300 mt-1">Between 2 and 20 characters.</p>
            </div>

            {/* Bio Description Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-bold text-white">
                  Bio / Profile Slogan
                </label>
                <span className={`text-xs font-semibold ${editDescription.length >= 120 ? "text-amber-400" : "text-purple-300"}`}>
                  {editDescription.length} / 120 chars
                </span>
              </div>
              <textarea
                value={editDescription}
                maxLength={120}
                rows={3}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Write a short bio or slogan (e.g. 'Master Detective in Raja Rani Police Thief 🔍')..."
                className="w-full bg-[#12072B] border border-[#5A2C81] focus:border-yellow-400 focus:outline-none px-4 py-3 rounded-xl text-white font-medium text-sm transition-colors shadow-inner resize-none"
              />
              <p className="text-[11px] text-purple-300 mt-1">Maximum 120 characters.</p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 pt-4 border-t border-[#3A1C61]">
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveProfile}
                className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 hover:from-amber-300 hover:to-yellow-500 text-[#12072B] font-extrabold text-sm tracking-wide shadow-lg hover:shadow-[0_0_25px_rgba(234,179,8,0.4)] transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Profile Changes</span>
                )}
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setActiveTab('overview')}
                className="py-3 px-6 rounded-xl bg-[#12072B] border border-[#3A1C61] hover:bg-[#200E44] text-purple-300 hover:text-white font-bold text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProfileDashboard;
