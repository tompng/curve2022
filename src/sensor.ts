export class GravitySensor {
  available = false
  gravity = { x: 0, y: 0, z: 0 }
  referenceGravity = { x: 0, y: 0, z: 0 }
  initialized = false
  button: HTMLElement
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
    })
  }
  upgradeButton() {
    this.button.textContent = 'Reset'
    this.button.onclick = () => {
      this.referenceGravity = { ...this.gravity }
    }
  }
  createButton() {
    const button = document.createElement('a')
    button.textContent = 'Gravity On'
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
    `
    return button
  }
}
