// ============================================================
// Narrador de voz — Web Speech API (pt-BR)
// Sem dependências externas; usa a síntese de voz nativa do browser.
// ============================================================

interface SpeakOptions {
  interrupt?: boolean; // cancela o que está sendo falado antes de começar
  rate?: number;       // velocidade (0.5 – 2.0); padrão 1.3
  pitch?: number;      // tom (0 – 2.0); padrão 1.0
}

class NarratorEngine {
  private _synth: SpeechSynthesis | null = null;
  private _voice: SpeechSynthesisVoice | null = null;
  private _enabled: boolean;

  constructor() {
    this._enabled = localStorage.getItem('elifoot_narrator') !== 'false';

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this._synth = window.speechSynthesis;
      // Vozes podem carregar de forma assíncrona (Chrome)
      const load = () => this._loadVoice();
      load();
      if (this._synth.onvoiceschanged !== undefined) {
        this._synth.onvoiceschanged = load;
      }
    }
  }

  private _loadVoice(): void {
    if (!this._synth) return;
    const voices = this._synth.getVoices();
    // Prefere pt-BR, aceita qualquer pt como fallback
    this._voice =
      voices.find((v) => v.lang === 'pt-BR') ??
      voices.find((v) => v.lang.startsWith('pt')) ??
      null;
  }

  get enabled(): boolean {
    return this._enabled;
  }

  toggle(): boolean {
    this._enabled = !this._enabled;
    localStorage.setItem('elifoot_narrator', String(this._enabled));
    if (!this._enabled) this.cancel();
    return this._enabled;
  }

  cancel(): void {
    this._synth?.cancel();
  }

  /** Fala o texto sempre (com ou sem fila). */
  speak(text: string, options: SpeakOptions = {}): void {
    if (!this._enabled || !this._synth) return;
    if (options.interrupt) this._synth.cancel();

    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'pt-BR';
    utt.rate = options.rate ?? 1.3;
    utt.pitch = options.pitch ?? 1.0;
    utt.volume = 1.0;
    if (this._voice) utt.voice = this._voice;

    this._synth.speak(utt);
  }

  /** Fala o texto apenas se o narrador estiver ocioso (sem interromper). */
  speakIfFree(text: string, options: Omit<SpeakOptions, 'interrupt'> = {}): void {
    if (!this._enabled || !this._synth) return;
    if (this._synth.speaking || this._synth.pending) return;
    this.speak(text, { ...options, interrupt: false });
  }
}

export const narratorEngine = new NarratorEngine();
