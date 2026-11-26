// 像素绘制只依赖 fillRect，既能写入 canvas，也能收集成矩形交给离线 SVG 导出。
export function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function hashPalette(colors = {}) {
  return hashString(Object.keys(colors).sort().map(key => `${key}:${colors[key]}`).join('|'));
}

/** 固定种子的伪随机数，保证每次启动的地形与装饰布局一致。 */
export function mulberry32(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeRectSink() {
  return {
    fillStyle: '#000000',
    globalAlpha: 1,
    rects: [],
    fillRect(x, y, width, height) {
      if (width <= 0 || height <= 0 || this.globalAlpha <= 0) return;
      this.rects.push({ x, y, width, height, color: this.fillStyle, alpha: this.globalAlpha });
    },
  };
}

export class Painter {
  constructor(sink) {
    this.sink = sink;
    this.width = Infinity;
  }

  /** 以整数像素块绘制；所有坐标取整，避免半像素发虚。 */
  rect(x, y, width, height, color, alpha = 1) {
    const px = Math.round(x), py = Math.round(y);
    const pw = Math.round(width), ph = Math.round(height);
    if (pw <= 0 || ph <= 0 || alpha <= 0) return;
    if (px + pw <= 0 || py + ph <= 0 || px >= this.width) return;
    this.sink.fillStyle = color;
    this.sink.globalAlpha = alpha;
    this.sink.fillRect(px, py, pw, ph);
    this.sink.globalAlpha = 1;
  }

  /** 用逐行矩形拼出像素椭圆，避免依赖 path / arc。 */
  ellipse(cx, cy, rx, ry, color, alpha = 1) {
    for (let y = -ry; y <= ry; y++) {
      const half = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
      if (half > 0) this.rect(cx - half, cy + y, half * 2, 1, color, alpha);
    }
  }

  /** 整体平移一层，用于行走起伏与受击位移。 */
  translated(dx, dy) {
    const source = this.sink;
    const sink = {
      fillStyle: '#000000',
      globalAlpha: 1,
      fillRect(x, y, width, height) {
        if (width <= 0 || height <= 0) return;
        source.fillStyle = this.fillStyle;
        source.globalAlpha = this.globalAlpha;
        source.fillRect(x + dx, y + dy, width, height);
      },
    };
    const moved = new Painter(sink);
    moved.width = this.width;
    return moved;
  }

  /** 左向帧由右向帧镜像生成，避免同一套造型写两遍。 */
  mirrored(cellWidth) {
    const source = this.sink;
    const painted = this;
    const sink = {
      fillStyle: '#000000',
      globalAlpha: 1,
      fillRect(x, y, width, height) {
        if (width <= 0 || height <= 0) return;
        source.fillStyle = this.fillStyle;
        source.globalAlpha = this.globalAlpha;
        source.fillRect(cellWidth - x - width, y, width, height);
      },
    };
    const mirror = new Painter(sink);
    mirror.width = cellWidth;
    mirror.outline = painted.outline;
    return mirror;
  }
}

export function rectsToSvg(rects, { width, height, scale = 1, padding = 0 } = {}) {
  const boxes = rects.filter(item => item.width > 0 && item.height > 0);
  const body = boxes.map(({ x, y, width: w, height: h, color, alpha }) => {
    const opacity = alpha < 1 ? ` fill-opacity="${Number(alpha.toFixed(3))}"` : '';
    return `<rect x="${(x + padding) * scale}" y="${(y + padding) * scale}" width="${w * scale}" height="${h * scale}" fill="${color}"${opacity}/>`;
  }).join('');
  const totalWidth = (width + padding * 2) * scale;
  const totalHeight = (height + padding * 2) * scale;
  return { body, totalWidth, totalHeight };
}