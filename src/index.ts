import { Mesh } from 'three'
import * as THREE from 'three'
import { CurveManager, createVertexShader } from './tube'
import { createSnow } from './snow'
import { GravitySensor } from './sensor'

const sensor = new GravitySensor()
function randomSign(): -1 | 1 {
  return Math.random() < 0.5 ? -1 : 1
}
const renderer = new THREE.WebGLRenderer()
const scene = new THREE.Scene()
let camera = new THREE.Camera()
const target = new THREE.WebGLRenderTarget(1, 1, {
  minFilter: THREE.NearestFilter,
  magFilter: THREE.NearestFilter,
  type: THREE.HalfFloatType
})
function resetSize() {
  const width = window.innerWidth
  const height = window.innerHeight
  renderer.setSize(width, height)
  target.setSize(width, height)
  camera = new THREE.PerspectiveCamera(75, width / height, 0.001, 32)
  camera.up = new THREE.Vector3(0, 0, 1)
}
resetSize()
document.body.appendChild(renderer.domElement)
document.body.appendChild(sensor.button)
const targetRenderMesh = new Mesh(new THREE.PlaneGeometry(), new THREE.MeshBasicMaterial({ map: target.texture }))
const targetRenderScene = new THREE.Scene()
const targetRenderCamera = new THREE.Camera()
targetRenderMesh.scale.x = targetRenderMesh.scale.y = 2
targetRenderScene.add(targetRenderMesh)

let timer: NodeJS.Timeout | null = null
window.onresize = () => {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    timer = null
    resetSize()
  }, 200)
}

const treeLeaf = new CurveManager(scene, createVertexShader(`
  float th = 8.0 * (2.0 + params1.x) * t + 0.3 * params1.y * time;
  vec3 gpos = 0.2 * vec3(
    vec2(cos(th), sin(th)) * (1.0 + 0.2 * sin((12.0 + 7.0 * params1.y) * t + 0.3 * params1.z * time)),
    dot(sin(8.0 * params1 * t + 0.1 * params2 * time),vec3(1,1,1))
  ) + 0.04 * (sin(37.0 * params2 * t + 0.5 * params1 * time) - sin(59.0 * params1.yzx * t + 0.3 * params2.zxy * time));
  gpos.z += 0.7;
  gpos.xy *= 1.2 - gpos.z;
  float max = 1.2;
  gpos.z = (max + gpos.z - sqrt(0.01 + (max - gpos.z) * (max - gpos.z))) * 0.5;
`))
const treeTrunk = new CurveManager(scene, createVertexShader(`
  vec3 gpos = vec3(
    0.02 * (1.2 - t)*(sin(10.0 * params2.xy * (t + 0.1 * time)) + sin(5.0 * params2.yz * (4.0 * t - 0.1 * time))),
    t
  );
`))
const star = new CurveManager(scene, createVertexShader(`
  vec3 gpos = sin(params1 * (32.0 * t + 16.0 * time)) + 0.1 * sin(params2 * (24.0 * t + 13.0 * time));
  gpos /= 0.5 + length(gpos);
  gpos *= 0.1;
  gpos.z += 1.2;
`))
const ground = new CurveManager(scene, createVertexShader(`
  vec2 a = vec2(params1.z, params2.z);
  vec3 gpos = vec3(
    params1.xy * t + params2.xy * (1.0 - t) + 0.1 * vec2(
      dot(sin(32.0 * a * t + a.x), a.xy),
      dot(sin(32.0 * a * t + a.y), a.yx)
    ),
    0
  );
`))

for (let i = 0; i < 20; i++) {
  const curve = treeLeaf.use()
  curve.color.setRGB(0.8 * Math.random(), 1, 0.8 * Math.random())
  curve.brightness0 = 0
  curve.brightness1 = 32
  curve.brightness2 = -16
  curve.ra = 0.02
  curve.rb = 0.01
}
for (let i = 0; i < 10; i++) {
  const curve = treeTrunk.use()
  curve.color.setRGB(1, 0.6 * Math.random(), 0.6 * Math.random())
  curve.brightness0 = 4
  curve.brightness1 = 0
  curve.brightness2 = -4
  curve.ra = 0.05
  curve.rb = 0.005
}

for (let i = 0; i < 3; i++) {
  const curve = star.use()
  curve.color.setRGB(1, 1, 0.6 * Math.random())
  curve.brightness0 = 0
  curve.brightness1 = 64
  curve.brightness2 = -64
  curve.ra = 0.01
  curve.rb = 0.01
}

for (let i = 0; i < 20; i++) {
  const t = i / 19
  const curve = ground.use()
  curve.color.setRGB(1, 1, 1)
  curve.params1.x = -2
  curve.params1.y = -2 + 4 * t
  curve.params2.x = -curve.params1.x
  curve.params2.y = curve.params1.y
  curve.params1.z = (0.2 + 0.8 * Math.random()) * randomSign()
  curve.params2.z = (0.2 + 0.8 * Math.random()) * randomSign()
  curve.brightness0 = 0
  curve.brightness1 = 128
  curve.brightness2 = -128
  curve.ra = 0.02
  curve.rb = 0.02
}
const snow = createSnow(512)
scene.add(snow.points)

