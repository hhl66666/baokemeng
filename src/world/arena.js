import * as THREE from 'three';
import { DEFAULT_MAP } from '../data/maps.js';
import { label } from './factory.js';
import { BlockBatch } from './blocks.js';
import { buildTerrain } from './terrain.js';
import { buildTerrainTexture } from './pixel/sheet.js';
import { addDecorations, terrainHeightAt } from './decor.js';

function addWalls(batch, map) {
  const halfWidth = map.halfWidth;
  const halfDepth = map.halfDepth;
  const wall = map.terrain.wall;
  const trim = map.terrain.trim ?? '#f1ead4';
  const backZ = -halfDepth - 1.55;
  const width = (halfWidth + 2) * 2;
  batch.add(0, 1.8, backZ, width, 3.6, 0.55, wall);
  batch.add(0, 3.68, backZ, width + 0.3, 0.22, 0.8, trim);
  for (const side of [-1, 1]) {
    batch.add(side * (halfWidth + 1.55), 1.5, 0, 0.55, 3.0, (halfDepth + 1.5) * 2, wall);
    batch.add(side * (halfWidth + 1.55), 3.08, 0, 0.75, 0.2, (halfDepth + 1.5) * 2, trim);
  }
  for (const x of [-7, -3]) {
    batch.add(x, 2.25, backZ + 0.29, 3.5, 2.05, 0.08, map.terrain.windowFrame ?? '#587b60');
    batch.add(x, 2.25, backZ + 0.34, 3.0, 1.55, 0.06, map.terrain.window ?? '#f7dfa1');
    batch.add(x, 2.25, backZ + 0.38, 0.09, 1.55, 0.04, '#fff3d4');
    batch.add(x, 2.25, backZ + 0.38, 3.0, 0.09, 0.04, '#fff3d4');
  }
  // 后墙腰线，给体素墙面一条清晰的水平分层。
  batch.add(0, 1.02, backZ + 0.29, width, 0.12, 0.06, map.terrain.trim ?? '#d9c9a5');
}

function addSofa(batch, obstacle, base, map) {
  const { x, z, w, d } = obstacle;
  const body = map.terrain.sofa ?? '#28573f';
  const back = map.terrain.sofaBack ?? '#416f51';
  const cushion = map.terrain.sofaCushion ?? '#689575';
  batch.add(x, base + 0.36, z, w, 0.72, d, body);
  batch.add(x - w / 2 + 0.28, base + 0.98, z, 0.5, 1.25, d, back);
  for (const offset of [-1.62, 0, 1.62]) {
    batch.add(x + 0.18, base + 0.82, z + offset, w - 0.9, 0.32, 1.35, cushion);
  }
  for (const offset of [-d / 2 + 0.22, d / 2 - 0.22]) {
    batch.add(x, base + 0.72, z + offset, w, 0.46, 0.42, back);
  }
  batch.add(x - 0.35, base + 1.18, z - 1.5, 0.55, 0.2, 0.55, map.terrain.pillow ?? '#e8d6a5', 0.25);
}

function addTable(batch, obstacle, base, map) {
  const { x, z, w, d } = obstacle;
  batch.add(x, base + 0.55, z, 0.28, 1.1, 0.28, map.terrain.tableLeg ?? '#805d3e');
  batch.add(x, base + 1.16, z, w, 0.16, d, map.terrain.table ?? '#cf9e67');
  batch.add(x, base + 1.32, z, 0.34, 0.18, 0.34, '#fff4d8');
  batch.add(x + 0.44, base + 1.24, z + 0.36, 0.18, 0.03, 0.18, '#76513a');
}

function addCounter(batch, obstacle, base, map) {
  const { x, z, w, d } = obstacle;
  batch.add(x, base + 0.65, z, w, 1.3, d, map.terrain.counter ?? '#e8dec3');
  batch.add(x, base + 1.38, z, w + 0.2, 0.16, d + 0.2, '#fff1d7');
  batch.add(x, base + 0.62, z + d / 2 + 0.03, w - 0.4, 0.72, 0.06, map.terrain.counterInset ?? '#5e8660');
  batch.add(x + 1.4, base + 1.82, z - 0.2, 1.9, 0.72, 0.88, '#9dad9d');
  batch.add(x + 1.4, base + 1.84, z + 0.24, 1.6, 0.28, 0.08, '#264f3d');
  for (const offset of [1, 1.7]) {
    batch.add(x + offset, base + 1.58, z + 0.42, 0.24, 0.2, 0.24, '#f7edd1');
    batch.add(x + offset, base + 1.72, z + 0.38, 0.12, 0.1, 0.08, '#e6bc6c');
  }
  for (const offset of [-2, -1.4]) {
    batch.add(x + offset, base + 1.58, z + 0.1, 0.3, 0.3, 0.3, '#235840');
  }
}

