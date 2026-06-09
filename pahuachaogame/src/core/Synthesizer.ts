export class Synthesizer {
  private ctx: AudioContext | null = null;
  private isInitialized = false;

  init() {
    if (this.isInitialized) return;
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.isInitialized = true;
    } catch (e) {
      console.error('Web Audio API is not supported in this browser', e);
    }
  }

  private createOscillatorAndGain(type: OscillatorType, freq: number, volume: number) {
    if (!this.ctx) return null;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    return { osc, gain };
  }

  playDrum() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // 模擬鼓聲：低頻短暫的正弦波
    const { osc, gain } = this.createOscillatorAndGain('sine', 100, 1)!;
    
    // 頻率快速下降
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
    
    // 音量快速衰減
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    
    osc.start(now);
    osc.stop(now + 0.1);
  }

  playGong() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // 模擬鑼聲：包含多個頻率的方波和三角波
    const osc1 = this.createOscillatorAndGain('square', 300, 0.3)!;
    const osc2 = this.createOscillatorAndGain('triangle', 450, 0.2)!;
    
    // 長時間的音量衰減
    osc1.gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
    osc2.gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
    
    osc1.osc.start(now);
    osc2.osc.start(now);
    
    osc1.osc.stop(now + 1.5);
    osc2.osc.stop(now + 1.5);
  }

  playCombo(comboCount: number) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // 隨著 Combo 增加，音高上升
    const baseFreq = 400;
    const freq = baseFreq + Math.min(comboCount * 20, 400); // 最高到 800Hz
    
    const { osc, gain } = this.createOscillatorAndGain('sine', freq, 0.5)!;
    
    gain.gain.linearRampToValueAtTime(0, now + 0.2);
    
    osc.start(now);
    osc.stop(now + 0.2);
  }

  speakFeedback(text: string) {
    if (!('speechSynthesis' in window)) return;
    
    // 取消先前的播報
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-TW';
    utterance.rate = 1.1; // 稍微快一點
    utterance.pitch = 1.0;
    
    window.speechSynthesis.speak(utterance);
  }
}
