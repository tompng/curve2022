import { Mesh } from 'three'
import * as THREE from 'three'
import { sphereRandom, Curve, CurveManager, createVertexShader } from './tube'

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
}
resetSize()
const theCode = 'vec3 gpos = params1 + sin(10.0 * params2 * (t + time)) * 0.1 + 0.02 * sin(5.0 * params2.yxz * (4.0 * t - time));'
const curveManager = new CurveManager(scene, createVertexShader(theCode))
camera.up = new THREE.Vector3(0, 0, 1)
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
for (let i = 0; i < 10; i++) {
  const curve = curveManager.use()
  const v = sphereRandom()
  curve.params1.x = 0
  curve.params1.y = 0
  curve.params1.z = 0
  curve.params2.x = v.x
  curve.params2.y = v.y
  curve.params2.z = v.z
  curve.color.setRGB(0.6 * Math.random(), 0.6 * Math.random(), 1)
  curve.brightness0 = 0
  curve.brightness1 = 2
  curve.brightness2 = -1
  curve.ra = 0.002
  curve.rb = 0.004
}
function animate() {
  requestAnimationFrame(animate)
  const t = performance.now() / 1000
  const zth = Math.sin(t)
  camera.position.x = 0.4 * Math.cos(t) * Math.cos(zth)
  camera.position.y = 0.4 * Math.sin(t) * Math.cos(zth)
  camera.position.z = 0.4 * Math.sin(zth)
  camera.lookAt(new THREE.Vector3(0, 0, 0))
  renderer.setRenderTarget(target)
  renderer.autoClear = false
  renderer.clearColor()
  renderer.clearDepth()
  for (const c of curveManager.curves) c.time = t/4
  curveManager.update()
  renderer.render(scene, camera)
  renderer.setRenderTarget(null)
  renderer.render(targetRenderScene, targetRenderCamera)
}
animate()
