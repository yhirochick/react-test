// 建物・船・乗り物・航空機・小道具
import * as THREE from 'three'
import { at, box, cone, cyl, flatMat, fwd, G, group, mesh, plane, roof, sph, tex } from './kit'

// 絵柄つきの素材
const tms = new Map()
export function TM(key, w, h, draw, o = {}) {
  if (!tms.has(key)) {
    const m = new THREE.MeshStandardMaterial({ map: tex(key, w, h, draw, o.repeat), roughness: 0.9, side: THREE.DoubleSide, ...o.mat })
    m.userData.shared = true
    tms.set(key, m)
  }
  return tms.get(key)
}

// ── 旗と帆の絵柄 ──
const FLAGS = {
  hinomaru: (c, w, h) => {
    c.fillStyle = '#fff'
    c.fillRect(0, 0, w, h)
    c.fillStyle = '#c8102e'
    c.beginPath()
    c.arc(w / 2, h / 2, h * 0.3, 0, 7)
    c.fill()
  },
  usa: (c, w, h) => {
    for (let i = 0; i < 13; i++) {
      c.fillStyle = i % 2 ? '#fff' : '#b22234'
      c.fillRect(0, (i * h) / 13, w, h / 13 + 1)
    }
    c.fillStyle = '#3c3b6e'
    c.fillRect(0, 0, w * 0.42, h * 0.54)
    c.fillStyle = '#fff'
    for (let y = 0; y < 5; y++) for (let x = 0; x < 6; x++) c.fillRect(6 + x * 8.5, 5 + y * 6.5, 2.4, 2.4)
  },
  satsuma: (c, w, h) => {
    c.fillStyle = '#f2ede0'
    c.fillRect(0, 0, w, h)
    c.strokeStyle = '#15151a'
    c.lineWidth = h * 0.09
    c.beginPath()
    c.arc(w / 2, h / 2, h * 0.3, 0, 7)
    c.moveTo(w / 2 - h * 0.3, h / 2)
    c.lineTo(w / 2 + h * 0.3, h / 2)
    c.moveTo(w / 2, h * 0.2)
    c.lineTo(w / 2, h * 0.8)
    c.stroke()
  },
  junk: (c, w, h) => {
    c.fillStyle = '#b5764a'
    c.fillRect(0, 0, w, h)
    c.fillStyle = '#7d4a2c'
    for (let i = 0; i < 9; i++) c.fillRect(0, (i * h) / 9, w, 3)
  },
  tan: (c, w, h) => {
    c.fillStyle = '#d9c9a0'
    c.fillRect(0, 0, w, h)
    c.fillStyle = '#b9a67c'
    for (let i = 0; i < 5; i++) c.fillRect((i * w) / 5, 0, 2, h)
  },
  ryukyu: (c, w, h) => {
    c.fillStyle = '#f4f1e6'
    c.fillRect(0, 0, w, h)
    c.fillStyle = '#1f3f8f'
    c.fillRect(0, h * 0.38, w, h * 0.24)
    c.fillStyle = '#c8102e'
    c.fillRect(w * 0.42, h * 0.3, w * 0.16, h * 0.4)
  },
}
const text = (label, bg, fg) => (c, w, h) => {
  c.fillStyle = bg
  c.fillRect(0, 0, w, h)
  c.fillStyle = fg
  c.font = `bold ${h * 0.62}px sans-serif`
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  c.fillText(label, w / 2, h / 2 + h * 0.04, w * 0.92)
}
export const flagMat = (name) => TM('flag-' + name, 128, 80, FLAGS[name])
export const signMat = (label, bg = '#fff', fg = '#111', glow = false) =>
  TM(`sign-${label}-${bg}-${fg}-${glow}`, 256, 64, text(label, bg, fg), glow ? { mat: { emissive: '#ffffff', emissiveIntensity: 0.9, emissiveMap: tex(`sign-${label}-${bg}-${fg}-${glow}`, 256, 64, text(label, bg, fg)) } } : {})

