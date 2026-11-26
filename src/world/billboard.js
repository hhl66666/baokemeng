import * as THREE from 'three';
import { shadowGeometry } from './pixel/sheet.js';

export function shortestAngle(value) {
  return Math.atan2(Math.sin(value), Math.cos(value));
}

/**
 * 精灵始终绕 Y 轴正对相机；朝向只决定读取图集的哪一组方向帧。
 * rel>0 表示角色朝向落在相机右前方，读取面向屏幕右侧的帧。
 */
export function directionFor(facingYaw, cameraYaw) {
  const relative = shortestAngle(facingYaw - cameraYaw);
  const absolute = Math.abs(relative);
  if (absolute < Math.PI * 50 / 180) return 'down';
  if (absolute > Math.PI * 130 / 180) return 'up';
  return relative > 0 ? 'right' : 'left';
}

/**
 * 一个单位 = 根节点（位置/朝向）+ 身体（受击压缩/弹跳）+ 精灵平面 + 贴地阴影。
 * 每个单位只克隆一块 4 顶点平面，切帧时写 UV，不复制纹理与材质。
 */
export function createBillboard({ sheet, height, shadow, shadowWidth, shadowDepth }) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const geometry = new THREE.PlaneGeometry(1, 1);
  geometry.translate(0, 0.5, 0);
  const uv = geometry.getAttribute('uv');
  const width = height * sheet.cellW / sheet.cellH;
  const plane = new THREE.Mesh(geometry, sheet.material);
  plane.scale.set(width, height, 1);
  body.add(plane);
  let shadowMesh = null;
  if (shadow) {
    shadowMesh = new THREE.Mesh(shadowGeometry, shadow.material);
    shadowMesh.scale.set(shadowWidth ?? width * 0.8, 1, shadowDepth ?? width * 0.55);
    shadowMesh.position.y = 0.012;
    root.add(shadowMesh);
  }
  let action = 'idle';
  let frameIndex = 0;
  let direction = 'down';

  function applyFrame() {
    const frames = sheet.frames;
    const frame = frames.get(`${direction}:${action}:${frameIndex}`)
      ?? frames.get(`${direction}:${action}:0`)
      ?? frames.get(`${direction}:idle:0`)
      ?? frames.values().next().value;
    if (!frame) return;
    uv.setXY(0, frame.u0, frame.v1);
    uv.setXY(1, frame.u1, frame.v1);
    uv.setXY(2, frame.u0, frame.v0);
    uv.setXY(3, frame.u1, frame.v0);
    uv.needsUpdate = true;
  }

  function setPose(nextAction, nextFrame) {
    action = nextAction;
    frameIndex = nextFrame;
  }

  function faceCamera(cameraYaw) {
    plane.rotation.y = shortestAngle(cameraYaw - root.rotation.y);
    direction = directionFor(root.rotation.y, cameraYaw);
    applyFrame();
  }

  applyFrame();
  return {
    root, body, plane, shadow: shadowMesh, width, height,
    setPose, faceCamera,
    get action() { return action; },
    get frameIndex() { return frameIndex; },
    get direction() { return direction; },
    dispose() { geometry.dispose(); },
  };
}