let cameraZTheta = 0
let cameraRotate = 0
const bird = {
  xyDir: 0,
  zTheta: 0,
  position: { x: -1, y: 0, z: 0.7 }
}
sensor.onreset = () => {
  bird.xyDir = 0
  bird.zTheta = 0
  bird.position = { x: -1, y: 0, z: 0.7 }
}
const timeUniforms = {
  time: { value: 0 }
}
const box = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1, 4, 4, 4), new THREE.ShaderMaterial({
  uniforms: timeUniforms,
  vertexShader: `
  uniform float time;
  void main() {
    vec3 pos = position * vec3(0.01, 0.01, 0.002) + vec3(0,0,(sin(39.0 * time) * 0.8 + 0.3) * abs(position.y) * 0.01);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1);
  }
  `,
  fragmentShader: `
  void main() {
    gl_FragColor = vec4(0.5);
  }
  `,
  blending: THREE.AdditiveBlending,
  depthWrite: false
}))
box.visible = false
const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(32, 32),
  new THREE.ShaderMaterial({
    uniforms: timeUniforms,
    vertexShader: `
    varying vec2 coord;
    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1);
      coord = position.xy;
    }
    `,
    fragmentShader: `
    varying vec2 coord;
    uniform float time;
    void main() {
      vec2 xy = coord / 16.0;
      float r2 = dot(xy, xy);
      float r = sqrt(r2);
      float c = clamp(1.0 - r2, 0.0, 1.0);
      float c2 = c * c;
      float a = max(0.0, 16.0 * sin(16.0 * r - 4.0 * time) - 15.0);
      float w = r * a * a;
      gl_FragColor = vec4(0.1 * vec3(c2, c2, 1) * c2 + 0.1 * c2 * vec3(w), 1);
    }
    `,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  })
)
scene.add(plane)
scene.add(box)
let prevTime = 0
function animate() {
  requestAnimationFrame(animate)
  const t = performance.now() / 1000
  const dt = Math.max(0, Math.min(t - prevTime, 0.1))
  prevTime = t
  const sensorDebug = location.hash?.match(/debug/)
  if (sensor.available || sensorDebug) {
    if (sensorDebug) {
      sensor.smoothGravity.x = 0.1
      sensor.smoothGravity.y = -1
      sensor.smoothGravity.z = -4
      sensor.referenceGravity.x = 0
      sensor.referenceGravity.y = -1
      sensor.referenceGravity.z = -4
    }
    const { x, y, z } = sensor.smoothGravity
    const ref = sensor.referenceGravity
    const refZTheta = Math.atan2(Math.hypot(ref.x, ref.y), -ref.z)
    const gravityZTheta = Math.atan2(Math.hypot(x, y), -z)
    cameraZTheta = gravityZTheta - refZTheta
    cameraZTheta = Math.max(-1, Math.min(cameraZTheta, 1))
    const safeRatio = 1 - (1 - (x ** 2 + y ** 2) / (x ** 2 + y ** 2 + z ** 2)) ** 16
    cameraRotate = -(Math.atan2(y, x) + Math.PI / 2) * safeRatio
    const speed = 0.2
    bird.zTheta = cameraZTheta
    bird.position.x += dt * speed * Math.cos(bird.xyDir) * Math.cos(bird.zTheta)
    bird.position.y += dt * speed * Math.sin(bird.xyDir) * Math.cos(bird.zTheta)
    bird.position.z += dt * speed * Math.sin(bird.zTheta)
    bird.position.z = Math.max(0.1, Math.min(bird.position.z, 4))
    const r = Math.hypot(bird.position.x, bird.position.y)
    bird.xyDir += cameraRotate * dt
    if (r > 8) {
      const scale = 8 / r
      bird.position.x *= scale
      bird.position.y *= scale
    }
    box.visible = true
    box.position.x = bird.position.x
    box.position.y = bird.position.y
    box.position.z = bird.position.z
    box.matrixWorldNeedsUpdate = true
    box.rotation.x = 0
    box.rotation.y = 0
    box.rotation.z = 0
    box.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), Math.max(-1,Math.min(-cameraRotate,1)))
    box.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), -bird.zTheta)
    box.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), bird.xyDir)
  } else {
    const th = t * 0.4
    bird.position.x = Math.cos(th)
    bird.position.y = Math.sin(th)
    bird.position.z = 0.7
    bird.xyDir = th + Math.PI
  }
  const camDistance = 0.1
  camera.position.x = bird.position.x - Math.cos(bird.xyDir) * camDistance * Math.cos(cameraZTheta)
  camera.position.y = bird.position.y - Math.sin(bird.xyDir) * camDistance * Math.cos(cameraZTheta)
  camera.position.z = bird.position.z - camDistance * Math.sin(cameraZTheta)
  camera.lookAt(new THREE.Vector3(bird.position.x, bird.position.y, bird.position.z))
  camera.rotateZ(cameraRotate)
  renderer.setRenderTarget(target)
  renderer.autoClear = false
  renderer.clearColor()
  renderer.clearDepth()
  star.update(t)
  treeLeaf.update(t)
  treeTrunk.update(t)
  ground.update(t)
  snow.update(t)
  timeUniforms.time.value = t
  renderer.render(scene, camera)
  renderer.setRenderTarget(null)
  renderer.render(targetRenderScene, targetRenderCamera)
}
animate()