export function flagpole(name, h = 9, w = 3) {
  const f = plane(w, w * 0.62, flagMat(name))
  f.position.set(w / 2 + 0.1, h - w * 0.36, 0)
  f.castShadow = true
  const g = group(cyl(0.06, 0.08, h, '#d0d0d0', 0, 0, 0, 6), f)
  g.userData.flag = f
  return g
}
export function sign(label, w, h, bg, fg, glow) {
  const p = plane(w, h, signMat(label, bg, fg, glow))
  return p
}
// 縦長ののぼり
export function banner(color = '#c8102e', h = 5) {
  return group(cyl(0.04, 0.05, h, '#5a4632', 0, 0, 0, 5), box(0.9, h * 0.6, 0.03, color, 0.5, h * 0.36, 0))
}

// ── 建物 ──
export function thatch(w = 6, d = 5) {
  return group(
    box(w, 2.1, d, '#8a6f4d'),
    box(1, 1.6, 0.1, '#2e2419', 0, 0, d / 2 + 0.02),
    roof(w + 1.8, d + 1.8, 2.7, 0.12, '#b39a5e', 1.9),
  )
}
export const pithut = (s = 1) => {
  const g = group(roof(5, 5, 3.2, 0.05, '#a8905a'), box(1, 1.3, 0.1, '#2a2118', 0, 0, 2.05))
  g.scale.setScalar(s)
  return g
}
export function redtile(w = 8, d = 6, wall = '#6e5236', tile = '#b5492e') {
  return group(
    box(w + 0.6, 0.3, d + 0.6, '#a8a294'),
    box(w, 2.3, d, wall, 0, 0.3, 0),
    box(w * 0.5, 1.7, 0.1, '#241c14', 0, 0.3, d / 2 + 0.02),
    roof(w + 2.2, d + 2.2, 2.3, 0.28, tile, 2.5),
    box(w * 0.34, 0.22, 0.5, '#e8e2d0', 0, 4.75, 0),
  )
}
export function stonewall(w, d, h = 1.3, c = '#9c988a') {
  const t = 0.5
  return group(
    box(w, h, t, c, 0, 0, -d / 2),
    box(t, h, d, c, -w / 2, 0, 0),
    box(t, h, d, c, w / 2, 0, 0),
    box(w / 2 - 1.2, h, t, c, -w / 4 - 0.6, 0, d / 2),
    box(w / 2 - 1.2, h, t, c, w / 4 + 0.6, 0, d / 2),
    box(2.6, h + 0.2, t, c, 0, 0, d / 2 - 2.2),
  )
}
const windows = (base) => (c, w, h) => {
  c.fillStyle = base
  c.fillRect(0, 0, w, h)
  for (let y = 0; y < 4; y++)
    for (let x = 0; x < 6; x++) {
      c.fillStyle = (x * 7 + y * 3) % 5 === 0 ? '#e8d9a0' : '#2c3a48'
      c.fillRect(8 + x * 20, 8 + y * 30, 12, 16)
    }
}
export function concrete(w = 10, h = 9, d = 9, color = '#d9d4c6', tank = true) {
  const g = group(
    mesh(G('box', () => new THREE.BoxGeometry(1, 1, 1)), TM('win-' + color, 128, 128, windows(color), { mat: { side: THREE.FrontSide } })),
    box(w + 0.4, 0.35, d + 0.4, '#bdb8aa', 0, h, 0),
  )
  g.children[0].scale.set(w, h, d)
  g.children[0].position.y = h / 2
  if (tank) g.add(cyl(0.7, 0.7, 1.3, '#c9ced2', w * 0.25, h + 0.9, d * 0.2, 10), box(1.6, 0.6, 1.6, '#aaa', w * 0.25, h + 0.3, d * 0.2))
  return g
}
export function hangar(w = 30, d = 40) {
  const r = mesh(G('halfcyl', () => new THREE.CylinderGeometry(1, 1, 1, 14, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).rotateY(Math.PI / 2)), '#8d949a')
  r.scale.set(w / 2, w / 4, d)
  return group(r, box(w * 0.7, w * 0.16, 0.2, '#3a4046', 0, 0, d / 2))
}
export function govBuilding() {
  const g = group(box(44, 11, 14, '#d9d3c2'), box(46, 1.2, 15, '#c4bdaa', 0, 11, 0), box(20, 1, 6, '#c4bdaa', 0, 0, 9), box(18, 3, 3, '#cfc8b6', 0, 11.6, 7.5))
  for (let i = 0; i < 8; i++) g.add(cyl(0.5, 0.55, 10, '#e6e0d0', -8.4 + i * 2.4, 1, 8.6, 10))
  for (let x = -18; x <= 18; x += 4) for (let y = 2; y < 10; y += 3.6) g.add(box(2, 2, 0.1, '#2c3a48', x, y, 7.03))
  return g
}

