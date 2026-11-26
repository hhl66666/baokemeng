import * as THREE from 'three';
import { Painter } from './paint.js';

export const FRAME_GUTTER = 1;
// 阴影贴地且不参与曲面变形，所有单位共用同一份几何，只按体型缩放。
export const shadowGeometry = new THREE.PlaneGeometry(1, 1);
shadowGeometry.rotateX(-Math.PI / 2);

function createCanvas(doc, width, height) {
  const canvas = doc.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function pixelTexture(canvas, { repeat = false } = {}) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  if (repeat) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
  }
  return texture;
}

/**
 * 逐帧画到独立小画布，再拼进一张图集。
 * 帧元数据统一为归一化 UV，运行时只改每个单位的 UV 属性，不克隆纹理。
 */
export function buildSheet({ doc = document, key = 'sheet', cellW, cellH, columns = 8, frames, drawFrame }) {
  const rows = Math.ceil(frames.length / columns);
  const atlasW = FRAME_GUTTER + columns * (cellW + FRAME_GUTTER);
  const atlasH = FRAME_GUTTER + rows * (cellH + FRAME_GUTTER);
  const atlas = createCanvas(doc, atlasW, atlasH);
  const context = atlas.getContext('2d');
  const frameMap = new Map();
  frames.forEach((frame, index) => {
    const cell = createCanvas(doc, cellW, cellH);
    const painter = new Painter(cell.getContext('2d'));
    painter.width = cellW;
    drawFrame(painter, frame, cellW, cellH);
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = FRAME_GUTTER + column * (cellW + FRAME_GUTTER);
    const y = FRAME_GUTTER + row * (cellH + FRAME_GUTTER);
    context.drawImage(cell, x, y);
    // Nearest 采样在边缘可能取到相邻像素，UV 四边各内缩半像素。
    frameMap.set(frame.key, {
      u0: (x + 0.5) / atlasW,
      u1: (x + cellW - 0.5) / atlasW,
      v0: 1 - (y + cellH - 0.5) / atlasH,
      v1: 1 - (y + 0.5) / atlasH,
    });
  });
  const texture = pixelTexture(atlas);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    alphaTest: 0.5,
    transparent: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  return {
    key, texture, material, frames: frameMap, cellW, cellH, atlasW, atlasH,
    dispose() {
      texture.dispose();
      material.dispose();
    },
  };
}

export function buildShadowTexture(doc = document) {
  const size = 16;
  const canvas = createCanvas(doc, size, size);
  const painter = new Painter(canvas.getContext('2d'));
  painter.width = size;
  painter.ellipse(8, 8, 7, 4, '#000000', 0.42);
  painter.ellipse(8, 8, 5, 2, '#000000', 0.55);
  const texture = pixelTexture(canvas);
  const material = new THREE.MeshBasicMaterial({
    map: texture, transparent: true, depthWrite: false, toneMapped: false, opacity: 0.9,
  });
  return { texture, material, dispose() { texture.dispose(); material.dispose(); } };
}

/** 16×16 可平铺像素底图；颜色交给地形顶点色，贴图只负责木纹/石纹颗粒。 */
export function buildTerrainTexture(doc, map) {
  const size = 16;
  const canvas = createCanvas(doc, size, size);
  const painter = new Painter(canvas.getContext('2d'));
  painter.width = size;
  const pattern = map?.terrain?.pattern ?? 'plank';
  painter.rect(0, 0, size, size, '#ffffff');
  if (pattern === 'stone') {
    const dots = [[1, 2], [5, 1], [9, 3], [13, 2], [3, 6], [11, 7], [15, 6], [7, 10], [1, 12], [13, 12], [5, 14], [9, 15]];
    for (const [x, y] of dots) painter.rect(x, y, 1, 1, '#e8e8e8');
    painter.rect(0, 5, size, 1, '#e2e2e2');
    painter.rect(0, 13, size, 1, '#e2e2e2');
  } else if (pattern === 'terra') {
    painter.rect(0, 0, size, 1, '#e6e6e6');
    painter.rect(0, 8, size, 1, '#e6e6e6');
    painter.rect(0, 0, 1, size, '#e6e6e6');
    painter.rect(8, 0, 1, size, '#e6e6e6');
    painter.rect(4, 4, 1, 1, '#dcdcdc');
    painter.rect(12, 12, 1, 1, '#dcdcdc');
  } else {
    for (let y = 0; y < size; y += 4) painter.rect(0, y, size, 1, '#e4e4e4');
    painter.rect(3, 0, 1, 4, '#ededed');
    painter.rect(11, 4, 1, 4, '#ededed');
    painter.rect(6, 8, 1, 4, '#ededed');
    painter.rect(14, 12, 1, 4, '#ededed');
  }
  const texture = pixelTexture(canvas, { repeat: true });
  return {
    texture,
    dispose() { texture.dispose(); },
  };
}