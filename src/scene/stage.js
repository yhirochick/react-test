// 映像シーンの舞台: 空・光・地形・海・カメラ・特殊効果
import * as THREE from 'three'
import { animatePerson, flatMat, G, instances, tex } from './kit'

const ENV = {
  day: { top: '#2a78cf', hor: '#cfe6f2', sun: [0.45, 0.72, 0.4], sunC: '#fff3dc', sunI: 3.3, amb: '#c4dcff', ambI: 1.15, fog: '#cfe6f2', fogD: 0.0016 },
  dawn: { top: '#4a70b6', hor: '#ffd3a0', sun: [0.82, 0.2, -0.35], sunC: '#ffc38c', sunI: 3.0, amb: '#a9bbe0', ambI: 0.95, fog: '#f2d2ad', fogD: 0.0028 },
  dusk: { top: '#2f3470', hor: '#ff8f5a', sun: [-0.8, 0.15, -0.45], sunC: '#ff9c5e', sunI: 2.8, amb: '#948ac4', ambI: 0.85, fog: '#e39a76', fogD: 0.003 },
  night: { top: '#02050d', hor: '#141e36', sun: [-0.4, 0.62, 0.45], sunC: '#8ea6ff', sunI: 0.7, amb: '#33446e', ambI: 0.6, fog: '#0c1424', fogD: 0.004, stars: true, clouds: 0, exp: 1.1 },
  overcast: { top: '#8492a0', hor: '#c8d0d5', sun: [0.3, 0.8, 0.3], sunC: '#e8eef2', sunI: 1.5, amb: '#c6ced6', ambI: 1.5, fog: '#c2cace', fogD: 0.0035, noSun: true },
  storm: { top: '#39424c', hor: '#7b868e', sun: [0.2, 0.8, 0.3], sunC: '#c8d2dc', sunI: 1.0, amb: '#8f9aa6', ambI: 1.4, fog: '#78838b', fogD: 0.005, noSun: true },
  war: { top: '#5c5852', hor: '#c4a47e', sun: [0.4, 0.45, 0.35], sunC: '#ffcd96', sunI: 2.0, amb: '#ab9c8c', ambI: 1.1, fog: '#b79e85', fogD: 0.0042 },
}

const V = (a) => new THREE.Vector3(a[0], a[1], a[2])

function waterNormals() {
  return tex(
    'water-n',
    128,
    128,
    (ctx, w, h) => {
      const img = ctx.createImageData(w, h)
      const waves = [[3, 1, 0.3], [-2, 4, 1.7], [5, -3, 4.1], [1, 6, 2.2], [-6, -2, 0.9], [8, 5, 3.3]]
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          let dx = 0
          let dy = 0
          for (const [kx, ky, ph] of waves) {
            const c = Math.cos(2 * Math.PI * ((kx * x) / w + (ky * y) / h) + ph) / Math.hypot(kx, ky)
            dx += c * kx
            dy += c * ky
          }
          const n = new THREE.Vector3(-dx * 0.5, -dy * 0.5, 1).normalize()
          const i = (y * w + x) * 4
          img.data[i] = (n.x * 0.5 + 0.5) * 255
          img.data[i + 1] = (n.y * 0.5 + 0.5) * 255
          img.data[i + 2] = (n.z * 0.5 + 0.5) * 255
          img.data[i + 3] = 255
        }
      ctx.putImageData(img, 0, 0)
    },
    true,
  )
}

