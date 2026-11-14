// 場面の演出（前半）: 田畑・浜・村・グスク・港・首里城・聖地
import * as THREE from 'three'
import { animatePerson, at, bird, box, buffalo, bump, cone, cyl, fbm, group, horse, person, plane, plants, roof, sm, sph } from './kit'
import * as P from './props'

export const pick = (R, a) => a[Math.floor(R() * a.length)]
export const rr = (R, a, b) => a + R() * (b - a)
export const camOf = (S) => (x, dy, z) => [x, Math.max(S.h(x, z), 0) + dy, z]

const KIMONO = ['#3d4f7a', '#6b5a44', '#4a5f4a', '#7a6a55', '#5a4a6a', '#8a7a5a']
const BRIGHT = ['#b23a48', '#d9a441', '#3f6fb5', '#5b8a3c', '#7a4fa3', '#d97a3a']
const MODERN = ['#e85d4a', '#f2c14e', '#4a90d9', '#f4f4f0', '#58b368', '#f08a5d', '#9b6fd1', '#2f3b52']
const PANTS = ['#2f3b52', '#3a3a3a', '#c8b68a', '#1f4e79', '#5a5a5a']

// 役柄ごとの衣装
export function folk(kind, R) {
  switch (kind) {
    case 'farmer': return { top: pick(R, KIMONO), hat: R() < 0.6 ? 'kasa' : null }
    case 'villager': return R() < 0.5 ? { top: pick(R, KIMONO), robe: true } : { top: pick(R, KIMONO) }
    case 'noble': return { top: pick(R, BRIGHT), robe: true, hat: 'hachimaki', hatColor: pick(R, BRIGHT), sash: '#e8d9a0' }
    case 'king': return { top: '#d9a521', robe: true, hat: 'hachimaki', hatColor: '#15151a', sash: '#b0271e', scale: 1.12 }
    case 'priestess': return { top: '#f2efe6', robe: true, hat: 'long' }
    case 'warrior': return { top: '#3a3a44', bottom: '#2b2b30', hat: 'jingasa', tool: R() < 0.2 ? 'banner' : 'spear', toolColor: pick(R, BRIGHT) }
    case 'torch': return { top: '#3a3a44', bottom: '#2b2b30', hat: 'jingasa', tool: R() < 0.6 ? 'torch' : 'spear' }
    case 'samurai': return { top: '#22262e', bottom: '#30343c', hat: 'jingasa', hatColor: '#15151a', tool: R() < 0.18 ? 'banner' : R() < 0.6 ? 'gun' : 'spear', toolColor: '#f2ede0', sash: '#8d2a22' }
    case 'chinese': return { top: '#2f4f8f', robe: true, hat: 'cap', hatColor: '#15151a' }
    case 'meiji': return { top: '#1e2a44', bottom: '#1e2a44', hat: 'cap', hatColor: '#1e2a44', tool: 'gun', sash: '#c9a23a' }
    case 'sailor': return { top: '#1c2a4a', bottom: '#e8e8e0', hat: 'cap', hatColor: '#15151a', tool: 'gun' }
    case 'marine': return { top: '#5b6140', bottom: '#5b6140', hat: 'helmet', tool: 'gun' }
    case 'ija': return { top: '#8a7f52', bottom: '#8a7f52', hat: 'cap', hatColor: '#8a7f52', tool: 'gun' }
    case 'mp': return { top: '#8a7f52', bottom: '#8a7f52', hat: 'helmet', hatColor: '#f2f2ee' }
    case 'police': return { top: '#1e2a44', bottom: '#1e2a44', hat: 'cap', hatColor: '#1e2a44' }
    case 'prewar':
      return R() < 0.5
        ? { top: pick(R, KIMONO), robe: true, tool: R() < 0.4 ? 'bundle' : null }
        : { top: pick(R, ['#d8d2c0', '#6b5a44', '#3d4f7a']), bottom: '#3a3a3a', hat: R() < 0.4 ? 'cap' : null, hatColor: '#5a5040' }
    case 'refugee': return { top: pick(R, ['#6b6458', '#5a5246', '#7a7264']), robe: R() < 0.5, bottom: '#4a443c', tool: R() < 0.5 ? 'bundle' : null, scale: R() < 0.25 ? 0.7 : 1 }
    case 'modern': return { top: pick(R, MODERN), bottom: pick(R, PANTS), hat: R() < 0.2 ? 'cap' : null, hatColor: pick(R, MODERN), scale: R() < 0.15 ? 0.72 : 1 }
    case 'rain': return { top: pick(R, MODERN), bottom: pick(R, PANTS), hat: 'umbrella', hatColor: pick(R, ['#30343c', '#3f6fb5', '#b23a48', '#e8e8e0']) }
    case 'flag': return { top: '#f4f4f0', bottom: pick(R, PANTS), tool: 'flag', toolColor: '#f4f4f0' }
    case 'worker': return { top: '#e8e4d8', bottom: '#44506a', hat: 'hardhat' }
    case 'miner': return { top: '#4a443c', bottom: '#3a342c', hat: R() < 0.5 ? 'cap' : null, hatColor: '#3a342c', tool: R() < 0.5 ? 'sack' : null, toolColor: '#22201e' }
    case 'fireman': return { top: '#c9952a', bottom: '#2a2a2a', hat: 'helmet', hatColor: '#d8d8d0' }
    case 'dancer': return { top: pick(R, ['#d83b3b', '#f2c14e', '#d94a8a']), robe: true, hat: 'hachimaki', hatColor: '#d9a521', sash: '#3f6fb5' }
    case 'mfarmer': return { top: pick(R, MODERN), bottom: pick(R, PANTS), hat: 'kasa' }
    default: return {}
  }
}

const low = (mode) => (mode === 'sit' || mode === 'bow' ? -0.42 : 0)

