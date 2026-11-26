const OUTLINE = '#2f2620';
export const ENEMY_ACTIONS = { idle: 2, walk: 4, attack: 3 };
export const ENEMY_CELLS = {
  bean: { width: 32, height: 32 },
  sugar: { width: 32, height: 32 },
  cream: { width: 40, height: 40 },
  boss: { width: 96, height: 96 },
};
export const ENEMY_DIRECTIONS = ['down', 'left', 'right', 'up'];

const PALETTES = {
  bean: { body: '#94603c', light: '#b07a4f', dark: '#6b4227', leaf: '#639258', eye: '#3b2a1d' },
  sugar: { body: '#e6bb6d', light: '#ffe9b0', dark: '#b98b45', leaf: '#fff3cc', eye: '#4a3a23' },
  cream: { body: '#efe3bf', light: '#fff0d0', dark: '#cdbb92', leaf: '#f6c6b6', eye: '#423c27' },
  mocha: { body: '#869c83', light: '#9dad9d', dark: '#27583c', metal: '#d4d7ba', trim: '#a88956', eye: '#e8bd6b' },
  steam: { body: '#809caf', light: '#b7cfda', dark: '#43566c', metal: '#d6dece', trim: '#a6c4d2', eye: '#ffdc94' },
  vine: { body: '#667e4b', light: '#b4d7a1', dark: '#4c5c37', metal: '#b9b786', trim: '#70945b', eye: '#e7aec1' },
};

function eyesFront(p, cx, cy, eye, gap = 6, radius = 2) {
  for (const x of [cx - gap, cx + gap]) {
    p.rect(x - radius, cy - radius, radius * 2 + 1, radius * 2 + 1, OUTLINE);
    p.rect(x - radius + 1, cy - radius + 1, radius * 2 - 1, radius * 2 - 1, eye);
    p.rect(x - radius + 1, cy - radius + 1, 1, 1, '#fff8e9');
  }
}

function eliteMarks(p, width, height) {
  const gold = '#f2c75c', shine = '#fff0b8';
  p.rect(3, height - 9, 2, 2, gold);
  p.rect(5, height - 7, 1, 1, shine);
  p.rect(width - 6, 5, 2, 2, gold);
  p.rect(width - 9, height - 8, 1, 3, gold);
  p.rect(width - 12, height - 12, 1, 1, shine);
}

function drawBean(p, frame) {
  const { dir, attack, elite } = frame;
  const c = PALETTES.bean;
  const facing = dir === 'down';
  const back = dir === 'up';
  const side = dir === 'right';
  const squash = attack >= 0 ? [1, 0, -1][attack] : 0;
  if (back) {
    p.ellipse(16, 18 + squash, 9, 10, OUTLINE);
    p.ellipse(16, 18 + squash, 8, 9, c.body);
    p.rect(15, 11 + squash, 2, 15, c.dark);
    p.rect(18, 8 + squash, 4, 2, OUTLINE);
    p.rect(19, 7 + squash, 3, 2, c.leaf);
  } else if (side) {
    p.ellipse(17, 18 + squash, 7, 10, OUTLINE);
    p.ellipse(17, 18 + squash, 6, 9, c.body);
    p.rect(18, 10 + squash, 2, 15, c.light);
    p.rect(14, 16 + squash, 3, 3, OUTLINE);
    p.rect(15, 17 + squash, 2, 2, c.eye);
    p.rect(22, 8 + squash, 4, 2, OUTLINE);
    p.rect(23, 7 + squash, 3, 2, c.leaf);
  } else {
    p.ellipse(16, 18 + squash, 9, 10, OUTLINE);
    p.ellipse(16, 18 + squash, 8, 9, c.body);
    p.rect(10, 13 + squash, 2, 10, c.light);
    p.rect(15, 11 + squash, 2, 6, c.dark);
    eyesFront(p, 16, 17 + squash, c.eye, 4, 2);
    p.rect(13, 21 + squash, 6, 1, OUTLINE);
    p.rect(18, 8 + squash, 4, 2, OUTLINE);
    p.rect(19, 7 + squash, 3, 2, c.leaf);
    if (attack >= 0) p.rect(22, 14 + squash, 3, 1, '#fff5d5');
  }
  p.rect(11, 28, 4, 3, c.dark);
  p.rect(17, 28, 4, 3, c.dark);
  if (facing && elite) eliteMarks(p, 32, 32);
}

