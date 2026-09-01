import mongoose from "mongoose";
import User from "../../models/User.js";
import DetectiveChallengeRound from "../../models/detectiveChallenge/DetectiveChallengeRound.js";
import DetectiveChallengeMatch from "../../models/detectiveChallenge/DetectiveChallengeMatch.js";
import DetectiveChallengeAchievement from "../../models/detectiveChallenge/DetectiveChallengeAchievement.js";
import { DetectiveChallengeStatsService } from "./DetectiveChallengeStatsService.js";
import { DetectiveChallengeBadgeService } from "./DetectiveChallengeBadgeService.js";
import { DetectiveChallengeLeaderboardService } from "./DetectiveChallengeLeaderboardService.js";
import GuestTrackingService from "../GuestTrackingService.js";

const SUSPECT_CHARACTERS = [
  {
    id: "suspect-1",
    name: "Arjun Kumar",
    occupation: "College Student",
    personality: "Friendly, curious, energetic",
    gifName: "college student.gif",
    avatar: "1",
    expression: "curious",
    speechBubbles: [
      "I just finished my classes.",
      "I'm waiting for my friend.",
      "I was checking my phone.",
      "You look more suspicious than me.",
      "I didn't notice anything unusual.",
      "Maybe ask someone else.",
      "I've been here since morning.",
      "That's a strange accusation.",
      "I think you're overthinking.",
      "Trust your instincts, not appearances.",
      "I'm just passing through.",
      "Wrong guess!"
    ]
  },
  {
    id: "suspect-2",
    name: "Ravi Prakash",
    occupation: "Barber",
    personality: "Confident, friendly, observant",
    gifName: "Barber.gif",
    avatar: "2",
    expression: "observant",
    speechBubbles: [
      "I was cutting someone's hair.",
      "The shop has been busy all day.",
      "Customers can confirm where I was.",
      "You picked the wrong person.",
      "I'm only holding scissors for work.",
      "Relax, I'm innocent.",
      "Everyone visits my shop.",
      "Maybe the real thief is smiling.",
      "Don't judge by appearances.",
      "You're wasting valuable time.",
      "I've got nothing to hide.",
      "Interesting choice."
    ]
  },
  {
    id: "suspect-3",
    name: "Karthik Vel",
    occupation: "Mechanic",
    personality: "Hardworking, cheerful, unpredictable",
    gifName: "Mechanic.gif",
    avatar: "3",
    expression: "cheerful",
    speechBubbles: [
      "I was repairing an engine.",
      "Grease doesn't make me guilty.",
      "I've been busy all day.",
      "Ask the workshop owner.",
      "Wrong suspect.",
      "Maybe someone fooled you.",
      "I only fix machines.",
      "That's not enough evidence.",
      "You're looking in the wrong place.",
      "I haven't gone anywhere.",
      "Think carefully before accusing.",
      "Nice try."
    ]
  },
  {
    id: "suspect-4",
    name: "Murugan Iyer",
    occupation: "Grocery Shop Owner",
    personality: "Calm, polite, practical",
    gifName: "Grocery Shop owner.gif",
    avatar: "4",
    expression: "calm",
    speechBubbles: [
      "I was serving customers.",
      "My shop has security cameras.",
      "Everyone knows me here.",
      "I've been counting inventory.",
      "You should investigate further.",
      "Maybe check the next suspect.",
      "I'm too busy to cause trouble.",
      "That's a bold accusation.",
      "Evidence matters more than guesses.",
      "I've seen many people today.",
      "I'm just doing my job.",
      "Think twice."
    ]
  },
  {
    id: "suspect-5",
    name: "Selvam Raj",
    occupation: "Tea Shop Owner",
    personality: "Talkative, humorous, clever",
    gifName: "Tea Shop Owner.gif",
    avatar: "5",
    expression: "clever",
    speechBubbles: [
      "Tea solves everything.",
      "I've been making tea all day.",
      "Half the town was at my shop.",
      "Want tea before accusing me?",
      "Maybe the thief had tea too.",
      "You look confused.",
      "Wrong person, detective.",
      "Don't rush your decision.",
      "Ask my regular customers.",
      "Everyone tells stories here.",
      "Think with your head, not your heart.",
      "Interesting theory."
    ]
  },
  {
    id: "suspect-6",
    name: "Naveen Sharma",
    occupation: "Office Employee",
    personality: "Smart, calm, analytical",
    gifName: "Office Employee.gif",
    avatar: "6",
    expression: "analytical",
    speechBubbles: [
      "I was working overtime.",
      "Coffee keeps me awake, not guilty.",
      "I've been in meetings all day.",
      "Check my attendance.",
      "Looks can be misleading.",
      "You almost convinced me.",
      "Think logically.",
      "Someone is distracting you.",
      "Maybe the answer is obvious.",
      "I'm just here for coffee.",
      "Trust facts, not faces.",
      "Wrong conclusion."
    ]
  }
];

