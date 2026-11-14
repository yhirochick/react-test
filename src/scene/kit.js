// 3D シーンの基本部品: 形・素材・自然物・人物・動物
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

// ── 乱数とノイズ ──
export const rng = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const hash = (x, y) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return s - Math.floor(s)
}
const mix = (a, b, t) => a + (b - a) * t
export function noise(x, y) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  return mix(
    mix(hash(xi, yi), hash(xi + 1, yi), u),
    mix(hash(xi, yi + 1), hash(xi + 1, yi + 1), u),
    v,
  )
}
export const fbm = (x, y) =>
  noise(x, y) * 0.5 + noise(x * 2.1 + 3, y * 2.1 + 7) * 0.3 + noise(x * 4.3 + 11, y * 4.3 + 5) * 0.2
export const sm = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
export const bump = (x, z, cx, cz, r, h) => h * Math.exp(-((x - cx) ** 2 + (z - cz) ** 2) / (r * r))

// ── 素材と形（使い回すものはキャッシュして共有） ──
const mats = new Map()
export function M(color, o) {
  const key = color + (o ? JSON.stringify(o) : '')
  if (!mats.has(key)) {
    const m = new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.92, metalness: 0, ...o })
    m.userData.shared = true
    mats.set(key, m)
  }
  return mats.get(key)
}
const geos = new Map()
export function G(key, make) {
  if (!geos.has(key)) {
    const g = make()
    g.userData.shared = true
    geos.set(key, g)
  }
  return geos.get(key)
}
const texs = new Map()
export function tex(key, w, h, draw, repeat) {
  if (!texs.has(key)) {
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    draw(c.getContext('2d'), w, h)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping
    texs.set(key, t)
  }
  return texs.get(key)
}

export function mesh(geo, color, o) {
  const m = new THREE.Mesh(geo, color?.isMaterial ? color : M(color, o))
  m.castShadow = true
  m.receiveShadow = true
  return m
}
// y は底面の高さ
export function box(w, h, d, color, x = 0, y = 0, z = 0, o) {
  const m = mesh(
    G('box', () => new THREE.BoxGeometry(1, 1, 1)),
    color,
    o,
  )
  m.scale.set(w, h, d)
  m.position.set(x, y + h / 2, z)
  return m
}
// 上半径 rt・下半径 rb の円柱（rb を基準に拡大）
export function cyl(rt, rb, h, color, x = 0, y = 0, z = 0, seg = 8, o) {
  const ratio = Math.round((rt / rb) * 20) / 20
  const m = mesh(
    G(`cyl${ratio}_${seg}`, () => new THREE.CylinderGeometry(ratio, 1, 1, seg)),
    color,
    o,
  )
  m.scale.set(rb, h, rb)
  m.position.set(x, y + h / 2, z)
  return m
}
export const cone = (r, h, color, x, y, z, seg = 8, o) => cyl(0, r, h, color, x, y, z, seg, o)
export function sph(r, color, x = 0, y = 0, z = 0, o) {
  const m = mesh(
    G('ico', () => new THREE.IcosahedronGeometry(1, 1)),
    color,
    o,
  )
  m.scale.setScalar(r)
  m.position.set(x, y, z)
  return m
}
export function plane(w, h, material) {
  const m = new THREE.Mesh(
    G('plane', () => new THREE.PlaneGeometry(1, 1)),
    material,
  )
  m.scale.set(w, h, 1)
  return m
}
export function group(...children) {
  const g = new THREE.Group()
  children.forEach((c) => c && g.add(c))
  return g
}
export function at(obj, x, y, z, ry = 0) {
  obj.position.set(x, y, z)
  obj.rotation.y = ry
  return obj
}
// 寄棟屋根。top が 0 なら四角錐
export function roof(w, d, h, top, color, y = 0) {
  const ratio = Math.round(top * 20) / 20
  const m = mesh(
    G(`roof${ratio}`, () => new THREE.CylinderGeometry(ratio, 1, 1, 4).rotateY(Math.PI / 4)),
    color,
  )
  m.scale.set(w / 1.414, h, d / 1.414)
  m.position.y = y + h / 2
  return m
}
// +X 向きに作ったものを、進行方向 +Z 向きに直す
export function fwd(obj) {
  obj.rotation.y = -Math.PI / 2
  return group(obj)
}
export const flatMat = (color, o) => {
  const m = new THREE.MeshBasicMaterial({ color, ...o })
  return m
}

