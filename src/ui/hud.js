import { createApp, shallowRef } from 'vue';
import HudPanel from './HudPanel.vue';
import { SKILLS, PASSIVES, EVOLUTIONS, COMBAT, RULES } from '../config.js';
import { xpNeeded } from '../core/state.js';
import { mapFor } from '../data/maps.js';
import { CHARACTERS, DEFAULT_CHARACTER } from '../data/characters.js';

export function timeText(seconds) {
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
}
export class Hud {
  constructor(doc = document, { pause = () => {} } = {}) {
    this.state = shallowRef({ visible: false, skills: [], emptySlots: 0 });
    this.notice = shallowRef(null);
    this.stick = shallowRef({ x: 0, z: 0 });
    this.app = createApp(HudPanel, { state: this.state, notice: this.notice, stick: this.stick, onPause: pause });
    this.app.mount(doc.getElementById('hud-root'));
  }
  notify(message, retry) {
    this.notice.value = message === null ? null : { message, retry };
  }
  setVisible(visible) { this.state.value = { ...this.state.value, visible }; }
  moveStick(x, z) { this.stick.value = { x, z }; }
  update(run) {
    if (!run) return;
    const map = mapFor(run);
    const character = CHARACTERS[run.characterId] ?? DEFAULT_CHARACTER;
    const boss = run.enemies.find(e => e.type === 'boss');
    const skills = Object.entries(run.skills).map(([id, level]) => ({
      id, name: SKILLS[id].name, level,
      evolved: run.evolutions.some(evolution => EVOLUTIONS[evolution].pair.includes(id)),
      cooldown: 100 * (1 - run.cooldowns[id] / (SKILLS[id].interval * (1 - (run.passives.haste ?? 0) * COMBAT.hastePerLevel))),
    }));
    this.state.value = {
      visible: this.state.value.visible, mapName: map.name, bossName: map.boss.name,
      characterName: character.name, characterTitle: character.title,
      clock: timeText(run.time),
      phase: run.bossSpawned ? '首领战' : run.time < 60 ? '第一阶段 · 热身' : run.time < 180 ? '第二阶段 · 成长' : '第三阶段 · 风味风暴',
      health: run.player.hp / RULES.maxHealth * 100, healthText: `${Math.ceil(run.player.hp)} / ${RULES.maxHealth}`,
      kills: run.kills, level: run.level,
      experience: run.xp / xpNeeded(run.level) * 100,
      experienceText: `灵感 ${Math.floor(run.xp)} / ${xpNeeded(run.level)}`,
      boss: Boolean(boss), bossHealth: boss ? boss.hp / boss.maxHp * 100 : 0,
      bossHint: run.bossSpawned ? '首领出现 · 留意地面预警' : `首领登场 · ${timeText(RULES.bossTime)}`,
      skills, emptySlots: Math.max(0, Math.min(2, run.skillLimit - skills.length)),
      passives: Object.entries(run.passives).map(([id, level]) => `${PASSIVES[id].name} ${level}`).join(' · ') || 'WASD / 方向键 · P 暂停',
    };
  }
  dispose() { this.app.unmount(); }
}
