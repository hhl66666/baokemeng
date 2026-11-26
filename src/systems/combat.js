import { RULES, SKILLS, COMBAT } from '../config.js';
import { lineClear } from '../world/collision.js';
import { addXp } from '../core/state.js';
import { mapFor } from '../data/maps.js';
import { addDrop, damage, areaHit } from './combat-core.js';
import { skillActions } from './skills/index.js';
import { updateZones as updateCaramelZones } from './skills/caramel.js';

export { addDrop, damage, areaHit };

export function updateSkills(game, dt, moving) {
  const { run, effects } = game, p = run.player;
  const area = 1 + (run.passives.area ?? 0) * COMBAT.areaPerLevel;
  for (const [id, level] of Object.entries(run.skills)) {
    run.cooldowns[id] = Math.max(0, run.cooldowns[id] - dt);
    if (run.cooldowns[id] > 0) continue;
    const settings = COMBAT[id];
    const range = id === 'caramel' ? 0 : (settings.range + level * (settings.rangePerLevel ?? 0)) * area;
    const targets = id === 'caramel' ? [] : run.enemies
      .filter(enemy => enemy.hp > 0 && Math.hypot(enemy.x - p.x, enemy.z - p.z) < range && lineClear(p, enemy, mapFor(run)))
      .sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z));
    if (id !== 'caramel' && !targets.length) continue;
    const didCast = skillActions[id].cast({ game, run, effects, player: p, targets, level, range, area, moving });
    if (didCast === false) continue;
    if (id !== 'caramel') {
      game.world.cast(id, p, targets[0]);
      game.audio.tone(id === 'ice' ? 330 : 550, 0.035, 0.012);
    }
    run.cooldowns[id] = SKILLS[id].interval * (1 - (run.passives.haste ?? 0) * COMBAT.hastePerLevel);
  }
}
export function updateZones(game, dt) {
  updateCaramelZones(game, dt);
}
export function collectDrops(run) {
  const radius = 1 + (run.passives.pickup ?? 0) * COMBAT.pickupPerLevel;
  run.drops = run.drops.filter(d => {
    if (Math.hypot(d.x - run.player.x, d.z - run.player.z) >= radius || !lineClear(run.player, d, mapFor(run))) return true;
    if (d.type === 'xp') addXp(run, d.amount);
    if (d.type === 'heal') run.player.hp = Math.min(RULES.maxHealth, run.player.hp + d.amount);
    if (d.type === 'speed') run.speedBuff = Math.max(run.speedBuff ?? 0, d.amount);
    return false;
  });
}
