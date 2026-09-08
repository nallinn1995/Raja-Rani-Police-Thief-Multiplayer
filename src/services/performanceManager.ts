/**
 * Centralized Performance, Battery, GPU, CPU, and Thermal Optimization Manager
 *
 * Implements:
 * - Dynamic adaptive render scaling based on real-time FPS & frame-time telemetry
 * - Hardware capability detection (deviceMemory, hardwareConcurrency, WebGL capabilities, mobile vs desktop)
 * - Safe DPR clamping to prevent mobile GPU overheating on high-density displays
 * - Hysteresis cooldowns to prevent rapid quality oscillation (6s downgrade, 25s upgrade)
 * - Settle-state texture update budgets and particle capacity scaling
 * - Tab visibility coordination (pausing WebGL render loops when backgrounded)
 * - Optional user quality preference persistence (AUTO, HIGH, MEDIUM, LOW, POWER_SAVER)
 * - Zero-overhead developer diagnostics via window.__RAJA_RANI_PERF__
 */

export type QualityProfile = "AUTO" | "HIGH" | "MEDIUM" | "LOW" | "POWER_SAVER";
export type EffectiveTier = "HIGH" | "MEDIUM" | "LOW" | "POWER_SAVER";

export interface DeviceCapabilities {
  isMobile: boolean;
  hardwareConcurrency: number;
  deviceMemoryGB: number;
  maxTextureSize: number;
  devicePixelRatio: number;
  prefersReducedMotion: boolean;
  recommendedInitialTier: EffectiveTier;
}

export interface PerformanceMetrics {
  currentFps: number;
  averageFps: number;
  minFps: number;
  frameTimeMs: number;
  effectiveTier: EffectiveTier;
  userProfile: QualityProfile;
  hardwareScalingLevel: number;
  renderScale: number;
  isTabVisible: boolean;
  particleBudgetMultiplier: number;
}

type QualityChangeListener = (tier: EffectiveTier, profile: QualityProfile) => void;
type VisibilityChangeListener = (isVisible: boolean) => void;

class PerformanceManager {
  private static instance: PerformanceManager;

  private userProfile: QualityProfile = "AUTO";
  private currentEffectiveTier: EffectiveTier = "MEDIUM";
  private capabilities: DeviceCapabilities;

  // FPS & Frame-time tracking (circular ring buffer without React setState overhead)
  private readonly SAMPLE_CAPACITY = 60;
  private frameTimes: Float32Array = new Float32Array(60);
  private frameIndex = 0;
  private sampleCount = 0;
  private lastFrameTimestamp = 0;

  // Evaluated stats
  private instantaneousFps = 60;
  private smoothedFps = 60;
  private lowestFps = 60;
  private lastEvaluationTime = 0;

  // Adaptive Hysteresis
  private consecutiveLowFpsEvaluations = 0;
  private consecutiveHighFpsEvaluations = 0;
  private readonly EVALUATION_INTERVAL_MS = 3000;
  private readonly LOW_FPS_THRESHOLD = 32;
  private readonly HIGH_FPS_THRESHOLD = 54;
  private readonly DOWNGRADE_COUNT_REQUIRED = 2; // ~6 seconds of sustained poor FPS
  private readonly UPGRADE_COUNT_REQUIRED = 8; // ~24 seconds of rock-solid FPS

  // Listeners
  private qualityListeners: Set<QualityChangeListener> = new Set();
  private visibilityListeners: Set<VisibilityChangeListener> = new Set();

  private isTabVisible = true;

  private constructor() {
    this.capabilities = this.detectDeviceCapabilities();
    this.loadPersistedProfile();
    this.setupVisibilityListener();
    this.setupDevDiagnostics();
  }

  public static getInstance(): PerformanceManager {
    if (!PerformanceManager.instance) {
      PerformanceManager.instance = new PerformanceManager();
    }
    return PerformanceManager.instance;
  }