// ── 大量に置くもの（インスタンス描画） ──
export function instances(geo, material, list) {
  const im = new THREE.InstancedMesh(geo, material, Math.max(1, list.length))
  const d = new THREE.Object3D()
  list.forEach((p, i) => {
    d.position.set(p.x, p.y, p.z)
    d.rotation.set(p.rx || 0, p.ry || 0, p.rz || 0)
    d.scale.set(p.sx ?? p.s ?? 1, p.sy ?? p.s ?? 1, p.sz ?? p.s ?? 1)
    d.updateMatrix()
    im.setMatrixAt(i, d.matrix)
  })
  im.count = list.length
  im.castShadow = im.receiveShadow = true
  return im
}

const T = (x, y, z, sx = 1, sy = sx, sz = sx, rx = 0, ry = 0, rz = 0) =>
  new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
    new THREE.Vector3(sx, sy, sz),
  )
function part(geo, color, m) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone()
  if (m) g.applyMatrix4(m)
  const c = new THREE.Color(color)
  const n = g.attributes.position.count
  const arr = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) arr.set([c.r, c.g, c.b], i * 3)
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3))
  return g
}
const merged = (parts) => mergeGeometries(parts)
const VC = () => M('#ffffff', { vertexColors: true })

function fronds(n, len, y, color, droop = 0.4, width = 0.4) {
  const blade = new THREE.ConeGeometry(width, len, 4)
  const out = []
  for (let i = 0; i < n; i++) {
    const m = new THREE.Matrix4()
      .makeTranslation(0, y, 0)
      .multiply(new THREE.Matrix4().makeRotationY((i / n) * Math.PI * 2))
      .multiply(new THREE.Matrix4().makeRotationZ(-(Math.PI / 2 + droop * (0.6 + (i % 3) * 0.3))))
      .multiply(new THREE.Matrix4().makeTranslation(0, len / 2, 0))
      .multiply(new THREE.Matrix4().makeScale(1, 1, 0.22))
    out.push(part(blade, color, m))
  }
  return out
}

