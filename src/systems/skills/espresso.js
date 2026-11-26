import { COMBAT } from '../../config.js';
import { canMove } from '../../world/collision.js';
import { mapFor } from '../../data/maps.js';
import { damage, areaHit } from '../combat-core.js';

export function cast({ game, targets, level, range }) {
  const { run, effects } = game, player = run.player, settings = COMBAT.espresso, target = targets[0];
  const dx = target.x - player.x, dz = target.z - player.z, length = Math.hypot(dx, dz) || 1;
  const end = { x: player.x + dx / length * range, z: player.z + dz / length * range };
  let hits = 0;
  for (const enemy of targets) {
    if (enemy.hp <= 0) continue;
    const along = ((enemy.x - player.x) * dx + (enemy.z - player.z) * dz) / length;
    const across = Math.abs((enemy.x - player.x) * dz - (enemy.z - player.z) * dx) / length;
    if (along > 0 && across < settings.width && hits < 2 + level) {
      damage(game, enemy, settings.baseDamage + level * settings.damagePerLevel);
      hits++;
      if (run.evolutions.includes('pulse')) {
        const zone = run.zones.find(item => Math.hypot(enemy.x - item.x, enemy.z - item.z) < item.radius);
        if (zone && !zone.pulsed) {
          areaHit(game, zone.x, zone.z, zone.radius * COMBAT.pulse.radiusMultiplier, COMBAT.pulse.damage);
          effects.pulse(zone.x, zone.z, zone.radius * COMBAT.pulse.radiusMultiplier);
          zone.pulsed = true;
        }
      }
    }
  }
  for (let distance = 0.1; distance <= range; distance += 0.1) {
    const point = { x: player.x + dx / length * distance, z: player.z + dz / length * distance };
    if (!canMove(point.x, point.z, 0.02, mapFor(run))) { end.x = point.x; end.z = point.z; break; }
  }
  effects.beam(player, end, '#eac07e');
}