function drawSugar(p, frame) {
  const { dir, attack, elite } = frame;
  const c = PALETTES.sugar;
  const back = dir === 'up';
  const side = dir === 'right';
  const lift = attack === 1 ? -2 : attack === 2 ? 1 : 0;
  const dy = lift;
  p.rect(14, 5 + dy, 4, 3, OUTLINE);
  p.rect(11, 8 + dy, 10, 4, OUTLINE);
  p.rect(8, 12 + dy, 16, 10, OUTLINE);
  p.rect(11, 22 + dy, 10, 5, OUTLINE);
  p.rect(14, 27 + dy, 4, 2, OUTLINE);
  p.rect(15, 6 + dy, 2, 2, c.light);
  p.rect(12, 9 + dy, 8, 3, c.body);
  p.rect(9, 13 + dy, 14, 8, c.body);
  p.rect(12, 21 + dy, 8, 4, c.body);
  p.rect(15, 26 + dy, 2, 1, c.light);
  p.rect(11, 13 + dy, 2, 8, c.light);
  p.rect(18, 13 + dy, 2, 7, c.dark);
  if (!back) {
    if (side) {
      p.rect(17, 16 + dy, 3, 3, OUTLINE);
      p.rect(18, 17 + dy, 2, 2, c.eye);
    } else {
      eyesFront(p, 16, 17 + dy, c.eye, 3, 2);
      p.rect(14, 20 + dy, 4, 1, OUTLINE);
    }
  }
  if (attack >= 0) {
    p.rect(23, 8 + dy, 3, 1, c.leaf);
    p.rect(25, 11 + dy, 2, 1, c.leaf);
    p.rect(22, 5 + dy, 1, 2, c.leaf);
  }
  if (elite) eliteMarks(p, 32, 32);
}

function drawCream(p, frame) {
  const { dir, attack, elite } = frame;
  const c = PALETTES.cream;
  const back = dir === 'up';
  const side = dir === 'right';
  const squash = attack === 1 ? 2 : attack === 2 ? 1 : 0;
  p.ellipse(20, 25, 11, 9 - squash, OUTLINE);
  p.ellipse(20, 25, 10, 8 - squash, c.body);
  p.rect(13, 16, 5, 3, OUTLINE);
  p.rect(14, 17, 3, 2, c.light);
  p.rect(23, 17, 3, 2, c.light);
  p.rect(15, 28, 3, 4, c.body);
  p.rect(24, 29, 3, 3, c.body);
  p.rect(11, 21, 2, 5, c.light);
  if (!back) {
    if (side) {
      p.rect(23, 22, 3, 3, OUTLINE);
      p.rect(24, 23, 2, 2, c.eye);
      p.rect(26, 26, 2, 1, OUTLINE);
    } else {
      eyesFront(p, 20, 23, c.eye, 5, 2);
      p.rect(17, 28, 2, 1, c.leaf);
      p.rect(23, 28, 2, 1, c.leaf);
    }
  }
  if (attack >= 0) {
    p.rect(30, 20, 3, 1, c.light);
    p.rect(32, 24, 2, 1, c.light);
  }
  if (elite) eliteMarks(p, 40, 40);
}