const PLANTS = {
  broad: () => [
    part(new THREE.CylinderGeometry(0.22, 0.34, 3, 6), '#5b4530', T(0, 1.5, 0)),
    part(new THREE.IcosahedronGeometry(1, 1), '#3f7a34', T(0, 4.3, 0, 2.7, 2.1, 2.7)),
    part(new THREE.IcosahedronGeometry(1, 1), '#4f8c3c', T(1.3, 3.5, 0.6, 1.8, 1.4, 1.8)),
    part(new THREE.IcosahedronGeometry(1, 1), '#356b30', T(-1.1, 3.6, -0.7, 1.7, 1.3, 1.7)),
  ],
  pine: () => [
    part(new THREE.CylinderGeometry(0.16, 0.28, 6, 6), '#4b3a2c', T(0, 3, 0, 1, 1, 1, 0, 0, 0.08)),
    part(new THREE.IcosahedronGeometry(1, 1), '#2f5f3a', T(-0.3, 6.4, 0, 3.3, 0.9, 3.3)),
    part(new THREE.IcosahedronGeometry(1, 1), '#3a6e42', T(0.9, 5.3, 0.5, 2, 0.7, 2)),
  ],
  palm: () => [
    part(new THREE.CylinderGeometry(0.13, 0.2, 7, 6), '#7a6a52', T(0, 3.5, 0)),
    ...fronds(9, 3.2, 7, '#4c9a3f'),
  ],
  cycad: () => [
    part(new THREE.CylinderGeometry(0.28, 0.34, 1.1, 6), '#3b3026', T(0, 0.55, 0)),
    ...fronds(11, 1.7, 1.1, '#3f7f3a', 0.15, 0.28),
  ],
  fern: () => [
    part(new THREE.CylinderGeometry(0.12, 0.16, 3.4, 6), '#3d3226', T(0, 1.7, 0)),
    ...fronds(10, 2.4, 3.4, '#5aa84a', 0.2, 0.5),
  ],
  fukugi: () => [
    part(new THREE.CylinderGeometry(0.2, 0.28, 2, 6), '#4b3a2c', T(0, 1, 0)),
    part(new THREE.IcosahedronGeometry(1, 1), '#2c5a2e', T(0, 4.4, 0, 1.7, 3.2, 1.7)),
  ],
  bush: () => [part(new THREE.IcosahedronGeometry(1, 1), '#4a8a3a', T(0, 0.5, 0, 1, 0.7, 1))],
  dead: () => [
    part(new THREE.CylinderGeometry(0.08, 0.24, 4, 5), '#2a2420', T(0, 2, 0, 1, 1, 1, 0, 0, 0.06)),
    part(new THREE.CylinderGeometry(0.04, 0.09, 1.6, 4), '#2a2420', T(0.5, 2.6, 0, 1, 1, 1, 0, 0, -0.9)),
    part(new THREE.CylinderGeometry(0.04, 0.08, 1.2, 4), '#2a2420', T(-0.4, 3.2, 0, 1, 1, 1, 0, 0, 0.8)),
  ],
  cane: () => [0, 1, 2, 3, 4].map((i) =>
    part(
      new THREE.ConeGeometry(0.1, 2.8, 4),
      i % 2 ? '#8fbf5a' : '#7aae4c',
      T(Math.cos(i * 1.3) * 0.25, 1.4, Math.sin(i * 1.3) * 0.25, 1, 1, 1, Math.cos(i) * 0.18, 0, Math.sin(i) * 0.18),
    ),
  ),
  seedling: () => [part(new THREE.ConeGeometry(0.07, 0.34, 4), '#8fd05a', T(0, 0.17, 0))],
  rice: () => [part(new THREE.ConeGeometry(0.16, 0.75, 4), '#6fae3c', T(0, 0.37, 0))],
  gold: () => [
    part(new THREE.ConeGeometry(0.17, 0.8, 4), '#d9b648', T(0, 0.4, 0, 1, 1, 1, 0.25, 0, 0)),
  ],
  barley: () => [part(new THREE.ConeGeometry(0.1, 0.9, 4), '#b9c56c', T(0, 0.45, 0))],
  potato: () => [part(new THREE.IcosahedronGeometry(1, 0), '#4f8f45', T(0, 0.12, 0, 0.55, 0.2, 0.55))],
  pineapple: () => [
    part(new THREE.IcosahedronGeometry(1, 0), '#c9a23a', T(0, 0.35, 0, 0.16, 0.24, 0.16)),
    ...fronds(7, 0.7, 0.15, '#5f8f6a', -0.5, 0.12),
  ],
  rock: () => [part(new THREE.IcosahedronGeometry(1, 0), '#a9a595', T(0, 0.3, 0, 1, 0.7, 0.9))],
  stump: () => [part(new THREE.CylinderGeometry(0.3, 0.38, 0.5, 6), '#6b5238', T(0, 0.25, 0))],
}
export const plantGeo = (kind) => G('plant-' + kind, () => merged(PLANTS[kind]()))
// list: [{x,y,z,s,ry}]
export const plants = (kind, list) => instances(plantGeo(kind), VC(), list)

