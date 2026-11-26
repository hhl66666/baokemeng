export class Input {
  constructor(element, { isPlaying, togglePause, moveStick = () => {} }, host = window) {
    this.element = element;
    this.moveStick = moveStick;
    this.host = host;
    this.keys = new Set();
    this.axis = { x: 0, z: 0 };
    this.pointer = null;
    this.listeners = [];
    const on = (target, name, handler) => {
      target.addEventListener(name, handler);
      this.listeners.push(() => target.removeEventListener(name, handler));
    };
    on(element, 'pointerdown', event => {
      if (!isPlaying() || this.pointer !== null) return;
      this.pointer = event.pointerId;
      element.setPointerCapture(event.pointerId);
      this.handlePointer(event);
    });
    on(element, 'pointermove', event => {
      if (isPlaying() && event.pointerId === this.pointer) this.handlePointer(event);
    });
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      on(element, name, event => { if (event.pointerId === this.pointer) this.reset(); });
    }
    on(host, 'keydown', event => {
      if (event.target?.closest?.('input, textarea, select, [contenteditable="true"]')) return;
      const key = event.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
      if (['p', 'escape'].includes(key)) {
        if (!event.repeat) togglePause();
      } else if (isPlaying()) this.keys.add(key);
    });
    on(host, 'keyup', event => this.keys.delete(event.key.toLowerCase()));
    on(host, 'blur', () => this.reset());
  }
  handlePointer(event) {
    const rect = this.element.getBoundingClientRect();
    const maxDistance = rect.width > 0 ? rect.width * 0.25 : 32;
    let x = event.clientX - rect.left - rect.width / 2;
    let z = event.clientY - rect.top - rect.height / 2;
    const length = Math.hypot(x, z);
    if (length > maxDistance) { x *= maxDistance / length; z *= maxDistance / length; }
    const distance = Math.min(length, maxDistance);
    const deadZone = Math.min(5, maxDistance * 0.16);
    const strength = distance <= deadZone ? 0 : (distance - deadZone) / (maxDistance - deadZone);
    this.axis = length > 0 ? { x: x / Math.hypot(x, z) * strength, z: z / Math.hypot(x, z) * strength } : { x: 0, z: 0 };
    this.moveStick(x, z);
  }
  getDirection() {
    const has = key => this.keys.has(key);
    let x = this.axis.x + (has('d') || has('arrowright') ? 1 : 0) - (has('a') || has('arrowleft') ? 1 : 0);
    let z = this.axis.z + (has('s') || has('arrowdown') ? 1 : 0) - (has('w') || has('arrowup') ? 1 : 0);
    const length = Math.hypot(x, z);
    // 键盘与触控共用单位方向，防止斜走或同时输入时速度翻倍。
    if (length > 1) { x /= length; z /= length; }
    return { x, z, moving: length > 0.05 };
  }
  reset() {
    // 暂停、失焦和切界面都要清空按键，避免恢复时产生“粘住”的移动。
    this.keys.clear(); this.axis = { x: 0, z: 0 }; this.pointer = null;
    this.moveStick(0, 0);
  }
  dispose() { this.reset(); for (const off of this.listeners) off(); }
}