// 楕円の範囲に人を散らして立たせる
export function people(S, R, { n, kind, at: [cx, cz], r: [rx, rz], face, mode = 'stand', opt, dy = 0 }) {
  const out = []
  for (let i = 0; i < n; i++) {
    const a = R() * 6.283
    const d = Math.sqrt(R())
    const x = cx + Math.cos(a) * d * rx
    const z = cz + Math.sin(a) * d * rz
    const md = typeof mode === 'function' ? mode(i) : mode
    const p = person({ ...folk(typeof kind === 'function' ? kind(i) : kind, R), ...opt })
    const ry = face ? Math.atan2(face[0] - x, face[1] - z) + rr(R, -0.2, 0.2) : R() * 6.283
    S.put(p, x, z, ry, dy + low(md))
    S.act(p, md)
    out.push(p)
  }
  return out
}
// 隊列。ry の向きを向いて nx 列 × nz 段
export function rows(S, R, { nx, nz, kind, at: [cx, cz], gap = [1.3, 1.5], ry = 0, mode = 'stand', opt, dy = 0 }) {
  const out = []
  for (let j = 0; j < nz; j++)
    for (let i = 0; i < nx; i++) {
      const lx = (i - (nx - 1) / 2) * gap[0]
      const lz = -j * gap[1]
      const x = cx + lx * Math.cos(ry) + lz * Math.sin(ry)
      const z = cz - lx * Math.sin(ry) + lz * Math.cos(ry)
      const p = person({ ...folk(kind, R), ...opt })
      S.put(p, x, z, ry, dy + low(mode))
      S.act(p, mode)
      out.push(p)
    }
  return out
}
// 道に沿って歩く人々
export function walkers(S, R, { n, kind, path, speed = 1.2, mode = 'walk', spread = 1.5, loop = true, gap, opt, endMode }) {
  let total = 0
  for (let i = 1; i < path.length; i++) total += Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1])
  const out = []
  for (let i = 0; i < n; i++) {
    const jx = rr(R, -spread, spread)
    const jz = rr(R, -spread, spread)
    const p = person({ ...folk(typeof kind === 'function' ? kind(i) : kind, R), ...opt })
    S.walk(p, path.map(([x, z]) => [x + jx, z + jz]), speed * rr(R, 0.9, 1.1), {
      mode,
      loop,
      endMode,
      offset: loop ? (i * total) / n : -i * (gap ?? 1.6),
    })
    out.push(p)
  }
  return out
}
// 条件に合う場所に木を生やす。area: [x0, z0, x1, z1]
export function wood(S, R, kind, n, area, ok, sizes = [0.8, 1.4]) {
  const list = []
  let tries = 0
  while (list.length < n && tries++ < n * 14) {
    const x = rr(R, area[0], area[2])
    const z = rr(R, area[1], area[3])
    const h = S.h(x, z)
    if (h < 0.9 || (ok && !ok(x, z, h))) continue
    list.push({ x, y: h - 0.1, z, s: rr(R, sizes[0], sizes[1]), ry: R() * 6.28 })
  }
  if (list.length) S.add(plants(kind, list))
}
export function birds(S, R, n, cx, cz, y = 30, color) {
  for (let i = 0; i < n; i++) {
    const b = bird(color)
    const r = rr(R, 15, 45)
    const ph = R() * 6.28
    const sp = rr(R, 0.25, 0.45) * (i % 2 ? 1 : -1)
    S.add(b)
    S.tick((t) => {
      const a = ph + t * sp
      b.position.set(cx + Math.cos(a) * r, y + Math.sin(t * 0.5 + ph) * 3 + i * 1.5, cz + Math.sin(a) * r)
      b.rotation.y = -a + (sp > 0 ? 0 : Math.PI)
      b.userData.flap(t + ph)
    })
  }
}
// 船や乗り物の煙突の位置（+Z 向きの模型で、前後 fx・高さ fy）
export function funnelSmoke(S, ship, o = {}) {
  const [fx, fy] = ship.userData.funnel
  const ry = ship.rotation.y
  return S.smoke(ship.position.x + Math.sin(ry) * fx, fy, ship.position.z + Math.cos(ry) * fx, { size: 2.2, n: 16, color: '#2a2826', rise: 3.5, wind: [3, 1], life: 9, ...o })
}

const SURF = {
  water: ['#8fa59c', { roughness: 0.12, metalness: 0.35 }],
  dry: ['#b59b6a'],
  mud: ['#6b5a44', { roughness: 0.5 }],
  gold: ['#a08a52'],
  soil: ['#7a5f40'],
}
const SPACING = { seedling: 1.0, rice: 0.8, gold: 0.8, barley: 0.7, potato: 1.2, cane: 1.7, pineapple: 1.2 }
// 田んぼ 1 枚。作物は crops に集めてまとめて描く
export function paddy(S, R, cx, cz, w, d, surf, crop, crops) {
  const y = S.h(cx, cz)
  S.add(box(w + 1.4, 0.42, d + 1.4, '#6e5b3c', cx, y - 0.1, cz), box(w, 0.06, d, SURF[surf][0], cx, y + 0.3, cz, SURF[surf][1]))
  if (crop) {
    const sp = SPACING[crop]
    const list = (crops[crop] ??= [])
    for (let x = -w / 2 + 0.6; x < w / 2 - 0.3; x += sp)
      for (let z = -d / 2 + 0.6; z < d / 2 - 0.3; z += sp)
        list.push({ x: cx + x + rr(R, -0.08, 0.08), y: y + 0.34, z: cz + z + rr(R, -0.08, 0.08), s: rr(R, 0.8, 1.2), ry: R() * 6 })
  }
  return y + 0.36
}
export const flush = (S, crops) => Object.entries(crops).forEach(([k, l]) => l.length && S.add(plants(k, l)))

// 石垣の城壁
export function wallLoop(S, ctrl, h, t = 2, gate) {
  const curve = new THREE.CatmullRomCurve3(ctrl.map(([x, z]) => new THREE.Vector3(x, 0, z)), true)
  const pts = curve.getSpacedPoints(Math.ceil(curve.getLength() / 3))
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i]
    const b = pts[i + 1]
    const mx = (a.x + b.x) / 2
    const mz = (a.z + b.z) / 2
    if (gate && Math.hypot(mx - gate[0], mz - gate[1]) < gate[2]) continue
    const ha = S.h(a.x, a.z)
    const hb = S.h(b.x, b.z)
    const base = Math.min(ha, hb) - 2
    const m = box(t, Math.max(ha, hb) + h - base, a.distanceTo(b) + 0.4, i % 3 ? '#c9c2ad' : '#bcb59f', mx, base, mz)
    m.rotation.y = Math.atan2(b.x - a.x, b.z - a.z)
    S.add(m)
  }
  if (gate) {
    const [gx, gz, gr] = gate
    const y = S.h(gx, gz)
    S.add(box(2 * gr + 2, 1.6, t + 0.6, '#bcb59f', gx, y + h - 0.6, gz))
  }
}
const ring = (cx, cz, r, n, wob, seed = 0) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * 6.283 + Math.PI / 2 + Math.PI / n
    const rad = r + Math.sin(i * 2.3 + seed) * wob
    return [cx + Math.cos(a) * rad, cz + Math.sin(a) * rad]
  })
export function houseCluster(S, R, kind, spots) {
  for (const [x, z, ry = 0] of spots) {
    const hse = kind === 'thatch' ? P.thatch(rr(R, 5.5, 7), rr(R, 4.5, 5.5)) : kind === 'chinese' ? P.redtile(8, 6, '#e6dfd0', '#4a4a4e') : P.redtile(rr(R, 7, 9), 6)
    S.put(hse, x, z, ry)
    if (kind !== 'chinese') S.put(P.stonewall(14, 13), x, z, ry)
  }
  S.add(plants('fukugi', spots.flatMap(([x, z]) => [[-7.5, -4], [7.5, 3], [-7.5, 4]].map(([dx, dz]) => ({ x: x + dx, y: S.h(x + dx, z + dz), z: z + dz, s: rr(R, 0.8, 1.2), ry: R() * 6 })))))
}

