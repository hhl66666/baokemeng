import { ENEMIES, ENEMY_ACTIONS } from '../config.js';
import { move } from '../world/collision.js';
import { hurtPlayer } from '../world/player.js';
import { mapFor } from '../data/maps.js';
import { bossFootprints, insideFootprint } from '../systems/boss.js';

export function updateEnemies(game, dt) {
  const { run } = game;
  const map = mapFor(run);
  for (const e of run.enemies) {
    if (e.hp <= 0) continue;
    e.age += dt; e.slow = Math.max(0, e.slow - dt);
    const x = run.player.x - e.x, z = run.player.z - e.z, distance = Math.hypot(x, z) || 1;
    const definition = ENEMIES[e.type];
    const speed = definition.speed * (e.slow > 0 ? 0.45 : 1);
    if (e.type === 'sugar') {
      const action = ENEMY_ACTIONS.sugar;
      e.attack = Math.max(0, e.attack - dt);
      if (e.windup > 0) {
        e.windup = Math.max(0, e.windup - dt);
        if (e.windup === 0) e.dash = action.dashDuration;
      } else if (e.dash > 0) {
        e.dash = Math.max(0, e.dash - dt);
        move(e, e.direction.x * action.dashSpeed * dt, e.direction.z * action.dashSpeed * dt, definition.radius, map);
      } else if (e.attack === 0 && distance < action.range) {
        e.windup = action.windup; e.attack = action.cooldown;
        e.direction = { x: x / distance, z: z / distance };
      } else move(e, x / distance * speed * dt, z / distance * speed * dt, definition.radius, map);
    } else {
      const oldX = e.x, oldZ = e.z;
      move(e, x / distance * speed * dt, z / distance * speed * dt, definition.radius, map);
      // 简单切线绕行避免敌群一直顶住家具；首版不是完整寻路系统。
      if (Math.hypot(e.x - oldX, e.z - oldZ) < speed * dt * 0.3) {
        move(e, -z / distance * speed * dt, x / distance * speed * dt, definition.radius, map);
      }
    }
    if (distance < (e.type === 'boss' ? 1.2 : 0.65)) hurtPlayer(game, definition.damage);
    if (e.type === 'boss') updateBoss(game, e, dt);
  }
}
function updateBoss(game, enemy, dt) {
  const action = mapFor(game.run).boss;
  enemy.attack = Math.max(0, enemy.attack - dt);
  if (enemy.windup > 0) {
    enemy.windup = Math.max(0, enemy.windup - dt);
    if (enemy.windup === 0) {
      const footprints = bossFootprints(game.run, enemy);
      for (const footprint of footprints) {
        game.effects.ring(footprint.x, footprint.z, footprint.radius ?? 1, '#e4af64', 0.4);
      }
      if (footprints.some(footprint => insideFootprint(game.run.player, footprint))) hurtPlayer(game, action.damage);
    }
  } else if (enemy.attack === 0) {
    enemy.attack = action.cooldown; enemy.windup = action.windup;
    enemy.direction = { x: game.run.player.x, z: game.run.player.z };
  }
}
