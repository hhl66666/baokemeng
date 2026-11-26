import * as THREE from 'three';
import { PixelLibrary } from './pixel/library.js';
import { createBillboard } from './billboard.js';

// 几何与普通材质在页面内共享；移除实体时不能单独 dispose 这些资源。
const materials = new Map();
export function material(color, roughness = 0.8, metalness = 0) {
  const key = `${color}-${roughness}-${metalness}`;
  if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, roughness, metalness }));
  return materials.get(key);
}
export const geometry = {
  cube: new THREE.BoxGeometry(1, 1, 1),
  sphere: new THREE.SphereGeometry(1, 16, 12),
  cylinder: new THREE.CylinderGeometry(1, 1, 1, 20),
  crystal: new THREE.OctahedronGeometry(0.45),
  drop: new THREE.OctahedronGeometry(0.13),
  ring: new THREE.RingGeometry(0.9, 1, 48),
  circle: new THREE.CircleGeometry(1, 40),
};
export const dropMaterials = Object.fromEntries(Object.entries({ xp: '#f4d276', heal: '#e39883', speed: '#a5dcbb' })
  .map(([id, color]) => [id, new THREE.MeshBasicMaterial({ color })]));

export function label(text, doc = document) {
  const canvas = doc.createElement('canvas'); canvas.width = 512; canvas.height = 192;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('无法绘制场景文字纹理');
  ctx.fillStyle = '#1e4a36'; ctx.fillRect(0, 0, 512, 192);
  ctx.fillStyle = '#f6edce'; ctx.textAlign = 'center'; ctx.font = 'bold 56px sans-serif'; ctx.fillText(text, 256, 113);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.PlaneGeometry(2.5, 0.94), new THREE.MeshBasicMaterial({ map: texture }));
}

/**
 * 敌人与首领都是 Billboard 像素精灵；体型由类型决定，精英只换金色图集。
 * 图集与材质由 PixelLibrary 共享，每个单位只独占一块四顶点平面。
 */
export function createEnemy(type, elite, bossId = 'mocha', { doc = document, library } = {}) {
  const pixels = library ?? new PixelLibrary(doc);
  const sheet = pixels.enemy(type, elite, bossId);
  const height = type === 'boss' ? 2.9 : type === 'cream' ? 1.35 : 1.1;
  const unit = createBillboard({
    sheet,
    height,
    shadow: pixels.shadow(),
    shadowWidth: height * 0.72,
    shadowDepth: height * 0.42,
  });
  unit.root.userData = {
    sheet, library: pixels, billboard: unit, body: unit.body, shadow: unit.shadow,
    type, elite, dispose: unit.dispose,
  };
  unit.setPose('idle', 0);
  unit.faceCamera(0);
  return unit.root;
}