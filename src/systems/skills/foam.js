import { COMBAT } from '../../config.js';
import { damage, areaHit } from '../combat-core.js';

export function cast({ game, targets, level }) {
  const { run, effects } = game, player = run.player, settings = COMBAT.foam;
  for (const target of targets.slice(0, 1 + Math.floor(level / 2))) {
    effects.foam(player, target, level);
    const direction = { x: target.x - player.x, z: target.z - player.z };
    const length = Math.hypot(direction.x, direction.z) || 1;
    let hits = 0;
    for (const enemy of targets) {
      if (enemy.hp <= 0) continue;
      const dx = enemy.x - player.x, dz = enemy.z - player.z;
      const along = (dx * direction.x + dz * direction.z) / length;
      const across = Math.abs(dx * direction.z - dz * direction.x) / length;
      if (along > 0 && across < settings.width && hits < 1 + Math.floor(level / 3)) {
        const frozen = enemy.slow > 0;
        damage(game, enemy, settings.baseDamage + level * settings.damagePerLevel, settings.knockback);
        hits++;
        if (frozen && run.evolutions.includes('snow')) {
          areaHit(game, enemy.x, enemy.z, COMBAT.snow.radius, COMBAT.snow.damage);
          effects.ice(enemy, COMBAT.snow.radius, true);
        }
      }
    }
  }
}