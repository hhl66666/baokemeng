import { buildSheet, buildShadowTexture } from './sheet.js';
import { heroFrameList, drawHeroFrame, HERO_CELL } from './heroFrames.js';
import { enemyFrameList, drawEnemyFrame, enemyCells } from './enemyFrames.js';
import { hashPalette } from './paint.js';

/**
 * 一个 WorldView 持有一份像素库；相同皮肤/怪物类型只生成一次图集。
 * 纹理与材质由本库统一释放，视图层不要单独 dispose 共享图集。
 */
export class PixelLibrary {
  constructor(doc = document) {
    this.doc = doc;
    this.sheets = new Map();
    this.shadowSheet = null;
  }

  get(key, create) {
    if (!this.sheets.has(key)) this.sheets.set(key, create());
    return this.sheets.get(key);
  }

  hero(character, colors = character.colors) {
    const key = `hero:${character.id}:${hashPalette(colors)}`;
    return this.get(key, () => buildSheet({
      doc: this.doc,
      key,
      cellW: HERO_CELL.width,
      cellH: HERO_CELL.height,
      columns: 8,
      frames: heroFrameList(character, colors),
      drawFrame: drawHeroFrame,
    }));
  }

  enemy(type, elite = false, bossId = 'mocha') {
    const key = `enemy:${type}:${bossId}:${elite ? 'elite' : 'base'}`;
    const cell = enemyCells(type);
    return this.get(key, () => buildSheet({
      doc: this.doc,
      key,
      cellW: cell.width,
      cellH: cell.height,
      columns: 6,
      frames: enemyFrameList({ type, bossId, elite }),
      drawFrame: drawEnemyFrame,
    }));
  }

  shadow() {
    if (!this.shadowSheet) this.shadowSheet = buildShadowTexture(this.doc);
    return this.shadowSheet;
  }

  dispose() {
    for (const sheet of this.sheets.values()) sheet.dispose();
    this.sheets.clear();
    this.shadowSheet?.dispose();
    this.shadowSheet = null;
  }
}