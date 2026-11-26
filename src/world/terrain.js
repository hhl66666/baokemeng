import * as THREE from 'three';
import { mulberry32 } from './pixel/paint.js';

/**
 * 视觉分层地形：可玩矩形内高度恒为 0，只在场外生成台阶与土丘。
 * 贪心合并同高度、同颜色的顶面与侧面，整张地形输出一个几何体。
 */
export function buildHeightmap(map) {
  const halfWidth = map.halfWidth;
  const halfDepth = map.halfDepth;
  const pad = 5;
  const cells = new Map();
  const tints = map.terrain?.tints ?? map.colors.floor;
  const curb = map.terrain?.curb ?? '#b7a582';
  const terrace = map.terrain?.terrace ?? '#8f9c7e';
  const seed = map.terrain?.seed ?? 1;
  const tintAt = (x, z) => tints[Math.abs((Math.floor((x + 64) / 2) * 7 + Math.floor((z + 64) / 2) * 13)) % tints.length];
  const set = (x, z, h, color) => cells.set(`${x},${z}`, { x, z, h, color });

  const minX = -Math.ceil(halfWidth) - pad;
  const maxX = Math.ceil(halfWidth) + pad;
  const minZ = -Math.ceil(halfDepth) - pad;
  const maxZ = Math.ceil(halfDepth) + pad;
  for (let x = minX; x <= maxX; x++) {
    for (let z = minZ; z <= maxZ; z++) {
      const fallX = Math.abs(x) - halfWidth;
      const fallZ = Math.abs(z) - halfDepth;
      const edge = Math.max(fallX, fallZ);
      if (edge <= 0) {
        const border = Math.abs(x) >= halfWidth - 0.5 || Math.abs(z) >= halfDepth - 0.5;
        set(x, z, 0, border ? curb : tintAt(x, z));
      } else if (edge <= 1) {
        set(x, z, 0.35, curb);
      } else if (edge <= 2) {
        set(x, z, 0.7, terrace);
      } else if (edge <= 3) {
        set(x, z, 1.05, terrace);
      }
    }
  }

  // 墙外土丘：固定种子，保证每次启动位置一致，也与可玩平面无关。
  const random = mulberry32(seed * 7919 + 17);
  for (let mound = 0; mound < 4; mound++) {
    const side = mound % 2 ? 1 : -1;
    const centerX = side * (halfWidth + 3.4 + random() * 1.2);
    const centerZ = -halfDepth + 2 + random() * (halfDepth * 2 - 4);
    const height = 1.25 + random() * 0.65;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        if (random() < 0.28) continue;
        const x = Math.round(centerX) + dx;
        const z = Math.round(centerZ) + dz;
        set(x, z, height + (random() - 0.5) * 0.18, terrace);
      }
    }
  }
  return cells;
}

function greedyRects(cellKeys, bounds) {
  const used = new Set();
  const rects = [];
  for (let z = bounds.z0; z <= bounds.z1; z++) {
    for (let x = bounds.x0; x <= bounds.x1; x++) {
      const key = `${x},${z}`;
      if (!cellKeys.has(key) || used.has(key)) continue;
      let width = 0;
      while (cellKeys.has(`${x + width},${z}`) && !used.has(`${x + width},${z}`)) width++;
      let depth = 1;
      outer: while (z + depth <= bounds.z1) {
        for (let dx = 0; dx < width; dx++) {
          const next = `${x + dx},${z + depth}`;
          if (!cellKeys.has(next) || used.has(next)) break outer;
        }
        depth++;
      }
      for (let dz = 0; dz < depth; dz++) {
        for (let dx = 0; dx < width; dx++) used.add(`${x + dx},${z + dz}`);
      }
      rects.push({ x, z, width, depth });
    }
  }
  return rects;
}

