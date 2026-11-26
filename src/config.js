// 游戏调参入口。时间单位为秒，距离单位为 Three.js 世界单位。
// 修改存档字段结构时还需同步 core/save.js 的校验与版本号。
import foam from './data/skills/foam.js';
import ice from './data/skills/ice.js';
import espresso from './data/skills/espresso.js';
import caramel from './data/skills/caramel.js';
import matcha from './data/skills/matcha.js';
import cocoa from './data/skills/cocoa.js';
import storm from './data/skills/storm.js';
import blossom from './data/skills/blossom.js';
import roast from './data/skills/roast.js';

const skillModules = { foam, ice, espresso, caramel, matcha, cocoa, storm, blossom, roast };
export const RULES = {
  bossTime: 300,
  maxEnemies: 70,
  maxDrops: 280,
  maxZones: 20,
  maxHealth: 100,
  playerRadius: 0.38,
  speed: 3.6,
  boostedSpeed: 4.7,
  invulnerability: 0.8,
  saveInterval: 8,
  maxStep: 0.033,
  maxSkills: 6,
  maxSkillLevel: 5,
  maxPassiveLevel: 3,
};
export const SKILLS = Object.fromEntries(Object.entries(skillModules).map(([id, skill]) => [id, skill.definition]));
export const PASSIVES = {
  haste: { name: '轻快手法', description: '每级减少 8% 技能冷却' },
  area: { name: '大杯灵感', description: '每级扩大 12% 技能作用范围' },
  pickup: { name: '灵感磁力', description: '每级扩大 35% 拾取范围' },
};
export const EVOLUTIONS = {
  snow: { name: '雪顶回旋', description: '泡弹命中减速目标，爆发碎冰', pair: ['foam', 'ice'] },
  pulse: { name: '焦糖脉冲', description: '射线引爆焦糖区域，造成范围伤害', pair: ['espresso', 'caramel'] },
};
export const ENEMIES = {
  bean: { hp: 18, speed: 0.85, radius: 0.35, damage: 10, xp: 2 },
  sugar: { hp: 25, speed: 0.95, radius: 0.3, damage: 10, xp: 2 },
  cream: { hp: 95, speed: 0.52, radius: 0.35, damage: 10, xp: 4 },
  boss: { hp: 1600, speed: 0.65, radius: 0.8, damage: 20, xp: 15 },
};
// 百分比使用小数：每级冷却缩减 0.08，即 8%，不是减少 0.08 秒。
export const COMBAT = {
  hastePerLevel: 0.08, areaPerLevel: 0.12, pickupPerLevel: 0.35,
  ...Object.fromEntries(Object.entries(skillModules).map(([id, skill]) => [id, skill.combat])),
  snow: { radius: 1.5, damage: 25 },
  pulse: { radiusMultiplier: 1.6, damage: 45 },
};
export const SPAWNING = {
  minDistance: 9, distanceSpread: 4, attempts: 100,
  hpRamp: 240, eliteHealth: 3, eliteChance: 0.035, eliteAfter: 75,
  sugarAfter: 60, creamAfter: 180, sugarChance: 0.28, creamChance: 0.18,
  initialInterval: 1, intervalRamp: 340, minInterval: 0.14,
};
export const ENEMY_ACTIONS = {
  sugar: { range: 6, windup: 0.8, cooldown: 4, dashDuration: 0.45, dashSpeed: 6, warningOffset: 1.6, warningRadius: 0.9 },
  boss: { firstAttack: 2, cooldown: 3.2, windup: 1.2, radius: 2.1, damage: 24 },
};
export const REWARDS = {
  eliteMaterials: 3, bossMaterials: 15, eliteXp: 8,
  healChance: 0.025, healAmount: 12, speedChance: 0.01, speedDuration: 5,
  upgradeHeal: 20,
};
export const STORAGE_KEYS = {
  run: 'cup-companions-run-v1',
  profile: 'cup-companions-profile-v1',
  settings: 'cup-companions-settings-v1',
};

// 纯视觉预算不参与命中与伤害；达到预算只省略装饰，不省略敌人预警。
export const VISUALS = {
  maxEffects: 80,
  maxDamageLabels: 12,
  maxBurstParticles: 18,
  hitInterval: 0.1,
  attackDuration: 0.5,
};