// ── 田畑 ──
export function farm(S, o, R) {
  S.env(o.env ?? 'day')
  const X = (k) => o.x?.includes(k)
  S.ground((x, z) => {
    let h = 1.3 + fbm(x * 0.05, z * 0.05) * 0.2 + sm(60, 200, -z + fbm(x * 0.012, z * 0.012) * 70) * (16 + fbm(x * 0.02 + 5, z * 0.02) * 42)
    if (o.mount) h += bump(x, z, -140, -270, 120, 85)
    if (X('river')) h -= (1 - sm(4, 11, Math.abs(x + 68 + Math.sin(z * 0.03) * 7))) * 2.7
    if (o.coast) h = Math.min(h, (112 - z) * 0.13 + fbm(x * 0.03, 9) * 1.2)
    return Math.max(h, -9)
  })
  S.sea()
  const c = camOf(S)
  const crops = {}
  const cells = []
  for (let ix = -2; ix <= 1; ix++)
    for (let iz = -1; iz <= 1; iz++) {
      const cx = ix * 27 + 13.5
      const cz = iz * 21
      let surf = o.surf ?? 'water'
      let crop = o.crop === undefined ? 'seedling' : o.crop
      if (X('drought')) [surf, crop] = ix === 0 && iz === 0 ? ['water', 'rice'] : ['dry', null]
      if (X('cane') && ix >= 0) [surf, crop] = ['soil', 'cane']
      if (X('pine') && ix < 0) [surf, crop] = ['soil', 'pineapple']
      if (X('stubble') && ix === -2) crop = null
      if (X('dozed') && ix === 1) [surf, crop] = ['mud', null]
      const y = paddy(S, R, cx, cz, 24, 18, surf, crop, crops)
      cells.push({ cx, cz, y, ix, iz, crop })
    }
  flush(S, crops)
  // 働く人々
  const kind = o.folk ?? 'farmer'
  const n = o.n ?? 14
  const ok = cells.filter((k) => (X('drought') ? k.ix === 0 && k.iz === 0 : X('dozed') ? k.ix < 1 : true))
  for (let i = 0; i < n; i++) {
    const cell = i < 6 ? ok.find((k) => k.ix === -(i % 2) && k.iz === (i % 3 === 0 ? 1 : 0)) ?? ok[0] : pick(R, ok)
    const p = person({ ...folk(kind, R), tool: o.work === 'hoe' ? 'hoe' : null })
    p.position.set(cell.cx + rr(R, -10, 10), cell.y, cell.cz + rr(R, -7, 7))
    p.rotation.y = R() < 0.5 ? 0 : Math.PI
    S.add(p)
    S.act(p, o.work ?? 'plant')
  }
  wood(S, R, 'broad', 150, [-380, -380, 380, -55], null, [1, 1.9])
  wood(S, R, 'palm', 26, [-200, -75, 200, -42])
  wood(S, R, 'bush', 60, [-150, -70, 150, 60], (x, z) => Math.abs(x + 13.5) > 58 || Math.abs(z) > 34)
  if (!o.noHuts) {
    const spots = [0, 1, 2, 3, 4].map((i) => [72 + (i % 3) * 17, -36 - (i > 2 ? 16 : 0) + (i % 2) * 5, -0.5])
    if (o.houses === 'modern') spots.forEach(([x, z], i) => S.put(i % 2 ? P.concrete(9, 4, 8, '#e6e0d4') : P.redtile(), x, z, -0.5))
    else houseCluster(S, R, o.houses ?? 'thatch', spots)
  }
  if (X('spring')) {
    for (const [x, z, r] of [[-56, 6, 2.6], [-49, 15, 1.9]]) {
      const y = S.h(x, z)
      S.add(cyl(r + 0.5, r + 0.6, 0.6, '#9c988a', x, y - 0.1, z, 10), cyl(r, r, 0.62, '#3fa3b5', x, y - 0.1, z, 10, { roughness: 0.1, metalness: 0.3 }))
    }
    S.add(plants('rock', [0, 1, 2, 3, 4, 5].map((i) => ({ x: -60 + i * 2.2, y: S.h(-60, 2), z: 1 + Math.sin(i) * 2, s: rr(R, 0.8, 1.6), ry: i }))))
    wood(S, R, 'broad', 30, [-95, -25, -58, 34], null, [1.2, 2])
    wood(S, R, 'fern', 16, [-75, -10, -52, 28])
    people(S, R, { n: 3, kind: 'priestess', at: [-52, 9], r: [2, 1.5], face: [-56, 6], mode: 'pray' })
    S.shot(c(-40, 2.6, 26), c(-45, 2.2, 19), [-55, 2.4, 7], null, 7)
  }
  if (X('crowd')) people(S, R, { n: 7, kind: 'villager', at: [30, 13], r: [3, 2], face: [13.5, 0] })
  if (X('boats')) {
    for (let i = 0; i < 3; i++) S.walk(P.sabani(), [[40 - i * 26, 230], [26 - i * 20, 118]], 2.2, { sea: true, offset: i * 40 })
    walkers(S, R, { n: 8, kind: 'farmer', path: [[10, 110], [4, 70], [0, 34]], opt: { tool: 'hoe' } })
  }
  if (X('river')) {
    for (let z = -40; z < 60; z += 3) S.put(box(1.6, 0.9, 3, '#a8a294'), -58 + Math.sin(z * 0.03) * -7, z, 0, 0.1)
    walkers(S, R, { n: 10, kind: 'farmer', path: [[-52, 58], [-52, -38]], mode: 'carry', opt: { tool: 'sack', toolColor: '#9c988a', hat: 'kasa' }, spread: 1 })
    people(S, R, { n: 1, kind: 'noble', at: [-46, 12], r: [0.1, 0.1], face: [-60, 12], mode: 'wave', opt: { top: '#3f6fb5' } })
    people(S, R, { n: 3, kind: 'noble', at: [-44, 14], r: [1.5, 1.5], face: [-60, 12] })
  }
  if (X('buffalo')) {
    const cell = cells.find((k) => k.ix === 0 && k.iz === 1)
    const loop = [[cell.cx - 9, cell.cz - 6], [cell.cx + 9, cell.cz - 6], [cell.cx + 9, cell.cz + 6], [cell.cx - 9, cell.cz + 6], [cell.cx - 9, cell.cz - 6]]
    for (let i = 0; i < 2; i++) {
      S.walk(buffalo(), loop, 0.9, { offset: i * 30, dy: 0.36 })
      S.walk(person(folk('farmer', R)), loop, 0.9, { offset: i * 30 - 2.4, dy: 0.36 })
    }
  }
  if (X('dozed')) {
    for (let i = 0; i < 2; i++) S.walk(P.bulldozer(), [[92, -6 + i * 14], [16, -6 + i * 14]], 1.6, { offset: i * 20, dy: 0.2 })
    rows(S, R, { nx: 10, nz: 2, kind: 'marine', at: [44, -30], ry: -1.2, mode: 'aim' })
    people(S, R, { n: 16, kind: 'farmer', at: [-8, 2], r: [8, 5], face: [60, 0], mode: 'sit' })
    S.put(P.jeep(), 56, -40, 1)
    S.put(P.fence(90), 70, 30, 0.2)
  }
  if (X('tractor')) S.walk(P.tractor(), [[-38, 23], [36, 23], [36, 19], [-38, 19], [-38, 23]], 2.2, { dy: 0.36 })
  if (X('combine')) S.walk(P.combine(), [[-30, -2], [36, -2], [36, 2], [-30, 2], [-30, -2]], 1.6, { dy: 0.36 })
  if (X('truck')) S.walk(P.truck('#4a6a8a', '#7aae4c'), [[-180, 38], [180, 38]], 7)
  if (X('official')) {
    people(S, R, { n: 1, kind: 'noble', at: [-4, 12], r: [0.1, 0.1], face: [13, 0], mode: 'wave' })
    people(S, R, { n: 4, kind: 'villager', at: [0, 13], r: [2.5, 1], face: [-4, 12] })
  }
  if (o.junkBay) S.float(P.junk(), -30, 190, 1.2, 0)
  birds(S, R, 5, 0, 0, 26)
  S.shot([74, 28, 96], [44, 17, 72], [0, 2, 0], null, 8)
  S.shot(c(-12, 2.2, 25), c(6, 2.4, 19), [6, 1.6, 0], [-4, 1.6, 0], 8)
  S.shot(c(34, 1.8, -6), c(20, 2, -12), [-20, 1.9, 6], null, 7)
}

