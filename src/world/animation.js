import * as THREE from 'three';
import { VISUALS } from '../config.js';

function damp(current, target, rate, dt) {
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-rate * dt));
}
function turn(current, target, rate, dt) {
  // 取最短角，避免跨过 ±π 时反向转一整圈。
  const delta = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + delta * (1 - Math.exp(-rate * dt));
}

/**
 * 只推进像素帧与朝向；命中、伤害和位移仍由玩法系统负责。
 * 时间只由战斗步长推进，暂停时不使用墙钟。
 */
export class HeroAnimator {
  constructor(hero) {
    this.hero = hero;
    this.billboard = hero.userData.billboard;
    this.reset();
  }

  reset() {
    this.time = 0;
    this.gait = 0;
    this.speed = 0;
    this.cast = null;
    this.action = 'idle';
    this.frame = 0;
    this.hero.rotation.set(0, 0, 0);
    this.billboard?.setPose('idle', 0);
    this.update({ player: { invulnerable: 0 } }, { x: 0, z: 0, moving: false }, 0);
  }

  attack(skill, origin, target) {
    // 同帧多技能不反复重置主动作；保留已经开始的挥击，避免帧抖动。
    if (this.cast && this.cast.elapsed < 0.22) return;
    this.cast = {
      skill, elapsed: 0, duration: skill === 'ice' ? 0.65 : VISUALS.attackDuration,
      yaw: target ? Math.atan2(target.x - origin.x, target.z - origin.z) : this.hero.rotation.y,
    };
  }

  update(run, direction, dt) {
    this.time += dt;
    this.speed = damp(this.speed, direction.moving ? 1 : 0, 12, dt);
    this.gait += dt * (run.speedBuff > 0 ? 15 : 11);
    if (this.cast) {
      this.cast.elapsed += dt;
      if (this.cast.elapsed >= this.cast.duration) this.cast = null;
    }
    const moveYaw = direction.moving ? Math.atan2(direction.x, direction.z) : this.hero.rotation.y;
    const yaw = this.cast ? this.cast.yaw : moveYaw;
    this.hero.rotation.y = turn(this.hero.rotation.y, yaw, this.cast ? 17 : 12, dt);
    let action = this.speed > 0.16 ? 'walk' : 'idle';
    let frame = action === 'walk' ? Math.floor(this.gait * 0.7) % 4 : Math.floor(this.time * 3) % 2;
    if (this.cast) {
      action = 'attack';
      frame = Math.min(3, Math.floor((this.cast.elapsed / this.cast.duration) * 4));
    }
    this.action = action;
    this.frame = frame;
    this.billboard?.setPose(action, frame);
  }
}