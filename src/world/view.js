import * as THREE from 'three';
import { DEFAULT_MAP, MAPS } from '../data/maps.js';
import { SKINS } from '../data/progression.js';
import { CHARACTERS, DEFAULT_CHARACTER } from '../data/characters.js';
import { bossFootprints } from '../systems/boss.js';
import { ENEMY_ACTIONS } from '../config.js';
import { createArena } from './arena.js';
import { createEnemy, geometry, material, dropMaterials } from './factory.js';
import { createHero } from './hero.js';
import { PixelLibrary } from './pixel/library.js';
import { Effects } from '../systems/effects.js';
import { HeroAnimator } from './animation.js';

export class WorldView {
  constructor(canvas, { host = window, doc = document, Renderer = THREE.WebGLRenderer } = {}) {
    this.host = host;
    this.doc = doc;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(DEFAULT_MAP.colors.background);
    this.scene.fog = new THREE.Fog(DEFAULT_MAP.colors.background, 27, 55);
    this.renderer = new Renderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(host.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 90);
    this.scene.add(new THREE.HemisphereLight('#fff1d3', '#6c8b73', 2.4));
    const light = new THREE.DirectionalLight('#fff1c8', 3.2);
    light.position.set(-7, 17, 7); light.castShadow = true;
    light.shadow.mapSize.set(2048, 2048);
    Object.assign(light.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, far: 45 });
    light.shadow.bias = -0.0007; this.scene.add(light);
    // 轮廓补光让像素角色从同色家具与地面中分离，不给每个技能分配动态灯。
    const rimLight = new THREE.DirectionalLight('#c7e9dc', 1.3);
    rimLight.position.set(6, 8, -5);
    this.scene.add(rimLight);
    this.keyLight = light;
    this.rimLight = rimLight;
    this.map = DEFAULT_MAP;
    this.skinId = 'classic';
    this.characterId = DEFAULT_CHARACTER.id;
    this.pixel = new PixelLibrary(doc);
    this.arena = createArena(DEFAULT_MAP, doc);
    this.scene.add(this.arena);
    this.hero = createHero(DEFAULT_CHARACTER, DEFAULT_CHARACTER.colors, { doc, library: this.pixel });
    this.scene.add(this.hero);
    this.animator = new HeroAnimator(this.hero);
    this.effects = new Effects(this.scene, doc);
    this.entityMeshes = new Map();
    this.hitTimes = new WeakMap();
    this.target = new THREE.Vector3();
    this.offset = new THREE.Vector3();
    this.resize();
  }
  disposeArena() {
    this.scene.remove(this.arena);
    // 地形贴图、方块实例与招牌都属于这个场景，统一由 arena 释放。
    this.arena.userData.dispose?.();
  }
  configure(mapId, skinId, characterId = DEFAULT_CHARACTER.id) {
    const map = MAPS[mapId], skin = SKINS[skinId];
    const character = CHARACTERS[characterId];
    if (!map || !skin || !character) throw new Error('未知门店、皮肤或角色');
    if (map !== this.map) {
      this.clear();
      this.disposeArena();
      this.map = map;
      this.arena = createArena(map, this.doc);
      this.scene.add(this.arena);
      this.scene.background.set(map.colors.background);
      this.scene.fog.color.set(map.colors.background);
      this.keyLight.color.set(map.id === 'rain' ? '#c1d9ff' : '#fff1c8');
      this.rimLight.color.set(map.id === 'garden' ? '#ffe4d1' : '#c7e9dc');
    }
    this.effects.map = map;
    if (skinId !== this.skinId || characterId !== this.characterId) {
      this.scene.remove(this.hero);
      this.hero.userData.dispose?.();
      const colors = characterId === DEFAULT_CHARACTER.id ? skin.colors : character.colors;
      this.hero = createHero({ ...character, colors }, colors, { doc: this.doc, library: this.pixel });
      this.scene.add(this.hero);
      this.animator = new HeroAnimator(this.hero);
      this.skinId = skinId;
      this.characterId = characterId;
    }
  }
  preview(canvas, mapId, skinId, characterId = this.characterId) {
    this.configure(mapId, skinId, characterId);
    this.clear();
    const context = canvas.getContext('2d');
    if (!context) throw new Error('无法绘制角色预览');
    const portrait = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
    portrait.position.set(1.7, 3.1, 6);
    portrait.lookAt(0, 1.3, 0);
    this.hero.position.set(0, 0, 0);
    this.hero.visible = true;
    this.animator.reset();
    this.arena.visible = false;
    if (this.hero.userData.shadow) this.hero.userData.shadow.visible = false;
    this.hero.userData.billboard?.faceCamera(Math.atan2(portrait.position.x, portrait.position.z));
    try {
      this.renderer.setSize(360, 360, false);
      this.renderer.render(this.scene, portrait);
      context.drawImage(this.renderer.domElement, 0, 0, canvas.width, canvas.height);
    } finally {
      if (this.hero.userData.shadow) this.hero.userData.shadow.visible = true;
      this.arena.visible = true;
      this.resize();
    }
  }
  resize() {
    const { innerWidth: w, innerHeight: h } = this.host;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h; this.camera.fov = w < 600 ? 49 : 42;
    this.camera.updateProjectionMatrix();
  }
  cameraYaw(x, z) {
    return Math.atan2(this.camera.position.x - x, this.camera.position.z - z);
  }
  remove(mesh) {
    // 预警材质属于单个敌人，可释放；图集由 PixelLibrary 统一持有。
    if (mesh.userData.warning) {
      this.scene.remove(mesh.userData.warning);
      mesh.userData.warning.traverse(part => part.material?.dispose());
    }
    this.scene.remove(mesh);
    mesh.userData.dispose?.();
  }
  clear() {
    for (const mesh of this.entityMeshes.values()) this.remove(mesh);
    this.entityMeshes.clear();
    this.effects.clear();
    this.hitTimes = new WeakMap();
    this.animator.reset();
  }
  dispose() {
    this.clear();
    this.disposeArena();
    this.scene.remove(this.hero);
    this.hero.userData.dispose?.();
    this.pixel.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
  syncEntities(run) {
    // 以状态对象作键：状态存档不引用 Mesh，恢复后可按需重建整套视图。
    const active = new Set();
    for (const e of run?.enemies ?? []) {
      active.add(e);
      let mesh = this.entityMeshes.get(e);
      if (!mesh) {
        mesh = createEnemy(e.type, e.elite, this.map.boss.id, { library: this.pixel });
        this.entityMeshes.set(e, mesh);
        this.scene.add(mesh);
      }
      mesh.position.set(e.x, 0, e.z);
      mesh.rotation.y = Math.atan2(run.player.x - e.x, run.player.z - e.z);
      const boss = e.type === 'boss';
      let action = 'walk';
      let frame = Math.floor(e.age * 8) % 4;
      if (e.windup > 0) {
        action = 'attack';
        const duration = boss ? this.map.boss.windup : ENEMY_ACTIONS.sugar.windup;
        const progress = 1 - Math.min(1, e.windup / Math.max(duration, 0.001));
        frame = Math.min(2, Math.floor(progress * 3));
      } else if (e.type === 'sugar' && e.dash > 0) {
        action = 'attack';
        frame = 2;
      }
      const unit = mesh.userData.billboard;
      unit?.setPose(action, frame);
      unit?.faceCamera(this.cameraYaw(e.x, e.z));
      const body = mesh.userData.body;
      const base = e.elite ? 1.3 : 1;
      const hitAge = run.time - (this.hitTimes.get(e) ?? -Infinity);
      const impact = hitAge < 0.18 ? Math.sin(hitAge / 0.18 * Math.PI) : 0;
      body.scale.set(base * (1 + impact * 0.12), base * (1 - impact * 0.15), base * (1 + impact * 0.12));
      body.position.y = e.type === 'sugar' ? Math.abs(Math.sin(e.age * 4)) * 0.15 : 0;
      if (e.windup > 0) {
        // 预警来自持久化 windup/direction，刷新后也不会丢失。
        let warning = mesh.userData.warning;
        if (!warning) {
          warning = new THREE.Group();
          const footprints = e.type === 'boss' ? bossFootprints(run, e) : [{ shape: 'circle', radius: ENEMY_ACTIONS.sugar.warningRadius }];
          for (const footprint of footprints) {
            const part = new THREE.Mesh(footprint.shape === 'rect' ? geometry.cube : geometry.circle,
              new THREE.MeshBasicMaterial({ color: '#bd7051', transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false }));
            if (footprint.shape === 'circle') part.rotation.x = -Math.PI / 2;
            warning.add(part);
          }
          this.scene.add(warning); mesh.userData.warning = warning;
        }
        warning.visible = true;
        const { sugar } = ENEMY_ACTIONS;
        const footprints = boss ? bossFootprints(run, e) : [{ shape: 'circle', x: e.x + e.direction.x * sugar.warningOffset, z: e.z + e.direction.z * sugar.warningOffset, radius: sugar.warningRadius }];
        footprints.forEach((footprint, index) => {
          const part = warning.children[index];
          part.position.set(footprint.x, 0.1, footprint.z);
          if (footprint.shape === 'circle') part.scale.setScalar(footprint.radius);
          else part.scale.set(footprint.width, 0.025, footprint.depth);
        });
      } else if (mesh.userData.warning) mesh.userData.warning.visible = false;
    }
    for (const d of run?.drops ?? []) {
      active.add(d);
      let mesh = this.entityMeshes.get(d);
      if (!mesh) { mesh = new THREE.Mesh(geometry.drop, dropMaterials[d.type]); this.entityMeshes.set(d, mesh); this.scene.add(mesh); }
      mesh.position.set(d.x, 0.22, d.z); mesh.rotation.y = run.time * 1.4;
    }
    for (const z of run?.zones ?? []) {
      active.add(z);
      let mesh = this.entityMeshes.get(z);
      if (!mesh) {
        mesh = new THREE.Mesh(geometry.circle, material('#b98345'));
        mesh.rotation.x = -Math.PI / 2; mesh.scale.setScalar(z.radius);
        this.scene.add(mesh); this.entityMeshes.set(z, mesh);
      }
      mesh.position.set(z.x, 0.08, z.z);
      // 焦糖存留范围不变；只在末尾渐缩提示即将消失，不扩大真实伤害区。
      mesh.scale.setScalar(z.radius * Math.min(1, z.life / 0.35));
    }
    for (const [key, mesh] of this.entityMeshes) if (!active.has(key)) { this.remove(mesh); this.entityMeshes.delete(key); }
  }
  cast(skill, origin, target) {
    this.animator.attack(skill, origin, target);
  }
  hit(enemy, time) {
    this.hitTimes.set(enemy, time);
  }
  animatePlayer(run, direction, dt) {
    this.animator.update(run, direction, dt);
  }
  render(run) {
    const p = run?.player ?? this.map.spawn;
    this.hero.position.set(p.x, 0.03, p.z);
    this.hero.visible = !run || p.invulnerable <= 0 || Math.floor(p.invulnerable * 16) % 2 === 0;
    this.target.set(p.x * 0.55, 0, p.z * 0.6 - 1);
    this.offset.set(0, this.host.innerWidth < 600 ? 19 : 17, 17);
    this.camera.position.copy(this.target).add(this.offset);
    this.camera.lookAt(this.target);
    this.hero.userData.billboard?.faceCamera(this.cameraYaw(p.x, p.z));
    this.syncEntities(run);
    this.renderer.render(this.scene, this.camera);
  }
}