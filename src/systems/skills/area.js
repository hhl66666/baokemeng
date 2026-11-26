import { RULES, COMBAT } from '../../config.js';
import { lineClear } from '../../world/collision.js';
import { mapFor } from '../../data/maps.js';
import { damage } from '../combat-core.js';

export function castAreaSkill({ game, id, target, level, range, area }) {
  const { run, effects } = game, settings = COMBAT[id], player = run.player;
  const center = id === 'roast' ? target : player;
  const radius = id === 'roast' ? (settings.radius + level * settings.radiusPerLevel) * area : range;
  let hit = false;
  for (const enemy of run.enemies) {
    if (enemy.hp <= 0 || Math.hypot(enemy.x - center.x, enemy.z - center.z) >= radius ||
        !lineClear(center, enemy, mapFor(run))) continue;
    damage(game, enemy, settings.baseDamage + level * settings.damagePerLevel, settings.knockback ?? 0);
    if (id === 'roast') enemy.slow = Math.max(enemy.slow, settings.slow + level * settings.slowPerLevel);
    hit = true;
  }
  if (id === 'blossom' && hit && player.hp > 0) player.hp = Math.min(RULES.maxHealth, player.hp + settings.baseHeal + level);
  effects.ring(center.x, center.z, radius, settings.color, 0.6);
  effects.burst(center.x, center.z, settings.color, 16, id === 'blossom' ? 'star' : 'bubble', 0.7, radius);
}