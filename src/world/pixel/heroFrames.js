export const HERO_CELL = { width: 48, height: 64 };
export const HERO_DIRECTIONS = ['down', 'left', 'right', 'up'];
export const HERO_ACTIONS = { idle: 2, walk: 4, attack: 4 };
const OUTLINE = '#2b2320';
const EYE_WHITE = '#fff8e9';

function palette(colors = {}, characterId) {
  const fallback = characterId === 'xiaolong'
    ? { shirt: '#b72f3c', pants: '#f3eddf', trim: '#8f2633', gold: '#cda65e', black: '#25262a' }
    : { shirt: '#f5e5c4', pants: '#283e35', apron: '#286648', pocket: '#6d9770', shoes: '#a7764b' };
  return {
    skin: colors.skin ?? '#efc29e',
    hair: colors.hair ?? '#654333',
    fringe: colors.fringe ?? colors.hair ?? '#835638',
    highlight: colors.highlight ?? '#f0d7a4',
    shirt: colors.shirt ?? fallback.shirt,
    pants: colors.pants ?? fallback.pants,
    apron: colors.apron ?? colors.trim ?? fallback.apron ?? fallback.trim ?? '#286648',
    pocket: colors.pocket ?? fallback.pocket ?? colors.trim ?? '#6d9770',
    shoes: colors.shoes ?? fallback.shoes ?? '#a7764b',
    trim: colors.trim ?? colors.apron ?? fallback.trim ?? '#8f2633',
    gold: colors.gold ?? fallback.gold ?? '#cda65e',
    black: colors.black ?? fallback.black ?? '#25262a',
    iris: colors.iris ?? '#376b53',
    pupil: colors.pupil ?? '#243c32',
    brow: colors.brow ?? '#54392d',
    blush: colors.blush ?? '#e4a38d',
    mouth: colors.mouth ?? '#8f554b',
  };
}

function drawTool(p, x, y, characterId, pal) {
  // 小满的奶缸与小龙的金属圆环共用同一轮廓，只换金属配色。
  p.rect(x, y, 11, 12, OUTLINE);
  p.rect(x + 1, y + 1, 9, 9, characterId === 'xiaolong' ? pal.black : '#cbded2');
  p.rect(x + 1, y + 9, 9, 2, characterId === 'xiaolong' ? pal.gold : '#a8bbae');
  p.rect(x + 3, y + 1, 5, 1, '#f4f3d9');
  p.rect(x + 9, y + 3, 3, 2, characterId === 'xiaolong' ? pal.gold : '#cbded2');
  p.rect(x - 2, y + 3, 2, 4, characterId === 'xiaolong' ? pal.gold : '#92b5a0');
  p.rect(x + 4, y + 4, 3, 3, characterId === 'xiaolong' ? pal.trim : pal.apron);
}

function drawFace(p, pal, dy, blink) {
  if (blink) {
    p.rect(18, 17 + dy, 4, 1, pal.brow);
    p.rect(26, 17 + dy, 4, 1, pal.brow);
  } else {
    for (const x of [18, 26]) {
      p.rect(x, 15 + dy, 4, 5, OUTLINE);
      p.rect(x + 1, 16 + dy, 2, 4, EYE_WHITE);
      p.rect(x + 1, 17 + dy, 2, 3, pal.iris);
      p.rect(x + 2, 18 + dy, 1, 2, pal.pupil);
      p.rect(x + 1, 16 + dy, 1, 1, '#ffffff');
    }
  }
  p.rect(17, 13 + dy, 5, 1, pal.brow);
  p.rect(26, 13 + dy, 5, 1, pal.brow);
  p.rect(15, 20 + dy, 3, 1, pal.blush);
  p.rect(30, 20 + dy, 3, 1, pal.blush);
  p.rect(23, 22 + dy, 2, 1, pal.mouth);
}