// ── 浜 ──
export function beach(S, o, R) {
  S.env(o.env ?? 'dawn')
  const X = (k) => o.x?.includes(k)
  S.ground(
    (x, z) => Math.max(-9, Math.min((18 - z) * 0.07 + fbm(x * 0.04, z * 0.04) * 0.5, 3 + sm(30, 170, -z) * (8 + fbm(x * 0.02, z * 0.02) * 30))),
    { paint: (x, z, h) => (h > 0.12 && h < 2.4 ? '#efe6c4' : null) },
  )
  S.sea()
  const c = camOf(S)
  wood(S, R, 'palm', 22, [-160, -45, 160, -14])
  wood(S, R, 'bush', 60, [-160, -60, 160, -18])
  wood(S, R, 'broad', 130, [-380, -380, 380, -45], null, [1, 1.8])
  birds(S, R, 7, 10, 30, 14)
  if (X('pot')) {
    S.walk(P.pot(1.6, '#6a5a48'), [[30, 110], [6, 22]], 2.6, { sea: true, dy: -0.2 })
    people(S, R, { n: 1, kind: 'priestess', at: [3, 15], r: [0.2, 0.2], face: [10, 40], mode: 'pray' })
    people(S, R, { n: 1, kind: 'villager', at: [6, 16], r: [0.2, 0.2], face: [10, 40], mode: 'wave', opt: { top: '#f2efe6', robe: false } })
    houseCluster(S, R, 'thatch', [[-40, -34, 0.3]])
  }
  if (X('kiln')) {
    const k = box(4.5, 2.6, 26, '#8a5a40', -34, S.h(-34, -62) + 1, -62)
    k.rotation.x = -0.22
    S.add(k)
    S.smoke(-34, S.h(-34, -76) + 6, -76, { size: 2.4, color: '#55504a', n: 16 })
    S.fire(-34, S.h(-34, -48) + 0.5, -48.5, 1.4, true)
    walkers(S, R, { n: 9, kind: 'farmer', path: [[-30, -44], [-10, -10], [8, 14]], mode: 'carry', opt: { tool: 'jar', hat: null } })
    for (let i = 0; i < 14; i++) S.put(P.pot(rr(R, 0.9, 1.3), '#4d5258'), -6 + (i % 7) * 1.3, 6 + Math.floor(i / 7) * 1.5)
    for (const [x, s] of [[12, 1.9], [-16, 1.6]]) {
      const b = P.sabani('tan')
      b.scale.setScalar(s)
      S.float(b, x, 27, 0.2, 0.1)
    }
    houseCluster(S, R, 'thatch', [[30, -36, -0.2], [48, -44, -0.4]])
  }
  if (X('chief')) {
    const b = P.sabani('tan')
    b.scale.setScalar(2.3)
    S.walk(b, [[4, 30], [50, 220]], 1.6, { sea: true })
    people(S, R, { n: 22, kind: 'villager', at: [0, 9], r: [14, 4], face: [10, 60], mode: (i) => (i % 2 ? 'wave' : 'stand') })
    people(S, R, { n: 1, kind: 'noble', at: [2, 14], r: [0.1, 0.1], face: [10, 60], opt: { top: '#7a4fa3' } })
    houseCluster(S, R, 'thatch', [[-36, -34, 0.2], [34, -38, -0.2], [0, -48, 0]])
  }
  S.shot(c(34, 15, -32), c(20, 9, -14), [0, 1, 26], null, 8)
  S.shot(c(-16, 1.8, 9), c(-5, 2, 13), [8, 1.6, 26], null, 7)
  S.shot([44, 5, 76], [22, 4, 62], [0, 3, 0], null, 7)
}

