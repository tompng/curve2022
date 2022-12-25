export class GravitySensor {
  available = false
  gravity = { x: 0, y: 0, z: 0 }
  referenceGravity = { x: 0, y: -1, z: -1 }
  initialized = false
  button: HTMLElement
  onreset?: () => void
  smoothGravity = {
    x: 0, y: 0, z: 0,
    ax: 0, ay: 0, az: 0,
    bx: 0, by: 0, bz: 0,
    cx: 0, cy: 0, cz: 0,
  }
  constructor() {
    this.button = this.createButton()
    this.button.onclick = () => {
      this.start()
      this.button.style.display = 'none'
    }
  }
  start() {
    this.bindEvent()
    ;(window.DeviceMotionEvent as any).requestPermission?.()
  }
  bindEvent() {
    if (this.initialized) return
    this.initialized = true
    window.addEventListener('devicemotion', e => {
      if (!this.available) {
        this.upgradeButton()
        this.available = true
      }
      const { x, y, z } = e.accelerationIncludingGravity as { x: number; y: number; z: number }
      const r = Math.hypot(x, y, z)
      const scale = 0.01 * (r > 10 ? 10 / r : 1)
      const orientation = typeof window.orientation === 'number' ? window.orientation : (window.screen && window.screen.orientation && window.screen.orientation.angle) || 0
      const th = Math.PI * orientation / 180
      const cos = Math.cos(th)
      const sin = Math.sin(th)
      this.gravity.x = scale * (x * cos - y * sin)
      this.gravity.y = scale * (x * sin + y * cos)
      this.gravity.z = z * scale
      const ratioA = 0.7
      const ratioB = ratioA ** 2
      const ratioC = ratioA ** 3
      this.smoothGravity.ax = (this.smoothGravity.ax + this.gravity.x) * ratioA
      this.smoothGravity.ay = (this.smoothGravity.ay + this.gravity.y) * ratioA
      this.smoothGravity.az = (this.smoothGravity.az + this.gravity.z) * ratioA
      this.smoothGravity.bx = (this.smoothGravity.bx + this.gravity.x) * ratioB
      this.smoothGravity.by = (this.smoothGravity.by + this.gravity.y) * ratioB
      this.smoothGravity.bz = (this.smoothGravity.bz + this.gravity.z) * ratioB
      this.smoothGravity.cx = (this.smoothGravity.cx + this.gravity.x) * ratioC
      this.smoothGravity.cy = (this.smoothGravity.cy + this.gravity.y) * ratioC
      this.smoothGravity.cz = (this.smoothGravity.cz + this.gravity.z) * ratioC
      const smoothScale = 1 / (1 - ratioA) - 2 / (1 - ratioB) + 1 / (1 - ratioC)
      this.smoothGravity.x = (this.smoothGravity.ax - 2 * this.smoothGravity.bx + this.smoothGravity.cx) / smoothScale
      this.smoothGravity.y = (this.smoothGravity.ay - 2 * this.smoothGravity.by + this.smoothGravity.cy) / smoothScale
      this.smoothGravity.z = (this.smoothGravity.az - 2 * this.smoothGravity.bz + this.smoothGravity.cz) / smoothScale
    })
  }
  upgradeButton() {
    this.button.textContent = 'Reset'
    this.button.style.display = 'block'
    this.button.onclick = () => {
      this.referenceGravity = { ...this.gravity }
      this.onreset?.()
    }
  }
  createButton() {
    const button = document.createElement('a')
    button.textContent = 'Gyro On'
    button.style.cssText = `
      position: fixed;
      height: 8vmin;
      fontSize: 4vmin;
      right: 2vmin;
      bottom: 2vmin;
      background: white;
      color: black;
      text-align: center;
      line-height: 8vmin;
      padding: 0 2vmin;
      border-radius: 1vmin;
      cursor: pointer;
      opacity: 0.8;
    `
    return button
  }
}