// 首里城正殿
export function seiden() {
  const red = '#b0271e'
  const tile = '#8d3a2b'
  const g = group(
    box(36, 1.4, 22, '#b8b2a0'),
    box(12, 0.45, 5, '#b8b2a0', 0, 0, 12.5),
    box(11, 0.9, 3, '#b8b2a0', 0, 0, 11.6),
    box(29, 5.6, 16, red, 0, 1.4, 0),
    roof(34, 21, 3.0, 0.6, tile, 7.0),
    box(21, 4.2, 10.5, red, 0, 9.4, 0),
    roof(27, 16, 4.0, 0.42, tile, 13.4),
    box(11.6, 0.5, 0.9, '#e9e3d2', 0, 17.3, 0),
    // 唐破風
    box(8.5, 4.6, 3.2, red, 0, 1.4, 9),
    roof(10.5, 4.6, 2.2, 0.15, tile, 6.0),
    box(7, 1.5, 0.15, '#d9a521', 0, 6.4, 10.7),
    box(5, 3.2, 0.15, '#2a1612', 0, 1.4, 10.63),
    // 棟飾り
    box(0.9, 1.3, 0.9, '#d9a521', -6.2, 17.3, 0),
    box(0.9, 1.3, 0.9, '#d9a521', 6.2, 17.3, 0),
    box(1.0, 1.6, 1.0, '#d9a521', 0, 8.2, 10.4),
    // 大龍柱
    cyl(0.36, 0.42, 3.4, '#8fa39f', -3.4, 0.45, 13.6, 8),
    cyl(0.36, 0.42, 3.4, '#8fa39f', 3.4, 0.45, 13.6, 8),
  )
  g.children[9].position.z = 9.6
  for (let i = -6; i <= 6; i++) if (Math.abs(i) > 1) g.add(box(0.5, 5.6, 0.3, '#7d1a14', i * 2.2, 1.4, 8.1), box(1.3, 2.6, 0.1, '#2a1612', i * 2.2 + 1.1, 2.2, 8.02))
  return g
}
// 御庭の縞模様
export const unaMat = () =>
  TM('una', 256, 256, (c, w, h) => {
    for (let i = 0; i < 16; i++) {
      c.fillStyle = i % 2 ? '#a8402f' : '#d8cdb8'
      c.fillRect((i * w) / 16, 0, w / 16 + 1, h)
    }
    c.fillStyle = '#b9a98c'
    c.fillRect(w * 0.47, 0, w * 0.06, h)
  })
export function longHall(w, color, tile = '#8d3a2b') {
  const g = group(box(w, 0.8, 9, '#b8b2a0'), box(w - 2, 4.4, 7, color, 0, 0.8, 0), roof(w + 1, 10.5, 2.8, 0.5, tile, 5.2))
  for (let x = -w / 2 + 3; x < w / 2 - 2; x += 3.2) g.add(box(1.5, 2.6, 0.1, '#2a1612', x, 0.8, 3.52))
  return g
}

export const pot = (s = 1, c = '#5a4a3c') => {
  const g = group(cyl(0.22, 0.34, 0.5, c, 0, 0.3, 0, 8), cyl(0.34, 0.2, 0.3, c, 0, 0, 0, 8), cyl(0.16, 0.2, 0.14, c, 0, 0.8, 0, 8))
  g.scale.setScalar(s)
  return g
}
export const crate = (c = '#8a6a44') => box(1, 0.9, 1, c)
export const grave = () => group(at(sph(0.7, '#8a7a5c'), 0, 0.1, 0), box(0.08, 0.9, 0.16, '#cfc6a8', 0, 0.3, 0.6))
export function fenceMat() {
  return TM('fence', 64, 64, (c, w, h) => {
    c.clearRect(0, 0, w, h)
    c.strokeStyle = '#c9ced2'
    c.lineWidth = 1.5
    for (let i = -h; i < w; i += 8) {
      c.beginPath()
      c.moveTo(i, 0)
      c.lineTo(i + h, h)
      c.moveTo(i + h, 0)
      c.lineTo(i, h)
      c.stroke()
    }
  }, { repeat: true, mat: { transparent: true, alphaTest: 0.25 } })
}
export function fence(len, h = 2.6) {
  const p = plane(len, h, fenceMat().clone())
  p.material.map = p.material.map.clone()
  p.material.map.repeat.set(len / 1.5, h / 1.5)
  p.material.map.needsUpdate = true
  p.position.y = h / 2
  const g = group(p)
  for (let x = -len / 2; x <= len / 2; x += 4) g.add(cyl(0.05, 0.05, h + 0.4, '#9aa0a4', x, 0, 0, 5))
  return g
}
export const radar = (h = 8) => group(cyl(1.2, 1.6, h, '#d8d8d4', 0, 0, 0, 8), at(sph(3, '#f2f2ee'), 0, h + 2.2, 0))

