import { RULES, SKILLS } from '../config.js';
import { MAPS } from '../data/maps.js';
import { DEFAULT_CHARACTER } from '../data/characters.js';
import { newProfile } from '../data/progression.js';

/** 仅包含可序列化数据：不能放入 Mesh、DOM、音频节点或回调。 */
export function newRun(loadout = newProfile().loadout) {
  const map = MAPS[loadout.mapId];
  if (!map) throw new Error('未知门店');
  return {
    version: 2, id: globalThis.crypto?.randomUUID?.() ?? `run-${Date.now()}-${Math.random()}`,
    mapId: map.id, skinId: loadout.skinId, characterId: loadout.characterId ?? DEFAULT_CHARACTER.id,
    skillPool: [...loadout.skillPool], skillLimit: RULES.maxSkills, legacy: false,
    time: 0, player: { ...map.spawn, hp: RULES.maxHealth, invulnerable: 0 },
    level: 1, xp: 0, pending: 0, kills: 0, materials: 0,
    skills: { [DEFAULT_CHARACTER.startingSkill]: 1 }, passives: {}, evolutions: [],
    cooldowns: Object.fromEntries(Object.keys(SKILLS).map(id => [id, 0])),
    enemies: [], drops: [], zones: [], spawnClock: 0, bossSpawned: false,
    result: null,
  };
}
export function xpNeeded(level) { return 7 + level * 4; }
export function addXp(run, amount) {
  run.xp += amount;
  while (run.xp >= xpNeeded(run.level)) {
    run.xp -= xpNeeded(run.level);
    run.level++;
    // 一次拾取可能连升多级；每一级都排队等待一次暂停选择。
    run.pending++;
  }
}