  /**
   * Evaluates hardware signals to determine safe initial profile
   */
  private detectDeviceCapabilities(): DeviceCapabilities {
    const isBrowser = typeof window !== "undefined";
    if (!isBrowser) {
      return {
        isMobile: false,
        hardwareConcurrency: 4,
        deviceMemoryGB: 4,
        maxTextureSize: 4096,
        devicePixelRatio: 1,
        prefersReducedMotion: false,
        recommendedInitialTier: "MEDIUM",
      };
    }

    const nav = navigator as any;
    const hardwareConcurrency = typeof nav.hardwareConcurrency === "number" ? nav.hardwareConcurrency : 4;
    const deviceMemoryGB = typeof nav.deviceMemory === "number" ? nav.deviceMemory : 4;
    const devicePixelRatio = Math.max(1, window.devicePixelRatio || 1);

    // Modern mobile detection considering touch, screen dimension and pointer
    const isTouch = "ontouchstart" in window || nav.maxTouchPoints > 0;
    const isSmallScreen = Math.min(window.innerWidth, window.innerHeight) < 768;
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(nav.userAgent || "");
    const isMobile = (isTouch && isSmallScreen) || isMobileUA;

    // WebGL capabilities probe
    let maxTextureSize = 4096;
    try {
      const testCanvas = document.createElement("canvas");
      const gl = (testCanvas.getContext("webgl") || testCanvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
      if (gl) {
        maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 4096;
      }
    } catch {
      maxTextureSize = 4096;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Determine safe initial tier
    let recommendedInitialTier: EffectiveTier = "MEDIUM";
    if (deviceMemoryGB <= 2 || hardwareConcurrency <= 2 || maxTextureSize < 4096) {
      recommendedInitialTier = "LOW";
    } else if (isMobile) {
      // For mobile: start balanced at MEDIUM to prevent thermal spikes while preserving beauty
      recommendedInitialTier = deviceMemoryGB >= 6 && hardwareConcurrency >= 8 ? "HIGH" : "MEDIUM";
    } else {
      // Desktop with ample RAM & cores
      recommendedInitialTier = deviceMemoryGB >= 8 && hardwareConcurrency >= 6 ? "HIGH" : "MEDIUM";
    }

    return {
      isMobile,
      hardwareConcurrency,
      deviceMemoryGB,
      maxTextureSize,
      devicePixelRatio,
      prefersReducedMotion,
      recommendedInitialTier,
    };
  }

  private loadPersistedProfile(): void {
    if (typeof localStorage === "undefined") {
      this.currentEffectiveTier = this.capabilities.recommendedInitialTier;
      return;
    }

    const saved = localStorage.getItem("rrpt_perf_quality") as QualityProfile | null;
    if (saved && ["AUTO", "HIGH", "MEDIUM", "LOW", "POWER_SAVER"].includes(saved)) {
      this.userProfile = saved;
      if (saved === "AUTO") {
        this.currentEffectiveTier = this.capabilities.recommendedInitialTier;
      } else {
        this.currentEffectiveTier = saved;
      }
    } else {
      this.userProfile = "AUTO";
      this.currentEffectiveTier = this.capabilities.recommendedInitialTier;
    }
  }

  private setupVisibilityListener(): void {
    if (typeof document === "undefined") return;

    this.isTabVisible = !document.hidden;

    document.addEventListener("visibilitychange", () => {
      const visible = !document.hidden;
      this.isTabVisible = visible;
      this.visibilityListeners.forEach((listener) => {
        try {
          listener(visible);
        } catch (e) {
          console.error("[PerformanceManager] Visibility listener error:", e);
        }
      });
    });
  }

  /**
   * Call once per frame inside the Babylon render loop.
   * Calculates delta time with zero memory allocation or React render triggering.
   */
  public recordRenderFrame(nowMs: number = performance.now()): void {
    if (!this.lastFrameTimestamp) {
      this.lastFrameTimestamp = nowMs;
      return;
    }

    const deltaMs = nowMs - this.lastFrameTimestamp;
    this.lastFrameTimestamp = nowMs;

    // Ignore extreme delta outliers (e.g. background tab return or debugger pauses)
    if (deltaMs <= 0 || deltaMs > 500) {
      return;
    }

    // Insert into circular ring buffer
    this.frameTimes[this.frameIndex] = deltaMs;
    this.frameIndex = (this.frameIndex + 1) % this.SAMPLE_CAPACITY;
    if (this.sampleCount < this.SAMPLE_CAPACITY) {
      this.sampleCount++;
    }

    this.instantaneousFps = 1000 / deltaMs;

    // Periodically evaluate adaptive performance trend
    if (nowMs - this.lastEvaluationTime >= this.EVALUATION_INTERVAL_MS) {
      this.evaluateAdaptiveQuality(nowMs);
    }
  }

  /**
   * Periodic evaluation to adjust tier gracefully without flapping
   */
  private evaluateAdaptiveQuality(nowMs: number): void {
    this.lastEvaluationTime = nowMs;

    if (this.sampleCount < 15) return;

    let totalDelta = 0;
    let maxDelta = 0;

    for (let i = 0; i < this.sampleCount; i++) {
      const dt = this.frameTimes[i];
      totalDelta += dt;
      if (dt > maxDelta) maxDelta = dt;
    }

    const avgDelta = totalDelta / this.sampleCount;
    this.smoothedFps = avgDelta > 0 ? Math.round(1000 / avgDelta) : 60;
    this.lowestFps = maxDelta > 0 ? Math.round(1000 / maxDelta) : 60;

    // If user selected a fixed manual tier, do not auto-adjust
    if (this.userProfile !== "AUTO") {
      return;
    }

    // Adaptive adjustment logic
    if (this.smoothedFps < this.LOW_FPS_THRESHOLD || this.lowestFps < 22) {
      this.consecutiveLowFpsEvaluations++;
      this.consecutiveHighFpsEvaluations = 0;

      if (this.consecutiveLowFpsEvaluations >= this.DOWNGRADE_COUNT_REQUIRED) {
        this.stepDownTier();
        this.consecutiveLowFpsEvaluations = 0;
      }
    } else if (this.smoothedFps >= this.HIGH_FPS_THRESHOLD && this.lowestFps >= 38) {
      this.consecutiveHighFpsEvaluations++;
      this.consecutiveLowFpsEvaluations = 0;

      if (this.consecutiveHighFpsEvaluations >= this.UPGRADE_COUNT_REQUIRED) {
        this.stepUpTier();
        this.consecutiveHighFpsEvaluations = 0;
      }
    } else {
      // In healthy middle band: reset downgrade counters
      this.consecutiveLowFpsEvaluations = 0;
    }
  }

  private stepDownTier(): void {
    if (this.currentEffectiveTier === "HIGH") {
      this.setEffectiveTier("MEDIUM");
    } else if (this.currentEffectiveTier === "MEDIUM") {
      this.setEffectiveTier("LOW");
    }
  }

  private stepUpTier(): void {
    if (this.currentEffectiveTier === "LOW") {
      this.setEffectiveTier("MEDIUM");
    } else if (this.currentEffectiveTier === "MEDIUM") {
      // Only step up to HIGH if device has sufficient RAM & cores
      if (this.capabilities.deviceMemoryGB >= 4 && this.capabilities.hardwareConcurrency >= 4) {
        this.setEffectiveTier("HIGH");
      }
    }
  }

  private setEffectiveTier(tier: EffectiveTier): void {
    if (this.currentEffectiveTier === tier) return;
    this.currentEffectiveTier = tier;

    this.qualityListeners.forEach((listener) => {
      try {
        listener(tier, this.userProfile);
      } catch (e) {
        console.error("[PerformanceManager] Error notifying quality listener:", e);
      }
    });
  }

  // --- Public API ---

  public getQualityProfile(): QualityProfile {
    return this.userProfile;
  }

  public getEffectiveTier(): EffectiveTier {
    return this.currentEffectiveTier;
  }

  public setQualityProfile(profile: QualityProfile): void {
    this.userProfile = profile;
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("rrpt_perf_quality", profile);
    }

    if (profile === "AUTO") {
      this.setEffectiveTier(this.capabilities.recommendedInitialTier);
      this.consecutiveLowFpsEvaluations = 0;
      this.consecutiveHighFpsEvaluations = 0;
    } else {
      this.setEffectiveTier(profile);
    }
  }

  /**
   * Computes the Babylon.js hardware scaling level:
   * Level = 1 / (clampedDpr * qualityScale)
   * A higher hardware scaling level (e.g. 1.25 or 1.4) reduces internal render resolution,
   * significantly relieving mobile GPU fill-rate, heat and battery.
   */
  public getHardwareScalingLevel(): number {
    const rawDpr = this.capabilities.devicePixelRatio;

    switch (this.currentEffectiveTier) {
      case "HIGH": {
        // High profile: Clamp DPR to 1.5 on mobile to avoid 16MP over-rendering
        const clampedDpr = Math.min(rawDpr, 1.5);
        return 1 / clampedDpr;
      }
      case "MEDIUM": {
        // Balanced: Clamp DPR to 1.25, render scale 0.9
        const clampedDpr = Math.min(rawDpr, 1.25);
        return 1 / (clampedDpr * 0.9);
      }
      case "LOW": {
        // Low profile: Clamp DPR to 1.0, render scale 0.78
        const clampedDpr = Math.min(rawDpr, 1.0);
        return 1 / (clampedDpr * 0.78);
      }
      case "POWER_SAVER": {
        // Battery/Thermal priority: DPR 1.0, render scale 0.70
        const clampedDpr = Math.min(rawDpr, 1.0);
        return 1 / (clampedDpr * 0.70);
      }
      default:
        return 1.0;
    }
  }

  /**
   * DynamicTexture resolution budget (width x height) for 3D doors
   */
  public getDoorTextureDimensions(): { width: number; height: number; anisotropicLevel: number } {
    switch (this.currentEffectiveTier) {
      case "HIGH":
        return { width: 1024, height: 1536, anisotropicLevel: 2 };
      case "MEDIUM":
        return { width: 512, height: 768, anisotropicLevel: 1 };
      case "LOW":
      case "POWER_SAVER":
      default:
        return { width: 512, height: 768, anisotropicLevel: 1 };
    }
  }

  /**
   * Particle count and emit multiplier (0.0 to 1.0)
   */
  public getParticleMultiplier(): number {
    if (this.capabilities.prefersReducedMotion) return 0.2;

    switch (this.currentEffectiveTier) {
      case "HIGH":
        return 1.0;
      case "MEDIUM":
        return 0.6;
      case "LOW":
        return 0.25;
      case "POWER_SAVER":
        return 0.15;
      default:
        return 0.6;
    }
  }

  /**
   * Maximum ms to keep actively redrawing a revealed door's dynamic interior texture before settling
   */
  public getDoorSettleTimeoutMs(): number {
    switch (this.currentEffectiveTier) {
      case "HIGH":
        return 2800;
      case "MEDIUM":
        return 2200;
      case "LOW":
      case "POWER_SAVER":
      default:
        return 1800;
    }
  }

  public getIsTabVisible(): boolean {
    return this.isTabVisible;
  }

  public getMetrics(): PerformanceMetrics {
    const hwScaling = this.getHardwareScalingLevel();
    const renderScale = hwScaling > 0 ? +(1 / hwScaling).toFixed(2) : 1;

    return {
      currentFps: Math.round(this.instantaneousFps),
      averageFps: this.smoothedFps,
      minFps: this.lowestFps,
      frameTimeMs: this.smoothedFps > 0 ? +(1000 / this.smoothedFps).toFixed(1) : 16.6,
      effectiveTier: this.currentEffectiveTier,
      userProfile: this.userProfile,
      hardwareScalingLevel: +hwScaling.toFixed(2),
      renderScale,
      isTabVisible: this.isTabVisible,
      particleBudgetMultiplier: this.getParticleMultiplier(),
    };
  }

  public onQualityChange(listener: QualityChangeListener): () => void {
    this.qualityListeners.add(listener);
    return () => this.qualityListeners.delete(listener);
  }

  public subscribe(listener: QualityChangeListener): () => void {
    return this.onQualityChange(listener);
  }

  public setProfile(profile: QualityProfile): void {
    this.setQualityProfile(profile);
  }

  public getAnisotropicLevel(): number {
    return this.getDoorTextureDimensions().anisotropicLevel;
  }

  public onVisibilityChange(listener: VisibilityChangeListener): () => void {
    this.visibilityListeners.add(listener);
    return () => this.visibilityListeners.delete(listener);
  }

  private setupDevDiagnostics(): void {
    if (typeof window !== "undefined" && import.meta.env.DEV) {
      (window as any).__RAJA_RANI_PERF__ = {
        getMetrics: () => this.getMetrics(),
        getCapabilities: () => this.capabilities,
        setQuality: (q: QualityProfile) => this.setQualityProfile(q),
      };
    }
  }
}

export const performanceManager = PerformanceManager.getInstance();
