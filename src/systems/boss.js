import { mapFor } from '../data/maps.js';

// 预警视图与伤害共用同一足迹，避免换首领后“看见的安全区”仍然受伤。
export function bossFootprints(run, enemy) {
  const { x, z } = enemy.direction;
  switch (mapFor(run).boss.id) {
    case 'mocha': return [{ shape: 'circle', x, z, radius: 2.1 }];
    case 'steam': return [
      { shape: 'rect', x, z, width: 10, depth: 1.5 },
      { shape: 'rect', x, z, width: 1.5, depth: 10 },
    ];
    case 'vine': return [
      { shape: 'circle', x, z, radius: 1.65 },
      { shape: 'circle', x: x - 2.7, z: z - 1.8, radius: 1.65 },
      { shape: 'circle', x: x + 2.7, z: z - 1.8, radius: 1.65 },
    ];
    default: throw new Error('未知首领攻击');
  }
}
export function insideFootprint(point, footprint) {
  return footprint.shape === 'circle' ?
    Math.hypot(point.x - footprint.x, point.z - footprint.z) < footprint.radius :
    Math.abs(point.x - footprint.x) < footprint.width / 2 && Math.abs(point.z - footprint.z) < footprint.depth / 2;
}