function addPlant(batch, obstacle, base, map) {
  const { x, z, w } = obstacle;
  const pot = map.terrain.pot ?? '#b6986c';
  const leaf = map.terrain.leaf ?? '#467c4b';
  batch.add(x, base + 0.4, z, w * 0.62, 0.8, w * 0.62, pot);
  batch.add(x, base + 1.0, z, w * 0.74, 0.42, w * 0.74, leaf, 0.2);
  batch.add(x + 0.1, base + 1.36, z - 0.05, w * 0.46, 0.34, w * 0.46, leaf, 0.6);
  batch.add(x - 0.12, base + 1.62, z + 0.08, w * 0.24, 0.24, w * 0.24, map.terrain.leafAlt ?? '#5f8f5a');
}

function addObstacle(batch, obstacle, map) {
  const base = 0.12;
  batch.add(obstacle.x, 0.06, obstacle.z, obstacle.w, 0.12, obstacle.d, map.terrain.plinth ?? '#8a6b4d');
  if (obstacle.kind === 'sofa') addSofa(batch, obstacle, base, map);
  else if (obstacle.kind === 'table') addTable(batch, obstacle, base, map);
  else if (obstacle.kind === 'counter') addCounter(batch, obstacle, base, map);
  else if (obstacle.kind === 'plant') addPlant(batch, obstacle, base, map);
}

function addMapDetails(batch, map) {
  const halfWidth = map.halfWidth;
  const halfDepth = map.halfDepth;
  if (map.id === 'rain') {
    for (const side of [-1, 1]) {
      const x = side * (halfWidth + 1.45);
      const z = 7.4;
      const ground = terrainHeightAt(map, x, z);
      batch.add(x, ground + 1.3, z, 0.16, 2.6, 0.16, '#4c596b');
      batch.add(x, ground + 2.72, z, 0.5, 0.34, 0.5, '#f4c98f');
      batch.add(x, ground + 2.96, z, 0.2, 0.12, 0.2, '#fff0c8');
    }
    batch.add(0, 3.9, -halfDepth - 1.5, 6.5, 0.28, 0.4, '#26465f');
    batch.add(0, 3.9, -halfDepth - 1.3, 5.9, 0.1, 0.2, '#a3c9df');
  } else if (map.id === 'garden') {
    for (const x of [-8, 8]) {
      const ground = terrainHeightAt(map, x, -halfDepth - 1.2);
      batch.add(x, ground + 1.7, -halfDepth - 1.2, 0.18, 3.4, 0.18, '#77916a');
    }
    batch.add(0, 3.4, -halfDepth - 1.2, 16.2, 0.18, 0.22, '#77916a');
    for (let x = -7; x <= 7; x += 2) {
      batch.add(x, 3.15, -halfDepth - 1.2, 0.9, 0.24, 0.36, '#6d9959');
      batch.add(x + 0.3, 3.34, -halfDepth - 1.2, 0.28, 0.22, 0.28, '#f0b5c3');
    }
  } else {
    for (const x of [-6, 6]) {
      batch.add(x, 2.8, -halfDepth - 1.22, 2.6, 0.16, 0.3, '#a9794c');
      batch.add(x - 0.8, 3.0, -halfDepth - 1.22, 0.3, 0.24, 0.3, '#f7edd1');
      batch.add(x + 0.7, 3.0, -halfDepth - 1.22, 0.26, 0.2, 0.26, '#e6bc6c');
    }
  }
}

/**
 * 体素地形 + 方块家具 + 实例化装饰 + 招牌。
 * 玩法仍以 maps.js 的障碍数据为准；这里的台阶只在场外，不改变碰撞高度。
 */
export function createArena(map = DEFAULT_MAP, doc = document) {
  const room = new THREE.Group();
  const texture = buildTerrainTexture(doc, map);
  const terrain = buildTerrain(map, texture);
  room.add(terrain);

  const batch = new BlockBatch();
  addWalls(batch, map);
  for (const obstacle of map.obstacles) addObstacle(batch, obstacle, map);
  addMapDetails(batch, map);
  addDecorations(batch, map);
  const blocks = batch.finalize();
  room.add(blocks);

  const sign = label(map.name, doc);
  sign.position.set(3.2, 2.5, -map.halfDepth - 1.18);
  room.add(sign);

  room.userData.dispose = () => {
    terrain.userData.dispose?.();
    blocks.geometry.dispose();
    blocks.material.dispose();
    blocks.dispose?.();
    sign.geometry.dispose();
    sign.material.map?.dispose();
    sign.material.dispose();
  };
  return room;
}