// ── 船（+Z 向き） ──
function hullGeo(L, B, D) {
  return G(`hull${L}_${B}_${D}`, () => {
    const s = new THREE.Shape()
    s.moveTo(-L / 2, -B * 0.36)
    s.quadraticCurveTo(-L * 0.1, -B * 0.56, L * 0.2, -B * 0.48)
    s.quadraticCurveTo(L * 0.42, -B * 0.3, L / 2, 0)
    s.quadraticCurveTo(L * 0.42, B * 0.3, L * 0.2, B * 0.48)
    s.quadraticCurveTo(-L * 0.1, B * 0.56, -L / 2, B * 0.36)
    s.closePath()
    return new THREE.ExtrudeGeometry(s, { depth: D, bevelEnabled: false, curveSegments: 6 }).rotateX(-Math.PI / 2)
  })
}
const hull = (L, B, D, color, y = 0) => at(mesh(hullGeo(L, B, D), color), 0, y, 0)
function sail(w, h, name, x, y, yaw = 0.3) {
  const p = plane(w, h, flagMat(name))
  p.rotation.y = Math.PI / 2 + yaw
  p.position.set(x, y + h / 2, 0)
  p.castShadow = true
  return p
}
const foam = (L, B) => {
  const f = box(L * 1.05, 0.05, B * 1.25, flatMat('#ffffff', { transparent: true, opacity: 0.35 }), 0, 0.03, 0)
  f.castShadow = f.receiveShadow = false
  return f
}

