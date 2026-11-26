export class AudioSystem {
  constructor(settings, notify, host = window) {
    this.settings = settings;
    this.notify = notify;
    this.host = host;
    this.context = null;
  }
  unlock() {
    // 必须由按钮等用户手势调用，满足浏览器的音频自动播放限制。
    if (!this.settings.sound) return;
    try {
      const AudioContext = this.host.AudioContext || this.host.webkitAudioContext;
      if (!AudioContext) { this.notify('此浏览器不支持游戏音效，可继续静音游玩。'); return; }
      this.context ??= new AudioContext();
      this.context.resume().catch(error => { console.error(error); this.notify('音效无法启用，可继续静音游玩。'); });
    } catch (error) { console.error(error); this.notify('音效无法启用，可继续静音游玩。'); }
  }
  tone(frequency, duration = 0.06, volume = 0.025) {
    if (!this.settings.sound || !this.context) return;
    const osc = this.context.createOscillator(), gain = this.context.createGain();
    osc.type = 'sine'; osc.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);
    osc.connect(gain); gain.connect(this.context.destination);
    osc.start(); osc.stop(this.context.currentTime + duration);
  }
  dispose() {
    if (!this.context) return;
    this.context.close().catch(error => {
      console.error('释放音频上下文失败', error);
      this.notify('音频资源释放失败，请刷新页面。');
    });
    this.context = null;
  }
}