export class Stage {
  constructor(canvas) {
    this.canvas = canvas
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.3, 3000)
    this.updaters = []
    this.shots = []
    this.h = () => 0
    this.time = 0
    this.raf = 0
    this.frame = this.frame.bind(this)
  }

  clear() {
    this.scene.traverse((o) => {
      if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose()
      const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : []
      ms.forEach((m) => !m.userData.shared && m.dispose())
      if (o.isInstancedMesh) o.dispose()
    })
    this.scene.clear()
    this.updaters = []
    this.shots = []
    this.h = () => 0
    this.time = 0
    this.sky = null
  }

  // ── 環境 ──
  env(name = 'day', o = {}) {
    const e = { ...ENV[name], ...o }
    const { scene } = this
    scene.fog = new THREE.FogExp2(e.fog, e.fogD)
    this.renderer.toneMappingExposure = e.exp ?? 1
    this.sky = new THREE.Mesh(
      new THREE.SphereGeometry(2400, 24, 12),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: { top: { value: new THREE.Color(e.top) }, hor: { value: new THREE.Color(e.hor) } },
        vertexShader: 'varying vec3 p; void main(){ p = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader:
          'uniform vec3 top; uniform vec3 hor; varying vec3 p; void main(){ float h = max(normalize(p).y, 0.0); gl_FragColor = vec4(mix(hor, top, pow(h, 0.55)), 1.0);\n#include <colorspace_fragment>\n}',
      }),
    )
    scene.add(this.sky)
    scene.add(new THREE.HemisphereLight(e.amb, e.gnd ?? '#5c5242', e.ambI))
    const dir = V(e.sun).normalize()
    this.sunDir = dir
    const sun = new THREE.DirectionalLight(e.sunC, e.sunI)
    sun.position.copy(dir).multiplyScalar(260)
    sun.castShadow = true
    const r = e.shadow ?? 85
    Object.assign(sun.shadow.camera, { left: -r, right: r, top: r, bottom: -r, near: 10, far: 600 })
    sun.shadow.mapSize.set(2048, 2048)
    sun.shadow.bias = -0.0004
    sun.shadow.normalBias = 0.35
    scene.add(sun, sun.target)
    if (!e.noSun) {
      const glow = tex('glow', 128, 128, (c) => {
        const g = c.createRadialGradient(64, 64, 0, 64, 64, 64)
        g.addColorStop(0, 'rgba(255,255,255,1)')
        g.addColorStop(0.12, 'rgba(255,255,255,0.9)')
        g.addColorStop(0.3, 'rgba(255,255,255,0.25)')
        g.addColorStop(1, 'rgba(255,255,255,0)')
        c.fillStyle = g
        c.fillRect(0, 0, 128, 128)
      })
      const s = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: glow, color: e.sunC, fog: false, depthWrite: false, blending: THREE.AdditiveBlending }),
      )
      s.scale.setScalar(e.stars ? 260 : 620)
      s.position.copy(dir).multiplyScalar(2200)
      this.sunSprite = s
      scene.add(s)
    }
    if (e.stars) {
      const n = 500
      const pos = new Float32Array(n * 3)
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2
        const y = Math.random() * 0.95 + 0.04
        const rr = Math.sqrt(1 - y * y)
        pos.set([Math.cos(a) * rr * 2300, y * 2300, Math.sin(a) * rr * 2300], i * 3)
      }
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      this.stars = new THREE.Points(g, new THREE.PointsMaterial({ color: '#dfe8ff', size: 2.2, sizeAttenuation: false, fog: false }))
      scene.add(this.stars)
    }
    const nc = e.clouds ?? 9
    if (nc) {
      const list = []
      for (let i = 0; i < nc; i++) {
        const cx = (Math.random() - 0.5) * 1800
        const cz = (Math.random() - 0.5) * 1800
        const cy = 170 + Math.random() * 120
        for (let k = 0; k < 5; k++)
          list.push({ x: cx + (Math.random() - 0.5) * 90, y: cy + Math.random() * 12, z: cz + (Math.random() - 0.5) * 50, sx: 30 + Math.random() * 30, sy: 9 + Math.random() * 7, sz: 22 + Math.random() * 20 })
      }
      const m = new THREE.MeshLambertMaterial({ color: e.cloudC ?? '#ffffff', transparent: true, opacity: 0.9, fog: false })
      const im = instances(G('ico', () => new THREE.IcosahedronGeometry(1, 1)), m, list)
      im.castShadow = im.receiveShadow = false
      scene.add(im)
      this.tick((t) => (im.position.x = ((t * 3) % 400) - 200))
    }
    return e
  }

  // 地形。hfn(x,z) が高さ、paint(x,z,h) が色（null なら既定の色）
  ground(hfn, { size = 800, seg = 160, paint } = {}) {
    this.h = hfn
    const geo = new THREE.PlaneGeometry(size, size, seg, seg).rotateX(-Math.PI / 2)
    const pos = geo.attributes.position
    const col = new Float32Array(pos.count * 3)
    const c = new THREE.Color()
    const c2 = new THREE.Color()
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)
      const h = hfn(x, z)
      pos.setY(i, h)
      const hex = paint?.(x, z, h)
      if (hex) c.set(hex)
      else {
        const slope = Math.hypot(hfn(x + 1.5, z) - h, hfn(x, z + 1.5) - h) / 1.5
        const n = Math.sin(x * 0.37 + z * 0.21) * 0.5 + Math.sin(x * 0.11 - z * 0.3) * 0.5
        if (h < -0.25) c.set('#e3d9ae').lerp(c2.set('#0f4f7a'), Math.min(1, -h / 5))
        else if (h < 0.12) c.set('#f6f1dc')
        else if (h < 0.7) c.set('#e6dcb4')
        else if (slope > 0.75) c.set('#aaa593')
        else c.set('#5f9140').lerp(c2.set('#7fa850'), n * 0.5 + 0.5).lerp(c2.set('#e6dcb4'), 1 - Math.min(1, (h - 0.7) / 0.8))
      }
      col.set([c.r, c.g, c.b], i * 3)
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
    geo.computeVertexNormals()
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 }))
    m.receiveShadow = true
    this.scene.add(m)
    return m
  }

  sea({ color = '#1fa3ba', opacity = 0.8, level = 0 } = {}) {
    const n = waterNormals()
    n.repeat.set(70, 70)
    const mat = new THREE.MeshStandardMaterial({ color, transparent: true, opacity, roughness: 0.16, metalness: 0.2, normalMap: n, normalScale: new THREE.Vector2(0.7, 0.7) })
    const m = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000).rotateX(-Math.PI / 2), mat)
    m.position.y = level
    m.receiveShadow = true
    this.scene.add(m)
    this.tick((t) => n.offset.set(t * 0.012, t * 0.02))
    return m
  }

  // 地面の高さに置く
  put(obj, x, z, ry = 0, dy = 0) {
    obj.position.set(x, this.h(x, z) + dy, z)
    obj.rotation.y = ry
    this.scene.add(obj)
    return obj
  }
  // 海に浮かべて揺らす
  float(obj, x, z, ry = 0, dy = 0) {
    obj.position.set(x, dy, z)
    obj.rotation.y = ry
    this.scene.add(obj)
    const ph = x * 0.3 + z * 0.2
    this.tick((t) => {
      obj.position.y = dy + Math.sin(t * 1.1 + ph) * 0.18
      obj.rotation.z = Math.sin(t * 0.9 + ph) * 0.025
      obj.rotation.x = Math.sin(t * 0.7 + ph) * 0.02
    })
    return obj
  }
  add(...objs) {
    this.scene.add(...objs)
    return objs[0]
  }
  tick(fn) {
    this.updaters.push(fn)
  }
  // 立っている人などに身ぶりをつける
  act(p, mode) {
    this.tick((t) => animatePerson(p, t, mode))
    return p
  }

  // 折れ線に沿って動かす。pts: [[x,z],...]
  walk(obj, pts, speed, o = {}) {
    const { mode = 'walk', loop = true, sea = false, offset = 0, endMode = 'stand', dy = 0, fly = null } = o
    const lens = []
    let total = 0
    for (let i = 1; i < pts.length; i++) {
      const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])
      lens.push(d)
      total += d
    }
    this.scene.add(obj)
    this.tick((t) => {
      let s = offset + t * speed
      const done = !loop && s >= total
      s = loop ? ((s % total) + total) % total : Math.min(s, total - 0.001)
      let i = 0
      while (i < lens.length - 1 && s > lens[i]) s -= lens[i++]
      const k = lens[i] ? s / lens[i] : 0
      const [ax, az] = pts[i]
      const [bx, bz] = pts[i + 1]
      const x = ax + (bx - ax) * k
      const z = az + (bz - az) * k
      let y = sea ? Math.sin(t * 1.1 + x * 0.2) * 0.15 : this.h(x, z)
      if (fly) y = fly(x, z, t)
      obj.position.set(x, y + dy, z)
      obj.rotation.y = Math.atan2(bx - ax, bz - az)
      if (obj.userData.person) animatePerson(obj, t, done ? endMode : mode)
      obj.userData.spin?.(t)
    })
    return obj
  }

  // カメラの 1 カット。from → to へゆっくり動き、look → look2 を見る
  shot(from, to, look, look2, dur = 8) {
    this.shots.push({ a: V(from), b: V(to), la: V(look), lb: V(look2 ?? look), dur })
  }

  // ── 特殊効果 ──
  fire(x, y, z, size = 1, light = false) {
    const g = new THREE.Group()
    g.position.set(x, y, z)
    const geo = G('flame', () => new THREE.ConeGeometry(0.5, 1.6, 6).translate(0, 0.8, 0))
    const cols = ['#ff5a1f', '#ff8a1f', '#ffc23a', '#ffe38a']
    const flames = cols.map((c, i) => {
      const m = new THREE.Mesh(geo, flatMat(c, { transparent: true, opacity: 0.9, fog: false }))
      m.position.set(Math.cos(i * 2.1) * 0.25 * size, 0, Math.sin(i * 2.1) * 0.25 * size)
      g.add(m)
      return m
    })
    let pl = null
    if (light) {
      pl = new THREE.PointLight('#ff8a3a', 60 * size, 60 * size)
      pl.position.y = size * 1.5
      g.add(pl)
    }
    this.scene.add(g)
    this.tick((t) => {
      flames.forEach((m, i) => {
        const f = 0.75 + 0.35 * Math.sin(t * (9 + i * 2.3) + i + x) + 0.15 * Math.sin(t * 23 + i * 5)
        m.scale.set(size * (1 - i * 0.18), size * f * (1.2 - i * 0.15), size * (1 - i * 0.18))
      })
      if (pl) pl.intensity = size * (45 + 25 * Math.sin(t * 13 + x) * Math.sin(t * 7.1))
    })
    return g
  }

  smoke(x, y, z, { size = 2, n = 14, color = '#4a4642', rise = 5, spread = 1.2, wind = [1.5, 0.6], life = 7, opacity = 0.75 } = {}) {
    const mat = new THREE.MeshLambertMaterial({ color, transparent: true, opacity, depthWrite: false })
    const im = new THREE.InstancedMesh(G('ico', () => new THREE.IcosahedronGeometry(1, 1)), mat, n)
    im.frustumCulled = false
    const d = new THREE.Object3D()
    this.scene.add(im)
    this.tick((t) => {
      for (let i = 0; i < n; i++) {
        const a = ((t / life + i / n) % 1 + 1) % 1
        const sway = Math.sin(i * 12.9) * spread
        d.position.set(x + wind[0] * a * life + sway * a * 3, y + a * rise * life, z + wind[1] * a * life + Math.cos(i * 7.3) * spread * a * 3)
        d.scale.setScalar(size * (0.35 + a * 1.9) * (a > 0.85 ? (1 - a) / 0.15 : 1))
        d.rotation.set(i, a * 2 + i, 0)
        d.updateMatrix()
        im.setMatrixAt(i, d.matrix)
      }
      im.instanceMatrix.needsUpdate = true
    })
    return im
  }

  // area: [cx, cz, rx, rz] の中でときどき爆発が起きる
  explosions(area, { every = 1.3, size = 5, count = 4 } = {}) {
    const pool = []
    for (let i = 0; i < count; i++) {
      const flash = new THREE.Mesh(G('ico', () => new THREE.IcosahedronGeometry(1, 1)), flatMat('#ffd27a', { transparent: true, fog: false }))
      const dirt = new THREE.Mesh(G('ico', () => new THREE.IcosahedronGeometry(1, 1)), new THREE.MeshLambertMaterial({ color: '#3d342b', transparent: true, depthWrite: false }))
      flash.visible = dirt.visible = false
      this.scene.add(flash, dirt)
      pool.push({ flash, dirt, t0: -99, x: 0, z: 0, s: 1 })
    }
    let next = 0.5
    let k = 0
    this.tick((t) => {
      if (t > next) {
        const e = pool[k++ % count]
        e.t0 = t
        e.x = area[0] + (Math.random() * 2 - 1) * area[2]
        e.z = area[1] + (Math.random() * 2 - 1) * area[3]
        e.s = size * (0.6 + Math.random() * 0.8)
        next = t + every * (0.4 + Math.random() * 1.2)
      }
      for (const e of pool) {
        const a = t - e.t0
        const y = this.h(e.x, e.z)
        e.flash.visible = a < 0.35
        e.dirt.visible = a < 3.2
        if (a < 0.35) {
          e.flash.position.set(e.x, Math.max(y, 0) + e.s * 0.4, e.z)
          e.flash.scale.setScalar(e.s * (0.3 + a * 2.6))
          e.flash.material.opacity = 1 - a / 0.35
        }
        if (a < 3.2) {
          e.dirt.position.set(e.x, Math.max(y, 0) + e.s * (0.5 + a * 1.4), e.z)
          e.dirt.scale.set(e.s * (0.6 + a * 0.6), e.s * (0.8 + a * 0.9), e.s * (0.6 + a * 0.6))
          e.dirt.material.opacity = 0.85 * (1 - a / 3.2)
        }
      }
    })
  }

  rain(n = 1400) {
    const pos = new Float32Array(n * 6)
    const seeds = []
    for (let i = 0; i < n; i++) seeds.push([Math.random() * 120 - 60, Math.random() * 50, Math.random() * 120 - 60, 0.7 + Math.random() * 0.6])
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    const lines = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: '#c8d4e0', transparent: true, opacity: 0.5 }))
    lines.frustumCulled = false
    this.scene.add(lines)
    this.tick((t) => {
      const c = this.camera.position
      for (let i = 0; i < n; i++) {
        const s = seeds[i]
        const y = 50 - ((t * 38 * s[3] + s[1]) % 50)
        pos.set([c.x + s[0], y, c.z + s[2], c.x + s[0] + 0.25, y - 1.3, c.z + s[2]], i * 6)
      }
      g.attributes.position.needsUpdate = true
    })
  }

  // ── 再生 ──
  resize() {
    const w = this.canvas.clientWidth || 1
    const h = this.canvas.clientHeight || 1
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    // 縦長の画面では画角を広げる
    this.camera.fov = w / h < 1 ? 58 : 38
    this.camera.updateProjectionMatrix()
  }
  frame(now) {
    const dt = Math.min(0.1, (now - this.last) / 1000 || 0)
    this.last = now
    this.time += dt
    this.render(this.time, dt)
    this.raf = requestAnimationFrame(this.frame)
  }
  render(t, dt = 0.016) {
    for (const f of this.updaters) f(t, dt)
    if (this.shots.length) {
      const total = this.shots.reduce((s, x) => s + x.dur, 0)
      let u = t % total
      let sh = this.shots[0]
      for (const s of this.shots) {
        if (u < s.dur) {
          sh = s
          break
        }
        u -= s.dur
      }
      const k = u / sh.dur
      const e = k * 0.7 + (k * k * (3 - 2 * k)) * 0.3
      this.camera.position.lerpVectors(sh.a, sh.b, e)
      this.camera.position.y += Math.sin(t * 0.8) * 0.04
      this.camera.lookAt(new THREE.Vector3().lerpVectors(sh.la, sh.lb, e))
    }
    if (this.sky) this.sky.position.copy(this.camera.position)
    this.renderer.render(this.scene, this.camera)
  }
  play() {
    if (this.raf) return
    this.resize()
    this.last = performance.now()
    this.raf = requestAnimationFrame(this.frame)
  }
  stop() {
    cancelAnimationFrame(this.raf)
    this.raf = 0
  }
  dispose() {
    this.stop()
    this.clear()
    this.renderer.dispose()
  }
}