export function junk() {
  const g = group(
    hull(30, 8, 4.4, '#4a2f22', -1.5),
    hull(30.4, 8.3, 0.4, '#c9a23a', 2.6),
    hull(29, 7.4, 0.2, '#8a6a48', 2.3),
    box(7, 2.6, 6.2, '#6a3b2a', -11, 2.9, 0),
    box(7.8, 0.3, 7, '#b23a2e', -11, 5.5, 0),
    box(3, 1.2, 5, '#6a3b2a', 11, 2.9, 0),
    cyl(0.16, 0.26, 17, '#3a2a1c', 2, 2.5, 0, 6),
    cyl(0.13, 0.2, 12.5, '#3a2a1c', 10, 2.5, 0, 6),
    cyl(0.11, 0.16, 9.5, '#3a2a1c', -9.5, 5.6, 0, 6),
    sail(8.4, 11, 'junk', 2, 7, 0.35),
    sail(6, 8, 'junk', 10, 5.5, 0.35),
    sail(4.4, 5.6, 'junk', -9.5, 8.6, 0.35),
    box(0.05, 0.7, 1.6, '#e0b030', 2, 19.4, 0.8),
    box(0.05, 0.6, 1.3, '#c8102e', 10, 15, 0.7),
    foam(30, 8),
  )
  return fwd(g)
}
export function wasen() {
  const g = group(
    hull(20, 4.8, 2.6, '#8a6a44', -0.8),
    hull(20.3, 5, 0.25, '#3a2a1c', 1.8),
    box(4, 1.6, 3.6, '#6e5236', -7, 1.9, 0),
    cyl(0.12, 0.18, 10, '#3a2a1c', 1, 1.8, 0, 6),
    sail(6.8, 6.4, 'satsuma', 1, 4.6, 0.15),
    box(0.04, 2.4, 0.6, '#f2ede0', -8.6, 4.6, 1.2),
    box(0.04, 2.4, 0.6, '#c8102e', -8.6, 4.6, -1.2),
    cyl(0.03, 0.03, 3.6, '#3a2a1c', -8.6, 3.5, 1.2, 4),
    cyl(0.03, 0.03, 3.6, '#3a2a1c', -8.6, 3.5, -1.2, 4),
    foam(20, 4.8),
  )
  for (let i = 0; i < 6; i++)
    for (const s of [-1, 1]) {
      const o = box(0.08, 0.08, 4, '#6b5238', -4 + i * 1.6, 1.4, s * 3.6)
      o.rotation.x = s * 0.35
      g.add(o)
    }
  return fwd(g)
}
export function sabani(sailName = 'tan') {
  const g = group(hull(8, 1.5, 0.9, '#7a5a3a', -0.3), cyl(0.05, 0.07, 4.4, '#3a2a1c', 0.6, 0.5, 0, 5), foam(8, 1.5))
  if (sailName) g.add(sail(2.6, 3.2, sailName, 0.6, 1.4, 0.25))
  return fwd(g)
}
export function blackship() {
  const g = group(
    hull(64, 11, 6.5, '#17171a', -2),
    hull(64.3, 11.2, 0.5, '#e6e2d4', 2.9),
    hull(62, 10, 0.2, '#6b5238', 4.4),
    cyl(1.1, 1.25, 10, '#0f0f10', -3, 4.5, 0, 10),
    box(5, 2, 4, '#2a2622', 12, 4.5, 0),
    foam(64, 11),
  )
  for (const [x, h] of [[18, 24], [-12, 27], [-24, 20]]) {
    g.add(cyl(0.22, 0.34, h, '#3a2a1c', x, 4.5, 0, 6))
    g.add(box(0.25, 0.25, h * 0.55, '#3a2a1c', x, 4.5 + h * 0.5, 0), box(0.2, 0.2, h * 0.4, '#3a2a1c', x, 4.5 + h * 0.78, 0))
    g.add(box(0.5, 0.5, h * 0.5, '#d8d2c0', x, 4.5 + h * 0.5 - 0.4, 0))
  }
  for (const s of [-1, 1]) {
    const p = cyl(4.6, 4.6, 2.2, '#1f1f22', 2, 0, 0, 14)
    p.rotation.x = Math.PI / 2
    p.position.set(2, 1.6, s * 6.2)
    g.add(p)
  }
  const f = plane(4, 2.5, flagMat('usa'))
  f.position.set(-31, 9, 0)
  g.add(cyl(0.06, 0.06, 6, '#3a2a1c', -29, 4.5, 0, 5), f)
  const w = fwd(g)
  w.userData.funnel = [-3, 15]
  return w
}
export function steamer(hullC = '#16181c', upper = '#eee9dc', funnelC = '#c9a13a', L = 54) {
  const k = L / 54
  const g = group(
    hull(L, 9 * k, 5.5 * k, hullC, -1.6 * k),
    hull(L * 0.99, 8.9 * k, 0.5 * k, '#8d2a22', -0.4 * k),
    box(20 * k, 3 * k, 6.4 * k, upper, -2 * k, 3.9 * k, 0),
    box(8 * k, 2.2 * k, 5 * k, upper, -4 * k, 6.9 * k, 0),
    cyl(1.3 * k, 1.4 * k, 6 * k, funnelC, -6 * k, 6.9 * k, 0, 10),
    cyl(0.14, 0.2, 11 * k, '#3a2a1c', 16 * k, 3.9 * k, 0, 5),
    cyl(0.14, 0.2, 11 * k, '#3a2a1c', -20 * k, 3.9 * k, 0, 5),
    foam(L, 9 * k),
  )
  const w = fwd(g)
  w.userData.funnel = [-6 * k, 13 * k]
  return w
}
export function warship(L = 110) {
  const k = L / 110
  const c = '#7b868e'
  const g = group(
    hull(L, 14 * k, 7 * k, c, -2 * k),
    box(34 * k, 4 * k, 9 * k, '#8c979f', -2 * k, 5 * k, 0),
    box(14 * k, 5 * k, 7 * k, '#8c979f', 4 * k, 9 * k, 0),
    box(5 * k, 6 * k, 4 * k, '#96a1a9', 5 * k, 14 * k, 0),
    cyl(1.8 * k, 2.2 * k, 7 * k, '#6b757c', -8 * k, 9 * k, 0, 10),
    cyl(0.2, 0.3, 14 * k, '#5b656c', 5 * k, 20 * k, 0, 5),
    foam(L, 14 * k),
  )
  for (const [x, y] of [[30, 5], [20, 7.4], [-32, 5]]) {
    g.add(box(8 * k, 2.4 * k, 6 * k, '#8c979f', x * k, y * k, 0))
    for (const z of [-1.4, 0, 1.4]) {
      const b = cyl(0.28 * k, 0.28 * k, 10 * k, '#5b656c', 0, 0, 0, 6)
      b.rotation.z = -Math.PI / 2 + (x > 0 ? 0.12 : Math.PI - 0.12)
      b.position.set((x + (x > 0 ? 8 : -8)) * k, (y + 1.8) * k, z * k)
      g.add(b)
    }
  }
  return fwd(g)
}
// 水陸両用の上陸用舟艇
export function lvt() {
  const c = '#5b6140'
  const g = group(box(7.2, 1.7, 3.2, c, 0, -0.4, 0), box(1.6, 1.2, 3.2, c, 4, -0.1, 0), box(2.4, 0.9, 3, '#4d5338', -1.6, 1.3, 0), foam(8, 3.4))
  g.children[1].rotation.z = 0.5
  for (let i = 0; i < 6; i++) g.add(at(sph(0.2, '#4d5338'), 0.6 + (i % 3) * 0.9, 1.5, i < 3 ? -0.8 : 0.8))
  return fwd(g)
}
export function barge() {
  const g = group(box(42, 3, 14, '#4b4f55', 0, -1.2, 0), cone(7, 4.5, '#8a5a3a', -8, 1.8, 0, 9), box(3, 9, 3, '#e0a82e', 12, 1.8, 0), box(18, 0.8, 0.8, '#e0a82e', 5, 11, 0), box(4, 3, 4, '#d8d4c8', 16, 1.8, 3))
  g.children[3].rotation.z = 0.5
  g.children[3].position.set(5, 13.5, 0)
  return fwd(g)
}
export const kayak = (c = '#e85d4a') => fwd(group(hull(4.2, 0.75, 0.35, c, -0.1)))
export const fishing = () => fwd(group(hull(11, 3, 1.7, '#f2f2ee', -0.5), box(3, 1.8, 2.2, '#f2f2ee', -1.5, 1.2, 0), box(3.3, 0.2, 2.5, '#2f6fb5', -1.5, 3, 0), foam(11, 3)))