function drawHairFront(p, pal, characterId, dy) {
  p.rect(12, 4 + dy, 24, 6, OUTLINE);
  p.rect(13, 5 + dy, 22, 4, pal.hair);
  p.rect(12, 10 + dy, 4, 13, OUTLINE);
  p.rect(13, 11 + dy, 3, 11, pal.hair);
  p.rect(32, 10 + dy, 4, 13, OUTLINE);
  p.rect(33, 11 + dy, 3, 11, pal.hair);
  p.rect(16, 9 + dy, 8, 3, pal.fringe);
  p.rect(24, 8 + dy, 9, 4, pal.fringe);
  p.rect(20, 11 + dy, 3, 2, pal.highlight);
  if (characterId === 'xiaoman') {
    p.rect(32, 7 + dy, 4, 3, '#b3cfa3');
    p.rect(35, 8 + dy, 2, 2, '#c3ddb2');
  } else {
    p.rect(29, 7 + dy, 5, 1, pal.gold);
    p.rect(31, 6 + dy, 2, 3, pal.gold);
  }
}

function drawLegsFront(p, pal, dy, phase) {
  const lift = [[0, 0], [1, -1], [0, 0], [-1, 1]][phase] ?? [0, 0];
  for (const [x, offset] of [[18, lift[0]], [26, lift[1]]]) {
    p.rect(x - 1, 41 + dy, 6, 18, OUTLINE);
    p.rect(x, 42 + dy, 4, 14, pal.pants);
    p.rect(x - 1, 57 + dy + offset, 6, 4, OUTLINE);
    p.rect(x, 58 + dy + offset, 4, 3, pal.shoes);
  }
}

function drawFront(p, pal, characterId, { bob, phase, attack, blink }) {
  const dy = -bob;
  const swing = attack >= 0 ? [0, 2, 3, 0][attack] : [0, -1, 0, 1][phase] ?? 0;
  if (characterId === 'xiaoman') {
    p.rect(33, 11 + dy, 4, 19, OUTLINE);
    p.rect(34, 12 + dy, 3, 17, pal.hair);
    p.rect(35, 27 + dy, 3, 3, pal.fringe);
    p.rect(31, 30 + dy, 2, 5, pal.hair);
  } else {
    p.rect(19, 1 + dy, 12, 12, OUTLINE);
    p.rect(20, 2 + dy, 10, 10, pal.hair);
    p.rect(21, 0 + dy, 7, 4, pal.highlight);
    p.rect(27, 4 + dy, 4, 10, pal.hair);
  }
  drawLegsFront(p, pal, dy, phase);
  p.rect(15, 24 + dy, 18, 19, OUTLINE);
  p.rect(16, 25 + dy, 16, 17, pal.shirt);
  if (characterId === 'xiaoman') {
    p.rect(18, 29 + dy, 12, 14, pal.apron);
    p.rect(20, 34 + dy, 8, 4, pal.pocket);
    p.rect(22, 32 + dy, 2, 2, pal.gold);
    p.rect(19, 25 + dy, 2, 5, pal.apron);
    p.rect(27, 25 + dy, 2, 5, pal.apron);
    p.rect(17, 40 + dy, 14, 5, pal.apron);
    p.rect(18, 44 + dy, 12, 2, pal.trim);
  } else {
    p.rect(16, 33 + dy, 16, 3, pal.trim);
    p.rect(22, 32 + dy, 4, 4, pal.gold);
    p.rect(23, 45 + dy, 3, 2, pal.gold);
  }
  p.rect(10, 26 + dy, 7, 16, OUTLINE);
  p.rect(11, 27 + dy, 5, 14, pal.shirt);
  p.rect(11, 40 + dy, 5, 5, OUTLINE);
  p.rect(12, 41 + dy, 3, 3, pal.skin);
  p.rect(31, 26 + dy - swing, 7, 16, OUTLINE);
  p.rect(32, 27 + dy - swing, 5, 14, pal.shirt);
  p.rect(32, 40 + dy - swing, 5, 5, OUTLINE);
  p.rect(33, 41 + dy - swing, 3, 3, pal.skin);
  p.rect(13, 4 + dy, 22, 23, OUTLINE);
  p.rect(14, 5 + dy, 20, 21, pal.skin);
  p.rect(10, 16 + dy, 4, 5, OUTLINE);
  p.rect(11, 17 + dy, 2, 3, pal.skin);
  p.rect(34, 16 + dy, 4, 5, OUTLINE);
  p.rect(35, 17 + dy, 2, 3, pal.skin);
  drawHairFront(p, pal, characterId, dy);
  drawFace(p, pal, dy, blink);
  const tool = attack >= 0
    ? [[33, 22], [36, 29], [38, 37], [35, 40]][attack]
    : [35, 38 + swing];
  drawTool(p, tool[0], tool[1] + dy, characterId, pal);
  if (attack === 1 || attack === 2) {
    p.rect(42, 26 + dy, 3, 1, '#fff8e0');
    p.rect(44, 29 + dy, 2, 1, '#fff1c8', 0.9);
    p.rect(40, 33 + dy, 3, 1, '#fff8e0', 0.8);
  }
}