// ── 村 ──
export function village(S, o, R) {
  S.env(o.env ?? 'day')
  const X = (k) => o.x?.includes(k)
  const dry = X('famine')
  S.ground(
    (x, z) => {
      let h = 2 + fbm(x * 0.04, z * 0.04) * 0.5 + sm(70, 220, -z + fbm(x * 0.01, z * 0.01) * 60) * (14 + fbm(x * 0.02, 3 + z * 0.02) * 36)
      if (o.coast) h = Math.min(h, (96 - z) * 0.12)
      return Math.max(h, -8)
    },
    { paint: (x, z, h) => (Math.abs(z - 8) < 2.6 && h > 1 ? '#c9b58a' : dry && h > 0.7 ? (fbm(x * 0.2, z * 0.2) > 0.5 ? '#b8a878' : '#a59868') : null) },
  )
  S.sea()
  const c = camOf(S)
  const spots = []
  const n = dry ? 6 : 12
  for (let i = 0; i < n; i++) {
    const x = -60 + (i % 6) * 24 + rr(R, -3, 3)
    if (Math.abs(x) < 14 && i >= 6) continue
    spots.push([x, i < 6 ? -14 : 30, i < 6 ? 0 : Math.PI])
  }
  houseCluster(S, R, o.houses ?? 'thatch', spots)
  wood(S, R, dry ? 'dead' : 'broad', dry ? 50 : 130, [-380, -380, 380, -45])
  if (!dry) wood(S, R, 'palm', 14, [-90, -40, 90, 50], (x, z) => Math.abs(z - 8) > 5)
  if (X('tax')) {
    S.put(box(0.55, 1.43, 0.45, '#8d8a80'), 0, 8)
    people(S, R, { n: 3, kind: 'noble', at: [-3, 6.5], r: [1.5, 1], face: [0.6, 8] })
    people(S, R, { n: 2, kind: 'warrior', at: [-4, 10], r: [1, 1], face: [8, 8] })
    people(S, R, { n: 1, kind: 'farmer', at: [0.7, 8], r: [0.05, 0.05], face: [-3, 7], opt: { hat: null } })
    for (let i = 0; i < 11; i++) {
      const p = person({ ...folk('farmer', R), tool: i % 2 ? 'sack' : null, hat: null })
      S.put(p, 3 + i * 1.5, 8 + Math.sin(i) * 0.5, -Math.PI / 2)
      S.act(p, 'stand')
    }
    for (let i = 0; i < 8; i++) S.put(box(0.9, 0.5, 0.6, '#c9b88a'), -6 + (i % 4) * 1, 3.6 + Math.floor(i / 4) * 0.7, 0, 0)
    walkers(S, R, { n: 6, kind: 'farmer', path: [[70, 8], [22, 8]], mode: 'carry', opt: { tool: 'sack', hat: null }, spread: 0.6 })
  }
  if (X('festival')) {
    people(S, R, { n: 40, kind: 'villager', at: [0, 8], r: [16, 7], face: [0, 8], mode: (i) => (i % 3 === 0 ? 'dance' : 'cheer') })
    for (let i = 0; i < 8; i++) S.put(P.banner(pick(R, ['#c8102e', '#f2c14e', '#3f6fb5', '#f4f4f0']), 6), -21 + i * 6, i % 2 ? 1 : 15)
    for (const x of [-2, 2]) {
      S.put(cyl(0.7, 0.7, 0.9, '#b0271e', 0, 0.5, 0, 10), x, 8)
      people(S, R, { n: 1, kind: 'villager', at: [x, 9.2], r: [0.05, 0.05], face: [x, 8], mode: 'hoe' })
    }
  }
  if (dry) {
    wood(S, R, 'cycad', 60, [-100, -40, 100, 70], (x, z) => Math.abs(z - 8) > 4, [0.8, 1.5])
    people(S, R, { n: 5, kind: 'prewar', at: [4, 13], r: [2, 1.2], mode: 'sit', opt: { scale: 0.9, tool: null } })
    people(S, R, { n: 3, kind: 'farmer', at: [-10, 2], r: [3, 2], mode: 'hoe', opt: { tool: 'hoe' } })
    walkers(S, R, { n: 7, kind: 'prewar', path: [[-10, 8], [90, 8]], speed: 0.8, opt: { tool: 'bundle' }, spread: 0.8 })
  }
  if (X('trade')) {
    S.float(P.junk(), 20, 128, 1.9)
    const crops = {}
    for (let i = 0; i < 4; i++) paddy(S, R, -62 + (i % 2) * 20, -52 - Math.floor(i / 2) * 15, 17, 12, 'water', 'rice', crops)
    flush(S, crops)
    people(S, R, { n: 3, kind: 'chinese', at: [8, 60], r: [2, 1.5], face: [0, 55] })
    people(S, R, { n: 7, kind: 'villager', at: [-1, 56], r: [3, 2], face: [8, 60] })
    for (let i = 0; i < 9; i++) S.put(P.pot(rr(R, 0.9, 1.4), pick(R, ['#e8e6dc', '#4d5258', '#8fb0a8'])), 3 + (i % 3) * 1.2, 57 + Math.floor(i / 3) * 1.2)
    walkers(S, R, { n: 6, kind: 'farmer', path: [[6, 62], [4, 30], [-20, 8]], mode: 'carry', opt: { tool: 'jar', hat: null } })
    people(S, R, { n: 6, kind: 'farmer', at: [-52, -58], r: [14, 9], mode: 'plant' })
    S.shot(c(26, 6, 84), c(16, 4, 72), [4, 2, 56], null, 7)
  }
  if (!X('festival') && !dry) walkers(S, R, { n: 6, kind: 'villager', path: [[-80, 8], [80, 8]], speed: 1 })
  S.shot(c(54, 20, 64), c(30, 11, 46), [0, 2, 8], null, 8)
  S.shot(c(11, 2, 17), c(3, 2.2, 14), [0, 1.5, 8], null, 7)
  S.shot(c(-42, 2.6, 9.5), c(-26, 2.6, 9), [10, 2.2, 8], null, 7)
}