// ── 乗り物（+Z 向き） ──
function wheels(g, xs, z, r = 0.36, y = 0) {
  for (const x of xs)
    for (const s of [-1, 1]) {
      const w = cyl(r, r, 0.26, '#18181a', 0, 0, 0, 10)
      w.rotation.x = Math.PI / 2
      w.position.set(x, r + y, s * z)
      g.add(w)
    }
}
export function car(color = '#c94a3a') {
  const g = group(box(4.2, 0.72, 1.75, color, 0, 0.32, 0), box(2.1, 0.6, 1.6, '#22303c', -0.25, 1.04, 0), box(2.2, 0.06, 1.66, color, -0.25, 1.64, 0))
  wheels(g, [-1.3, 1.35], 0.82)
  return fwd(g)
}
export function jeep() {
  const c = '#565c3c'
  const g = group(box(3.4, 0.7, 1.6, c, 0, 0.4, 0), box(0.06, 0.6, 1.5, '#8fa0a8', 0.5, 1.1, 0), box(0.5, 0.5, 1.3, '#3a3d2a', -0.6, 1.1, 0))
  wheels(g, [-1.1, 1.1], 0.78, 0.38)
  return fwd(g)
}
export function truck(color = '#4a6a8a', load = null) {
  const g = group(box(1.9, 1.9, 2.3, color, 2.4, 0.5, 0), box(1.2, 0.8, 2.1, '#22303c', 2.6, 1.6, 0), box(4.6, 0.3, 2.3, '#5a5a56', -1, 0.9, 0), box(4.6, 0.8, 0.12, color, -1, 1.2, 1.1), box(4.6, 0.8, 0.12, color, -1, 1.2, -1.1))
  if (load) g.add(box(4.4, 1.3, 2.1, load, -1, 1.2, 0))
  wheels(g, [-2.2, -1, 2.3], 1.05, 0.46)
  return fwd(g)
}
export function bus(color = '#3f8f6a') {
  const g = group(box(9.5, 2.5, 2.5, color, 0, 0.5, 0), box(9.2, 0.8, 2.56, '#22303c', 0, 1.8, 0), box(9.5, 0.2, 2.5, '#f0ead8', 0, 3, 0))
  wheels(g, [-3, 3], 1.15, 0.5)
  return fwd(g)
}
export function bulldozer() {
  const c = '#e0a82e'
  const g = group(
    box(3.2, 1.3, 2.1, c, 0, 0.8, 0),
    box(1.5, 1.4, 1.8, '#c9952a', -0.6, 2.1, 0),
    box(3.9, 0.9, 0.55, '#2a2a2a', 0, 0, 1.15),
    box(3.9, 0.9, 0.55, '#2a2a2a', 0, 0, -1.15),
    box(0.3, 1.4, 3.6, '#b8b8b0', 2.5, 0.1, 0),
    box(1, 0.2, 0.2, '#555', 1.9, 0.8, 1.3),
    box(1, 0.2, 0.2, '#555', 1.9, 0.8, -1.3),
  )
  return fwd(g)
}
export function tank(c = '#565c3c') {
  const b = cyl(0.1, 0.1, 3.4, '#3d422c', 0, 0, 0, 6)
  b.rotation.z = -Math.PI / 2
  b.position.set(2.7, 2.3, 0)
  const g = group(box(5.6, 1.2, 2.7, c, 0, 0.7, 0), box(6, 0.95, 0.6, '#2b2b28', 0, 0, 1.3), box(6, 0.95, 0.6, '#2b2b28', 0, 0, -1.3), cyl(1.1, 1.3, 0.95, c, 0.2, 1.9, 0, 8), b)
  return fwd(g)
}
export function loco() {
  const boiler = cyl(0.9, 0.9, 4.6, '#1c1c1e', 0, 0, 0, 10)
  boiler.rotation.z = Math.PI / 2
  boiler.position.set(0.6, 1.9, 0)
  const g = group(boiler, box(2, 2.6, 2.2, '#1c1c1e', -2.9, 0.7, 0), box(2.3, 0.15, 2.5, '#2a2a2a', -2.9, 3.3, 0), cyl(0.24, 0.34, 1.3, '#111', 2, 2.7, 0, 8), box(6.6, 0.4, 2, '#8d2a22', -0.4, 0.6, 0), cyl(0.3, 0.3, 0.5, '#c9a23a', 0.4, 2.7, 0, 8))
  wheels(g, [-2.6, -0.8, 0.8, 2.2], 0.95, 0.55)
  const w = fwd(g)
  w.userData.funnel = [2, 4]
  return w
}
export function coach(c = '#6b3a2a') {
  const g = group(box(6.6, 2.3, 2.2, c, 0, 0.7, 0), box(6.2, 0.7, 2.26, '#d8cfa8', 0, 1.9, 0), box(6.9, 0.2, 2.5, '#3a3a3a', 0, 3, 0))
  wheels(g, [-2.2, 2.2], 0.95, 0.42)
  return fwd(g)
}
export function monocar() {
  const g = group(box(14, 2.7, 2.7, '#f2f2ee', 0, 0.4, 0), box(14.05, 0.5, 2.75, '#c8102e', 0, 0.9, 0), box(13.4, 0.9, 2.76, '#22303c', 0, 1.8, 0))
  return fwd(g)
}
export function tractor(c = '#c8402e') {
  const g = group(box(2.4, 0.9, 1.1, c, 0.3, 0.9, 0), box(1.1, 1.3, 1.2, '#22303c', -0.7, 1.6, 0), box(1.3, 0.1, 1.4, c, -0.7, 2.9, 0))
  wheels(g, [-0.8], 0.85, 0.8)
  wheels(g, [1.1], 0.75, 0.42)
  return fwd(g)
}
export function combine() {
  const g = group(box(3.6, 1.8, 2, '#c8402e', 0, 0.7, 0), box(1.4, 1.2, 1.6, '#22303c', 0.8, 2.5, 0), box(1.2, 0.9, 3.2, '#e0a82e', 2.5, 0.1, 0), box(1.6, 0.4, 0.5, '#aaa', -1.4, 2.5, 0))
  g.add(box(3.8, 0.8, 0.5, '#2a2a2a', 0, 0, 0.9), box(3.8, 0.8, 0.5, '#2a2a2a', 0, 0, -0.9))
  return fwd(g)
}
export function cart() {
  const g = group(box(1.4, 0.7, 0.9, '#4a3a2c', 0, 0.35, 0), box(1.2, 0.3, 0.7, '#161616', 0, 1.0, 0))
  wheels(g, [-0.4, 0.4], 0.45, 0.2)
  return fwd(g)
}