// ── 人物 ──
// 正面は +Z。o: top, bottom, robe, hat, hatColor, skin, tool, scale, hair
export function person(o = {}) {
  const top = o.top ?? '#3d4f7a'
  const skin = o.skin ?? '#c68e63'
  const bottom = o.bottom ?? skin
  const g = new THREE.Group()
  g.scale.setScalar(o.scale ?? 1)
  const hip = 0.84
  const leg = (x) => {
    const p = new THREE.Group()
    p.position.set(x, hip, 0)
    p.add(box(0.15, hip, 0.17, bottom, 0, -hip, 0))
    g.add(p)
    return p
  }
  const legL = leg(-0.1)
  const legR = leg(0.1)
  if (o.robe) g.add(cyl(0.2, 0.3, 0.78, top, 0, 0.06, 0, 6))
  const torso = new THREE.Group()
  torso.position.y = hip
  g.add(torso)
  torso.add(box(0.42, 0.58, 0.25, top))
  if (o.sash) torso.add(box(0.44, 0.1, 0.27, o.sash, 0, 0.06, 0))
  const arm = (x) => {
    const p = new THREE.Group()
    p.position.set(x, 0.54, 0)
    p.add(box(0.11, 0.56, 0.12, o.sleeve ?? top, 0, -0.56, 0))
    torso.add(p)
    return p
  }
  const armL = arm(-0.27)
  const armR = arm(0.27)
  torso.add(sph(0.135, skin, 0, 0.73, 0))
  const hair = o.hair ?? '#1a1512'
  if (o.hat !== 'helmet' && o.hat !== 'hardhat') {
    const h = sph(0.14, hair, 0, 0.77, -0.035)
    h.scale.set(0.14, 0.12, 0.14)
    torso.add(h)
  }
  const hc = o.hatColor
  if (o.hat === 'kasa') torso.add(cone(0.34, 0.17, hc ?? '#d2bd7c', 0, 0.82, 0, 8))
  else if (o.hat === 'hachimaki') torso.add(cyl(0.15, 0.15, 0.13, hc ?? '#b23a48', 0, 0.82, 0, 8))
  else if (o.hat === 'jingasa') torso.add(cone(0.27, 0.12, hc ?? '#22242a', 0, 0.84, 0, 8))
  else if (o.hat === 'cap') {
    torso.add(cyl(0.14, 0.145, 0.1, hc ?? '#1e2a44', 0, 0.83, 0, 8))
    torso.add(box(0.2, 0.025, 0.12, hc ?? '#1e2a44', 0, 0.83, 0.13))
  } else if (o.hat === 'helmet' || o.hat === 'hardhat') {
    const h = sph(0.165, hc ?? (o.hat === 'helmet' ? '#4d5338' : '#f2c230'), 0, 0.78, 0)
    h.scale.set(0.165, 0.13, 0.175)
    torso.add(h)
  } else if (o.hat === 'long') torso.add(box(0.22, 0.5, 0.07, hair, 0, 0.3, -0.14))
  else if (o.hat === 'umbrella') {
    armR.add(cyl(0.012, 0.012, 1.1, '#333', 0, -0.6, 0.1, 4))
    const u = cone(0.6, 0.22, hc ?? '#30343c', 0, 0.45, 0.1, 8)
    armR.add(u)
  }
  if (o.tool === 'spear') armR.add(at(cyl(0.02, 0.02, 2.4, '#5a4632', 0, 0, 0, 4), 0, -1.5, 0.12))
  else if (o.tool === 'gun') {
    const r = box(0.05, 0.07, 1.1, '#2b2622', 0, 0, 0)
    r.position.set(0, -0.5, 0.3)
    armR.add(r)
  } else if (o.tool === 'hoe') {
    const s = cyl(0.02, 0.02, 1.3, '#6b5238', 0, 0, 0, 4)
    s.rotation.x = Math.PI / 2
    s.position.set(-0.1, -0.52, 0.5)
    armR.add(s, at(box(0.16, 0.05, 0.22, '#3a3a3e'), -0.1, -0.66, 1.1))
  } else if (o.tool === 'flag' || o.tool === 'banner') {
    armR.add(at(cyl(0.02, 0.02, 2.8, '#5a4632', 0, 0, 0, 4), 0, -0.9, 0.1))
    const f = box(o.tool === 'flag' ? 0.9 : 0.5, o.tool === 'flag' ? 0.6 : 1.5, 0.02, o.toolColor ?? '#d83b3b')
    f.position.set(o.tool === 'flag' ? 0.47 : 0.27, o.tool === 'flag' ? 1.55 : 1.1, 0.1)
    armR.add(f)
  } else if (o.tool === 'torch') {
    armR.add(at(cyl(0.02, 0.02, 0.9, '#3a2a1c', 0, 0, 0, 4), 0, -0.9, 0.1))
    armR.add(at(sph(0.13, flatMat('#ffb23a')), 0, -1, 0.1))
  } else if (o.tool === 'sack') torso.add(box(0.5, 0.3, 0.3, o.toolColor ?? '#c9b88a', 0, 0.62, -0.1))
  else if (o.tool === 'bundle') torso.add(box(0.36, 0.4, 0.2, o.toolColor ?? '#7a5a8a', 0, 0.1, -0.22))
  else if (o.tool === 'jar') torso.add(cyl(0.12, 0.17, 0.34, o.toolColor ?? '#4a4f55', 0, 0.9, 0, 7))
  g.userData = { person: true, legL, legR, armL, armR, torso, ph: Math.random() * 6.28, mode: o.mode }
  return g
}

