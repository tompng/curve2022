import * as THREE from 'three'

const vertexShader = `
uniform float time, scale;
attribute vec3 params;
varying float vBrightness;
varying vec2 vCoord;
void main() {
  float z = mod(position.z + 1.0 - 0.1 * time, 2.0);
  vec3 gpos = vec3(position.xy, z);
  vec3 cpos = (viewMatrix * vec4(gpos, 1)).xyz;
  gl_Position = projectionMatrix * vec4(cpos, 1);
  gl_PointSize = 16.0;
  vBrightness = sqrt(z) * (2.0 - z) * 0.05 * max(1.0 - cpos.z, 0.0);
}
`

const fragmentShader = `
varying float vBrightness;
varying vec2 vCoord;
const vec2 a = vec2(0.5, 0.5 * sqrt(3.0));
const vec2 b = vec2(0.5, -0.5 * sqrt(3.0));
void main() {
  vec2 coord = 2.0 * gl_PointCoord.xy - vec2(1);
  float c = max(abs(coord.x), max(abs(dot(coord, a)), abs(dot(coord, b))));
  float color = clamp(4.0*(0.8-c),0.0,1.0) * vBrightness;
  gl_FragColor = vec4(vec3(color),1);
}
`

export function createSnow(N: number) {
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(N * 3)
  for (let i = 0; i < N; i++) {
    positions[3 * i] = 2 * Math.random() - 1
    positions[3 * i + 1] = 2 * Math.random() - 1
    positions[3 * i + 2] = 2 * Math.random() - 1
  }
  const params = new Float32Array(N * 3)
  for (let i = 0; i < N; i++) {
    params[3 * i] = 2 * Math.random() - 1
    params[3 * i + 1] = 2 * Math.random() - 1
    params[3 * i + 2] = 2 * Math.random() - 1
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('params', new THREE.BufferAttribute(params, 3))
  const material = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 } },
    vertexShader,
    fragmentShader,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })
  const points = new THREE.Points(geometry,material)
  return {
    points,
    update(t: number) { material.uniforms.time.value = t }
  }
}