function drawMocha(p, frame) {
  const { dir, attack, elite } = frame;
  const c = PALETTES.mocha;
  const back = dir === 'up';
  const side = dir === 'right';
  const shake = attack === 1 ? 2 : attack === 2 ? 1 : 0;
  const p2 = p;
  p2.rect(26, 32 - shake, 44, 42, OUTLINE);
  p2.rect(28, 34 - shake, 40, 38, c.body);
  p2.rect(34, 14 - shake, 28, 20, OUTLINE);
  p2.rect(36, 16 - shake, 24, 16, c.light);
  p2.rect(31, 9 - shake, 34, 6, OUTLINE);
  p2.rect(33, 11 - shake, 30, 3, c.metal);
  p2.rect(34, 40 - shake, 28, 14, c.dark);
  if (back) {
    p2.rect(38, 44 - shake, 20, 6, c.dark);
    p2.rect(42, 52 - shake, 12, 4, c.trim);
  } else if (side) {
    p2.rect(56, 44 - shake, 8, 8, OUTLINE);
    p2.rect(57, 45 - shake, 6, 6, c.eye);
    p2.rect(58, 46 - shake, 2, 2, '#fff8e9');
    p2.rect(58, 58 - shake, 8, 4, c.metal);
  } else {
    for (const x of [40, 54]) {
      p2.rect(x - 1, 43 - shake, 8, 8, OUTLINE);
      p2.rect(x, 44 - shake, 6, 6, c.eye);
      p2.rect(x + 2, 46 - shake, 2, 2, '#6b4227');
    }
    p2.rect(56, 54 - shake, 8, 5, c.metal);
    p2.rect(58, 59 - shake, 4, 2, c.trim);
    p2.rect(40, 53 - shake, 8, 2, OUTLINE);
  }
  p2.rect(28, 70 - shake, 40, 4, c.trim);
  p2.rect(30, 74, 12, 6, c.dark);
  p2.rect(54, 74, 12, 6, c.dark);
  p2.rect(66, 20 - shake, 4, 10, c.metal);
  if (attack >= 0) {
    p2.rect(42, 4 - shake, 2, 5, '#ffffff', 0.75);
    p2.rect(52, 2 - shake, 2, 7, '#ffffff', 0.65);
    p2.rect(60, 5 - shake, 2, 4, '#ffffff', 0.55);
  }
  if (elite) eliteMarks(p2, 96, 96);
}

function drawSteam(p, frame) {
  const { dir, attack, elite } = frame;
  const c = PALETTES.steam;
  const back = dir === 'up';
  const side = dir === 'right';
  const shake = attack === 1 ? 2 : attack === 2 ? 1 : 0;
  p.rect(24, 70 - shake, 48, 9, OUTLINE);
  p.rect(26, 71 - shake, 44, 6, c.dark);
  p.ellipse(48, 48 - shake, 23, 21, OUTLINE);
  p.ellipse(48, 48 - shake, 21, 19, c.body);
  p.rect(34, 25 - shake, 28, 6, OUTLINE);
  p.rect(36, 26 - shake, 24, 4, c.metal);
  p.rect(45, 20 - shake, 6, 5, OUTLINE);
  p.rect(46, 21 - shake, 4, 3, c.trim);
  p.rect(14, 42 - shake, 10, 5, OUTLINE);
  p.rect(12, 46 - shake, 4, 12, OUTLINE);
  p.rect(16, 56 - shake, 9, 5, OUTLINE);
  p.rect(67, 44 - shake, 13, 6, OUTLINE);
  p.rect(76, 37 - shake, 5, 8, OUTLINE);
  p.rect(78, 36 - shake, 3, 3, c.metal);
  if (back) {
    p.rect(36, 40 - shake, 24, 8, c.light);
    p.rect(42, 55 - shake, 12, 4, c.trim);
  } else if (side) {
    p.rect(54, 42 - shake, 9, 9, OUTLINE);
    p.rect(55, 43 - shake, 7, 7, c.eye);
    p.rect(57, 45 - shake, 3, 2, '#4a3a23');
  } else {
    for (const x of [40, 54]) {
      p.rect(x - 2, 42 - shake, 10, 10, OUTLINE);
      p.rect(x - 1, 43 - shake, 8, 8, c.eye);
      p.rect(x + 2, 45 - shake, 2, 3, '#4a3a23');
      p.rect(x, 44 - shake, 2, 2, '#fff8e9');
    }
    p.rect(35, 58 - shake, 26, 3, c.trim);
  }
  p.rect(36, 30 - shake, 3, 8, c.light);
  if (attack >= 0) {
    p.rect(82, 26 - shake, 2, 6, '#ffffff', 0.8);
    p.rect(86, 22 - shake, 2, 9, '#ffffff', 0.65);
    p.rect(90, 28 - shake, 2, 5, '#ffffff', 0.5);
  }
  if (elite) eliteMarks(p, 96, 96);
}

