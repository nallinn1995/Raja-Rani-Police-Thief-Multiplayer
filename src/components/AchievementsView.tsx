import React, { useState, useRef } from 'react';
import {
  Trophy,
  Award,
  Zap,
  Target,
  Search,
  CheckCircle2,
  Lock,
  Flame,
  Star,
  Crown,
  Sparkles,
  Shield,
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export interface AchievementItem {
  id: string;
  code: string;
  title: string;
  description: string;
  tier: 'Legendary' | 'Epic' | 'Rare' | 'Common' | 'Secret';
  category: 'Classic Mode' | 'Detective Challenge' | 'Modern Mode' | 'General';
  xpReward: number;
  coinReward?: number;
  isUnlocked: boolean;
  unlockedAt?: string;
  progressCurrent?: number;
  progressTotal?: number;
  iconSrc: string;
}

interface AchievementsViewProps {
  userAchievements?: any[];
  userStats?: any;
}

export const AchievementBadgeIcon: React.FC<{
  code: string;
  tier: string;
  isUnlocked: boolean;
  size?: string;
}> = ({ code, tier, isUnlocked, size = 'w-20 h-20' }) => {
  const getBadgeGradient = () => {
    if (!isUnlocked) return 'from-slate-800/90 to-slate-950 border-slate-700/60 text-slate-500';
    switch (tier) {
      case 'Legendary':
        return 'from-amber-500/30 via-yellow-500/20 to-amber-700/40 border-amber-400/80 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.4)]';
      case 'Epic':
        return 'from-purple-500/30 via-fuchsia-500/20 to-purple-700/40 border-purple-400/80 text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.4)]';
      case 'Rare':
        return 'from-cyan-500/30 via-blue-500/20 to-cyan-700/40 border-cyan-400/80 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.4)]';
      case 'Common':
      default:
        return 'from-emerald-500/30 via-teal-500/20 to-emerald-700/40 border-emerald-400/80 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.4)]';
    }
  };

  const renderSvgContent = () => {
    switch (code) {
      case 'MASTER_DETECTIVE':
      case 'MASTER_DETECTIVE_ACH':
        return (
          <div className="relative flex items-center justify-center">
            <Shield className="w-10 h-10 text-amber-400 filter drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
            <Search className="w-5 h-5 text-yellow-200 absolute inset-0 m-auto filter drop-shadow-md" />
          </div>
        );
      case 'ULTIMATE_DETECTIVE':
        return (
          <div className="relative flex items-center justify-center">
            <Crown className="w-10 h-10 text-yellow-300 filter drop-shadow-[0_0_10px_rgba(234,179,8,0.9)] fill-amber-400/40" />
            <Sparkles className="w-4 h-4 text-amber-200 absolute -top-1 -right-1 animate-pulse" />
          </div>
        );
      case 'SHARP_SHOOTER':
        return (
          <div className="relative flex items-center justify-center">
            <Target className="w-10 h-10 text-purple-400 filter drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
            <Zap className="w-4 h-4 text-fuchsia-300 absolute inset-0 m-auto" />
          </div>
        );
      case 'GHOST_THIEF':
        return (
          <div className="relative flex items-center justify-center">
            <Flame className="w-10 h-10 text-fuchsia-400 filter drop-shadow-[0_0_8px_rgba(217,70,239,0.8)] fill-fuchsia-500/30" />
            <Lock className="w-4 h-4 text-purple-200 absolute bottom-1" />
          </div>
        );
      case 'SPEED_DETECTIVE':
        return (
          <div className="relative flex items-center justify-center">
            <Zap className="w-10 h-10 text-indigo-400 filter drop-shadow-[0_0_10px_rgba(129,140,248,0.8)] fill-indigo-400" />
            <Sparkles className="w-4 h-4 text-white absolute -top-1 -left-1" />
          </div>
        );
      case 'GHOST_HUNTER':
        return (
          <div className="relative flex items-center justify-center">
            <Clock className="w-10 h-10 text-cyan-400 filter drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            <Zap className="w-4 h-4 text-blue-200 absolute inset-0 m-auto" />
          </div>
        );
      case 'SHADOW_ESCAPE':
        return (
          <div className="relative flex items-center justify-center">
            <Shield className="w-10 h-10 text-cyan-300 filter drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            <Crown className="w-4 h-4 text-teal-200 absolute inset-0 m-auto" />
          </div>
        );
      case 'OBSERVATION_KING':
        return (
          <div className="relative flex items-center justify-center">
            <Search className="w-10 h-10 text-cyan-400 filter drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            <Star className="w-4 h-4 text-yellow-300 absolute inset-0 m-auto fill-yellow-300" />
          </div>
        );
      case 'FIRST_STEPS':
      case 'FIRST_GAME':
        return (
          <div className="relative flex items-center justify-center">
            <Award className="w-10 h-10 text-emerald-400 filter drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <Star className="w-4 h-4 text-teal-200 absolute inset-0 m-auto fill-teal-200" />
          </div>
        );
      case 'VICTORIOUS':
      case 'FIRST_WIN':
        return (
          <div className="relative flex items-center justify-center">
            <Trophy className="w-10 h-10 text-emerald-400 filter drop-shadow-[0_0_10px_rgba(16,185,129,0.9)] fill-emerald-500/30" />
            <Crown className="w-4 h-4 text-yellow-300 absolute -top-1 inset-x-0 mx-auto" />
          </div>
        );
      case 'ROYAL_SOVEREIGN':
        return (
          <div className="relative flex items-center justify-center">
            <Crown className="w-10 h-10 text-amber-400 filter drop-shadow-[0_0_10px_rgba(245,158,11,0.9)] fill-amber-400" />
            <Trophy className="w-4 h-4 text-yellow-200 absolute bottom-0" />
          </div>
        );
      case 'ROYAL_GENIUS':
        return (
          <div className="relative flex items-center justify-center">
            <Crown className="w-10 h-10 text-yellow-400 filter drop-shadow-[0_0_8px_rgba(234,179,8,0.8)] fill-amber-400/40" />
            <Sparkles className="w-4 h-4 text-yellow-200 absolute -top-1 -right-1" />
          </div>
        );
      case 'QUEENS_INTUITION':
        return (
          <div className="relative flex items-center justify-center">
            <Crown className="w-10 h-10 text-pink-400 filter drop-shadow-[0_0_8px_rgba(244,114,182,0.8)] fill-pink-500/30" />
            <Star className="w-4 h-4 text-pink-200 absolute inset-0 m-auto fill-pink-200" />
          </div>
        );
      case 'ESCAPE_ARTIST':
        return (
          <div className="relative flex items-center justify-center">
            <Flame className="w-10 h-10 text-emerald-400 filter drop-shadow-[0_0_8px_rgba(52,211,153,0.8)] fill-emerald-500/30" />
            <Lock className="w-4 h-4 text-emerald-200 absolute bottom-1" />
          </div>
        );
      case 'TRUSTED_WITNESS':
        return (
          <div className="relative flex items-center justify-center">
            <Shield className="w-10 h-10 text-amber-300 filter drop-shadow-[0_0_8px_rgba(252,211,77,0.8)]" />
            <Award className="w-4 h-4 text-yellow-200 absolute inset-0 m-auto" />
          </div>
        );
      case 'ROYAL_GUARDIAN':
        return (
          <div className="relative flex items-center justify-center">
            <Shield className="w-10 h-10 text-purple-400 filter drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] fill-purple-500/30" />
            <Crown className="w-4 h-4 text-amber-300 absolute inset-0 m-auto" />
          </div>
        );
      case 'KINGDOM_SAVIOR':
        return (
          <div className="relative flex items-center justify-center">
            <Trophy className="w-10 h-10 text-yellow-300 filter drop-shadow-[0_0_10px_rgba(234,179,8,0.9)] fill-amber-400" />
            <Crown className="w-4 h-4 text-yellow-100 absolute -top-1 inset-x-0 mx-auto" />
          </div>
        );
      case 'RAJAS_BOUNTY':
      default:
        return (
          <div className="relative flex items-center justify-center">
            <Trophy className="w-10 h-10 text-amber-400 filter drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
            <Star className="w-4 h-4 text-yellow-300 absolute inset-0 m-auto fill-yellow-300" />
          </div>
        );
    }
  };

  return (
    <div
      className={`${size} rounded-2xl bg-gradient-to-br ${getBadgeGradient()} border p-2 flex items-center justify-center relative overflow-hidden transition-all duration-300 group-hover:scale-105 shrink-0`}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-white/10 pointer-events-none" />
      {renderSvgContent()}
      {!isUnlocked && (
        <div className="absolute inset-0 bg-[#0A0217]/70 backdrop-blur-[1px] flex items-center justify-center">
          <Lock className="w-5 h-5 text-slate-400 drop-shadow" />
        </div>
      )}
    </div>
  );
};

const DEFAULT_ACHIEVEMENTS_TEMPLATE: Omit<AchievementItem, 'isUnlocked' | 'progressCurrent'>[] = [
  {
    id: 'ach-1',
    code: 'MASTER_DETECTIVE',
    title: 'Master Detective',
    description: 'Maintain 80%+ Detective Accuracy with at least 5 correct catches.',
    tier: 'Legendary',
    category: 'Detective Challenge',
    xpReward: 500,
    coinReward: 1000,
    progressTotal: 5,
    iconSrc: '/assets/achievements/master_detective.png',
  },
  {
    id: 'ach-2',
    code: 'SHARP_SHOOTER',
    title: 'Sharp Shooter',
    description: 'Achieve 10 Correct Catches as Police/Detective.',
    tier: 'Epic',
    category: 'Detective Challenge',
    xpReward: 300,
    coinReward: 600,
    progressTotal: 10,
    iconSrc: '/assets/achievements/sharp_shooter.png',
  },
  {
    id: 'ach-3',
    code: 'GHOST_HUNTER',
    title: 'Ghost Hunter',
    description: 'Catch the Thief in under 5 seconds.',
    tier: 'Rare',
    category: 'Detective Challenge',
    xpReward: 200,
    coinReward: 400,
    progressTotal: 1,
    iconSrc: '/assets/achievements/ghost_hunter.png',
  },
  {
    id: 'ach-4',
    code: 'GHOST_THIEF',
    title: 'Ghost Thief',
    description: 'Achieve 10 consecutive Thief escapes.',
    tier: 'Epic',
    category: 'Classic Mode',
    xpReward: 300,
    coinReward: 600,
    progressTotal: 10,
    iconSrc: '/assets/achievements/ghost_thief.png',
  },
  {
    id: 'ach-5',
    code: 'SHADOW_ESCAPE',
    title: 'Shadow Escape',
    description: 'Escape 25 rounds as Thief.',
    tier: 'Rare',
    category: 'Classic Mode',
    xpReward: 250,
    coinReward: 500,
    progressTotal: 25,
    iconSrc: '/assets/achievements/shadow_escape.png',
  },
  {
    id: 'ach-6',
    code: 'FIRST_STEPS',
    title: 'First Steps',
    description: 'Play your first match.',
    tier: 'Common',
    category: 'General',
    xpReward: 100,
    coinReward: 200,
    progressTotal: 1,
    iconSrc: '/assets/achievements/first_steps.png',
  },
  {
    id: 'ach-7',
    code: 'VICTORIOUS',
    title: 'Victorious',
    description: 'Win your first match.',
    tier: 'Common',
    category: 'General',
    xpReward: 100,
    coinReward: 200,
    progressTotal: 1,
    iconSrc: '/assets/achievements/victorious.png',
  },
  {
    id: 'ach-8',
    code: 'OBSERVATION_KING',
    title: 'Observation King',
    description: 'Maintain 70%+ accuracy in 3 matches.',
    tier: 'Rare',
    category: 'Detective Challenge',
    xpReward: 200,
    coinReward: 300,
    progressTotal: 3,
    iconSrc: '/assets/achievements/observation_king.png',
  },
  {
    id: 'ach-9',
    code: 'SPEED_DETECTIVE',
    title: 'Speed Detective',
    description: 'Make 15 correct catches in under 6 seconds.',
    tier: 'Epic',
    category: 'Detective Challenge',
    xpReward: 300,
    coinReward: 600,
    progressTotal: 15,
    iconSrc: '/assets/achievements/speed_detective.png',
  },
  {
    id: 'ach-10',
    code: 'ULTIMATE_DETECTIVE',
    title: 'Ultimate Detective',
    description: 'Win 100 matches as Detective.',
    tier: 'Legendary',
    category: 'Detective Challenge',
    xpReward: 1000,
    coinReward: 2000,
    progressTotal: 100,
    iconSrc: '/assets/achievements/ultimate_detective.png',
  },
  {
    id: 'ach-11',
    code: 'ROYAL_SOVEREIGN',
    title: 'Royal Sovereign',
    description: 'Accumulate 5,000+ total points in Classic Mode.',
    tier: 'Legendary',
    category: 'Classic Mode',
    xpReward: 500,
    coinReward: 1000,
    progressTotal: 5000,
    iconSrc: '/assets/achievements/master_detective.png',
  },
  {
    id: 'ach-12',
    code: 'RAJAS_BOUNTY',
    title: "Raja's Bounty",
    description: 'Assigned as Raja 10 times in Classic Mode.',
    tier: 'Rare',
    category: 'Classic Mode',
    xpReward: 200,
    coinReward: 400,
    progressTotal: 10,
    iconSrc: '/assets/achievements/victorious.png',
  },
  {
    id: 'ach-13',
    code: 'ROYAL_GENIUS',
    title: 'Royal Genius',
    description: 'Correctly identify Rani 10 times as Raja.',
    tier: 'Epic',
    category: 'Modern Mode',
    xpReward: 300,
    coinReward: 600,
    progressTotal: 10,
    iconSrc: '/assets/achievements/royal_genius.png',
  },
  {
    id: 'ach-14',
    code: 'QUEENS_INTUITION',
    title: "Queen's Intuition",
    description: 'Correctly identify Raja 10 times as Rani.',
    tier: 'Epic',
    category: 'Modern Mode',
    xpReward: 300,
    coinReward: 600,
    progressTotal: 10,
    iconSrc: '/assets/achievements/queens_intuition.png',
  },
  {
    id: 'ach-15',
    code: 'ESCAPE_ARTIST',
    title: 'Escape Artist',
    description: 'Escape 20 times as Thief in Modern Kingdom Mode.',
    tier: 'Rare',
    category: 'Modern Mode',
    xpReward: 250,
    coinReward: 500,
    progressTotal: 20,
    iconSrc: '/assets/achievements/escape_artist.png',
  },
  {
    id: 'ach-16',
    code: 'TRUSTED_WITNESS',
    title: 'Trusted Witness',
    description: 'Earn 20 Witness / Insight Bonuses as Villager.',
    tier: 'Rare',
    category: 'Modern Mode',
    xpReward: 200,
    coinReward: 400,
    progressTotal: 20,
    iconSrc: '/assets/achievements/trusted_witness.png',
  },
  {
    id: 'ach-17',
    code: 'ROYAL_GUARDIAN',
    title: 'Royal Guardian',
    description: 'Successfully protect 20 kingdom members as Mantri.',
    tier: 'Epic',
    category: 'Modern Mode',
    xpReward: 300,
    coinReward: 600,
    progressTotal: 20,
    iconSrc: '/assets/achievements/royal_guardian.png',
  },
  {
    id: 'ach-18',
    code: 'KINGDOM_SAVIOR',
    title: 'Kingdom Savior',
    description: 'Win 50 Modern Kingdom Mode matches.',
    tier: 'Legendary',
    category: 'Modern Mode',
    xpReward: 500,
    coinReward: 1000,
    progressTotal: 50,
    iconSrc: '/assets/achievements/kingdom_savior.png',
  },
];

export const AchievementsView: React.FC<AchievementsViewProps> = ({ userAchievements = [], userStats }) => {
  const [activeStatusFilter, setActiveStatusFilter] = useState<'All' | 'Unlocked' | 'Locked'>('All');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'rarity' | 'title' | 'reward'>('rarity');
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  const carouselRef = useRef<HTMLDivElement>(null);

  // Extract user metrics dynamically from userStats & userAchievements API response
  const overallStats = userStats?.overallStats || {};
  const detectiveStats = userStats?.detectiveChallenge || {};
  const roleStats = userStats?.roleStats || {};
  const policeRole = roleStats.police || {};
  const thiefRole = roleStats.thief || {};

  const totalGames = overallStats.totalGames || detectiveStats.gamesPlayed || 0;
  const totalWins = overallStats.totalWins || detectiveStats.gamesWon || 0;
  const longestStreak = Math.max(
    overallStats.longestWinStreak || 0,
    detectiveStats.longestStreak || 0,
    userStats?.records?.longestWinStreak || 0
  );

  // Compute unlock status & progress for each achievement dynamically based on API response
  const achievements: AchievementItem[] = DEFAULT_ACHIEVEMENTS_TEMPLATE.map((template) => {
    const dbAch = userAchievements.find(
      (u) =>
        u.code === template.code ||
        (u.code === 'FIRST_GAME' && template.code === 'FIRST_STEPS') ||
        (u.code === 'FIRST_WIN' && template.code === 'VICTORIOUS') ||
        (u.code === 'MASTER_DETECTIVE_ACH' && template.code === 'MASTER_DETECTIVE') ||
        u.title?.toLowerCase() === template.title.toLowerCase()
    );

    let isUnlocked = !!dbAch;
    let unlockedAt = dbAch?.unlockedAt
      ? new Date(dbAch.unlockedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : undefined;

    let progressCurrent = 0;

    switch (template.code) {
      case 'FIRST_STEPS':
        progressCurrent = Math.min(1, totalGames);
        if (totalGames >= 1) isUnlocked = true;
        break;
      case 'VICTORIOUS':
        progressCurrent = Math.min(1, totalWins);
        if (totalWins >= 1) isUnlocked = true;
        break;
      case 'MASTER_DETECTIVE':
        progressCurrent = Math.min(5, detectiveStats.gamesWon || policeRole.correctCatches || 0);
        if ((detectiveStats.overallAccuracy >= 80 || policeRole.accuracy >= 80) && progressCurrent >= 5) {
          isUnlocked = true;
        }
        break;
      case 'SHARP_SHOOTER':
        progressCurrent = Math.min(10, policeRole.correctCatches || detectiveStats.gamesWon || 0);
        if (progressCurrent >= 10) isUnlocked = true;
        break;
      case 'GHOST_HUNTER':
        progressCurrent = detectiveStats.fastestGuessTime && detectiveStats.fastestGuessTime <= 5 ? 1 : 0;
        if (progressCurrent >= 1) isUnlocked = true;
        break;
      case 'GHOST_THIEF':
        progressCurrent = Math.min(10, thiefRole.escaped || 0);
        if (progressCurrent >= 10) isUnlocked = true;
        break;
      case 'SHADOW_ESCAPE':
        progressCurrent = Math.min(25, thiefRole.escaped || 0);
        if (progressCurrent >= 25) isUnlocked = true;
        break;
      case 'OBSERVATION_KING':
        progressCurrent = Math.min(3, detectiveStats.gamesPlayed || 0);
        if ((detectiveStats.overallAccuracy >= 70 || policeRole.accuracy >= 70) && progressCurrent >= 3) {
          isUnlocked = true;
        }
        break;
      case 'SPEED_DETECTIVE':
        progressCurrent = Math.min(15, detectiveStats.gamesWon || 0);
        if (progressCurrent >= 15) isUnlocked = true;
        break;
      case 'ULTIMATE_DETECTIVE':
        progressCurrent = Math.min(100, totalWins);
        if (totalWins >= 100) isUnlocked = true;
        break;
      case 'ROYAL_SOVEREIGN':
        progressCurrent = Math.min(5000, userStats?.classicMode?.totalPointsEarned || userStats?.overallStats?.totalScore || 0);
        if (progressCurrent >= 5000) isUnlocked = true;
        break;
      case 'RAJAS_BOUNTY':
        progressCurrent = Math.min(10, userStats?.roleStats?.raja?.timesAssigned || 0);
        if (progressCurrent >= 10) isUnlocked = true;
        break;
      case 'ROYAL_GENIUS':
        progressCurrent = Math.min(10, userStats?.modernMode?.correctRajaGuesses || 0);
        if (progressCurrent >= 10 || isUnlocked) isUnlocked = true;
        break;
      case 'QUEENS_INTUITION':
        progressCurrent = Math.min(10, userStats?.modernMode?.correctRaniGuesses || 0);
        if (progressCurrent >= 10 || isUnlocked) isUnlocked = true;
        break;
      case 'ESCAPE_ARTIST':
        progressCurrent = Math.min(20, userStats?.modernMode?.thiefEscapes || 0);
        if (progressCurrent >= 20 || isUnlocked) isUnlocked = true;
        break;
      case 'TRUSTED_WITNESS':
        progressCurrent = Math.min(20, (userStats?.modernMode?.villagerWitnessBonuses || 0) + (userStats?.modernMode?.villagerInsightBonuses || 0));
        if (progressCurrent >= 20 || isUnlocked) isUnlocked = true;
        break;
      case 'ROYAL_GUARDIAN':
        progressCurrent = Math.min(20, userStats?.modernMode?.mantriShieldSuccesses || 0);
        if (progressCurrent >= 20 || isUnlocked) isUnlocked = true;
        break;
      case 'KINGDOM_SAVIOR':
        progressCurrent = Math.min(50, userStats?.modernMode?.gamesWon || 0);
        if (progressCurrent >= 50 || isUnlocked) isUnlocked = true;
        break;
    }

    if (isUnlocked && !unlockedAt) {
      unlockedAt = 'Unlocked';
    }

    return {
      ...template,
      isUnlocked,
      unlockedAt,
      progressCurrent,
    };
  });

  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;
  const totalCount = achievements.length;
  const completionPercentage = ((unlockedCount / totalCount) * 100).toFixed(1);

  const achievementXpEarned = achievements
    .filter((a) => a.isUnlocked)
    .reduce((sum, a) => sum + a.xpReward, 0);
  const totalXpEarned =
    typeof userStats?.xp === 'number' && userStats.xp > 0
      ? userStats.xp
      : (detectiveStats.xp || 0) + achievementXpEarned;

  const legendaryCount = achievements.filter((a) => a.tier === 'Legendary');
  const legendaryUnlocked = legendaryCount.filter((a) => a.isUnlocked).length;

  const epicCount = achievements.filter((a) => a.tier === 'Epic');
  const epicUnlocked = epicCount.filter((a) => a.isUnlocked).length;

  const rareCount = achievements.filter((a) => a.tier === 'Rare');
  const rareUnlocked = rareCount.filter((a) => a.isUnlocked).length;

  const commonCount = achievements.filter((a) => a.tier === 'Common');
  const commonUnlocked = commonCount.filter((a) => a.isUnlocked).length;

  const filteredAchievements = achievements.filter((ach) => {
    if (activeStatusFilter === 'Unlocked' && !ach.isUnlocked) return false;
    if (activeStatusFilter === 'Locked' && ach.isUnlocked) return false;

    if (activeCategoryFilter !== 'All') {
      if (ach.category !== activeCategoryFilter && ach.category !== 'General') {
        return false;
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return ach.title.toLowerCase().includes(q) || ach.description.toLowerCase().includes(q);
    }

    return true;
  });

  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    // Primary sort: Unlocked achievements show first
    if (a.isUnlocked !== b.isUnlocked) {
      return a.isUnlocked ? -1 : 1;
    }

    // Secondary sort: Common -> Rare -> Epic -> Legendary
    if (sortBy === 'rarity') {
      const tierRank: Record<string, number> = { Common: 1, Rare: 2, Epic: 3, Legendary: 4, Secret: 5 };
      const rankA = tierRank[a.tier] ?? 99;
      const rankB = tierRank[b.tier] ?? 99;
      if (rankA !== rankB) {
        return rankA - rankB;
      }
      return a.title.localeCompare(b.title);
    }

    if (sortBy === 'reward') {
      return b.xpReward - a.xpReward;
    }
    return a.title.localeCompare(b.title);
  });

  // Carousel navigation handlers for mobile view
  const handleCarouselScroll = () => {
    if (!carouselRef.current) return;
    const container = carouselRef.current;
    const firstChild = container.children[0] as HTMLElement;
    if (!firstChild) return;
    const cardWidth = firstChild.offsetWidth + 12; // width + gap (gap-3 = 12px)
    if (cardWidth <= 0) return;
    const index = Math.round(container.scrollLeft / cardWidth);
    setActiveCardIndex(Math.min(Math.max(0, index), Math.max(0, sortedAchievements.length - 1)));
  };

  const scrollToCard = (index: number) => {
    if (!carouselRef.current) return;
    const container = carouselRef.current;
    const child = container.children[index] as HTMLElement;
    if (child) {
      child.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      setActiveCardIndex(index);
    }
  };

  const handlePrevCard = () => {
    const newIdx = Math.max(0, activeCardIndex - 1);
    scrollToCard(newIdx);
  };

  const handleNextCard = () => {
    const newIdx = Math.min(sortedAchievements.length - 1, activeCardIndex + 1);
    scrollToCard(newIdx);
  };

  const getTierStyles = (tier: AchievementItem['tier'], isUnlocked: boolean) => {
    switch (tier) {
      case 'Legendary':
        return {
          cardBg: isUnlocked
            ? 'bg-gradient-to-b from-[#2E1906]/95 via-[#1D0C3A]/95 to-[#0F0422]'
            : 'bg-[#180B35]/80',
          border: isUnlocked ? 'border-amber-400' : 'border-amber-500/30',
          shadow: isUnlocked ? 'shadow-[0_0_30px_rgba(245,158,11,0.3)]' : 'shadow-md',
          badgeBg: 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950',
          titleColor: isUnlocked ? 'text-amber-300' : 'text-amber-200/80',
          progressBar: 'bg-gradient-to-r from-amber-500 to-yellow-400',
        };
      case 'Epic':
        return {
          cardBg: isUnlocked
            ? 'bg-gradient-to-b from-[#2A0845]/95 via-[#1D0C3A]/95 to-[#0F0422]'
            : 'bg-[#180B35]/80',
          border: isUnlocked ? 'border-purple-500' : 'border-purple-500/30',
          shadow: isUnlocked ? 'shadow-[0_0_25px_rgba(168,85,247,0.3)]' : 'shadow-md',
          badgeBg: 'bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white',
          titleColor: isUnlocked ? 'text-purple-300' : 'text-purple-200/80',
          progressBar: 'bg-gradient-to-r from-purple-500 to-fuchsia-400',
        };
      case 'Rare':
        return {
          cardBg: isUnlocked
            ? 'bg-gradient-to-b from-[#0A2647]/95 via-[#1D0C3A]/95 to-[#0F0422]'
            : 'bg-[#180B35]/80',
          border: isUnlocked ? 'border-cyan-400' : 'border-cyan-500/30',
          shadow: isUnlocked ? 'shadow-[0_0_25px_rgba(34,211,238,0.3)]' : 'shadow-md',
          badgeBg: 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950',
          titleColor: isUnlocked ? 'text-cyan-300' : 'text-cyan-200/80',
          progressBar: 'bg-gradient-to-r from-cyan-400 to-blue-500',
        };
      case 'Common':
        return {
          cardBg: isUnlocked
            ? 'bg-gradient-to-b from-[#0B2B1B]/95 via-[#1D0C3A]/95 to-[#0F0422]'
            : 'bg-[#180B35]/80',
          border: isUnlocked ? 'border-emerald-500' : 'border-emerald-500/30',
          shadow: isUnlocked ? 'shadow-[0_0_20px_rgba(16,185,129,0.25)]' : 'shadow-md',
          badgeBg: 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950',
          titleColor: isUnlocked ? 'text-emerald-300' : 'text-emerald-200/80',
          progressBar: 'bg-gradient-to-r from-emerald-400 to-teal-400',
        };
      default:
        return {
          cardBg: 'bg-[#150B2D]/90',
          border: 'border-slate-700',
          shadow: 'shadow-lg',
          badgeBg: 'bg-slate-800 text-slate-400',
          titleColor: 'text-slate-300',
          progressBar: 'bg-slate-600',
        };
    }
  };

  const renderCard = (ach: AchievementItem) => {
    const styles = getTierStyles(ach.tier, ach.isUnlocked);
    return (
      <div
        key={ach.id}
        className={`relative rounded-3xl p-5 border-2 ${styles.cardBg} ${styles.border} ${styles.shadow} flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 group h-full`}
      >
        {/* Top Tier Badge & Lock / Unlock Status */}
        <div className="flex items-center justify-between mb-3">
          <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${styles.badgeBg}`}>
            {ach.tier}
          </span>

          {ach.isUnlocked ? (
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.4)]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-slate-800/80 border border-slate-600 flex items-center justify-center text-slate-400">
              <Lock className="w-3.5 h-3.5" />
            </div>
          )}
        </div>

        {/* Glowing Achievement Badge Icon */}
        <div className="flex flex-col items-center text-center my-2">
          <div className="mb-3">
            <AchievementBadgeIcon code={ach.code} tier={ach.tier} isUnlocked={ach.isUnlocked} size="w-20 h-20" />
          </div>

          <h4 className={`text-base font-black tracking-wide ${styles.titleColor}`}>
            {ach.title}
          </h4>

          <p className="text-xs text-purple-200/80 mt-1 leading-relaxed line-clamp-2 min-h-[36px]">
            {ach.description}
          </p>
        </div>

        {/* Rewards & Progress Section */}
        <div className="mt-4 pt-3 border-t border-[#3A1C61]/80 space-y-2">
          {ach.isUnlocked ? (
            <div className="flex flex-col items-center justify-center space-y-1">
              <div className="flex items-center space-x-2 text-xs font-bold">
                <span className="text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-0.5 rounded-md">
                  +{ach.xpReward} XP
                </span>
              </div>
              {ach.unlockedAt && (
                <p className="text-[10px] text-emerald-400/90 font-bold italic flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>{ach.unlockedAt === 'Unlocked' ? 'Completed & Unlocked' : `Unlocked on ${ach.unlockedAt}`}</span>
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              {ach.progressTotal && ach.progressCurrent !== undefined && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-purple-300">Progress</span>
                    <span className="text-cyan-300">
                      {ach.progressCurrent} / {ach.progressTotal}
                    </span>
                  </div>
                  <div className="w-full bg-[#0E0422] h-2 rounded-full overflow-hidden border border-[#3A1C61]">
                    <div
                      className={`h-full ${styles.progressBar} transition-all duration-500`}
                      style={{ width: `${Math.min(100, (ach.progressCurrent / ach.progressTotal) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
              <div className="flex items-center justify-center space-x-2 text-[11px] font-bold pt-1">
                <span className="text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-0.5 rounded-md">
                  +{ach.xpReward} XP
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Top 4 Summary Cards Header - FULLY RESPONSIVE */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Achievements Unlocked Card */}
        <div className="bg-[#180B35]/95 border border-[#3A1C61] p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
            <Trophy className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <div className="flex-1 w-full">
            <p className="text-[10px] sm:text-[11px] font-bold text-purple-300 uppercase tracking-wider">Unlocked</p>
            <p className="text-lg sm:text-2xl font-black text-white mt-0.5">
              {unlockedCount} <span className="text-purple-400 text-xs sm:text-base font-normal">/ {totalCount}</span>
            </p>
            <div className="w-full bg-[#0E0422] h-1 sm:h-1.5 rounded-full mt-1.5 sm:mt-2 overflow-hidden border border-[#3A1C61]">
              <div
                className="bg-gradient-to-r from-amber-400 to-yellow-300 h-full rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <p className="text-[9px] sm:text-[10px] text-purple-300 font-semibold mt-1">{completionPercentage}% Completed</p>
          </div>
        </div>

        {/* Total XP Earned Card */}
        <div className="bg-[#180B35]/95 border border-[#3A1C61] p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_15px_rgba(34,211,238,0.3)]">
            <Star className="w-4 h-4 sm:w-6 sm:h-6 fill-cyan-400" />
          </div>
          <div className="flex-1 w-full">
            <p className="text-[10px] sm:text-[11px] font-bold text-purple-300 uppercase tracking-wider">Total XP</p>
            <p className="text-lg sm:text-2xl font-black text-cyan-300 mt-0.5">{totalXpEarned.toLocaleString()} XP</p>
            <div className="w-full bg-[#0E0422] h-1 sm:h-1.5 rounded-full mt-1.5 sm:mt-2 overflow-hidden border border-[#3A1C61]">
              <div
                className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (totalXpEarned / 1000) * 100)}%` }}
              />
            </div>
            <p className="text-[9px] sm:text-[10px] text-cyan-200/80 font-semibold mt-1">Level {userStats?.playerLevel || 1} Detective</p>
          </div>
        </div>

        {/* Categories Card */}
        <div className="bg-[#180B35]/95 border border-[#3A1C61] p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            <Target className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold text-purple-300 uppercase tracking-wider">Categories</p>
            <p className="text-lg sm:text-2xl font-black text-white mt-0.5">5</p>
            <p className="text-[9px] sm:text-[11px] text-purple-300 mt-0.5 sm:mt-1 italic">Classic, Modern &amp; Detective</p>
          </div>
        </div>

        {/* Longest Streak Card */}
        <div className="bg-[#180B35]/95 border border-[#3A1C61] p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 shadow-[0_0_15px_rgba(244,63,94,0.3)]">
            <Flame className="w-4 h-4 sm:w-6 sm:h-6 fill-rose-500" />
          </div>
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold text-purple-300 uppercase tracking-wider">Streak</p>
            <p className="text-lg sm:text-2xl font-black text-amber-400 mt-0.5">{longestStreak} {longestStreak === 1 ? 'Win' : 'Wins'}</p>
            <p className="text-[9px] sm:text-[11px] text-purple-300 mt-0.5 sm:mt-1 italic">Keep it going!</p>
          </div>
        </div>
      </div>

      {/* Status & Category Filter Pills + Search & Sort Toolbar - MOBILE RESPONSIVE */}
      <div className="bg-[#180B35]/90 border border-[#3A1C61] p-3 sm:p-4 rounded-2xl sm:rounded-3xl shadow-xl space-y-3 sm:space-y-4 max-w-full overflow-hidden">
        {/* Horizontal Scrollable Filter Chips */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1 max-w-full touch-pan-x">
          {(['All', 'Unlocked', 'Locked'] as const).map((status) => (
            <button
              key={status}
              onClick={() => {
                setActiveStatusFilter(status);
                setActiveCardIndex(0);
              }}
              className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-md shrink-0 cursor-pointer ${
                activeStatusFilter === status
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-500/30'
                  : 'bg-[#11052C] border border-[#3A1C61] text-purple-300 hover:text-white hover:border-purple-400'
              }`}
            >
              {status}
            </button>
          ))}

          <div className="w-px h-5 bg-[#3A1C61] mx-1 shrink-0" />

          {[
            { id: 'Classic Mode', label: '👑 Classic Mode' },
            { id: 'Modern Mode', label: '🏰 Modern Mode' },
            { id: 'Detective Challenge', label: '🔍 Detective Challenge' },
            { id: 'General', label: '⭐ General' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategoryFilter(activeCategoryFilter === cat.id ? 'All' : cat.id);
                setActiveCardIndex(0);
              }}
              className={`px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeCategoryFilter === cat.id
                  ? 'bg-cyan-500 text-slate-950 shadow-cyan-400/30'
                  : 'bg-[#11052C] border border-[#3A1C61] text-purple-300 hover:text-white hover:border-cyan-500'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Box & Sort Selector - MOBILE FLEX */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setActiveCardIndex(0);
              }}
              placeholder="Search achievements..."
              className="w-full bg-[#11052C] border border-[#3A1C61] focus:border-cyan-400 text-white text-xs pl-9 pr-4 py-2 rounded-xl focus:outline-none transition-all placeholder:text-purple-400/60"
            />
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 text-xs bg-[#11052C] sm:bg-transparent p-2 sm:p-0 rounded-xl border border-[#3A1C61] sm:border-none">
            <span className="text-purple-300 font-semibold shrink-0">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-[#180B35] sm:bg-[#11052C] border border-[#3A1C61] text-purple-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              <option value="rarity">Rarity (Common to Legendary)</option>
              <option value="title">Title (A-Z)</option>
              <option value="reward">Reward (High to Low)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Achievement Tier Progress Breakdown - MOBILE RESPONSIVE */}
      <div className="space-y-3">
        <h3 className="text-sm sm:text-base font-black text-white tracking-wide">Achievement Progress</h3>

        {/* Tier Cards Row: Horizontal Scroll on Mobile, 5-Col Grid on Desktop */}
        <div className="flex sm:grid sm:grid-cols-5 overflow-x-auto scrollbar-none gap-2.5 sm:gap-3 pb-1 -mx-1 px-1 touch-pan-x">
          {/* Legendary Tier */}
          <div className="w-[135px] sm:w-auto shrink-0 bg-[#180B35] border border-amber-500/40 p-2.5 sm:p-3 rounded-2xl flex flex-col justify-between space-y-1.5 sm:space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-400 flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Legendary</span>
              </span>
              <span className="text-[11px] font-bold text-amber-200">{legendaryUnlocked} / {legendaryCount.length}</span>
            </div>
            <div className="w-full bg-[#0E0422] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-400 h-full transition-all duration-500"
                style={{ width: `${legendaryCount.length > 0 ? (legendaryUnlocked / legendaryCount.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Epic Tier */}
          <div className="w-[135px] sm:w-auto shrink-0 bg-[#180B35] border border-purple-500/40 p-2.5 sm:p-3 rounded-2xl flex flex-col justify-between space-y-1.5 sm:space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-purple-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Epic</span>
              </span>
              <span className="text-[11px] font-bold text-purple-200">{epicUnlocked} / {epicCount.length}</span>
            </div>
            <div className="w-full bg-[#0E0422] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-purple-500 h-full transition-all duration-500"
                style={{ width: `${epicCount.length > 0 ? (epicUnlocked / epicCount.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Rare Tier */}
          <div className="w-[135px] sm:w-auto shrink-0 bg-[#180B35] border border-cyan-500/40 p-2.5 sm:p-3 rounded-2xl flex flex-col justify-between space-y-1.5 sm:space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-cyan-300 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>Rare</span>
              </span>
              <span className="text-[11px] font-bold text-cyan-200">{rareUnlocked} / {rareCount.length}</span>
            </div>
            <div className="w-full bg-[#0E0422] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-cyan-400 h-full transition-all duration-500"
                style={{ width: `${rareCount.length > 0 ? (rareUnlocked / rareCount.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Common Tier */}
          <div className="w-[135px] sm:w-auto shrink-0 bg-[#180B35] border border-emerald-500/40 p-2.5 sm:p-3 rounded-2xl flex flex-col justify-between space-y-1.5 sm:space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-300 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                <span>Common</span>
              </span>
              <span className="text-[11px] font-bold text-emerald-200">{commonUnlocked} / {commonCount.length}</span>
            </div>
            <div className="w-full bg-[#0E0422] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-400 h-full transition-all duration-500"
                style={{ width: `${commonCount.length > 0 ? (commonUnlocked / commonCount.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Secret Tier */}
          <div className="w-[135px] sm:w-auto shrink-0 bg-[#180B35] border border-slate-700/60 p-2.5 sm:p-3 rounded-2xl flex flex-col justify-between space-y-1.5 sm:space-y-2 opacity-70">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-400 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Secret</span>
              </span>
              <span className="text-[11px] font-bold text-slate-400">0 / 8</span>
            </div>
            <div className="w-full bg-[#0E0422] h-1.5 rounded-full overflow-hidden">
              <div className="bg-slate-600 h-full w-0" />
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {sortedAchievements.length === 0 && (
        <div className="bg-[#180B35]/90 border border-[#3A1C61] p-8 rounded-3xl text-center space-y-3">
          <Lock className="w-10 h-10 text-purple-400/50 mx-auto" />
          <h4 className="text-base font-bold text-white">No achievements found</h4>
          <p className="text-xs text-purple-300">Try adjusting your status filter or search term.</p>
        </div>
      )}

      {/* MOBILE VIEW: CAROUSEL WITH PREV / NEXT NAV & DOTS */}
      {sortedAchievements.length > 0 && (
        <div className="space-y-3 sm:hidden">
          {/* Carousel Control Bar */}
          <div className="flex items-center justify-between bg-[#180B35]/90 border border-[#3A1C61] px-4 py-2.5 rounded-2xl shadow-lg">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                Card <span className="text-white font-black">{activeCardIndex + 1}</span> of {sortedAchievements.length}
              </span>
              {sortedAchievements[activeCardIndex] && (
                <span className="text-[10px] text-cyan-300 bg-cyan-950/80 border border-cyan-500/40 px-2 py-0.5 rounded-full font-bold">
                  {sortedAchievements[activeCardIndex].tier}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrevCard}
                disabled={activeCardIndex === 0}
                className="w-8 h-8 rounded-full bg-[#11052C] border border-[#3A1C61] flex items-center justify-center text-purple-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer"
                aria-label="Previous achievement card"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextCard}
                disabled={activeCardIndex === sortedAchievements.length - 1}
                className="w-8 h-8 rounded-full bg-[#11052C] border border-[#3A1C61] flex items-center justify-center text-purple-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer"
                aria-label="Next achievement card"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Swipeable Carousel Track */}
          <div
            ref={carouselRef}
            onScroll={handleCarouselScroll}
            className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none gap-3 py-1 -mx-4 px-4 scroll-smooth"
          >
            {sortedAchievements.map((ach) => (
              <div key={`mob-${ach.id}`} className="w-[84vw] shrink-0 snap-center">
                {renderCard(ach)}
              </div>
            ))}
          </div>

          {/* Carousel Dot Indicators */}
          {sortedAchievements.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 pt-1">
              {sortedAchievements.map((ach, idx) => (
                <button
                  key={`dot-${ach.id}`}
                  onClick={() => scrollToCard(idx)}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    idx === activeCardIndex
                      ? 'w-6 h-2 bg-gradient-to-r from-cyan-400 to-purple-500'
                      : 'w-2 h-2 bg-purple-900/60 border border-purple-500/30'
                  }`}
                  aria-label={`Go to card ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* DESKTOP VIEW: 5-COLUMN GRID LAYOUT */}
      {sortedAchievements.length > 0 && (
        <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {sortedAchievements.map((ach) => (
            <div key={`desk-${ach.id}`} className="h-full">
              {renderCard(ach)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