export function greedyMesh(cells) {
  const positions = [];
  const normals = [];
  const uvs = [];
  const colors = [];
  const indices = [];
  const color = new THREE.Color();
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (const cell of cells.values()) {
    x0 = Math.min(x0, cell.x); x1 = Math.max(x1, cell.x);
    z0 = Math.min(z0, cell.z); z1 = Math.max(z1, cell.z);
  }
  if (!cells.size) return new THREE.BufferGeometry();

  const quad = (points, normal, hex) => {
    const base = positions.length / 3;
    const tint = color.set(hex);
    points.forEach(point => {
      positions.push(point[0], point[1], point[2]);
      normals.push(normal[0], normal[1], normal[2]);
      uvs.push(point[3], point[4]);
      colors.push(tint.r, tint.g, tint.b);
    });
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };

  const groups = new Map();
  for (const [key, cell] of cells) {
    const groupKey = `${cell.h.toFixed(3)}|${cell.color}`;
    if (!groups.has(groupKey)) groups.set(groupKey, { height: cell.h, color: cell.color, keys: new Set() });
    groups.get(groupKey).keys.add(key);
  }
  for (const group of groups.values()) {
    for (const rect of greedyRects(group.keys, { x0, x1, z0, z1 })) {
      const ax = rect.x - 0.5, bx = rect.x + rect.width - 0.5;
      const az = rect.z - 0.5, bz = rect.z + rect.depth - 0.5;
      const y = group.height;
      quad(
        [[ax, y, az, ax, az], [ax, y, bz, ax, bz], [bx, y, bz, bx, bz], [bx, y, az, bx, az]],
        [0, 1, 0], group.color,
      );
    }
  }

  const sides = [
    { id: '+x', dx: 1, dz: 0, axis: 'x' },
    { id: '-x', dx: -1, dz: 0, axis: 'x' },
    { id: '+z', dx: 0, dz: 1, axis: 'z' },
    { id: '-z', dx: 0, dz: -1, axis: 'z' },
  ];
  for (const side of sides) {
    const runs = new Map();
    for (const cell of cells.values()) {
      const neighbor = cells.get(`${cell.x + side.dx},${cell.z + side.dz}`);
      const low = neighbor ? neighbor.h : 0;
      if (low >= cell.h) continue;
      const fixed = side.axis === 'x' ? cell.x : cell.z;
      const vary = side.axis === 'x' ? cell.z : cell.x;
      const groupKey = `${fixed}|${low.toFixed(3)}|${cell.h.toFixed(3)}|${cell.color}`;
      if (!runs.has(groupKey)) runs.set(groupKey, { fixed, low, high: cell.h, color: cell.color, values: [] });
      runs.get(groupKey).values.push(vary);
    }
    for (const run of runs.values()) {
      run.values.sort((a, b) => a - b);
      let start = 0;
      while (start < run.values.length) {
        let end = start;
        while (end + 1 < run.values.length && run.values[end + 1] === run.values[end] + 1) end++;
        const a = run.values[start] - 0.5;
        const b = run.values[end] + 0.5;
        const low = run.low, high = run.high;
        if (side.id === '+x') {
          const x = run.fixed + 0.5;
          quad([[x, low, b, b, low], [x, low, a, a, low], [x, high, a, a, high], [x, high, b, b, high]], [1, 0, 0], run.color);
        } else if (side.id === '-x') {
          const x = run.fixed - 0.5;
          quad([[x, low, a, a, low], [x, low, b, b, low], [x, high, b, b, high], [x, high, a, a, high]], [-1, 0, 0], run.color);
        } else if (side.id === '+z') {
          const z = run.fixed + 0.5;
          quad([[a, low, z, a, low], [b, low, z, b, low], [b, high, z, b, high], [a, high, z, a, high]], [0, 0, 1], run.color);
        } else {
          const z = run.fixed - 0.5;
          quad([[b, low, z, b, low], [a, low, z, a, low], [a, high, z, a, high], [b, high, z, b, high]], [0, 0, -1], run.color);
        }
        start = end + 1;
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}

export function buildTerrain(map, texture) {
  const geometry = greedyMesh(buildHeightmap(map));
  const material = new THREE.MeshLambertMaterial({ map: texture.texture, vertexColors: true });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  mesh.userData.dispose = () => {
    geometry.dispose();
    material.dispose();
    texture.dispose();
  };
  return mesh;
}