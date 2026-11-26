// 障碍同时驱动物理碰撞与家具构建，避免改模型位置却漏改碰撞盒。
// kind 决定造型；x/z 是中心，w/d 是地面占用宽度/深度。
export const MAPS = {
  morning: {
    id: 'morning',
    name: '晨光门店',
    subtitle: '暖光木质 · 开阔清场',
    boss: { id: 'mocha', name: '失控摩卡机', hint: '离开圆形预警区域，利用开阔区持续输出。', hp: 1600, cooldown: 3.2, windup: 1.2, damage: 24 },
    reward: { skin: 'sunrise', skill: 'roast' },
    halfWidth: 9.5,
    halfDepth: 10.5,
    spawn: { x: 0, z: 2.5 },
    bossSpawn: { x: 0, z: -2.5 },
    colors: { background: '#d7dfcd', wall: '#f1ead4', floor: ['#dab98b', '#d2ad7c', '#dfc397'] },
    terrain: {
      pattern: 'plank', seed: 11,
      tints: ['#dab98b', '#d2ad7c', '#dfc397'],
      curb: '#b08c62', terrace: '#8f9c7e', wall: '#f1ead4', trim: '#d9c9a5',
      window: '#f7dfa1', windowFrame: '#587b60', plinth: '#8a6b4d',
      pot: '#b6986c', leaf: '#467c4b', leafAlt: '#5f8f5a', rock: '#8d8b80', crate: '#a87a4e', flower: '#e7aec1',
    },
    obstacles: [
      { kind: 'sofa', x: -7.3, z: -1, w: 2.7, d: 5.2 },
      { kind: 'table', x: -3.8, z: 0.8, w: 1.8, d: 1.8 },
      { kind: 'counter', x: 2, z: -7.5, w: 7.5, d: 2 },
      { kind: 'plant', x: 7.8, z: -4.7, w: 1.3, d: 1.3 },
    ],
  },
  rain: {
    id: 'rain', name: '雨夜街角店', subtitle: '雨窗蓝调 · 十字蒸汽',
    halfWidth: 9.5, halfDepth: 10.5,
    spawn: { x: 0, z: 3 }, bossSpawn: { x: 0, z: -3 },
    boss: { id: 'steam', name: '蒸汽压力壶', hint: '蒸汽沿十字通道喷发，向斜侧离开预警带。', hp: 1750, cooldown: 3.8, windup: 1.5, damage: 26 },
    reward: { skin: 'midnight', skill: 'storm' },
    colors: { background: '#637b98', wall: '#93a5b7', floor: ['#748b99', '#8297a2', '#6c8191'] },
    terrain: {
      pattern: 'stone', seed: 23,
      tints: ['#748b99', '#8297a2', '#6c8191'],
      curb: '#5f7484', terrace: '#51636f', wall: '#93a5b7', trim: '#c6d2dc',
      window: '#3d587d', windowFrame: '#41586b', plinth: '#5d6d78',
      pot: '#8c9ba3', leaf: '#4f7a63', leafAlt: '#6d9278', rock: '#7d858c', crate: '#7b6a58', flower: '#b7d7e8',
    },
    obstacles: [
      { kind: 'counter', x: -6, z: -6.5, w: 5.5, d: 2 },
      { kind: 'sofa', x: 7, z: 1, w: 2.7, d: 5.2 },
      { kind: 'table', x: -4, z: 2, w: 1.8, d: 1.8 },
      { kind: 'table', x: 4, z: -6, w: 1.8, d: 1.8 },
      { kind: 'plant', x: -7.5, z: 7, w: 1.3, d: 1.3 },
    ],
  },
  garden: {
    id: 'garden', name: '花园露台店', subtitle: '花架绿植 · 三重种子波',
    halfWidth: 9.5, halfDepth: 10.5,
    spawn: { x: 0, z: 3 }, bossSpawn: { x: 0, z: -3 },
    boss: { id: 'vine', name: '藤蔓冷萃装置', hint: '三个种子区延迟绽放，沿空隙移动，不要折返。', hp: 1850, cooldown: 4, windup: 1.7, damage: 25 },
    reward: { skin: 'botanical', skill: 'blossom' },
    colors: { background: '#c4dfbc', wall: '#dfedce', floor: ['#c5c6a0', '#d2d3b1', '#b9c499'] },
    terrain: {
      pattern: 'terra', seed: 37,
      tints: ['#c5c6a0', '#d2d3b1', '#b9c499'],
      curb: '#a8b48b', terrace: '#8ea276', wall: '#dfedce', trim: '#b7cf9f',
      window: '#d7ecc4', windowFrame: '#77916a', plinth: '#9a8d6d',
      pot: '#b6986c', leaf: '#467c4b', leafAlt: '#6d9959', rock: '#9a9a86', crate: '#a87a4e', flower: '#e7aec1',
    },
    obstacles: [
      { kind: 'counter', x: 4, z: -8, w: 6, d: 2 },
      { kind: 'table', x: -4.5, z: -3.5, w: 1.8, d: 1.8 },
      { kind: 'table', x: 4.5, z: 2.5, w: 1.8, d: 1.8 },
      { kind: 'plant', x: -7, z: 2, w: 1.3, d: 1.3 },
      { kind: 'plant', x: -3.8, z: 6.5, w: 1.3, d: 1.3 },
      { kind: 'plant', x: 7, z: -3, w: 1.3, d: 1.3 },
    ],
  },
};
export const DEFAULT_MAP = MAPS.morning;

export function mapFor(run) {
  const id = run?.mapId ?? DEFAULT_MAP.id;
  if (!Object.hasOwn(MAPS, id)) throw new Error('未知门店');
  return MAPS[id];
}
