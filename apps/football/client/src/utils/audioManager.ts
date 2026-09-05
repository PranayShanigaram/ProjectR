/**
 * Audio Manager for Football Arena
 * Handles background music, sound effects, and timeline-based audio playback
 */

export class AudioManager {
  private backgroundAudio: HTMLAudioElement | null = null;
  private soundEffects: Map<string, HTMLAudioElement> = new Map();
  private isMuted = false;

  private soundUrl(fileName: string): string {
    return new URL(`../football/sounds/${fileName}`, import.meta.url).href;
  }

  constructor() {
    this.preloadSounds();
  }

  private preloadSounds() {
    // Preload goal sounds for instant playback (no latency)
    this.createSoundEffect("goal1", this.soundUrl("goal.m4a"));
    this.createSoundEffect("goal2", this.soundUrl("goal1.mp3"));
    this.createSoundEffect("goal3", this.soundUrl("goal2.mp3"));
  }

  private createSoundEffect(name: string, src: string) {
    const audio = new Audio();
    audio.src = src;
    audio.preload = "auto";
    audio.volume = 0.8;
    this.soundEffects.set(name, audio);
  }

  /**
   * Initialize and start background crowd audio
   * @param startTimeMs - Start time in milliseconds (e.g., 60000 for 1 minute)
   */
  initializeBackground(startTimeMs: number = 0) {
    if (this.backgroundAudio) {
      this.backgroundAudio.pause();
    }

    this.backgroundAudio = new Audio();
    this.backgroundAudio.src = this.soundUrl("background crowd.m4a");
    this.backgroundAudio.loop = true;
    this.backgroundAudio.volume = 0.6;
    this.backgroundAudio.preload = "auto";

    // Set current time to the specified timeline
    this.backgroundAudio.currentTime = startTimeMs / 1000;

    this.backgroundAudio.play().catch((err) => {
      console.warn("Background audio play failed:", err);
    });
  }

  /**
   * Play a goal sound effect immediately (no async delays)
   * @param goalNumber - Which goal sound to play (1 or 2)
   */
  playGoalSound(goalNumber: 1 | 2 = 1) {
    if (this.isMuted) return;

    const soundKey = goalNumber === 2 ? "goal2" : "goal1";
    const goalAudio = this.soundEffects.get(soundKey);

    if (goalAudio) {
      // Reset to start and play immediately
      goalAudio.currentTime = 0;
      goalAudio.play().catch((err) => {
        console.warn(`Goal ${goalNumber} sound play failed:`, err);
      });
    }
  }

  /**
   * Play penalty goal sound (reuses goal sounds)
   */
  playPenaltyGoalSound() {
    if (this.isMuted) return;
    const goalAudio = this.soundEffects.get("goal1");
    if (goalAudio) {
      goalAudio.currentTime = 0;
      goalAudio.play().catch((err) => {
        console.warn("Penalty goal sound play failed:", err);
      });
    }
  }

  /**
   * Play shootout goal sound
   */
  playShootoutGoalSound() {
    if (this.isMuted) return;
    const goalAudio = this.soundEffects.get("goal2");
    if (goalAudio) {
      goalAudio.currentTime = 0;
      goalAudio.play().catch((err) => {
        console.warn("Shootout goal sound play failed:", err);
      });
    }
  }

  /**
   * Stop background audio
   */
  stopBackground() {
    if (this.backgroundAudio) {
      this.backgroundAudio.pause();
      this.backgroundAudio.currentTime = 0;
    }
  }

  /**
   * Resume background audio
   */
  resumeBackground() {
    if (this.backgroundAudio && this.isMuted === false) {
      this.backgroundAudio.play().catch((err) => {
        console.warn("Background audio resume failed:", err);
      });
    }
  }

  /**
   * Update background audio based on match time (for seeking)
   * @param matchTimeMs - Current match time in milliseconds
   */
  updateBackgroundTime(matchTimeMs: number) {
    if (this.backgroundAudio && this.backgroundAudio.duration) {
      // Wrap around if audio loops
      this.backgroundAudio.currentTime = (matchTimeMs / 1000) % this.backgroundAudio.duration;
    }
  }

  /**
   * Toggle mute state
   */
  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.backgroundAudio) {
      this.backgroundAudio.muted = this.isMuted;
    }
    this.soundEffects.forEach((audio) => {
      audio.muted = this.isMuted;
    });
    return this.isMuted;
  }

  /**
   * Set master volume (0-1)
   */
  setVolume(volume: number) {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    if (this.backgroundAudio) {
      this.backgroundAudio.volume = clampedVolume * 0.6; // Background at 60% of master
    }
    this.soundEffects.forEach((audio) => {
      audio.volume = clampedVolume * 0.8; // Effects at 80% of master
    });
  }

  /**
   * Clean up all audio resources
   */
  cleanup() {
    if (this.backgroundAudio) {
      this.backgroundAudio.pause();
      this.backgroundAudio = null;
    }
    this.soundEffects.forEach((audio) => {
      audio.pause();
    });
    this.soundEffects.clear();
  }
}

// Singleton instance
let audioManagerInstance: AudioManager | null = null;

export function getAudioManager(): AudioManager {
  if (!audioManagerInstance) {
    audioManagerInstance = new AudioManager();
  }
  return audioManagerInstance;
}

export function resetAudioManager() {
  if (audioManagerInstance) {
    audioManagerInstance.cleanup();
    audioManagerInstance = null;
  }
}
