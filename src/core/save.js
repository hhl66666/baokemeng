import { STORAGE_KEYS, SKILLS, PASSIVES, EVOLUTIONS, RULES } from '../config.js';
import { canMove } from '../world/collision.js';
import { MAPS } from '../data/maps.js';
import { CHARACTERS, DEFAULT_CHARACTER } from '../data/characters.js';
import { SKINS, FRAGMENTS, REWARD_SKILLS, newProfile, validateLoadout, settleProfile } from '../data/progression.js';

export function migrateRun(value) {
  if (value?.version === 2 && typeof value.characterId !== 'string') {
    return { ...value, characterId: DEFAULT_CHARACTER.id };
  }
  if (!value || value.version !== 1) return value;
  if (!value.cooldowns || !['foam', 'ice', 'espresso', 'caramel'].every(id =>
    typeof value.cooldowns[id] === 'number' && Number.isFinite(value.cooldowns[id]) && value.cooldowns[id] >= 0)) return value;
  return {
    ...value, version: 2, mapId: 'morning', skinId: 'classic', characterId: DEFAULT_CHARACTER.id,
    skillPool: ['ice', 'espresso', 'caramel'], skillLimit: 4, legacy: true,
    cooldowns: { ...Object.fromEntries(Object.keys(SKILLS).map(id => [id, 0])), ...value.cooldowns },
  };
}
export function migrateProfile(profile) {
  if (!profile) return profile;
  if (profile.version !== undefined) {
    if (profile.version === 2 && profile.loadout && typeof profile.loadout.characterId !== 'string') {
      return { ...profile, loadout: { ...profile.loadout, characterId: DEFAULT_CHARACTER.id } };
    }
    return profile;
  }
  if (!Number.isFinite(profile.materials) || profile.materials < 0 ||
      !Number.isInteger(profile.wins) || profile.wins < 0 ||
      !Array.isArray(profile.settled) || !profile.settled.every(id => typeof id === 'string')) return profile;
  const base = newProfile();
  return {
    ...base, ...profile, version: 2,
    loadout: { ...base.loadout, ...profile.loadout, characterId: profile.loadout?.characterId ?? DEFAULT_CHARACTER.id },
  };
}

