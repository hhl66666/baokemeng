import { RULES } from '../config.js';
import { move } from './collision.js';
import { mapFor } from '../data/maps.js';

export function updatePlayer(run, direction, dt) {
  const p = run.player;
  p.invulnerable = Math.max(0, p.invulnerable - dt);
  run.speedBuff = Math.max(0, (run.speedBuff ?? 0) - dt);
  const speed = run.speedBuff > 0 ? RULES.boostedSpeed : RULES.speed;
  move(p, direction.x * speed * dt, direction.z * speed * dt, RULES.playerRadius, mapFor(run));
}
export function hurtPlayer(game, amount) {
  const p = game.run.player;
  if (p.invulnerable > 0) return;
  p.hp = Math.max(0, p.hp - amount);
  p.invulnerable = RULES.invulnerability;
  game.audio.tone(140, 0.12, 0.035);
  game.effects.ring(p.x, p.z, 0.7, '#c67c59', 0.2);
}
