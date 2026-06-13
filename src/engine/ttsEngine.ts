/**
 * Lightweight Text-to-Speech Engine using the native Web Speech API.
 */

export interface SpeechOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: SpeechSynthesisVoice;
  onend?: () => void;
}

class TTSEngine {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      this.synth = window.speechSynthesis;
    }
  }

  public speak(text: string, options: SpeechOptions = {}) {
    if (!this.synth) return;

    this.stop();

    // Remove markup tags and speaker tags from text before speaking
    const cleanText = text
      .replace(/\[NPC:.*?\]/g, '')
      .replace(/\[INNER_MONOLOGUE\]/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/\{.*?\}/g, '');

    this.currentUtterance = new SpeechSynthesisUtterance(cleanText);
    
    // Default Atmosphere
    this.currentUtterance.rate = options.rate || 0.9;
    this.currentUtterance.pitch = options.pitch || 0.8;
    this.currentUtterance.volume = options.volume || 1.0;

    if (text.includes('[INNER_MONOLOGUE]')) {
      this.currentUtterance.rate = 1.1; // Fast, internal thought
      this.currentUtterance.pitch = 1.0;
    } else if (text.includes('[NPC:KAELEN]')) {
      this.currentUtterance.rate = 0.7; // Slow, gravelly
      this.currentUtterance.pitch = 0.5;
    }

    if (options.voice) {
      this.currentUtterance.voice = options.voice;
    }

    if (options.onend) {
      this.currentUtterance.onend = options.onend;
    }

    this.synth.speak(this.currentUtterance);
  }

  public stop() {
    if (this.synth && this.synth.speaking) {
      this.synth.cancel();
    }
  }

  public isSpeaking(): boolean {
    return this.synth ? this.synth.speaking : false;
  }
}

export const tts = new TTSEngine();
