import * as THREE from 'three';
import { geometry } from '../world/factory.js';
import { VISUALS } from '../config.js';
import { canMove } from '../world/collision.js';

const starShape = new THREE.Shape();
for (let i = 0; i <= 8; i++) {
  const angle = i * Math.PI / 4;
  const radius = i % 2 ? 0.24 : 1;
  const x = Math.cos(angle) * radius, y = Math.sin(angle) * radius;
  if (i === 0) starShape.moveTo(x, y);
  else starShape.lineTo(x, y);
}
const starGeometry = new THREE.ShapeGeometry(starShape);
const crystalGeometry = new THREE.OctahedronGeometry(1);
const bubbleGeometry = new THREE.SphereGeometry(1, 8, 6);
const scratch = new THREE.Object3D();

function glow(color, opacity = 1, additive = true) {
  return new THREE.MeshBasicMaterial({
    color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    toneMapped: false,
  });
}

/** 仅表现层：不延迟命中、不修改存档。所有独占几何/纹理在消退或重开时释放。 */
export class Effects {
  constructor(scene, doc = document) {
    this.scene = scene;
    this.doc = doc;
    this.items = [];
    this.lastHits = new WeakMap();
  }
  add(mesh, life, update, { ownGeometry = false, ownTexture = false, label = false } = {}) {
    // 特效预算有意丢弃装饰，敌人的危险预警由 WorldView 独立维护。
    if (this.items.length >= VISUALS.maxEffects ||
        (label && this.items.filter(item => item.label).length >= VISUALS.maxDamageLabels)) {
      this.release({ mesh, ownGeometry, ownTexture });
      return;
    }
    // 创建的同帧可能弹出升级暂停；初始姿态也必须落在施法点而非世界原点。
    update(0);
    this.scene.add(mesh);
    this.items.push({ mesh, life, total: life, update, ownGeometry, ownTexture, label, opacity: mesh.material.opacity });
  }
  ring(x, z, radius, color, life = 0.35, filled = false) {
    const mesh = new THREE.Mesh(filled ? geometry.circle : geometry.ring, glow(color, filled ? 0.13 : 0.7, !filled));
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, filled ? 0.08 : 0.13, z);
    this.add(mesh, life, progress => {
      mesh.scale.setScalar(radius * (0.25 + 0.75 * (1 - (1 - progress) ** 3)));
    });
  }
  /** 锥形月牙：顶点色让亮刃与透明尾部自然过渡，不使用巨大的实心白圆。 */
  slash(origin, yaw, radius, color = '#ffdb8d', life = 0.4) {
    const positions = [], colors = [], indices = [];
    const segments = 36;
    const bright = new THREE.Color('#fff5d5'), edge = new THREE.Color(color);
    for (let i = 0; i <= segments; i++) {
      const t = i / segments, angle = -1.8 + t * 3.9;
      const taper = Math.sin(Math.PI * t) ** 0.7;
      const inner = radius - 0.34 * taper;
      for (const [r, c] of [[inner, edge], [radius, bright]]) {
        positions.push(Math.sin(angle) * r, 0.2 + taper * 0.55, Math.cos(angle) * r);
        colors.push(c.r, c.g, c.b);
      }
      if (i < segments) {
        const n = i * 2;
        indices.push(n, n + 1, n + 2, n + 1, n + 3, n + 2);
      }
    }
    const ribbon = new THREE.BufferGeometry();
    ribbon.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    ribbon.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    ribbon.setIndex(indices);
    ribbon.computeBoundingSphere();
    const mat = glow('#ffffff', 0.8);
    mat.vertexColors = true;
    const mesh = new THREE.Mesh(ribbon, mat);
    mesh.position.set(origin.x, 0.12, origin.z);
    mesh.rotation.y = yaw;
    this.add(mesh, life, progress => {
      const head = Math.min(1, progress / 0.32);
      const tail = Math.max(0, (progress - 0.4) / 0.6);
      const start = Math.floor(tail * segments) * 6;
      ribbon.setDrawRange(start, Math.max(0, Math.ceil(head * segments) * 6 - start));
      mesh.rotation.y = yaw + progress * 0.45;
    }, { ownGeometry: true });
  }
  foam(a, b, level) {
    const yaw = Math.atan2(b.x - a.x, b.z - a.z);
    this.slash(a, yaw, 1.1 + level * 0.13);
    const dx = b.x - a.x, dz = b.z - a.z;
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(a.x, 1.05, a.z),
      new THREE.Vector3((a.x + b.x) / 2 - dz * 0.14, 1.6, (a.z + b.z) / 2 + dx * 0.14),
      new THREE.Vector3(b.x, 0.6, b.z),
    );
    // 命中走直线视线检测；靠近家具时收直装饰弧线，避免侧向穿过障碍。
    if (curve.getPoints(12).some(point => !canMove(point.x, point.z, 0.02, this.map))) {
      curve.v1.x = (a.x + b.x) / 2;
      curve.v1.z = (a.z + b.z) / 2;
    }
    const tube = new THREE.TubeGeometry(curve, 18, 0.065 + level * 0.006, 5, false);
    const mesh = new THREE.Mesh(tube, glow('#ffedbf', 0.8));
    this.add(mesh, 0.24, progress => { mesh.scale.y = 1 - progress * 0.08; }, { ownGeometry: true });
    this.burst(a.x, a.z, '#fff3cd', 7, 'bubble', 0.45);
  }
  beam(a, b, color) {
    const length = Math.hypot(b.x - a.x, b.z - a.z);
    // 三层光束共用盒几何：深金外缘、暖光晕、奶白核心。
    for (const [width, tint, opacity] of [[0.38, color, 0.24], [0.16, '#ffd88d', 0.7], [0.055, '#fff7dd', 0.95]]) {
      const mesh = new THREE.Mesh(geometry.cube, glow(tint, opacity));
      mesh.position.set((a.x + b.x) / 2, 0.85, (a.z + b.z) / 2);
      mesh.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
      this.add(mesh, 0.28, progress => {
        mesh.scale.set(width * (1 - progress * 0.7), width * 0.7, length);
      });
    }
    this.burst(b.x, b.z, '#edc078', 7);
  }
  ice(origin, radius, evolved = false) {
    this.ring(origin.x, origin.z, radius, evolved ? '#b5e9ff' : '#b5ecd8', 0.65);
    this.ring(origin.x, origin.z, radius * 0.83, '#f4fff0', 0.48);
    this.burst(origin.x, origin.z, '#b9f1e0', 16, 'crystal', 0.7, radius);
  }
  pulse(x, z, radius) {
    this.slash({ x, z }, 0, radius, '#e9b568', 0.5);
    this.slash({ x, z }, Math.PI, radius * 0.83, '#fff0bd', 0.45);
    this.ring(x, z, radius, '#ffd99b', 0.5);
    this.burst(x, z, '#ffe4a3', 12);
  }
  burst(x, z, color, count = 10, type = 'star', life = 0.45, spread = 0.8) {
    count = Math.min(count, VISUALS.maxBurstParticles);
    const shape = type === 'crystal' ? crystalGeometry : type === 'bubble' ? bubbleGeometry : starGeometry;
    const mesh = new THREE.InstancedMesh(shape, glow(color, type === 'bubble' ? 0.5 : 0.9), count);
    mesh.frustumCulled = false;
    const particles = Array.from({ length: count }, (_, i) => {
      const angle = i / count * Math.PI * 2 + Math.random() * 0.35;
      return { x: Math.cos(angle), z: Math.sin(angle), lift: 0.5 + Math.random(), size: 0.06 + Math.random() * 0.09 };
    });
    this.add(mesh, life, progress => {
      particles.forEach((p, index) => {
        const travel = spread * (0.15 + progress * 1.2);
        scratch.position.set(x + p.x * travel, 0.35 + Math.sin(progress * Math.PI) * p.lift, z + p.z * travel);
        scratch.rotation.set(type === 'star' ? -0.5 : progress * 4, progress * 3, index + progress * 2);
        const size = p.size * (1 - progress * 0.85);
        scratch.scale.set(size, type === 'crystal' ? size * 2.4 : size, size);
        scratch.updateMatrix();
        mesh.setMatrixAt(index, scratch.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    });
  }
  hit(enemy, amount, time) {
    const last = this.lastHits.get(enemy) ?? -Infinity;
    if (time - last < VISUALS.hitInterval) return;
    this.lastHits.set(enemy, time);
    this.burst(enemy.x, enemy.z, '#ffe29c', 7);
    this.damageLabel(enemy.x, enemy.z, Math.ceil(amount));
  }
  damageLabel(x, z, amount) {
    if (this.items.filter(item => item.label).length >= VISUALS.maxDamageLabels || this.items.length >= VISUALS.maxEffects) return;
    const canvas = this.doc.createElement('canvas');
    canvas.width = 192; canvas.height = 96;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('无法绘制伤害文字');
    ctx.font = 'italic 900 56px sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 7;
    ctx.strokeStyle = '#754728';
    ctx.fillStyle = '#fff0c1';
    ctx.strokeText(`${amount}`, 96, 65);
    ctx.fillText(`${amount}`, 96, 65);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false }));
    this.add(mesh, 0.65, progress => {
      mesh.position.set(x, 1.25 + progress * 1.1, z);
      mesh.scale.set(0.9 + Math.sin(progress * Math.PI) * 0.12, 0.45, 1);
    }, { ownTexture: true, label: true });
  }
  update(dt) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const fx = this.items[i];
      fx.life -= dt;
      if (fx.life <= 0) {
        this.release(fx);
        this.items.splice(i, 1);
        continue;
      }
      const progress = 1 - fx.life / fx.total;
      fx.update(progress);
      fx.mesh.material.opacity = fx.opacity * Math.min(1, (1 - progress) * 2);
    }
  }
  release({ mesh, ownGeometry, ownTexture }) {
    this.scene.remove(mesh);
    if (ownGeometry) mesh.geometry.dispose();
    if (ownTexture) mesh.material.map.dispose();
    if (mesh.isInstancedMesh) mesh.dispose();
    mesh.material.dispose();
  }
  clear() {
    for (const fx of this.items) this.release(fx);
    this.items.length = 0;
    this.lastHits = new WeakMap();
  }
}
