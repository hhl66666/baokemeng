import { RULES } from '../config.js';
import { newRun } from './state.js';
import { SaveStore } from './save.js';
import { Input } from './input.js';
import { AudioSystem } from './audio.js';
import { WorldView } from '../world/view.js';
import { updatePlayer } from '../world/player.js';
import { updateEnemies } from '../entities/enemy.js';
import { updateSpawner } from '../systems/spawner.js';
import { updateSkills, updateZones, collectDrops } from '../systems/combat.js';
import { choose, offerChoices } from '../systems/upgrades.js';
import { Hud } from '../ui/hud.js';
import { Screens } from '../ui/screens.js';
import { validateLoadout } from '../data/progression.js';

/**
 * 只负责编排：状态切换、系统执行顺序、存档时机与主循环。
 * 规则在 systems/，模型在 world/，HTML 在 ui/；不要把具体技能搬回这里。
 */
export class Game {
  constructor({ doc = document, host = window, storage = host.localStorage, world, input, audio } = {}) {
    this.doc = doc;
    this.host = host;
    this.run = null;
    this.mode = 'menu';
    this.lastSave = 0;
    this.hudTime = 0;
    this.previous = 0;
    this.frameId = null;
    this.listeners = [];
    this.hud = new Hud(doc, { pause: () => this.pause() });
    this.store = new SaveStore(storage, (message, retry) => this.hud.notify(message, retry ? () => {
      if (this.persist() && this.mode === 'ended') this.screens.result();
    } : null));
    this.audio = audio ?? new AudioSystem(this.store.settings, message => this.hud.notify(message), host);
    this.world = world ?? new WorldView(doc.getElementById('world'), { host, doc });
    this.effects = this.world.effects;
    this.input = input ?? new Input(doc.getElementById('joystick'), {
      isPlaying: () => this.mode === 'playing', togglePause: () => this.togglePause(),
      moveStick: (x, z) => this.hud.moveStick(x, z),
    }, host);
    this.screens = new Screens(this, doc);
    this.bindLifecycle();
    // 补做可能被关闭页面打断的结算；SaveStore 保证重复执行不重复发奖。
    if (this.store.savedRun?.result) {
      this.run = structuredClone(this.store.savedRun);
      this.persist();
    }
  }
  bindLifecycle() {
    const on = (target, name, handler) => {
      target.addEventListener(name, handler);
      this.listeners.push(() => target.removeEventListener(name, handler));
    };
    on(this.host, 'resize', () => this.world.resize());
    on(this.host, 'blur', () => { this.input.reset(); this.pause(); });
    on(this.doc, 'visibilitychange', () => {
      if (this.doc.hidden) {
        this.input.reset();
        if (this.mode === 'playing') this.pause();
        else this.persist();
      }
    });
    on(this.host, 'pagehide', () => this.persist());
    on(this.doc.getElementById('world'), 'webglcontextlost', e => {
      e.preventDefault(); this.pause();
      this.hud.notify('3D 图形上下文已中断，进度已尝试保存。请刷新后继续。');
    });
  }
  start() {
    if (this.frameId !== null) return;
    this.menu(); this.previous = this.host.performance.now();
    const loop = now => {
      this.frame(now);
      this.frameId = this.host.requestAnimationFrame(loop);
    };
    this.frameId = this.host.requestAnimationFrame(loop);
  }
  persist() {
    return this.store.persist(this.run);
  }
  menu() {
    this.mode = 'menu';
    this.hud.setVisible(false);
    this.screens.menu();
  }
  replaceSavedRun() {
    if (!validateLoadout(this.store.profile.loadout, this.store.profile)) {
      this.hud.notify('无法重开：出战配置已失效，请返回首页重新选择。');
      return;
    }
    this.run = structuredClone(this.store.savedRun);
    this.run.result = 'quit';
    if (this.persist()) this.begin(false);
  }
  begin(restore = false) {
    if (restore && !this.store.savedRun) throw new Error('没有可以继续的存档');
    if (!restore && !validateLoadout(this.store.profile.loadout, this.store.profile)) {
      this.hud.notify('无法开局：请选择已解锁皮肤和 5 个不同的已解锁技能。');
      return;
    }
    this.world.clear();
    this.run = restore ? structuredClone(this.store.savedRun) : newRun(this.store.profile.loadout);
    this.world.configure(this.run.mapId, this.run.skinId, this.run.characterId);
    this.lastSave = this.run.time;
    if (this.run.result) {
      this.mode = 'ended';
      this.screens.result();
      return;
    }
    this.mode = 'playing';
    this.hud.setVisible(true);
    this.screens.hide();
    this.input.reset();
    if (this.run.player.hp <= 0) this.finish('lose');
    else if (this.run.pending) this.showUpgrade();
    this.persist();
    this.hud.update(this.run);
  }
  pause(title = '歇一小会儿', description = '世界已暂停。准备好了，随时回来继续。') {
    if (this.mode !== 'playing') return;
    this.mode = 'paused';
    this.persist();
    this.screens.pause(title, description);
  }
  resume() {
    // 升级与结算面板不能通过 Esc 跳过，只允许恢复普通暂停。
    if (this.mode !== 'paused') return;
    this.mode = 'playing';
    this.input.reset();
    this.screens.hide();
  }
  togglePause() {
    if (this.mode === 'playing') this.pause();
    else if (this.mode === 'paused') this.resume();
  }
  showUpgrade() {
    this.mode = 'upgrade';
    this.run.offered = offerChoices(this.run);
    this.persist();
    this.screens.upgrade(this.run.offered);
  }
  selectUpgrade(choice) {
    if (this.mode !== 'upgrade') throw new Error('当前不在升级选择界面');
    choose(this.run, choice);
    delete this.run.offered;
    this.audio.tone(800, 0.12);
    this.persist();
    if (this.run.pending) this.showUpgrade();
    else {
      this.mode = 'playing';
      this.screens.hide();
    }
    this.hud.update(this.run);
  }
  finish(result) {
    this.run.result = result;
    this.mode = 'ended';
    this.persist();
    this.screens.result();
  }
  update(dt) {
    if (this.mode !== 'playing') return;
    const run = this.run, direction = this.input.getDirection();
    run.time += dt;
    updatePlayer(run, direction, dt);
    this.world.animatePlayer(run, direction, dt);
    // 首领登场会暂停。必须立刻结束本帧，不能在弹出说明后继续伤害玩家。
    if (updateSpawner(this, dt)) return;
    updateEnemies(this, dt);
    updateSkills(this, dt, direction.moving);
    updateZones(this, dt);
    const bossDead = run.enemies.some(e => e.type === 'boss' && e.hp <= 0);
    run.enemies = run.enemies.filter(e => e.hp > 0);
    collectDrops(run);
    // 同帧交换伤害时优先判通关；此顺序也是存档与 UI 的统一结算依据。
    if (bossDead) this.finish('win');
    else if (run.player.hp <= 0) this.finish('lose');
    else if (run.pending > 0) this.showUpgrade();
  }
  frame(now) {
    // 限制单帧步长，避免后台恢复或长帧时穿过家具、瞬间受到多次伤害。
    const dt = Math.min(Math.max(0, (now - this.previous) / 1000), RULES.maxStep);
    this.previous = now;
    if (this.mode === 'playing') {
      this.update(dt);
      if (this.mode === 'playing') this.effects.update(dt);
      if (this.run.time - this.lastSave > RULES.saveInterval) {
        this.lastSave = this.run.time;
        this.persist();
      }
    }
    this.world.render(this.mode === 'menu' ? null : this.run);
    this.hudTime += dt;
    if (this.hudTime > 0.1) {
      this.hud.update(this.run);
      this.hudTime = 0;
    }
  }
  dispose() {
    // Vite 热更新先解除旧循环与事件绑定，否则输入和存档会被重复处理。
    if (this.frameId !== null) this.host.cancelAnimationFrame(this.frameId);
    this.frameId = null;
    this.persist();
    this.input.dispose();
    for (const off of this.listeners) off();
    this.screens.dispose();
    this.hud.dispose();
    this.world.dispose();
    this.audio.dispose();
  }
}
