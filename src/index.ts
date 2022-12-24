import { Mesh } from 'three'
import * as THREE from 'three'
import { CurveManager, createVertexShader } from './tube'
import { createSnow } from './snow'

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
  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100)
  camera.up = new THREE.Vector3(0, 0, 1)
}
resetSize()
document.body.appendChild(renderer.domElement)
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

function animate() {
  requestAnimationFrame(animate)
  const t = performance.now() / 1000
  const zth = Math.sin(t)*0
  const distance = 1
  const th = t * 0.4
  camera.position.x = distance * Math.cos(th) * Math.cos(zth)
  camera.position.y = distance * Math.sin(th) * Math.cos(zth)
  camera.position.z = distance * Math.sin(zth) / 4 + 0.7
  camera.lookAt(new THREE.Vector3(0, 0, 0.7))
  renderer.setRenderTarget(target)
  renderer.autoClear = false
  renderer.clearColor()
  renderer.clearDepth()
  star.update(t)
  treeLeaf.update(t)
  treeTrunk.update(t)
  ground.update(t)
  snow.update(t)
  renderer.render(scene, camera)
  renderer.setRenderTarget(null)
  renderer.render(targetRenderScene, targetRenderCamera)
}
animate()
