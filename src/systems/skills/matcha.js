import { COMBAT } from '../../config.js';
import { lineClear } from '../../world/collision.js';
import { mapFor } from '../../data/maps.js';
import { damage } from '../combat-core.js';

export function cast({ game, targets, level, range }) {
  const settings = COMBAT.matcha;
  let origin = game.run.player;
  const remaining = new Set(targets);
  for (let i = 0; i < settings.baseChains + Math.floor(level / 2); i++) {
    const target = [...remaining].filter(enemy => enemy.hp > 0 && Math.hypot(enemy.x - origin.x, enemy.z - origin.z) <= range &&
      lineClear(origin, enemy, mapFor(game.run)))
      .sort((a, b) => Math.hypot(a.x - origin.x, a.z - origin.z) - Math.hypot(b.x - origin.x, b.z - origin.z))[0];
    if (!target) break;
    game.effects.beam(origin, target, '#9bd987');
    damage(game, target, settings.baseDamage + level * settings.damagePerLevel);
    remaining.delete(target);
    origin = { x: target.x, z: target.z };
  }
}