import { RULES, SPAWNING, ENEMIES, ENEMY_ACTIONS } from '../config.js';
import { mapFor } from '../data/maps.js';
import { canMove } from '../world/collision.js';

export function createEnemyState(type, x, z, hp, elite = false) {
  return {
    type, x, z, hp, maxHp: hp, elite, age: 0, slow: 0,
    attack: type === 'boss' ? ENEMY_ACTIONS.boss.firstAttack : 0,
    windup: 0, dash: 0, direction: { x: 0, z: 0 },
  };
}
export function spawnEnemy(run, type, elite = false, random = Math.random) {
  const p = run.player, s = SPAWNING;
  for (let i = 0; i < s.attempts; i++) {
    const angle = random() * Math.PI * 2;
    const x = p.x + Math.cos(angle) * (s.minDistance + random() * s.distanceSpread);
    const z = p.z + Math.sin(angle) * (s.minDistance + random() * s.distanceSpread);
    if (!canMove(x, z, 0.45, mapFor(run))) continue;
    const hp = ENEMIES[type].hp * (1 + run.time / s.hpRamp) * (elite ? s.eliteHealth : 1);
    run.enemies.push(createEnemyState(type, x, z, hp, elite));
    return true;
  }
  // 边缘无合法位置时跳过该次生成，不强行生成在家具里。
  return false;
}
export function updateSpawner(game, dt) {
  const { run } = game, s = SPAWNING;
  if (run.time < RULES.bossTime) {
    run.spawnClock = Math.max(0, run.spawnClock - dt);
    if (run.spawnClock <= 0 && run.enemies.length < RULES.maxEnemies) {
      const type = run.time > s.creamAfter && Math.random() < s.creamChance ? 'cream' :
        run.time > s.sugarAfter && Math.random() < s.sugarChance ? 'sugar' : 'bean';
      spawnEnemy(run, type, run.time > s.eliteAfter && Math.random() < s.eliteChance);
      run.spawnClock = Math.max(s.minInterval, s.initialInterval - run.time / s.intervalRamp);
    }
  } else if (!run.bossSpawned) {
    // 此标记进入存档，恢复或后续帧都不会重复清场和生成首领。
    run.bossSpawned = true;
    const map = mapFor(run), point = map.bossSpawn;
    run.enemies = [createEnemyState('boss', point.x, point.z, map.boss.hp)];
    game.pause(`${map.boss.name}登场`, map.boss.hint);
    return true;
  }
  return false;
}