// ── グスク ──
export function gusuku(S, o, R) {
  S.env(o.env ?? 'day')
  const X = (k) => o.x?.includes(k)
  const H = o.height ?? 24
  S.ground(
    (x, z) => {
      let h = 2 + bump(x, z, 0, -10, 72, H) + fbm(x * 0.03, z * 0.03) * 3 + sm(150, 330, Math.hypot(x, z + 10) + fbm(x * 0.01, z * 0.01) * 80) * (o.mount ? 55 : 14)
      if (o.sea) h = Math.min(h, (175 - x) * 0.14 + 2)
      return Math.max(h, -8)
    },
    { paint: (x, z, h) => (Math.abs(x - Math.sin(z * 0.04) * 6 * sm(40, 90, z)) < 2.4 && z > 30 && z < 150 && h > 1 ? '#c9b58a' : null) },
  )
  S.sea()
  const c = camOf(S)
  const top = S.h(0, -12)
  wallLoop(S, ring(0, -10, 40, 9, 6), 5.5, 2.4, [0, 31, 4])
  wallLoop(S, ring(0, -12, 18, 7, 2.5, 2), 4.2, 2, [0, 6.5, 3.2])
  const hall = o.hall === 'tile' ? P.redtile(14, 9) : P.thatch(11, 8)
  S.put(hall, 0, -16)
  S.put(P.thatch(6, 5), -9, -8, 0.5)
  S.put(P.thatch(6, 5), 10, -10, -0.4)
  for (let i = 0; i < 6; i++) S.put(P.banner(pick(R, BRIGHT), 6), -10 + i * 4, 8.5 + (i % 2), 0)
  wood(S, R, 'broad', 150, [-380, -380, 380, 380], (x, z) => Math.hypot(x, z + 10) > 52 && !(Math.abs(x) < 9 && z > 0), [1, 1.8])
  wood(S, R, 'pine', 24, [-90, -90, 90, 80], (x, z) => Math.hypot(x, z + 10) > 46 && Math.hypot(x, z + 10) < 80 && !(Math.abs(x) < 9 && z > 0))
  const patrol = ring(0, -11, 27, 14, 0).concat([ring(0, -11, 27, 14, 0)[0]])
  walkers(S, R, { n: 7, kind: 'warrior', path: patrol, speed: 1, spread: 0.6 })
  people(S, R, { n: 2, kind: 'warrior', at: [0, 34], r: [3.5, 0.3], face: [0, 80] })
  const road = [[0, 34], [0, 62], [3, 100], [0, 150]]
  if (X('build')) {
    walkers(S, R, { n: 16, kind: 'farmer', path: [...road].reverse(), mode: 'carry', opt: { tool: 'sack', toolColor: '#c9c2ad', hat: null }, spread: 1.2 })
    S.add(plants('rock', Array.from({ length: 26 }, () => ({ x: rr(R, 6, 18), y: S.h(12, 40), z: rr(R, 36, 48), s: rr(R, 0.8, 1.6), ry: R() * 6 }))))
    people(S, R, { n: 6, kind: 'farmer', at: [12, 42], r: [5, 4], mode: 'hoe', opt: { tool: 'hoe', hat: null } })
    people(S, R, { n: 2, kind: 'noble', at: [-6, 40], r: [1, 1], face: [10, 42], mode: (i) => (i ? 'stand' : 'wave') })
  }
  if (X('siege')) {
    walkers(S, R, { n: 36, kind: 'torch', path: [...road].reverse(), mode: 'march', spread: 2.2 })
    for (const [x, z] of [[-8, -4], [9, -4], [-4, 20], [5, 20]]) S.fire(x, S.h(x, z) + 1.2, z, 0.7, x < 0)
    people(S, R, { n: 10, kind: 'noble', at: [0, -2], r: [6, 3], face: [0, 30], mode: (i) => (i % 2 ? 'sit' : 'stand') })
  }
  if (X('battle')) {
    people(S, R, { n: 30, kind: 'warrior', at: [0, 46], r: [12, 9], face: [0, 30], mode: (i) => (i % 2 ? 'cheer' : 'aim') })
    walkers(S, R, { n: 14, kind: 'warrior', path: [[0, 150], [0, 58]], mode: 'run', speed: 3.4, spread: 3 })
    for (const [x, z, s] of [[-9, -8, 3], [10, -10, 2.4], [0, -16, 3.6]]) {
      S.fire(x, S.h(x, z) + 3, z, s, true)
      S.smoke(x, S.h(x, z) + 7, z, { size: 3.6, n: 14 })
    }
    people(S, R, { n: 10, kind: 'warrior', at: [0, 14], r: [12, 3], face: [0, 60], mode: 'aim' })
  }
  if (X('march')) {
    walkers(S, R, { n: 34, kind: 'warrior', path: road, mode: 'march', spread: 1.6 })
    const rider = person(folk('king', R))
    animatePerson(rider, 0, 'sit')
    rider.position.y = 0.55
    S.walk(group(horse('#2a1c12'), rider), road, 1.2, { offset: 8 })
    people(S, R, { n: 12, kind: 'farmer', at: [14, 60], r: [5, 12], face: [0, 60], mode: 'cheer', opt: { tool: 'hoe', hat: null } })
  }
  if (X('spring')) {
    const y = S.h(44, 66)
    S.add(cyl(4.4, 4.6, 0.7, '#9c988a', 44, y - 0.2, 66, 12), cyl(3.8, 3.8, 0.72, '#3fa3b5', 44, y - 0.2, 66, 12, { roughness: 0.1, metalness: 0.3 }))
    walkers(S, R, { n: 8, kind: 'villager', path: [[42, 62], [10, 70], [42, 62]], mode: 'carry', opt: { tool: 'jar', robe: true }, spread: 1 })
    const crops = {}
    for (let i = 0; i < 6; i++) paddy(S, R, 70 + (i % 3) * 22, 80 + Math.floor(i / 3) * 17, 19, 14, 'water', 'rice', crops)
    flush(S, crops)
    people(S, R, { n: 8, kind: 'farmer', at: [92, 88], r: [26, 12], mode: 'plant' })
    S.shot(c(60, 2.6, 78), c(52, 2.4, 72), [44, S.h(44, 66) + 1, 66], null, 6)
  }
  birds(S, R, 6, 0, -10, top + 26)
  S.shot(c(74, 6, 104), c(48, 9, 86), [0, top + 2, -10], null, 8)
  S.shot([-70, top + 44, 70], [-36, top + 38, 80], [0, top, -10], null, 8)
  S.shot(c(11, 2.6, 52), c(4, 2.2, 44), [0, S.h(0, 31) + 2.4, 31], null, 7)
}

// ── 港 ──
const SHIPS = { junk: P.junk, wasen: P.wasen, sabani: P.sabani, blackship: P.blackship, steamer: () => P.steamer(), warship: () => P.warship(), fishing: P.fishing, patrol: () => P.steamer('#f2f2ee', '#f2f2ee', '#2f6fb5', 46) }
export function harbor(S, o, R) {
  S.env(o.env ?? 'day')
  const X = (k) => o.x?.includes(k)
  S.ground((x, z) => (z < 1 ? 2.3 + fbm(x * 0.04, z * 0.04) * 0.3 + sm(80, 230, -z + fbm(x * 0.01, z * 0.01) * 60) * (12 + fbm(x * 0.02, z * 0.02) * 30) : Math.max(-9, -3 - z * 0.06)), {
    paint: (x, z, h) => (z > -12 && z < 1.5 && Math.abs(x) < 95 ? '#bdb7a6' : null),
    seg: 200,
  })
  S.sea({ color: o.env === 'night' ? '#0f3a52' : '#1f93ad' })
  S.add(box(190, 3.6, 3, '#a39d8c', 0, -1.2, 1.2))
  const c = camOf(S)
  const kind = o.town ?? 'tile'
  const spots = []
  for (let r = 0; r < 3; r++)
    for (let i = 0; i < 9; i++) {
      const x = -72 + i * 18 + (r % 2) * 7
      if (kind !== 'modern') spots.push([x, -26 - r * 20, 0])
      else S.put(P.concrete(rr(R, 9, 13), rr(R, 6, 16), 10, pick(R, ['#d9d4c6', '#e6e0d4', '#c9c0ae'])), x, -30 - r * 22)
    }
  if (spots.length) houseCluster(S, R, kind, spots)
  for (let i = 0; i < 3; i++) S.put(P.longHall(22, '#7a5a3a', '#8d3a2b'), -52 + i * 52, -14)
  for (let i = 0; i < 16; i++) S.put(i % 3 ? P.crate(pick(R, ['#8a6a44', '#6e5236'])) : P.pot(rr(R, 1, 1.5)), -30 + rr(R, 0, 60), rr(R, -9, -6))
  wood(S, R, 'broad', 110, [-380, -380, 380, -90], null, [1, 1.8])
  wood(S, R, 'palm', 10, [-95, -12, 95, -10])
  birds(S, R, 8, 0, 30, 18)
  ;(o.ships ?? []).forEach(([type, x, z, deg = 90, path], i) => {
    const s = SHIPS[type]()
    if (path) S.walk(s, path, 1.8, { sea: true, loop: true, offset: i * 9 })
    else {
      S.float(s, x, z, (deg * Math.PI) / 180)
      if (s.userData.funnel) funnelSmoke(S, s)
    }
  })
  ;(o.crowd ?? []).forEach(([n, k, mode, cx = 0, rx = 26]) => people(S, R, { n, kind: k, at: [cx, -5], r: [rx, 2.6], face: o.faceLand ? [cx, -60] : [cx, 60], mode }))
  if (X('march')) {
    const path = [[-90, -4.5], [90, -4.5]]
    walkers(S, R, { n: 26, kind: 'sailor', path, mode: 'march', spread: 0.9 })
    walkers(S, R, { n: 1, kind: 'sailor', path, mode: 'march', spread: 0, opt: { tool: 'flag', toolColor: '#b22234' } })
    rows(S, R, { nx: 9, nz: 2, kind: 'noble', at: [0, -11], ry: 0 })
  }
  if (X('load')) walkers(S, R, { n: 12, kind: 'farmer', path: [[-40, -16], [-10, -5], [20, -5], [40, -16], [-40, -16]], mode: 'carry', opt: { tool: 'sack', hat: null } })
  if (X('emigrants')) {
    walkers(S, R, { n: 16, kind: 'prewar', path: [[-70, -8], [-4, -4]], loop: true, opt: { tool: 'bundle' }, spread: 1 })
    S.walk(P.sabani(null), [[-2, 6], [10, 46], [-2, 6]], 1.4, { sea: true })
  }
  if (X('flagUS')) S.put(P.flagpole('usa', 10), -8, -8)
  S.shot([34, 7, 78], [14, 5, 52], [0, 5, 0], null, 8)
  S.shot(c(-22, 2, -3.5), c(-8, 2.2, -4.5), [14, 4, -4], [20, 5, 20], 7)
  S.shot([-84, 48, 70], [-48, 40, 84], [0, 3, 10], null, 8)
}