export function animatePerson(g, t, mode = 'stand') {
  const u = g.userData
  const p = t * 5 + u.ph
  const s = Math.sin(p)
  const { legL, legR, armL, armR, torso } = u
  legL.rotation.x = legR.rotation.x = 0
  armL.rotation.z = armR.rotation.z = 0
  torso.rotation.set(0, 0, 0)
  switch (mode) {
    case 'walk':
    case 'march':
      legL.rotation.x = s * 0.55
      legR.rotation.x = -s * 0.55
      armL.rotation.x = -s * 0.45
      armR.rotation.x = mode === 'march' ? -0.25 : s * 0.45
      break
    case 'run': {
      const q = Math.sin(t * 9 + u.ph)
      legL.rotation.x = q * 0.95
      legR.rotation.x = -q * 0.95
      armL.rotation.x = -q * 0.9
      armR.rotation.x = q * 0.9
      torso.rotation.x = 0.22
      break
    }
    case 'carry':
      legL.rotation.x = s * 0.5
      legR.rotation.x = -s * 0.5
      armL.rotation.x = armR.rotation.x = -2.7
      break
    case 'plant': {
      const b = 0.95 + Math.sin(t * 1.5 + u.ph) * 0.35
      torso.rotation.x = b
      armL.rotation.x = armR.rotation.x = -0.5 - Math.sin(t * 3 + u.ph) * 0.3
      break
    }
    case 'hoe': {
      const q = Math.sin(t * 2.6 + u.ph)
      torso.rotation.x = 0.35 + q * 0.25
      armL.rotation.x = armR.rotation.x = -1.5 + q * 1.0
      break
    }
    case 'cheer':
      armL.rotation.x = armR.rotation.x = -2.8 + Math.sin(t * 6 + u.ph) * 0.3
      armL.rotation.z = -0.3
      armR.rotation.z = 0.3
      break
    case 'wave':
      armR.rotation.x = -2.8
      armR.rotation.z = 0.3 + Math.sin(t * 5 + u.ph) * 0.4
      armL.rotation.x = 0
      break
    case 'pray':
      torso.rotation.x = 0.5 + Math.sin(t * 0.8 + u.ph) * 0.2
      armL.rotation.x = armR.rotation.x = -1.2
      armL.rotation.z = 0.25
      armR.rotation.z = -0.25
      break
    case 'bow':
      torso.rotation.x = 1.1 + Math.sin(t * 0.5 + u.ph) * 0.1
      armL.rotation.x = armR.rotation.x = -1.0
      legL.rotation.x = legR.rotation.x = -1.5
      break
    case 'sit':
      legL.rotation.x = legR.rotation.x = -1.5
      torso.rotation.x = 0.1 + Math.sin(t * 0.6 + u.ph) * 0.04
      armL.rotation.x = armR.rotation.x = -0.5
      break
    case 'dance': {
      const q = t * 1.4 + u.ph
      armL.rotation.x = -1.6 + Math.sin(q) * 0.5
      armR.rotation.x = -1.6 - Math.sin(q) * 0.5
      armL.rotation.z = -0.5
      armR.rotation.z = 0.5
      torso.rotation.y = Math.sin(q * 0.5) * 0.7
      legL.rotation.x = Math.sin(q) * 0.2
      legR.rotation.x = -Math.sin(q) * 0.2
      break
    }
    case 'aim':
      armL.rotation.x = armR.rotation.x = -1.5
      break
    default:
      torso.rotation.x = Math.sin(t * 0.7 + u.ph) * 0.03
      armL.rotation.x = Math.sin(t * 0.9 + u.ph) * 0.06
      armR.rotation.x = u.armRest ?? -Math.sin(t * 0.9 + u.ph) * 0.06
  }
}

