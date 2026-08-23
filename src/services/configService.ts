const API_BASE_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

export interface ScreenTexts {
  welcome: {
    heroTitle: string;
    heroSubtext: string;
    featureSubtext: string;
    whyLoveTitle: string;
    charactersTitle: string;
    gameModesTitle: string;
    ctaTitle: string;
  };
  gameInfo: {
    title: string;
    subtitle: string;
    classicRules: string;
    detectiveRules: string;
    modernRules: string;
  };
  homePage: {
    welcomeTitle: string;
    welcomeSubtext: string;
  };
  maintenance: {
    title: string;
    message: string;
  };
}

export interface PointsRules {
  raja: number;
  rani: number;
  policeCorrect: number;
  policeWrong: number;
  thiefEscaped: number;
  thiefCaught: number;
  mantriShieldBonus: number;
  villagerWitnessBonus: number;
  detectiveCorrectGuess: number;
}

export interface SystemSettings {
  maintenanceMode: boolean;
  allowGuestLogin: boolean;
  maxPlayersPerRoom: number;
  defaultGameMode: string;
  announcement: string;
  detectiveEnabled: boolean;
  modernEnabled: boolean;
  detectiveButtonText: string;
  modernButtonText: string;
}

export interface FullSystemConfig {
  screenTexts?: ScreenTexts;
  pointsRules?: PointsRules;
  systemSettings?: SystemSettings;
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
  announcement?: string;
}

export const defaultConfig: FullSystemConfig = {
  screenTexts: {
    welcome: {
      heroTitle: "THE CLASSIC PLAYGROUND GAME,\nNOW A THRILLING DIGITAL SHOWDOWN!",
      heroSubtext: "Strategy, bluff and deduction come together in this timeless game of kingdoms and secrets.",
      featureSubtext: "Quick Match • No Download • Play Anywhere",
      whyLoveTitle: "Why You'll Love It?",
      charactersTitle: "Meet the Characters",
      gameModesTitle: "Game Modes",
      ctaTitle: "READY TO RULE THE KINGDOM?",
    },
    gameInfo: {
      title: "Game Rules & Info",
      subtitle: "Master the strategy, understand the scoring, and dominate the kingdom!",
      classicRules: "Each player picks a secret card. The Police must guess who holds the Thief card. Correct guess yields 500 points to Police. Wrong guess yields 800 points to Thief!",
      detectiveRules: "Analyze clues, suspect statements, and crime scene logs to uncover the criminal before time runs out!",
      modernRules: "Play with 6 Kingdom Roles: Raja, Rani, Mantri, Police, Thief, and Villager with shield abilities and witness bonuses!",
    },
    homePage: {
      welcomeTitle: "Raja Rani Police Thief",
      welcomeSubtext: "Select a game mode or create a private room to start playing with friends!",
    },
    maintenance: {
      title: "Under Scheduled Maintenance",
      message: "The server is currently under scheduled maintenance. Please check back shortly!",
    },
  },
  pointsRules: {
    raja: 1000,
    rani: 800,
    policeCorrect: 500,
    policeWrong: 0,
    thiefEscaped: 800,
    thiefCaught: 0,
    mantriShieldBonus: 100,
    villagerWitnessBonus: 100,
    detectiveCorrectGuess: 500,
  },
  systemSettings: {
    maintenanceMode: false,
    allowGuestLogin: true,
    maxPlayersPerRoom: 10,
    defaultGameMode: "CLASSIC_POINTS",
    announcement: "",
    detectiveEnabled: false,
    modernEnabled: false,
    detectiveButtonText: "Coming Soon",
    modernButtonText: "Coming Soon",
  },
};

type ConfigSubscriber = (config: FullSystemConfig) => void;

class ConfigService {
  private currentConfig: FullSystemConfig = defaultConfig;
  private subscribers: Set<ConfigSubscriber> = new Set();
  private fetched: boolean = false;

  async fetchPublicConfig(): Promise<FullSystemConfig> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/config`);
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          this.updateConfig(data.config);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch dynamic config from server, using defaults:", err);
    }
    this.fetched = true;
    return this.currentConfig;
  }

  getConfig(): FullSystemConfig {
    if (!this.fetched) {
      this.fetchPublicConfig();
    }
    return this.currentConfig;
  }

  updateConfig(newConfig: Partial<FullSystemConfig>) {
    this.currentConfig = {
      ...this.currentConfig,
      ...newConfig,
      screenTexts: {
        welcome: { ...defaultConfig.screenTexts!.welcome, ...this.currentConfig.screenTexts?.welcome, ...newConfig.screenTexts?.welcome },
        gameInfo: { ...defaultConfig.screenTexts!.gameInfo, ...this.currentConfig.screenTexts?.gameInfo, ...newConfig.screenTexts?.gameInfo },
        homePage: { ...defaultConfig.screenTexts!.homePage, ...this.currentConfig.screenTexts?.homePage, ...newConfig.screenTexts?.homePage },
        maintenance: { ...defaultConfig.screenTexts!.maintenance, ...this.currentConfig.screenTexts?.maintenance, ...newConfig.screenTexts?.maintenance },
      },
      pointsRules: { ...defaultConfig.pointsRules!, ...this.currentConfig.pointsRules, ...newConfig.pointsRules },
      systemSettings: { ...defaultConfig.systemSettings!, ...this.currentConfig.systemSettings, ...newConfig.systemSettings },
    };
    this.notifySubscribers();
  }

  subscribe(callback: ConfigSubscriber): () => void {
    this.subscribers.add(callback);
    callback(this.currentConfig);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers() {
    this.subscribers.forEach((cb) => cb(this.currentConfig));
  }
}

export const configService = new ConfigService();