// ── 航空機（+Z 向き）。userData.spin(t) で回転翼が回る ──
function tube(rNose, rTail, len, color) {
  const f = cyl(rNose, rTail, len, color, 0, 0, 0, 8)
  f.rotation.z = -Math.PI / 2
  f.position.set(0, 0, 0)
  return f
}
export function propPlane(color = '#1f2f4a') {
  const p = group(box(0.08, 2.8, 0.22, '#2a2a2a'))
  p.children[0].position.y = 0
  p.position.set(4.1, 0, 0)
  const g = group(tube(0.72, 0.28, 8, color), box(1.9, 0.14, 11.5, color, 0.9, -0.3, 0), box(1, 0.1, 3.8, color, -3.5, 0, 0), box(1.2, 1.5, 0.12, color, -3.5, 0, 0), at(sph(0.5, '#8fb0c8'), 0.8, 0.55, 0), p)
  const w = fwd(g)
  w.userData.spin = (t) => (p.rotation.x = t * 40)
  return w
}
export function jet(color = '#b9c0c8') {
  const g = group(tube(0.35, 0.75, 13, color), at(cone(0.36, 2, color, 0, 0, 0, 8), 7.4, 0, 0), box(1.3, 1.9, 0.12, color, -5.4, 0.6, 0), box(1.3, 0.1, 4.2, color, -5.6, 0.2, 0), at(sph(0.45, '#6f8fa8'), 2.6, 0.6, 0), at(sph(0.5, flatMat('#ff9a3a')), -6.6, 0, 0))
  g.children[1].rotation.z = -Math.PI / 2
  for (const s of [-1, 1]) {
    const wg = box(3, 0.12, 5.2, color, 0, 0, 0)
    wg.rotation.y = s * 0.6
    wg.position.set(-0.6, -0.1, s * 2.6)
    g.add(wg)
  }
  return fwd(g)
}
function rotor(r) {
  return group(box(r * 2, 0.08, 0.5, '#2a2a2a'), box(0.5, 0.08, r * 2, '#2a2a2a'))
}
export function heli() {
  const c = '#6b7178'
  const main = at(rotor(7.5), 0, 3.3, 0)
  const tail = at(rotor(1.3), -9.6, 2.2, 0.5)
  tail.rotation.x = Math.PI / 2
  const g = group(box(8, 2.5, 2.5, c, 0, 0.3, 0), box(2.4, 2, 2.3, '#3d444a', 4.4, 0.4, 0), box(6.4, 0.7, 0.7, c, -6.8, 1.6, 0), box(0.8, 2.2, 0.2, c, -9.6, 1.6, 0), main, tail)
  const w = fwd(g)
  w.userData.spin = (t) => {
    main.rotation.y = t * 22
    tail.rotation.z = t * 30
  }
  return w
}
export function osprey() {
  const c = '#737a80'
  const r1 = at(rotor(5.6), 0.6, 4.6, 7)
  const r2 = at(rotor(5.6), 0.6, 4.6, -7)
  const g = group(box(10.5, 2.3, 2.3, c, 0, 0.3, 0), box(1.8, 0.25, 14.5, c, 0.6, 2.7, 0), box(1.2, 1.6, 1.2, c, 0.6, 2.9, 7), box(1.2, 1.6, 1.2, c, 0.6, 2.9, -7), box(1.4, 1.8, 0.2, c, -5, 2, 1.6), box(1.4, 1.8, 0.2, c, -5, 2, -1.6), box(1.2, 0.15, 3.6, c, -5, 2.4, 0), r1, r2)
  const w = fwd(g)
  w.userData.spin = (t) => {
    r1.rotation.y = t * 24
    r2.rotation.y = -t * 24
  }
  return w
}