function drawBack(p, pal, characterId, { bob, phase, attack }) {
  const dy = -bob;
  const swing = attack >= 0 ? [0, 2, 3, 0][attack] : [0, -1, 0, 1][phase] ?? 0;
  if (characterId === 'xiaoman') {
    p.rect(31, 9 + dy, 6, 20, OUTLINE);
    p.rect(32, 10 + dy, 4, 17, pal.hair);
    p.rect(34, 25 + dy, 4, 7, OUTLINE);
    p.rect(35, 26 + dy, 2, 5, pal.fringe);
  } else {
    p.rect(20, 0 + dy, 10, 13, OUTLINE);
    p.rect(21, 1 + dy, 8, 11, pal.hair);
    p.rect(22, 0 + dy, 5, 3, pal.highlight);
  }
  drawLegsFront(p, pal, dy, phase);
  p.rect(15, 24 + dy, 18, 19, OUTLINE);
  p.rect(16, 25 + dy, 16, 17, pal.shirt);
  if (characterId === 'xiaoman') {
    p.rect(17, 39 + dy, 14, 6, pal.apron);
    p.rect(19, 25 + dy, 2, 15, pal.apron);
    p.rect(27, 25 + dy, 2, 15, pal.apron);
    p.rect(21, 31 + dy, 6, 3, pal.pocket);
  } else {
    p.rect(16, 33 + dy, 16, 3, pal.trim);
    p.rect(22, 31 + dy, 4, 4, pal.black);
    p.rect(23, 44 + dy, 3, 2, pal.gold);
  }
  p.rect(10, 26 + dy, 7, 16, OUTLINE);
  p.rect(11, 27 + dy, 5, 14, pal.shirt);
  p.rect(31, 26 + dy - swing, 7, 16, OUTLINE);
  p.rect(32, 27 + dy - swing, 5, 14, pal.shirt);
  p.rect(13, 4 + dy, 22, 23, OUTLINE);
  p.rect(14, 5 + dy, 20, 21, pal.hair);
  p.rect(15, 8 + dy, 18, 4, pal.fringe);
  p.rect(16, 10 + dy, 6, 2, pal.highlight);
  p.rect(10, 16 + dy, 4, 5, OUTLINE);
  p.rect(11, 17 + dy, 2, 3, pal.skin);
  p.rect(34, 16 + dy, 4, 5, OUTLINE);
  p.rect(35, 17 + dy, 2, 3, pal.skin);
  if (characterId === 'xiaoman') {
    p.rect(22, 6 + dy, 4, 3, '#b3cfa3');
    p.rect(25, 7 + dy, 2, 2, '#c3ddb2');
  } else {
    p.rect(29, 7 + dy, 5, 1, pal.gold);
  }
  const tool = attack >= 0
    ? [[32, 22], [35, 29], [37, 37], [34, 40]][attack]
    : [34, 38 + swing];
  drawTool(p, tool[0], tool[1] + dy, characterId, pal);
}

