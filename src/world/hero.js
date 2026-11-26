import { DEFAULT_CHARACTER } from '../data/characters.js';
import { PixelLibrary } from './pixel/library.js';
import { createBillboard } from './billboard.js';

/**
 * 主角是 2.5D Billboard：根节点保留朝向，精灵平面每帧绕 Y 轴转向相机。
 * 图集由代码生成，皮肤换色只影响图集键，不新增纹理格式。
 */
export function createHero(character = DEFAULT_CHARACTER, colors = character.colors, { doc = document, library } = {}) {
  const pixels = library ?? new PixelLibrary(doc);
  const sheet = pixels.hero(character, colors);
  const unit = createBillboard({
    sheet,
    height: 2.1,
    shadow: pixels.shadow(),
    shadowWidth: 1.05,
    shadowDepth: 0.6,
  });
  const root = unit.root;
  root.name = character.id;
  root.userData = {
    sheet, library: pixels, billboard: unit, body: unit.body, shadow: unit.shadow,
    dispose: unit.dispose,
  };
  unit.setPose('idle', 0);
  unit.faceCamera(0);
  return root;
}