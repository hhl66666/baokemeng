import { DEFAULT_MAP } from '../data/maps.js';
import { RULES } from '../config.js';

/** 圆形实体与轴对齐家具占地的保守碰撞检测，不依赖渲染对象。 */
export function canMove(x, z, radius = RULES.playerRadius, map = DEFAULT_MAP) {
  return Math.abs(x) < map.halfWidth - radius && Math.abs(z) < map.halfDepth - radius &&
    !map.obstacles.some(o => Math.abs(x - o.x) < o.w / 2 + radius && Math.abs(z - o.z) < o.d / 2 + radius);
}
export function move(entity, dx, dz, radius = RULES.playerRadius, map = DEFAULT_MAP) {
  // 分轴移动允许沿墙滑动；直接拒绝整步移动会让角色卡住。
  if (canMove(entity.x + dx, entity.z, radius, map)) entity.x += dx;
  if (canMove(entity.x, entity.z + dz, radius, map)) entity.z += dz;
}
export function lineClear(a, b, map = DEFAULT_MAP) {
  // 地图障碍较大且数量固定，短距离采样即可阻断家具后的攻击与拾取。
  const steps = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.2);
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    if (!canMove(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t, 0.02, map)) return false;
  }
  return true;
}
