/**
 * Lightweight Text-to-Speech Engine using the native Web Speech API.
 */

export interface SpeechOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: SpeechSynthesisVoice;
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

    // Remove markup tags from text before speaking
    const cleanText = text.replace(/\[.*?\]/g, '').replace(/\{.*?\}/g, '');

    this.currentUtterance = new SpeechSynthesisUtterance(cleanText);
    this.currentUtterance.rate = options.rate || 0.9; // Slightly slower for drama
    this.currentUtterance.pitch = options.pitch || 0.8; // Slightly deeper for atmosphere
    this.currentUtterance.volume = options.volume || 1.0;

    if (options.voice) {
      this.currentUtterance.voice = options.voice;
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