/** 在创建任何场景对象前校验外部数据，避免 NaN 或不兼容状态进入模拟。 */
export function validateSave(value) {
  const finite = n => typeof n === 'number' && Number.isFinite(n);
  const positive = n => finite(n) && n >= 0;
  const point = p => p && finite(p.x) && finite(p.z);
  const levels = (map, definitions, max) => map && typeof map === 'object' && !Array.isArray(map) &&
    Object.entries(map).every(([k, v]) => Object.hasOwn(definitions, k) && Number.isInteger(v) && v >= 1 && v <= max);
  return !!(value && value.version === 2 && typeof value.id === 'string' &&
    typeof value.mapId === 'string' && Object.hasOwn(MAPS, value.mapId) &&
    typeof value.skinId === 'string' && Object.hasOwn(SKINS, value.skinId) &&
    typeof value.characterId === 'string' && Object.hasOwn(CHARACTERS, value.characterId) &&
    typeof value.legacy === 'boolean' &&
    value.skillLimit === (value.legacy ? 4 : RULES.maxSkills) &&
    Array.isArray(value.skillPool) && value.skillPool.length === (value.legacy ? 3 : 5) &&
    new Set(value.skillPool).size === value.skillPool.length &&
    value.skillPool.every(id => typeof id === 'string' && id !== 'foam' && Object.hasOwn(SKILLS, id)) &&
    (!value.legacy || (value.mapId === 'morning' && value.skinId === 'classic' && value.skillPool.join() === 'ice,espresso,caramel')) &&
    positive(value.time) && point(value.player) && positive(value.player.hp) && value.player.hp <= RULES.maxHealth &&
    positive(value.player.invulnerable) && canMove(value.player.x, value.player.z, RULES.playerRadius, MAPS[value.mapId]) &&
    Number.isInteger(value.level) && value.level >= 1 && positive(value.xp) &&
    Number.isInteger(value.pending) && value.pending >= 0 && positive(value.kills) && positive(value.materials) &&
    levels(value.skills, SKILLS, RULES.maxSkillLevel) && value.skills.foam && levels(value.passives, PASSIVES, RULES.maxPassiveLevel) &&
    Object.keys(value.skills).length <= value.skillLimit && Object.keys(value.skills).every(id => id === 'foam' || value.skillPool.includes(id)) &&
    Array.isArray(value.evolutions) && new Set(value.evolutions).size === value.evolutions.length &&
    value.evolutions.every(id => Object.hasOwn(EVOLUTIONS, id) && EVOLUTIONS[id].pair.every(k => value.skills[k] === RULES.maxSkillLevel)) &&
    value.cooldowns && Object.keys(SKILLS).every(k => positive(value.cooldowns[k])) &&
    positive(value.spawnClock) && typeof value.bossSpawned === 'boolean' &&
    Array.isArray(value.enemies) && value.enemies.length <= 100 &&
    value.enemies.every(e => point(e) && ['bean', 'sugar', 'cream', 'boss'].includes(e.type) &&
      positive(e.hp) && finite(e.maxHp) && e.maxHp > 0 && positive(e.age) && positive(e.attack) && positive(e.slow) &&
      typeof e.elite === 'boolean' && positive(e.windup) && point(e.direction) && positive(e.dash)) &&
    Array.isArray(value.drops) && value.drops.length <= 300 && value.drops.every(d => point(d) && ['xp', 'heal', 'speed'].includes(d.type) && positive(d.amount)) &&
    Array.isArray(value.zones) && value.zones.length <= RULES.maxZones && value.zones.every(z => point(z) && positive(z.life) && positive(z.tick) && positive(z.radius)) &&
    (value.result === null || ['win', 'lose', 'quit'].includes(value.result)) &&
    positive(value.speedBuff ?? 0));
}
export function validProfile(profile) {
  const inventory = (items, ids, max) => items && typeof items === 'object' &&
    Object.keys(items).length === ids.length && ids.every(id => Number.isInteger(items[id]) && items[id] >= 0 && items[id] <= max);
  return profile && profile.version === 2 && Number.isFinite(profile.materials) && profile.materials >= 0 &&
    Number.isInteger(profile.wins) && profile.wins >= 0 &&
    Array.isArray(profile.settled) && profile.settled.every(id => typeof id === 'string') &&
    new Set(profile.settled).size === profile.settled.length &&
    inventory(profile.skinFragments, Object.keys(SKINS).filter(id => id !== 'classic'), FRAGMENTS.skinRequired) &&
    inventory(profile.skillFragments, REWARD_SKILLS, FRAGMENTS.skillRequired) &&
    validateLoadout(profile.loadout, profile) &&
    Array.isArray(profile.receipts) && profile.receipts.every(receipt => receipt &&
      typeof receipt.id === 'string' && profile.settled.includes(receipt.id) &&
      typeof receipt.mapId === 'string' && Object.hasOwn(MAPS, receipt.mapId) && ['win', 'lose', 'quit'].includes(receipt.result) &&
      Number.isFinite(receipt.materials) && receipt.materials >= 0 && Array.isArray(receipt.unlocked) &&
      receipt.unlocked.every(name => typeof name === 'string') &&
      ['skin', 'skill'].every(kind => receipt[kind] === null || (receipt[kind] &&
        typeof receipt[kind].id === 'string' &&
        (kind === 'skin' ? Object.hasOwn(SKINS, receipt[kind].id) && receipt[kind].id !== 'classic' : REWARD_SKILLS.includes(receipt[kind].id)) &&
        Number.isInteger(receipt[kind].amount) && receipt[kind].amount >= 0 &&
        Number.isInteger(receipt[kind].converted) && receipt[kind].converted >= 0)));
}
export class SaveStore {
  constructor(storage, notify) {
    this.storage = storage;
    this.notify = notify;
    this.error = false;
    this.profileInvalid = false;
    this.failedReads = new Set();
    this.savedRun = null;
    this.profile = newProfile();
    this.settings = { sound: false };
    const loaded = migrateRun(this.read(STORAGE_KEYS.run));
    if (loaded && validateSave(loaded)) this.savedRun = loaded;
    else if (loaded) this.notify('本局存档格式不兼容或损坏，无法继续。开始新局将覆盖旧存档。');
    const profile = migrateProfile(this.read(STORAGE_KEYS.profile));
    if (profile) {
      if (validProfile(profile)) this.profile = profile;
      else { this.profileInvalid = true; this.notify('奖励档案格式异常，奖励保存已停用以避免覆盖。请备份并修复档案。'); }
    }
    const settings = this.read(STORAGE_KEYS.settings);
    if (settings && typeof settings.sound === 'boolean') this.settings = settings;
  }
  read(key) {
    try {
      const raw = this.storage.getItem(key);
      this.failedReads.delete(key);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      this.failedReads.add(key);
      console.error('读取本地数据失败', key, error);
      this.notify('本地数据无法读取，旧数据未被覆盖。可开始新局，但保存可能不可用。');
      return null;
    }
  }
  persist(run) {
    if (!run) return true;
    try {
      this.storage.setItem(STORAGE_KEYS.run, JSON.stringify(run));
      this.savedRun = structuredClone(run);
      if (run.result) {
        // 先持久化“本局已结束”，再入账。若中途关闭，下次启动会重放结算。
        // 奖励与 settled ID 存在同一个键中，重试不会再次增加同一局奖励。
        const current = migrateProfile(this.read(STORAGE_KEYS.profile));
        if (this.failedReads.has(STORAGE_KEYS.profile) || (current && !validProfile(current))) throw new Error('奖励档案不可读取，未覆盖');
        if (this.profileInvalid && !current) throw new Error('奖励档案需要修复，未覆盖');
        if (current) { this.profile = current; this.profileInvalid = false; }
        if (!this.profile.settled.includes(run.id)) {
          const next = settleProfile(this.profile, run);
          this.storage.setItem(STORAGE_KEYS.profile, JSON.stringify(next));
          this.profile = next;
        }
      }
      if (this.error) this.notify(null);
      this.error = false;
      return true;
    } catch (error) {
      this.error = true;
      console.error('保存进度失败', error);
      this.notify('进度或奖励尚未保存，请重试。当前状态仍保留，请勿关闭页面。', true);
      return false;
    }
  }
  saveLoadout(loadout) {
    try {
      const current = migrateProfile(this.read(STORAGE_KEYS.profile));
      if (this.failedReads.has(STORAGE_KEYS.profile) || this.profileInvalid || (current && !validProfile(current))) throw new Error('奖励档案不可读取');
      const profile = current ?? this.profile;
      if (!validateLoadout(loadout, profile)) throw new Error('需选择已解锁皮肤和 5 个不同的已解锁候选技能');
      const next = { ...profile, loadout: structuredClone(loadout) };
      this.storage.setItem(STORAGE_KEYS.profile, JSON.stringify(next));
      this.profile = next;
      return true;
    } catch (error) {
      console.error('保存出战配置失败', error);
      this.notify(`出战配置未保存：${error.message}。请调整或重试。`);
      return false;
    }
  }
  saveSettings() {
    try { this.storage.setItem(STORAGE_KEYS.settings, JSON.stringify(this.settings)); }
    catch (error) { console.error(error); this.notify('音效偏好未保存，当前设置仍生效。'); }
  }
}
