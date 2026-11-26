import { COMBAT } from '../../config.js';
import { damage } from '../combat-core.js';

export function cast({ game, targets, level, range }) {
  const { run, effects } = game, settings = COMBAT.ice;
  effects.ice(run.player, range);
  for (const enemy of targets) {
    damage(game, enemy, settings.baseDamage + level * settings.damagePerLevel);
    enemy.slow = settings.slow + level * settings.slowPerLevel;
  }
}