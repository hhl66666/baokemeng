import { RULES, COMBAT } from '../../config.js';
import { areaHit } from '../combat-core.js';
import { mapFor } from '../../data/maps.js';

export function cast({ game, level, area, moving }) {
  if (!moving) return false;
  const { run } = game, settings = COMBAT.caramel;
  if (run.zones.length < RULES.maxZones) {
    const radius = (settings.radius + level * settings.radiusPerLevel) * area;
    run.zones.push({ x: run.player.x, z: run.player.z, life: settings.life + level, tick: 0, radius });
    game.effects.slash(run.player, game.world.hero.rotation.y, radius, '#dca459', 0.4);
    game.world.cast('caramel', run.player);
  }
  return true;
}

export function updateZones(game, dt) {
  const { run } = game, settings = COMBAT.caramel;
  for (const zone of run.zones) {
    zone.life = Math.max(0, zone.life - dt);
    zone.tick = Math.max(0, zone.tick - dt);
    if (zone.tick === 0) {
      areaHit(game, zone.x, zone.z, zone.radius, settings.baseDamage + (run.skills.caramel ?? 1) * settings.damagePerLevel);
      zone.tick = settings.tick;
    }
  }
  run.zones = run.zones.filter(zone => zone.life > 0);
}