export class DetectiveChallengeService {
  static generateRoundSuspects() {
    // Randomly pick 3 distinct characters
    const shuffled = [...SUSPECT_CHARACTERS].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);

    // Secretly pick 1 index as actual thief (0, 1, or 2)
    const thiefIndex = Math.floor(Math.random() * 3);

    // Assign speech bubbles & secret thief flag
    const cards = selected.map((char, index) => {
      const initialSpeech = char.speechBubbles[Math.floor(Math.random() * char.speechBubbles.length)];
      return {
        cardId: `card-${index + 1}`,
        characterId: char.id,
        name: char.name,
        gifName: char.gifName,
        occupation: char.occupation,
        personality: char.personality,
        avatar: char.avatar,
        expression: char.expression,
        speechBubbles: char.speechBubbles,
        speechBubble: initialSpeech,
        isThief: index === thiefIndex,
      };
    });

    const actualThiefCard = cards.find((c) => c.isThief);

    return {
      cards: cards.map(({ isThief, ...publicCard }) => publicCard),
      secretThiefCardId: actualThiefCard.cardId,
      actualThiefName: actualThiefCard.name,
    };
  }

  static async recordRoundResult(roundData) {
    try {
      const { roomCode, roundNumber, playerId, username, selectedCardId, actualThiefCardId, guessTime } = roundData;
      const isCorrect = selectedCardId === actualThiefCardId;

      const roundRecord = new DetectiveChallengeRound({
        roomCode,
        roundNumber,
        playerId: playerId && mongoose.Types.ObjectId.isValid(playerId) ? playerId : undefined,
        username,
        selectedCardId,
        actualThiefCardId,
        isCorrect,
        guessTime: parseFloat(Number(guessTime).toFixed(2)),
      });

      await roundRecord.save();
      return roundRecord;
    } catch (err) {
      console.error("Error in DetectiveChallengeService.recordRoundResult:", err);
      return null;
    }
  }

  static async finalizeMatch(matchData) {
    try {
      const { roomCode, totalRounds, duration, players, roundLogs } = matchData;
      if (!players || !Array.isArray(players)) return null;

      // Ranking Priority: 1. Accuracy -> 2. Correct Guesses -> 3. Avg Guess Time -> 4. Longest Streak
      const sortedPlayers = [...players].sort((a, b) => {
        const accA = a.accuracy || 0;
        const accB = b.accuracy || 0;
        if (accB !== accA) return accB - accA;

        const corrA = a.correctCount || 0;
        const corrB = b.correctCount || 0;
        if (corrB !== corrA) return corrB - corrA;

        const timeA = a.avgGuessTime || a.fastestGuess || 99;
        const timeB = b.avgGuessTime || b.fastestGuess || 99;
        if (timeA !== timeB) return timeA - timeB;

        return (b.longestStreak || 0) - (a.longestStreak || 0);
      });

      const champion = sortedPlayers[0];

      const matchPlayers = players.map((p) => {
        const pName = p.name || p.username;
        const isChamp = champion ? pName === (champion.name || champion.username) : false;
        return {
          userId: p.userId || p.id || null,
          username: pName,
          rank: sortedPlayers.findIndex((sp) => (sp.name || sp.username) === pName) + 1,
          isChampion: isChamp,
          correctCount: p.correctCount || 0,
          wrongCount: p.wrongCount || 0,
          accuracy: p.accuracy || 0,
          avgGuessTime: parseFloat(Number(p.avgGuessTime || 0).toFixed(2)),
          fastestGuess: parseFloat(Number(p.fastestGuess || 0).toFixed(2)),
          longestStreak: p.longestStreak || 0,
          badgeEarned: p.badgeEarned || "",
        };
      });

      // Save match history record
      const match = new DetectiveChallengeMatch({
        roomCode,
        totalRounds: totalRounds || 5,
        duration: duration || 0,
        championUserId: champion?.userId && mongoose.Types.ObjectId.isValid(champion.userId) ? champion.userId : undefined,
        championUsername: champion ? (champion.name || champion.username) : "None",
        players: matchPlayers,
        roundLogs: roundLogs || [],
      });
      await match.save();

      // Update statistics for all non-guest players
      for (const p of matchPlayers) {
        try {
          let user = null;
          const targetId = p.userId || p.id;
          if (targetId && mongoose.Types.ObjectId.isValid(targetId)) {
            user = await User.findById(targetId);
          }
          if (!user && p.username) {
            user = await User.findOne({ username: new RegExp(`^${String(p.username).trim()}$`, "i") });
          }

          if (!user || user.isGuest) {
            if (p.guestDeviceId) {
              GuestTrackingService.recordGuestMatchCompleted(p.guestDeviceId, p.username || p.name, "DETECTIVE_CHALLENGE").catch(() => {});
            }
            continue;
          }

          const stats = await DetectiveChallengeStatsService.updatePlayerStats(user, p, duration || 0);

          // Achievements evaluation
          if (stats) {
            await this.evaluateAchievements(user._id, stats, p);
          }
        } catch (pErr) {
          console.error(`Error updating Detective Challenge stats for ${p.username}:`, pErr);
        }
      }

      // Refresh leaderboards
      DetectiveChallengeLeaderboardService.refreshLeaderboard("highest_accuracy", 50).catch(() => {});

      return match;
    } catch (err) {
      console.error("Error in DetectiveChallengeService.finalizeMatch:", err);
      return null;
    }
  }

  static async evaluateAchievements(userId, stats, playerMatchData) {
    const candidates = [];

    if ((stats.gamesPlayed || 0) >= 1) {
      candidates.push({
        code: "DETECTIVE_FIRST_MATCH",
        title: "Detective License",
        description: "Played your first Detective Challenge match!",
        icon: "🔍",
      });
    }

    if ((stats.gamesWon || 0) >= 1) {
      candidates.push({
        code: "DETECTIVE_FIRST_WIN",
        title: "Master Sleuth",
        description: "Won your first Detective Challenge as Champion!",
        icon: "🏆",
      });
    }

    if (playerMatchData.accuracy === 100 && (playerMatchData.correctCount || 0) >= 3) {
      candidates.push({
        code: "PERFECT_INVESTIGATION",
        title: "Perfect Investigation",
        description: "100% Accuracy in a Detective Challenge match!",
        icon: "🎯",
      });
    }

    if (stats.fastestGuessTime && stats.fastestGuessTime <= 2.0) {
      candidates.push({
        code: "LIGHTNING_SLEUTH",
        title: "Lightning Sleuth",
        description: "Identified the suspect in under 2 seconds!",
        icon: "⚡",
      });
    }

    if ((stats.longestStreak || 0) >= 5) {
      candidates.push({
        code: "STREAK_KING",
        title: "Unstoppable Detective",
        description: "Achieved a 5+ round correct streak!",
        icon: "🔥",
      });
    }

    for (const ach of candidates) {
      try {
        const existing = await DetectiveChallengeAchievement.findOne({ userId, code: ach.code });
        if (!existing) {
          const created = new DetectiveChallengeAchievement({
            userId,
            ...ach,
            unlockedAt: new Date(),
          });
          await created.save();
        }
      } catch (err) {}
    }
  }
}
