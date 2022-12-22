import * as THREE from 'three'
import { ShaderMaterial } from 'three'

export type P3 = { x: number; y: number; z: number }

const vertexShader = `
uniform float ra, rb, time;
uniform vec3 p, v;
uniform float brightness0, brightness1, brightness2;
varying float vBrightSum0, vBrightSum1, vBrightSum2, vBrightSum3, vT;
void main() {
  float t = position.z;
  vec3 gpos = p + sin(10.0 * v * (t + time)) * 0.1 + 0.02 * sin(5.0 * v.yxz * (t - time));
  vec3 cpos = (viewMatrix * vec4(gpos, 1)).xyz;
  float rainv2 = 1.0 / ra / ra;
  float rbinv2 = 1.0 / rb / rb;
  float r = sqrt(1.0 / mix(rainv2, rbinv2, t));
  gl_Position = projectionMatrix * vec4(cpos.xy + position.xy * r / cpos.z, cpos.z, 1);
  float rdinv2 = rbinv2 - rainv2;
  vT = t;
  vBrightSum0 = brightness0 * rainv2;
  vBrightSum1 = (rainv2 * brightness1 + rdinv2 * brightness0) * 0.5;
  vBrightSum2 = (rainv2 * brightness2 + rdinv2 * brightness1) / 3.0;
  vBrightSum3 = (rdinv2 * brightness2) * 0.25;
}
`

const fragmentShader = `
varying float vBrightSum0, vBrightSum1, vBrightSum2, vBrightSum3, vT;
uniform vec3 color;
void main() {
  float brightnessSum = vT * (vBrightSum0 + vT * (vBrightSum1 + vT * (vBrightSum2 + vT * vBrightSum3)));
  gl_FragColor.rgb = (2.0 * float(gl_FrontFacing) - 1.0) * brightnessSum * color * 0.0001;
  gl_FragColor.a = 1.0;
}
`

export function sphereRandom() {
  while (true) {
    const x = 2 * Math.random() - 1
    const y = 2 * Math.random() - 1
    const z = 2 * Math.random() - 1
    const r = Math.hypot(x, y, z)
    if (r < 1) return { x, y, z }
  }
}

const geometries: (THREE.BufferGeometry | undefined)[] = []
function cachedCylinderGeometry(lsec: number, rsec: number) {
  const idx = lsec * 128 + rsec
  const geometry = geometries[idx]
  if (geometry) return geometry
  return geometries[idx] = cylinderGeometry(lsec, rsec)
}

export class Curve {
  uniforms = {
    p: { value: new THREE.Vector3() },
    v: { value: new THREE.Vector3() },
    color: { value: new THREE.Color() },
    brightness0: { value: 0 },
    brightness1: { value: 0 },
    brightness2: { value: 0 },
    ra: { value: 0 },
    rb: { value: 0 },
    time: { value: 0 }
  }
  readonly p: THREE.Vector3
  readonly v: THREE.Vector3
  readonly color: THREE.Color
  brightness0 = 0
  brightness1 = 0
  brightness2 = 0
  time = 0
  ra = 0
  rb = 0
  mesh: THREE.Mesh
  constructor() {
    this.p = this.uniforms.p.value
    this.v = this.uniforms.v.value
    this.color = this.uniforms.color.value
    this.mesh = new THREE.Mesh()
    this.mesh.material = new ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader,
      fragmentShader,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  }
  update() {
    this.uniforms.ra.value = this.ra
    this.uniforms.rb.value = this.rb
    this.uniforms.time.value = this.time
    this.uniforms.brightness0.value = this.brightness0
    this.uniforms.brightness1.value = this.brightness1
    this.uniforms.brightness2.value = this.brightness2
    this.mesh.geometry = cachedCylinderGeometry(64, 6)
  }
}

export function cylinderGeometry(lsections: number, rsections: number) {
  const geometry = new THREE.BufferGeometry()
  const positions: number[] = []
  const indices: number[] = []
  const rs: [number, number][] = []
  for (let i = 0; i < rsections; i++) {
    const th = 2 * Math.PI * i / rsections
    rs.push([Math.cos(th), Math.sin(th)])
  }
  for (let i = 0; i <= lsections; i++) {
    const z = i / lsections
    rs.forEach(([cos, sin]) => positions.push(cos, sin, z))
  }
  const bottomIndex = positions.length / 3
  positions.push(0, 0, 0)
  const topIndex = positions.length / 3
  positions.push(0, 0, 1)
  for (let i = 0; i < lsections; i++) {
    const idxa = i * rsections
    const idxb = (i + 1) * rsections
    for (let j = 0; j < rsections; j++) {
      const k = (j + 1) % rsections
      indices.push(idxa + j, idxa + k, idxb + j, idxb + j, idxa + k, idxb + k)
    }
  }
  for (let j = 0; j < rsections; j++) {
    indices.push(j, bottomIndex, (j + 1) % rsections)
    const k = lsections * rsections
    indices.push(k + j, k + (j + 1) % rsections, topIndex)
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3))
  geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(indices), 1))
  return geometry
}

export class CurveManager {
  curves: Curve[] = []
  activeCount = 0
  constructor(public scene: THREE.Scene) {}
  reset() {
    for (let i = 0; i < this.activeCount; i++) {
      this.scene.remove(this.curves[i].mesh)
    }
    this.activeCount = 0
  }
  use() {
    const index = this.activeCount
    this.activeCount++
    let curve = this.curves[index]
    if (!curve) {
      curve = new Curve()
      this.curves[index] = curve
    }
    this.scene.add(curve.mesh)
    return curve
  }
  update() {
    for (let i = 0; i < this.activeCount; i++) this.curves[i].update()
  }
}
