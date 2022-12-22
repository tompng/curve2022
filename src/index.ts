import { Mesh } from 'three'
import * as THREE from 'three'
import { sphereRandom, Curve, CurveManager } from './tube'

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
const curves = new CurveManager(scene)
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
  }, 1000)
}
const added: Curve[] = []
for (let i = 0; i < 10; i++) {
  const curve = curves.use()
  const v = sphereRandom()
  curve.p.x = 0
  curve.p.y = 0
  curve.p.z = 0
  curve.v.x = v.x
  curve.v.y = v.y
  curve.v.z = v.z
  curve.color.setRGB(0.6 * Math.random(), 0.6 * Math.random(), 1)
  curve.brightness0 = 0
  curve.brightness1 = 2
  curve.brightness2 = -1
  curve.ra = 0.002
  curve.rb = 0.004
  added.push(curve)
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
  for (const c of added) c.time = t
  curves.update()
  renderer.render(scene, camera)
  renderer.setRenderTarget(null)
  renderer.render(targetRenderScene, targetRenderCamera)
}
animate()
