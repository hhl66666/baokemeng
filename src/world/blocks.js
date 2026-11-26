import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);

/**
 * 收集方块并加上下左右的比例与颜色，最后一次性提交为 InstancedMesh。
 * 家具、墙体与装饰共用一条实例路径，避免每个方块一次 Draw Call。
 */
export class BlockBatch {
  constructor() {
    this.items = [];
  }

  add(x, y, z, width, height, depth, color, rotationY = 0) {
    this.items.push({ x, y, z, width, height, depth, color, rotationY });
    return this;
  }

  finalize({ castShadow = true, receiveShadow = true } = {}) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshLambertMaterial({ color: '#ffffff' });
    const mesh = new THREE.InstancedMesh(geometry, material, Math.max(1, this.items.length));
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const color = new THREE.Color();
    this.items.forEach((item, index) => {
      position.set(item.x, item.y, item.z);
      quaternion.setFromAxisAngle(UP, item.rotationY);
      scale.set(item.width, item.height, item.depth);
      matrix.compose(position, quaternion, scale);
      mesh.setMatrixAt(index, matrix);
      mesh.setColorAt(index, color.set(item.color));
    });
    mesh.count = this.items.length;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.castShadow = castShadow;
    mesh.receiveShadow = receiveShadow;
    mesh.frustumCulled = false;
    return mesh;
  }
}