function drawSide(p, pal, characterId, { bob, phase, attack, blink }) {
  const dy = -bob;
  const step = attack >= 0 ? [0, 1, 2, 1][attack] : [0, 1, 0, -1][phase] ?? 0;
  const swing = attack >= 0 ? [0, 2, 3, 0][attack] : -step;
  // 后侧马尾先画，形成轮廓
  if (characterId === 'xiaoman') {
    p.rect(8, 10 + dy, 10, 14, OUTLINE);
    p.rect(9, 11 + dy, 8, 11, pal.hair);
    p.rect(7, 14 + dy, 4, 8, OUTLINE);
    p.rect(8, 15 + dy, 3, 6, pal.fringe);
  } else {
    p.rect(12, 1 + dy, 9, 12, OUTLINE);
    p.rect(13, 2 + dy, 7, 10, pal.hair);
    p.rect(14, 0 + dy, 5, 3, pal.highlight);
  }
  for (const [x, offset] of [[21, step], [26, -step]]) {
    p.rect(x - 1, 41 + dy, 6, 18, OUTLINE);
    p.rect(x, 42 + dy, 4, 14, pal.pants);
    p.rect(x - 1 + Math.sign(offset), 57 + dy, 7, 4, OUTLINE);
    p.rect(x + Math.sign(offset), 58 + dy, 5, 3, pal.shoes);
  }
  p.rect(20, 24 + dy, 13, 19, OUTLINE);
  p.rect(21, 25 + dy, 11, 17, pal.shirt);
  if (characterId === 'xiaoman') {
    p.rect(21, 29 + dy, 9, 14, pal.apron);
    p.rect(23, 34 + dy, 6, 4, pal.pocket);
    p.rect(21, 40 + dy, 11, 5, pal.apron);
  } else {
    p.rect(21, 33 + dy, 11, 3, pal.trim);
    p.rect(24, 32 + dy, 3, 4, pal.gold);
  }
  // 后臂
  p.rect(17, 26 + dy + swing, 6, 15, OUTLINE);
  p.rect(18, 27 + dy + swing, 4, 13, pal.shirt);
  // 前臂
  p.rect(28, 26 + dy - swing, 7, 16, OUTLINE);
  p.rect(29, 27 + dy - swing, 5, 14, pal.shirt);
  p.rect(29, 40 + dy - swing, 5, 5, OUTLINE);
  p.rect(30, 41 + dy - swing, 3, 3, pal.skin);
  // 头部
  p.rect(17, 4 + dy, 20, 23, OUTLINE);
  p.rect(18, 5 + dy, 18, 21, pal.skin);
  p.rect(36, 15 + dy, 4, 5, OUTLINE);
  p.rect(37, 16 + dy, 2, 3, pal.skin);
  p.rect(15, 6 + dy, 6, 18, OUTLINE);
  p.rect(16, 7 + dy, 4, 16, pal.hair);
  p.rect(20, 7 + dy, 15, 5, OUTLINE);
  p.rect(21, 8 + dy, 13, 3, pal.hair);
  p.rect(27, 9 + dy, 8, 3, pal.fringe);
  p.rect(29, 11 + dy, 2, 2, pal.highlight);
  if (blink) {
    p.rect(29, 17 + dy, 4, 1, pal.brow);
  } else {
    p.rect(29, 15 + dy, 4, 5, OUTLINE);
    p.rect(30, 16 + dy, 2, 4, EYE_WHITE);
    p.rect(30, 17 + dy, 2, 3, pal.iris);
    p.rect(31, 18 + dy, 1, 2, pal.pupil);
  }
  p.rect(29, 13 + dy, 4, 1, pal.brow);
  p.rect(29, 20 + dy, 3, 1, pal.blush);
  p.rect(33, 22 + dy, 3, 1, pal.mouth);
  const tool = attack >= 0
    ? [[31, 22], [35, 28], [38, 36], [35, 40]][attack]
    : [33, 38 + swing];
  drawTool(p, tool[0], tool[1] + dy, characterId, pal);
  if (attack === 1 || attack === 2) {
    p.rect(41, 24 + dy, 3, 1, '#fff8e0');
    p.rect(43, 28 + dy, 2, 1, '#fff1c8', 0.9);
    p.rect(40, 32 + dy, 3, 1, '#fff8e0', 0.8);
  }
}

export function heroFrameList(character, colors = character.colors) {
  const list = [];
  for (const dir of HERO_DIRECTIONS) {
    for (const [action, count] of Object.entries(HERO_ACTIONS)) {
      for (let index = 0; index < count; index++) {
        list.push({ key: `${dir}:${action}:${index}`, dir, action, index, characterId: character.id, colors });
      }
    }
  }
  return list;
}

export function drawHeroFrame(painter, frame) {
  const { dir, action, index, characterId, colors } = frame;
  const pal = palette(colors, characterId);
  const p = dir === 'left' ? painter.mirrored(HERO_CELL.width) : painter;
  const blink = action === 'idle' && index === 1;
  const bob = action === 'idle' ? index : action === 'walk' ? [0, 1, 0, 0][index] : 0;
  const phase = action === 'walk' ? index : 0;
  const attack = action === 'attack' ? index : -1;
  if (dir === 'up') drawBack(p, pal, characterId, { bob, phase, attack });
  else if (dir === 'right') drawSide(p, pal, characterId, { bob, phase, attack, blink });
  else drawFront(p, pal, characterId, { bob, phase, attack, blink });
}