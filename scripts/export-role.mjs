import { writeFileSync } from 'node:fs';
import { CHARACTERS } from '../src/data/characters.js';
import { HERO_CELL, drawHeroFrame, heroFrameList } from '../src/world/pixel/heroFrames.js';
import { Painter, makeRectSink, rectsToSvg } from '../src/world/pixel/paint.js';

const GUTTER = 1;
const COLUMNS = 8;
const SCALE = 4;

/**
 * 直接把 heroFrames 的 fillRect 矩形收集成 SVG，不创建 Three.js 场景或 WebGL。
 * 布局与运行时图集一致：逐帧留 1px 透明隔离边，避免 Nearest 采样串色。
 */
function paintFrames(frames, columns = COLUMNS) {
  const rows = Math.ceil(frames.length / columns);
  const width = GUTTER + columns * (HERO_CELL.width + GUTTER);
  const height = GUTTER + rows * (HERO_CELL.height + GUTTER);
  const sink = makeRectSink();
  const sheet = new Painter(sink);
  sheet.width = width;
  frames.forEach((frame, index) => {
    const x = GUTTER + (index % columns) * (HERO_CELL.width + GUTTER);
    const y = GUTTER + Math.floor(index / columns) * (HERO_CELL.height + GUTTER);
    drawHeroFrame(sheet.translated(x, y), frame, HERO_CELL.width, HERO_CELL.height);
  });
  return { width, height, rects: sink.rects };
}

function toSvg(frames, label, { columns = COLUMNS, scale = SCALE } = {}) {
  const painted = paintFrames(frames, columns);
  const { body, totalWidth, totalHeight } = rectsToSvg(painted.rects, {
    width: painted.width,
    height: painted.height,
    scale,
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}" role="img" aria-label="${label}" shape-rendering="crispEdges">${body}</svg>`;
}

const character = CHARACTERS.xiaoman;
const frames = heroFrameList(character);
const sheet = toSvg(frames, '小满像素图集：四方向 × 待机、行走、施法');
const idle = frames.find(frame => frame.key === 'down:idle:0');
const portrait = toSvg([idle], '小满像素待机立绘', { columns: 1, scale: 8 });

const output = new URL('../src/image/role/xiaoman.svg', import.meta.url);
const portraitOutput = new URL('../src/image/role/xiaoman-portrait.svg', import.meta.url);
writeFileSync(output, sheet);
writeFileSync(portraitOutput, portrait);
console.log(`已导出 ${output.pathname}（${frames.length} 帧，${SCALE} 倍）`);
console.log(`已导出 ${portraitOutput.pathname}（单帧待机，8 倍）`);
console.log('SVG 使用透明背景，可直接替换为同尺寸 PNG 而不改变 UV 图集契约。');