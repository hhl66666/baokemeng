import { RULES, REWARDS, ENEMIES } from '../config.js';
import { lineClear, move } from '../world/collision.js';
import { mapFor } from '../data/maps.js';
import { addXp } from '../core/state.js';

export function addDrop(run, x, z, type, amount) {
  if (run.drops.length >= RULES.maxDrops) {
    const existing = run.drops.find(drop => drop.type === type);
    if (existing) { existing.amount += amount; return; }
    console.warn('掉落物数量上限：丢弃非必要补给', type);
    return;
  }
  run.drops.push({ x, z, type, amount });
}
export function damage(game, enemy, amount, knockback = 0) {
  if (enemy.hp <= 0) return;
  const { run, effects } = game;
  effects.hit(enemy, Math.min(enemy.hp, amount), run.time);
  game.world.hit(enemy, run.time);
  enemy.hp -= amount;
  if (knockback && enemy.type !== 'boss') {
    const dx = enemy.x - run.player.x, dz = enemy.z - run.player.z;
    const distance = Math.hypot(dx, dz) || 1;
    move(enemy, dx / distance * knockback, dz / distance * knockback, ENEMIES[enemy.type].radius, mapFor(run));
  }
  if (enemy.hp > 0) return;
  run.kills++;
  if (enemy.elite) run.materials += REWARDS.eliteMaterials;
  if (enemy.type === 'boss') run.materials += REWARDS.bossMaterials;
  addDrop(run, enemy.x, enemy.z, 'xp', enemy.elite ? REWARDS.eliteXp : ENEMIES[enemy.type].xp);
  if (Math.random() < REWARDS.healChance && enemy.type !== 'boss') addDrop(run, enemy.x, enemy.z, 'heal', REWARDS.healAmount);
  else if (Math.random() < REWARDS.speedChance) addDrop(run, enemy.x, enemy.z, 'speed', REWARDS.speedDuration);
  effects.burst(enemy.x, enemy.z, '#e8b776', 10, 'bubble', 0.45);
}
export function areaHit(game, x, z, radius, amount) {
  for (const enemy of game.run.enemies) {
    if (Math.hypot(enemy.x - x, enemy.z - z) < radius && lineClear({ x, z }, enemy, mapFor(game.run))) {
      damage(game, enemy, amount);
    }
  }
}