// ── 動物 ──
export function buffalo() {
  const c = '#3b3b40'
  const g = group(
    box(0.8, 0.75, 1.7, c, 0, 0.6, 0),
    box(0.45, 0.45, 0.6, c, 0, 0.85, 1.05),
    at(cyl(0.02, 0.06, 0.6, '#cfc8b8', 0, 0, 0, 5), -0.38, 1.25, 1.1),
    at(cyl(0.02, 0.06, 0.6, '#cfc8b8', 0, 0, 0, 5), 0.38, 1.25, 1.1),
  )
  g.children[2].rotation.z = 1.1
  g.children[3].rotation.z = -1.1
  for (const [x, z] of [[-0.28, 0.6], [0.28, 0.6], [-0.28, -0.6], [0.28, -0.6]])
    g.add(box(0.16, 0.6, 0.16, c, x, 0, z))
  return g
}
export function horse(color = '#7a5232') {
  const g = group(
    box(0.42, 0.5, 1.3, color, 0, 0.75, 0),
    box(0.2, 0.55, 0.25, color, 0, 1.05, 0.72),
    box(0.18, 0.2, 0.42, color, 0, 1.5, 0.9),
    box(0.08, 0.5, 0.08, '#2a1c12', 0, 0.75, -0.72),
  )
  g.children[1].rotation.x = 0.5
  for (const [x, z] of [[-0.15, 0.5], [0.15, 0.5], [-0.15, -0.5], [0.15, -0.5]])
    g.add(box(0.1, 0.75, 0.1, color, x, 0, z))
  return g
}
// ヤンバルクイナ風の飛べない鳥
export function rail() {
  return group(
    box(0.16, 0.16, 0.3, '#4a4636', 0, 0.2, 0),
    box(0.1, 0.12, 0.12, '#3a3a40', 0, 0.34, 0.16),
    box(0.03, 0.03, 0.1, '#e03a2a', 0, 0.38, 0.27),
    box(0.03, 0.2, 0.03, '#e03a2a', -0.05, 0, 0),
    box(0.03, 0.2, 0.03, '#e03a2a', 0.05, 0, 0),
  )
}
// 空を飛ぶ鳥。wing() を毎フレーム呼んで羽ばたかせる
export function bird(color = '#f4f4f0') {
  const l = box(0.7, 0.03, 0.22, color, -0.35, 0, 0)
  const r = box(0.7, 0.03, 0.22, color, 0.35, 0, 0)
  const wl = group(l)
  const wr = group(r)
  const g = group(box(0.14, 0.12, 0.5, color, 0, -0.06, 0), wl, wr)
  g.userData.flap = (t) => {
    const a = Math.sin(t * 7) * 0.6
    wl.rotation.z = -a
    wr.rotation.z = a
  }
  return g
}