// ── 首里城 ──
export function shuri(S, o, R) {
  const mode = o.mode
  S.env(o.env ?? 'day', mode === 'fire' ? { exp: 1.25 } : {})
  S.ground((x, z) => {
    const d = Math.hypot(x, z)
    return 20 * (1 - sm(86, 190, d + fbm(x * 0.02, z * 0.02) * 30)) + 2 + fbm(x * 0.03, z * 0.03) * (d > 80 ? 4 : 0.15)
  })
  const c = camOf(S)
  const y = S.h(0, 0)
  const main = S.put(P.seiden(), 0, -30)
  const una = plane(46, 42, P.unaMat())
  una.rotation.x = -Math.PI / 2
  una.position.set(0, y + 0.06, 4)
  una.receiveShadow = true
  S.add(una)
  S.put(P.longHall(40, '#b0271e'), -30, 4, Math.PI / 2)
  S.put(P.longHall(36, '#7a5a3a'), 30, 4, -Math.PI / 2)
  for (const x of [-16, 16]) S.put(P.longHall(20, '#b0271e'), x, 32, Math.PI)
  S.put(group(box(8, 1, 3, '#b0271e', 0, 5, 0), roof(12, 6, 2.2, 0.3, '#8d3a2b', 6)), 0, 32)
  wallLoop(S, ring(0, 2, 62, 12, 5, 1), 6, 2.6, [0, 66, 5])
  S.put(group(cyl(0.35, 0.4, 5.5, '#b0271e', -3.4, 0, 0), cyl(0.35, 0.4, 5.5, '#b0271e', 3.4, 0, 0), roof(11, 4, 1.6, 0.3, '#8d3a2b', 5.4), roof(7, 3, 1.2, 0.3, '#8d3a2b', 7)), 0, 84)
  wood(S, R, 'broad', 170, [-380, -380, 380, 380], (x, z) => Math.hypot(x, z - 2) > 70 && !(Math.abs(x) < 8 && z > 60), [1, 1.9])
  wood(S, R, 'fukugi', 20, [-58, -52, 58, 58], (x, z) => Math.hypot(x, z - 2) > 46 && Math.hypot(x, z - 2) < 58)
  birds(S, R, 5, 0, 0, y + 40)
  const steps = [0, -15.2]
  if (mode === 'found' || mode === 'court') {
    const m = mode === 'court' ? 'bow' : 'stand'
    for (const sx of [-1, 1]) rows(S, R, { nx: 5, nz: 6, kind: 'noble', at: [sx * 8, -4], ry: Math.PI, gap: [1.7, 2.4], mode: m })
    const k = person(folk('king', R))
    k.position.set(steps[0], y + 1.85, steps[1])
    S.add(k)
    S.act(k, 'stand')
    for (const sx of [-1, 1]) {
      const a = person({ ...folk('noble', R), hat: 'umbrella', hatColor: '#c8102e' })
      a.position.set(sx * 1.6, y + 1.85, steps[1] - 0.6)
      S.add(a)
      S.act(a, 'stand')
    }
    for (let i = 0; i < 10; i++) S.put(P.banner(pick(R, BRIGHT), 7), (i % 2 ? 1 : -1) * 19, -10 + Math.floor(i / 2) * 7)
    rows(S, R, { nx: 1, nz: 8, kind: 'warrior', at: [-21, 20], ry: Math.PI / 2, gap: [1, 3.4], opt: { tool: 'spear' } })
    rows(S, R, { nx: 1, nz: 8, kind: 'warrior', at: [21, -4], ry: -Math.PI / 2, gap: [1, 3.4], opt: { tool: 'spear' } })
  }
  if (mode === 'dance') {
    S.put(box(11, 0.7, 8, '#8a6a44'), 0, 6)
    for (let i = 0; i < 4; i++) {
      const d = person(folk('dancer', R))
      d.position.set(-3 + i * 2, y + 0.7, 6 + (i % 2) * 1.6)
      d.rotation.y = Math.PI
      S.add(d)
      S.act(d, 'dance')
    }
    rows(S, R, { nx: 7, nz: 2, kind: 'chinese', at: [0, -5], ry: 0, mode: 'sit', gap: [1.6, 1.6] })
    for (const sx of [-1, 1]) rows(S, R, { nx: 3, nz: 7, kind: 'noble', at: [sx * 12, 12], ry: -sx * Math.PI / 2, mode: 'sit', gap: [1.5, 1.5] })
    for (let i = 0; i < 8; i++) S.fire((i % 2 ? 1 : -1) * 7.5, y + 1.6, -1 + Math.floor(i / 2) * 5, 0.45, i < 2)
    for (let i = 0; i < 8; i++) S.put(cyl(0.05, 0.06, 1.6, '#3a2a1c'), (i % 2 ? 1 : -1) * 7.5, -1 + Math.floor(i / 2) * 5)
  }
  if (mode === 'annex') {
    walkers(S, R, { n: 30, kind: 'meiji', path: [[0, 62], [0, 36], [0, 6]], mode: 'march', loop: false, spread: 2.4, gap: 0.9, speed: 1.5 })
    for (const sx of [-1, 1]) rows(S, R, { nx: 2, nz: 6, kind: 'noble', at: [sx * 14, -2], ry: -sx * Math.PI / 2, mode: 'bow', gap: [1.6, 2] })
    const pal = group(box(1.4, 1.3, 1.9, '#8a1f1a', 0, 0.7, 0), roof(2, 2.6, 0.6, 0.3, '#2a2a2e', 2), box(0.1, 0.1, 5.4, '#3a2a1c', 0, 2.1, 0))
    const path = [[8, -8], [18, 20], [4, 34], [0, 62]]
    S.walk(pal, path, 0.8, { loop: true })
    for (const dz of [-2.4, 2.4]) S.walk(person(folk('villager', R)), path, 0.8, { loop: true, offset: dz, mode: 'carry' })
    people(S, R, { n: 8, kind: 'noble', at: [14, 22], r: [4, 3], face: [8, 10], mode: 'bow' })
  }
  if (mode === 'restored') {
    for (let i = 0; i < 26; i++) {
      const a = [rr(R, -18, 18), rr(R, -8, 22)]
      const b = [rr(R, -18, 18), rr(R, -8, 22)]
      walkers(S, R, { n: 1, kind: 'modern', path: [a, b, a], speed: 0.7, spread: 0 })
    }
    people(S, R, { n: 14, kind: 'modern', at: [0, 0], r: [10, 5], face: [0, -30], mode: (i) => (i % 3 ? 'stand' : 'wave') })
  }
  if (mode === 'fire') {
    for (const [x, h, z, s] of [[0, 15, -30, 8], [-9, 9, -28, 6], [9, 9, -28, 6], [0, 6, -21, 5], [-12, 14, -32, 5], [12, 14, -32, 5]]) S.fire(x, y + h, z, s, Math.abs(x) < 10 && h > 8)
    S.smoke(0, y + 22, -30, { size: 9, n: 22, rise: 7, color: '#3a2a22', wind: [3, 1], life: 8 })
    S.smoke(-10, y + 16, -30, { size: 6, n: 14, rise: 6, color: '#4a342a' })
    for (const [x, z] of [[-30, 0], [30, -6]]) {
      S.fire(x, y + 6, z, 4.5, false)
      S.smoke(x, y + 10, z, { size: 5, n: 12, color: '#3a2a22' })
    }
    main.traverse((m) => m.isMesh && (m.castShadow = false))
    people(S, R, { n: 10, kind: 'fireman', at: [0, 16], r: [12, 3], face: [0, -30], mode: 'aim' })
    for (const x of [-9, 9]) S.put(P.truck('#c8102e', '#c8102e'), x, 24, Math.PI)
    // 火の粉
    const em = []
    for (let i = 0; i < 40; i++) em.push(sph(0.12, P.TM('ember', 4, 4, (cx) => ((cx.fillStyle = '#ffb23a'), cx.fillRect(0, 0, 4, 4)), { mat: { emissive: '#ff8a1f', emissiveIntensity: 3 } })))
    em.forEach((e, i) => {
      S.add(e)
      S.tick((t) => {
        const a = (t * 0.25 + i / 40) % 1
        e.position.set(Math.sin(i * 7) * 12 + a * 14, y + 14 + a * 34, -30 + Math.cos(i * 5) * 6 + Math.sin(t + i) * 2)
      })
    })
  }
  S.shot(c(0, 6, 60), c(0, 3.4, 30), [0, y + 9, -30], null, 9)
  S.shot([54, y + 30, 54], [40, y + 22, 42], [0, y + 4, -10], null, 8)
  S.shot(c(-13, 1.9, 15), c(-5, 1.9, 11), [0, y + (mode === 'fire' ? 9 : 2.6), mode === 'dance' ? 6 : -14], null, 7)
}

