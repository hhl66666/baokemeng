import { COMBAT } from '../../config.js';
import { areaHit } from '../combat-core.js';

export function cast({ game, targets, level, area }) {
  const { effects } = game, settings = COMBAT.cocoa, target = targets[0];
  const radius = (settings.radius + level * settings.radiusPerLevel) * area;
  areaHit(game, target.x, target.z, radius, settings.baseDamage + level * settings.damagePerLevel);
  effects.pulse(target.x, target.z, radius);
  effects.burst(target.x, target.z, '#b88b73', 12);
}