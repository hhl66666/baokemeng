import { mulberry32 } from './pixel/paint.js';

/** 与地形同一套分层规则，保证装饰物落在台阶顶面而不是悬空。 */
export function terrainHeightAt(map, x, z) {
  const edge = Math.max(Math.abs(x) - map.halfWidth, Math.abs(z) - map.halfDepth);
  if (edge <= 0) return 0;
  if (edge <= 1) return 0.35;
  if (edge <= 2) return 0.7;
  if (edge <= 3) return 1.05;
  return 0;
}

/**
 * 只在场外摆放装饰，不参与碰撞；随机数固定种子，布局每次启动一致。
 * 所有部件仍是方块实例，与家具、墙体共享同一份 InstancedMesh。
 */
export function addDecorations(batch, map) {
  const random = mulberry32((map.terrain?.seed ?? 1) * 1297 + 5);
  const halfWidth = map.halfWidth;
  const halfDepth = map.halfDepth;
  const pot = map.terrain?.pot ?? '#b6986c';
  const leaf = map.terrain?.leaf ?? '#467c4b';
  const leafAlt = map.terrain?.leafAlt ?? '#5f8f5a';
  const rock = map.terrain?.rock ?? '#8d8b80';
  const crate = map.terrain?.crate ?? '#a87a4e';
  const flower = map.terrain?.flower ?? '#e7aec1';

  // 两侧花盆：位于第一层台阶，树冠用两级方块压低面数。
  for (const side of [-1, 1]) {
    for (let i = 0; i < 6; i++) {
      const x = side * (halfWidth + 1.15);
      const z = -halfDepth + 1.5 + i * (halfDepth * 2 - 3) / 5;
      const ground = terrainHeightAt(map, x, z);
      batch.add(x, ground + 0.34, z, 0.72, 0.68, 0.72, pot);
      batch.add(x, ground + 0.86, z, 0.96, 0.38, 0.96, leaf);
      batch.add(x, ground + 1.12, z, 0.6, 0.26, 0.6, leafAlt, Math.PI / 4);
      if (map.id === 'garden') batch.add(x, ground + 1.3, z, 0.24, 0.16, 0.24, flower);
    }
  }

  // 台阶上的碎石。
  for (let i = 0; i < 20; i++) {
    const side = random() < 0.5 ? -1 : 1;
    const x = side * (halfWidth + 0.9 + random() * 1.6);
    const z = -halfDepth + random() * halfDepth * 2;
    const size = 0.26 + random() * 0.34;
    const ground = terrainHeightAt(map, x, z);
    batch.add(x, ground + size / 2, z, size, size * 0.8, size, rock, random() * Math.PI);
  }

  // 后墙角木箱与花架，位于可玩边界之外。
  for (const side of [-1, 1]) {
    for (let i = 0; i < 2; i++) {
      const x = side * (halfWidth + 2.4 + i * 0.9);
      const z = -halfDepth - 2.2 + random() * 0.8;
      const ground = terrainHeightAt(map, x, z);
      const size = 0.75 - i * 0.12;
      batch.add(x, ground + size / 2, z, size, size, size, crate, random() * 0.4 - 0.2);
    }
  }

  if (map.id === 'garden') {
    for (let i = 0; i < 5; i++) {
      const x = -halfWidth + 2 + i * 3.2;
      const ground = terrainHeightAt(map, x, -halfDepth - 1.1);
      batch.add(x, ground + 0.3, -halfDepth - 1.05, 1.1, 0.55, 0.8, pot);
      batch.add(x, ground + 0.62, -halfDepth - 1.05, 0.9, 0.2, 0.7, leafAlt);
      batch.add(x, ground + 0.78, -halfDepth - 1.05, 0.22, 0.14, 0.22, flower);
    }
  }
}