// ── 聖地 ──
export function grove(S, o, R) {
  S.env(o.env ?? 'dawn', { fogD: 0.0035 })
  S.ground((x, z) => Math.max(-8, Math.min(6 + fbm(x * 0.03, z * 0.03) * 5 - bump(x, z, 0, 30, 14, 2), (150 - x) * 0.22 + fbm(z * 0.03, 2) * 4)))
  S.sea()
  const c = camOf(S)
  const y = S.h(0, 0)
  const rock = (w, h, d, x, rz, col) => {
    const m = box(w, h, d, col, x, y - 2, -4)
    m.rotation.z = rz
    S.add(m)
  }
  rock(7, 22, 16, -5.5, -0.42, '#8f8c80')
  rock(6, 19, 15, 6.5, 0.5, '#9a978a')
  rock(10, 9, 12, -14, 0.1, '#86837a')
  rock(9, 11, 12, 16, -0.1, '#8a877c')
  S.put(box(3, 0.5, 1.2, '#a8a294'), 0, -1)
  for (const x of [-1, 0, 1]) S.put(P.pot(0.7, '#6a5a48'), x * 0.8, -1, 0, 0.5)
  const clear = (x, z) => !(Math.abs(x) < 4.5 && z > -4) && Math.hypot(x, z + 4) > 13
  wood(S, R, 'broad', 190, [-380, -380, 140, 380], clear, [1.2, 2.2])
  wood(S, R, 'fern', 70, [-80, -70, 90, 110], clear)
  wood(S, R, 'bush', 90, [-80, -70, 100, 110], clear)
  const isle = sph(1, '#3d6a4a', 760, 0, -160)
  isle.scale.set(150, 9, 46)
  S.add(isle)
  walkers(S, R, { n: 7, kind: 'priestess', path: [[0, 62], [0, 16]], loop: false, endMode: 'pray', spread: 0.4, gap: 2.2, speed: 1, opt: {} })
  people(S, R, { n: 1, kind: 'priestess', at: [0, 3], r: [0.1, 0.1], face: [0, -4], mode: 'pray', opt: { sash: '#d9a521', scale: 1.08 } })
  people(S, R, { n: 2, kind: 'priestess', at: [0, 6], r: [1.8, 0.4], face: [0, -4], mode: 'pray' })
  birds(S, R, 4, 40, 0, y + 30)
  S.shot(c(0, 2.4, 46), c(0, 2, 24), [0, y + 8, -4], null, 9)
  S.shot([-34, y + 30, 44], [-20, y + 24, 30], [60, 4, -10], null, 8)
  S.shot(c(4.2, 1.7, 13), c(2.4, 1.6, 9.5), [0, y + 1.5, 0], [0, y + 6, -4], 7)
}