function drawVine(p, frame) {
  const { dir, attack, elite } = frame;
  const c = PALETTES.vine;
  const back = dir === 'up';
  const side = dir === 'right';
  const sway = attack === 1 ? 1 : attack === 2 ? -1 : 0;
  p.rect(30, 64, 36, 20, OUTLINE);
  p.rect(32, 66, 32, 16, c.body);
  p.rect(26, 61, 44, 5, OUTLINE);
  p.rect(28, 62, 40, 3, c.metal);
  p.rect(45 + sway, 34, 6, 30, c.trim);
  p.rect(40, 50, 8, 4, c.light);
  p.rect(50, 44, 9, 4, c.light);
  p.ellipse(48 + sway, 27, 18, 14, OUTLINE);
  p.ellipse(48 + sway, 27, 16, 12, c.light);
  for (const [x, y, w, h] of [[34, 18, 8, 5], [54, 17, 8, 5], [31, 28, 7, 5], [58, 28, 7, 5], [42, 10, 7, 5], [50, 11, 7, 5]]) {
    p.rect(x + sway, y, w, h, c.eye);
  }
  if (back) {
    p.rect(40 + sway, 22, 16, 8, c.trim);
    p.rect(36, 70, 24, 4, c.dark);
  } else if (side) {
    p.rect(54 + sway, 24, 6, 6, OUTLINE);
    p.rect(55 + sway, 25, 4, 4, '#4a3a23');
    p.rect(58 + sway, 32, 5, 2, c.eye);
  } else {
    for (const x of [41, 53]) {
      p.rect(x - 1 + sway, 22, 7, 7, OUTLINE);
      p.rect(x + sway, 23, 5, 5, '#4a3a23');
      p.rect(x + sway + 1, 24, 2, 2, '#fff8e9');
    }
    p.rect(44 + sway, 31, 8, 2, OUTLINE);
  }
  p.rect(33, 84, 9, 5, c.dark);
  p.rect(54, 84, 9, 5, c.dark);
  if (attack >= 0) {
    p.rect(66, 12, 3, 3, c.eye);
    p.rect(72, 18, 2, 2, c.light);
    p.rect(60, 8, 2, 2, c.eye);
  }
  if (elite) eliteMarks(p, 96, 96);
}

export function enemyCells(type) {
  return ENEMY_CELLS[type] ?? ENEMY_CELLS.bean;
}

export function enemyFrameList({ type, bossId, elite = false }) {
  const list = [];
  for (const dir of ENEMY_DIRECTIONS) {
    for (const [action, count] of Object.entries(ENEMY_ACTIONS)) {
      for (let index = 0; index < count; index++) {
        list.push({ key: `${dir}:${action}:${index}`, dir, action, index, type, bossId, elite });
      }
    }
  }
  return list;
}

export function drawEnemyFrame(painter, frame) {
  const { dir, action, index, type, bossId, elite } = frame;
  const mirrored = dir === 'left';
  const base = mirrored ? painter.mirrored(enemyCells(type).width) : painter;
  const bob = action === 'idle' ? index : action === 'walk' ? [0, 1, 0, 1][index] : 0;
  const sway = action === 'walk' ? [-1, 0, 1, 0][index] : 0;
  const p = base.translated(sway, -bob);
  const context = { dir, action, attack: action === 'attack' ? index : -1, elite, bossId };
  if (type === 'bean') drawBean(p, context);
  else if (type === 'sugar') drawSugar(p, context);
  else if (type === 'cream') drawCream(p, context);
  else if (bossId === 'steam') drawSteam(p, context);
  else if (bossId === 'vine') drawVine(p, context);
  else drawMocha(p, context);
}