import mongoose from "mongoose";

const systemConfigSchema = new mongoose.Schema(
  {
    configKey: {
      type: String,
      default: "global_config",
      unique: true,
    },
    screenTexts: {
      welcome: {
        heroTitle: {
          type: String,
          default: "THE CLASSIC PLAYGROUND GAME,\nNOW A THRILLING DIGITAL SHOWDOWN!",
        },
        heroSubtext: {
          type: String,
          default: "Strategy, bluff and deduction come together in this timeless game of kingdoms and secrets.",
        },
        featureSubtext: {
          type: String,
          default: "Quick Match • No Download • Play Anywhere",
        },
        whyLoveTitle: {
          type: String,
          default: "Why You'll Love It?",
        },
        charactersTitle: {
          type: String,
          default: "Meet the Characters",
        },
        gameModesTitle: {
          type: String,
          default: "Game Modes",
        },
        ctaTitle: {
          type: String,
          default: "READY TO RULE THE KINGDOM?",
        },
      },
      gameInfo: {
        title: {
          type: String,
          default: "Game Rules & Info",
        },
        subtitle: {
          type: String,
          default: "Master the strategy, understand the scoring, and dominate the kingdom!",
        },
        classicRules: {
          type: String,
          default: "Each player picks a secret card. The Police must guess who holds the Thief card. Correct guess yields 500 points to Police. Wrong guess yields 800 points to Thief!",
        },
        detectiveRules: {
          type: String,
          default: "Analyze clues, suspect statements, and crime scene logs to uncover the criminal before time runs out!",
        },
        modernRules: {
          type: String,
          default: "Play with 6 Kingdom Roles: Raja, Rani, Mantri, Police, Thief, and Villager with shield abilities and witness bonuses!",
        },
      },
      homePage: {
        welcomeTitle: {
          type: String,
          default: "Raja Rani Police Thief",
        },
        welcomeSubtext: {
          type: String,
          default: "Select a game mode or create a private room to start playing with friends!",
        },
      },
      maintenance: {
        title: {
          type: String,
          default: "Under Scheduled Maintenance",
        },
        message: {
          type: String,
          default: "The server is currently under scheduled maintenance. Please check back shortly!",
        },
      },
    },
    pointsRules: {
      raja: { type: Number, default: 1000 },
      rani: { type: Number, default: 800 },
      policeCorrect: { type: Number, default: 500 },
      policeWrong: { type: Number, default: 0 },
      thiefEscaped: { type: Number, default: 800 },
      thiefCaught: { type: Number, default: 0 },
      mantriShieldBonus: { type: Number, default: 100 },
      villagerWitnessBonus: { type: Number, default: 100 },
      detectiveCorrectGuess: { type: Number, default: 500 },
    },
    systemSettings: {
      maintenanceMode: { type: Boolean, default: false },
      allowGuestLogin: { type: Boolean, default: true },
      maxPlayersPerRoom: { type: Number, default: 10 },
      defaultGameMode: { type: String, default: "CLASSIC_POINTS" },
      announcement: { type: String, default: "" },
      detectiveEnabled: { type: Boolean, default: false },
      modernEnabled: { type: Boolean, default: false },
      detectiveButtonText: { type: String, default: "Coming Soon" },
      modernButtonText: { type: String, default: "Coming Soon" },
    },
  },
  { timestamps: true }
);

export default mongoose.models.SystemConfig || mongoose.model("SystemConfig", systemConfigSchema);
