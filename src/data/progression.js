import { CHARACTERS, DEFAULT_CHARACTER } from './characters.js';
import { MAPS } from './maps.js';
import { SKILLS } from '../config.js';

export const BASE_SKILLS = ['foam', 'ice', 'espresso', 'caramel', 'matcha', 'cocoa'];
export const DEFAULT_POOL = BASE_SKILLS.filter(id => id !== DEFAULT_CHARACTER.startingSkill);
export const FRAGMENTS = { skinPerWin: 3, skillPerWin: 2, skinRequired: 9, skillRequired: 6 };
export const SKINS = {
  classic: { id: 'classic', name: '经典绿围裙', colors: DEFAULT_CHARACTER.colors },
  sunrise: { id: 'sunrise', name: '晨光焦糖', colors: { ...DEFAULT_CHARACTER.colors, apron: '#bd783b', pocket: '#eed19a', highlight: '#ffe2ac' } },
  midnight: { id: 'midnight', name: '雨夜蓝调', colors: { ...DEFAULT_CHARACTER.colors, apron: '#365e92', pocket: '#8faed0', shirt: '#e1e9f4', highlight: '#b7d7e8' } },
  botanical: { id: 'botanical', name: '花园茶语', colors: { ...DEFAULT_CHARACTER.colors, apron: '#657f49', pocket: '#d8a6ac', shirt: '#fff0e4', highlight: '#e6bbce' } },
};
export const REWARD_SKILLS = Object.values(MAPS).map(map => map.reward.skill);

export function newProfile() {
  return {
    version: 2, materials: 0, wins: 0, settled: [], receipts: [],
    skinFragments: Object.fromEntries(Object.keys(SKINS).filter(id => id !== 'classic').map(id => [id, 0])),
    skillFragments: Object.fromEntries(REWARD_SKILLS.map(id => [id, 0])),
    loadout: { mapId: 'morning', skinId: 'classic', characterId: DEFAULT_CHARACTER.id, skillPool: [...DEFAULT_POOL] },
  };
}
export function skinUnlocked(profile, id) {
  return Object.hasOwn(SKINS, id) && (id === 'classic' || profile.skinFragments[id] >= FRAGMENTS.skinRequired);
}
export function skillUnlocked(profile, id) {
  return BASE_SKILLS.includes(id) || (REWARD_SKILLS.includes(id) && profile.skillFragments[id] >= FRAGMENTS.skillRequired);
}
export function validateLoadout(loadout, profile) {
  return !!(loadout && typeof loadout.mapId === 'string' && typeof loadout.skinId === 'string' &&
    typeof loadout.characterId === 'string' && Object.hasOwn(CHARACTERS, loadout.characterId) &&
    Object.hasOwn(MAPS, loadout.mapId) && skinUnlocked(profile, loadout.skinId) &&
    Array.isArray(loadout.skillPool) && loadout.skillPool.length === 5 && new Set(loadout.skillPool).size === 5 &&
    loadout.skillPool.every(id => typeof id === 'string' && Object.hasOwn(SKILLS, id) &&
      id !== DEFAULT_CHARACTER.startingSkill && skillUnlocked(profile, id)));
}

/** 碎片与结算记录一起入账；旧局不补发新增奖励。 */
export function settleProfile(profile, run) {
  if (profile.settled.includes(run.id)) return profile;
  const next = structuredClone(profile);
  const receipt = { id: run.id, mapId: run.mapId, result: run.result, materials: run.materials, skin: null, skill: null, unlocked: [] };
  next.materials += run.materials;
  next.wins += run.result === 'win' ? 1 : 0;
  if (run.result === 'win' && !run.legacy) {
    const reward = MAPS[run.mapId].reward;
    for (const [kind, id, amount, threshold, inventory] of [
      ['skin', reward.skin, FRAGMENTS.skinPerWin, FRAGMENTS.skinRequired, next.skinFragments],
      ['skill', reward.skill, FRAGMENTS.skillPerWin, FRAGMENTS.skillRequired, next.skillFragments],
    ]) {
      const awarded = Math.min(amount, threshold - inventory[id]);
      inventory[id] += awarded;
      const converted = amount - awarded;
      next.materials += converted;
      receipt.materials += converted;
      receipt[kind] = { id, amount: awarded, converted };
      if (awarded > 0 && inventory[id] === threshold) receipt.unlocked.push(kind === 'skin' ? SKINS[id].name : SKILLS[id].name);
    }
  }
  next.settled.push(run.id);
  next.receipts.push(receipt);
  return next;
}
