// 場面の演出（後半）: 上陸・断崖・津波・密林・鉄道・空襲・戦場・街・リゾート・埋め立て
import * as THREE from 'three'
import { animatePerson, box, bump, cone, cyl, fbm, flatMat, G, group, horse, instances, M, person, plane, plants, rail as kuina, sm, sph } from './kit'
import * as P from './props'
import { birds, camOf, flush, folk, funnelSmoke, houseCluster, paddy, people, pick, rows, rr, walkers, wood } from './recipes-a'

const beachH = (x, z) =>
  Math.max(-9, Math.min((30 - z) * 0.05 + fbm(x * 0.04, z * 0.04) * 0.4 + bump(0, z, 0, -26, 9, 2.6), 4 + sm(40, 190, -z + fbm(x * 0.012, z * 0.012) * 50) * (10 + fbm(x * 0.02, z * 0.02) * 34)))
const sandPaint = (x, z, h) => (h > 0.12 && h < 2.2 && z > -18 ? '#efe6c4' : null)

// ── 上陸 ──
export function landing(S, o, R) {
  S.env(o.env ?? 'overcast')
  const era = o.era
  S.ground(beachH, { paint: sandPaint })
  S.sea({ color: o.env === 'day' ? '#1f9fb8' : '#2a7f95' })
  const c = camOf(S)
  wood(S, R, 'palm', 22, [-180, -60, 180, -30])
  wood(S, R, 'bush', 50, [-180, -70, 180, -32])
  wood(S, R, o.bombard ? 'dead' : 'broad', 150, [-380, -380, 380, -60], null, [1, 1.8])
  if (era === 'ryukyu') {
    for (let i = 0; i < 3; i++) S.float(P.junk(), -70 + i * 70, 130 + (i % 2) * 40, Math.PI)
    for (let i = 0; i < 7; i++) S.walk(P.sabani(), [[-60 + i * 20, 210], [-50 + i * 17, 40]], 2.4, { sea: true, offset: i * 23 })
    walkers(S, R, { n: 26, kind: 'warrior', path: [[0, 40], [0, -4]], spread: 22, mode: 'march' })
    rows(S, R, { nx: 14, nz: 2, kind: 'warrior', at: [0, -24], ry: 0, mode: 'aim', gap: [2.2, 2] })
    for (let i = 0; i < 6; i++) S.put(P.banner(pick(R, ['#c8102e', '#f2c14e', '#f4f4f0']), 6), -25 + i * 10, -27)
    houseCluster(S, R, 'thatch', [[-40, -62, 0], [-10, -70, 0.2], [30, -64, -0.2]])
    S.fire(30, S.h(30, -64) + 3, -64, 2.6, true)
    S.smoke(30, S.h(30, -64) + 7, -64, { size: 3.5 })
  }
  if (era === 'satsuma') {
    for (let i = 0; i < 3; i++) S.float(P.wasen(), -44 + i * 44, 44 + (i % 2) * 5, Math.PI + (i - 1) * 0.15)
    for (let i = 0; i < 5; i++) S.walk(P.wasen(), [[-90 + i * 45, 260], [-80 + i * 40, 62]], 2.2, { sea: true, offset: i * 37 })
    walkers(S, R, { n: 30, kind: 'samurai', path: [[0, 34], [0, -30], [10, -90]], spread: 18, mode: 'march' })
    rows(S, R, { nx: 12, nz: 2, kind: 'samurai', at: [0, 4], ry: Math.PI, mode: 'aim', gap: [1.8, 2], opt: { tool: 'gun' } })
    for (let i = 0; i < 7; i++) S.put(P.banner(i % 2 ? '#f2ede0' : '#15151a', 6.5), -27 + i * 9, 10)
    walkers(S, R, { n: 10, kind: 'villager', path: [[-10, -40], [-30, -130]], mode: 'run', speed: 3.6, spread: 8 })
    houseCluster(S, R, 'thatch', [[-48, -64, 0], [44, -66, 0]])
    S.smoke(0, 3, -2, { size: 1.2, n: 10, color: '#d8d4cc', rise: 1.5, life: 4, spread: 6, opacity: 0.5 })
  }
  if (era === 'us') {
    for (let i = 0; i < 5; i++) S.float(P.warship(), -420 + i * 210, 300 + (i % 2) * 90, Math.PI / 2 + 0.2)
    for (let i = 0; i < 3; i++) S.float(P.steamer('#6b757c', '#7b868e', '#6b757c', 60), -160 + i * 150, 190, Math.PI / 2)
    for (let i = 0; i < 12; i++) S.walk(P.lvt(), [[-88 + i * 16, 250], [-88 + i * 16, 31]], 4.5, { sea: true, offset: (i % 4) * 55 + i * 3, dy: 0.5 })
    walkers(S, R, { n: 40, kind: 'marine', path: [[0, 30], [0, -34], [0, -90]], spread: 44, mode: 'march' })
    for (let i = 0; i < 3; i++) S.walk(P.tank(), [[-40 + i * 40, 26], [-40 + i * 40, -60]], 1.5, { offset: i * 30 })
    for (let i = 0; i < 4; i++) S.walk(P.propPlane(), [[-500, -120 + i * 70], [500, -60 + i * 70]], 60, { offset: i * 260, fly: () => 70 + i * 12 })
    if (o.bombard) {
      S.explosions([0, -150, 150, 50], { size: 9, every: 0.9 })
      for (let i = 0; i < 5; i++) S.smoke(-150 + i * 75, S.h(-150 + i * 75, -150) + 6, -150 - (i % 2) * 40, { size: 9, n: 14, rise: 7, life: 9 })
    }
    if (o.villagers) walkers(S, R, { n: 14, kind: 'refugee', path: [[20, -50], [50, -160]], mode: 'run', speed: 3, spread: 6 })
  }
  birds(S, R, 4, 0, 30, 20)
  S.shot(c(-22, 4.6, -40), c(-9, 3.6, -32), [10, 2, 40], null, 8)
  S.shot(c(28, 1.6, 31), c(15, 1.9, 26), [-12, 1.6, 4], null, 7)
  S.shot([96, 64, -30], [60, 52, -14], [0, 0, 80], null, 8)
}

// ── 断崖 ──
export function cliff(S, o, R) {
  S.env(o.env ?? 'day')
  const X = (k) => o.x?.includes(k)
  const edge = (z) => fbm(z * 0.02, 3) * 34 - 17
  S.ground((x, z) => {
    const d = x - edge(z)
    return 38 * (1 - sm(0, 9, d)) + fbm(x * 0.03, z * 0.03) * 3 * (1 - sm(-4, 6, d)) - 7 * sm(6, 70, d) + sm(-60, -260, d) * 18
  }, { seg: 200 })
  S.sea({ color: '#1f6f9a' })
  const c = camOf(S)
  const e0 = edge(0)
  const war = X('refugees')
  wood(S, R, war ? 'dead' : 'bush', 110, [-380, -380, 0, 380], (x, z) => x < edge(z) - 6)
  if (!war) wood(S, R, 'cycad', 40, [-200, -200, 0, 200], (x, z) => x < edge(z) - 5)
  wood(S, R, war ? 'dead' : 'pine', 40, [-380, -380, -40, 380], (x, z) => x < edge(z) - 30)
  birds(S, R, 8, e0 + 20, 0, 30)
  if (X('chief')) {
    people(S, R, { n: 1, kind: 'priestess', at: [e0 - 3, 0], r: [0.1, 0.1], face: [200, 0], opt: { sash: '#c8102e', scale: 1.15, tool: 'spear' } })
    rows(S, R, { nx: 8, nz: 1, kind: 'warrior', at: [e0 - 8, 0], ry: Math.PI / 2, gap: [1.8, 1] })
    for (let i = 0; i < 6; i++) S.put(horse(pick(R, ['#7a5232', '#8a6a44', '#5a3a22'])), e0 - 20 - rr(R, 0, 20), rr(R, -30, 30), R() * 6)
    for (let i = 0; i < 6; i++) S.walk(P.sabani(), [[260, -80 + i * 34], [e0 + 30, -40 + i * 16]], 2.6, { sea: true, offset: i * 31 })
    S.float(P.junk(), 150, 30, -Math.PI / 2)
    houseCluster(S, R, 'thatch', [[e0 - 46, -24, 1.2], [e0 - 50, 12, 1.4], [e0 - 62, -6, 1.5]])
  }
  if (X('pioneers')) {
    const s = S.float(P.steamer(), 150, 20, 0.3)
    funnelSmoke(S, s)
    S.walk(P.sabani(null), [[130, 20], [e0 + 14, 2]], 1.8, { sea: true })
    const lad = box(0.9, 44, 0.25, '#8a6a44', e0 + 4, -3, 0)
    lad.rotation.z = 0.14
    S.add(lad)
    walkers(S, R, { n: 6, kind: 'prewar', path: [[e0 + 9, 0], [e0 - 3, 0], [e0 - 16, 6]], speed: 0.8, opt: { robe: false, tool: 'bundle' }, spread: 0.3 })
    people(S, R, { n: 10, kind: 'prewar', at: [e0 - 22, 4], r: [10, 12], mode: 'hoe', opt: { robe: false, tool: 'hoe' } })
    S.put(P.flagpole('hinomaru', 7, 2.4), e0 - 12, -8)
    for (let i = 0; i < 3; i++) S.put(group(roofTent()), e0 - 30 - i * 6, -14 + i * 9, 0.4)
    wood(S, R, 'palm', 30, [-200, -200, 0, 200], (x, z) => x < edge(z) - 34)
  }
  if (war) {
    walkers(S, R, { n: 34, kind: 'refugee', path: [[e0 - 14, 190], [e0 - 10, 20], [e0 - 16, -190]], speed: 0.9, spread: 3 })
    walkers(S, R, { n: 6, kind: 'ija', path: [[e0 - 24, 150], [e0 - 22, -150]], speed: 1, spread: 2 })
    for (let i = 0; i < 4; i++) S.float(P.warship(), 260 + i * 90, -260 + i * 170, 0.1)
    S.explosions([e0 - 70, 0, 50, 150], { size: 8, every: 1.4 })
    for (let i = 0; i < 4; i++) S.smoke(e0 - 60 - i * 30, 42, -150 + i * 90, { size: 8, n: 14, rise: 6, life: 9 })
    for (let i = 0; i < 3; i++) S.fire(e0 - 40 - i * 22, S.h(e0 - 40 - i * 22, -60 + i * 50), -60 + i * 50, 2.4, i === 0)
  }
  if (X('radar')) {
    for (let i = 0; i < 9; i++) S.put(horse(pick(R, ['#7a5232', '#8a6a44', '#5a3a22'])), e0 - 12 - rr(R, 0, 24), rr(R, -34, 34), R() * 6)
    for (const z of [-80, -108]) S.put(P.radar(9), e0 - 70, z)
    S.put(group(cyl(0.2, 0.5, 30, '#c8102e', 0, 0, 0, 5), box(6, 0.2, 0.2, '#c8c8c8', 0, 24, 0)), e0 - 90, -60)
    S.put(P.fence(90), e0 - 50, -90, Math.PI / 2)
    S.put(P.concrete(22, 5, 10, '#c9c4b4', false), e0 - 84, -130)
    S.put(group(cyl(1.3, 1.7, 14, '#f4f4f0', 0, 0, 0, 10), cyl(1.6, 1.6, 1.6, '#c8102e', 0, 14, 0, 10)), e0 - 8, 60)
    const s = S.float(P.steamer('#f2f2ee', '#f2f2ee', '#2f6fb5', 50), 170, -40, 0.2)
    funnelSmoke(S, s, { size: 1.2, color: '#8a8a8a' })
    people(S, R, { n: 4, kind: 'modern', at: [e0 - 7, 10], r: [3, 3], face: [200, 0] })
  }
  S.shot([110, 9, 70], [84, 14, 46], [e0 - 4, 32, 0], null, 8)
  S.shot(c(e0 - 18, 2.4, 16), c(e0 - 11, 2.1, 9), [e0 + 30, 30, -10], null, 7)
  S.shot([e0 - 60, 86, -80], [e0 - 36, 74, -56], [e0 + 30, 6, 16], null, 8)
}
const roofTent = () => {
  const t = cyl(0, 2.6, 2.4, '#d8d2c0', 0, 0, 0, 4)
  return t
}

// ── 津波 ──
export function tsunami(S, o, R) {
  S.env('overcast', { fogD: 0.0028 })
  S.ground((x, z) => Math.max(-9, Math.min((24 - z) * 0.05 + fbm(x * 0.04, z * 0.04) * 0.4, 3.2 + bump(x, z, 0, -150, 90, 34) + fbm(x * 0.02, z * 0.02) * 4)), { paint: sandPaint })
  S.sea({ color: '#2a7f95' })
  const c = camOf(S)
  const spots = []
  for (let i = 0; i < 12; i++) spots.push([-66 + (i % 6) * 26 + rr(R, -3, 3), i < 6 ? -22 : -46, 0])
  houseCluster(S, R, 'thatch', spots)
  wood(S, R, 'palm', 18, [-150, -16, 150, -4])
  wood(S, R, 'broad', 120, [-380, -380, 380, -70], null, [1, 1.8])
  for (let i = 0; i < 4; i++) S.put(P.sabani(null), -40 + i * 26, 16, 0.4 + i, 0.4)
  for (let i = 0; i < 30; i++) {
    const x = rr(R, -70, 70)
    walkers(S, R, { n: 1, kind: 'villager', path: [[x, -4], [x * 0.6, -70], [x * 0.2, -150]], mode: 'run', speed: 4.2, spread: 0, opt: { scale: R() < 0.2 ? 0.7 : 1 } })
  }
  // 押し寄せる波の壁
  // 横に長いかまぼこ形（軸が X、ふくらみが上）
  const geo = G('wavewall', () => new THREE.CylinderGeometry(1, 1, 1, 14, 1, false, 0, Math.PI).rotateZ(Math.PI / 2))
  const wave = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: '#2f8ba3', roughness: 0.25, metalness: 0.1, flatShading: true }))
  const crest = new THREE.Mesh(geo, flatMat('#f2f8fa', { transparent: true, opacity: 0.85 }))
  S.add(wave, crest)
  const spray = S.smoke(0, 0, 0, { size: 5, n: 30, color: '#f2f8fa', rise: 1.5, spread: 60, life: 3, wind: [0, 2], opacity: 0.6 })
  S.tick((t) => {
    const a = (t % 16) / 16
    const z = 330 - a * 315
    const hgt = 5 + a * 12
    wave.position.set(0, -0.5, z)
    wave.scale.set(900, hgt, hgt * 2.2)
    crest.position.set(0, hgt * 0.78, z - hgt * 0.9)
    crest.scale.set(900, hgt * 0.3, hgt * 0.9)
    spray.position.set(0, hgt, z - hgt)
  })
  S.shot(c(12, 7, -84), c(5, 5.5, -66), [0, 5, 80], null, 8)
  S.shot(c(-34, 2, 4), c(-24, 2.3, -3), [10, 7, 110], null, 8)
  S.shot([150, 54, 10], [118, 42, 0], [0, 4, 60], null, 8)
}

// ── 密林 ──
export function jungle(S, o, R) {
  const X = (k) => o.x?.includes(k)
  S.env(o.env ?? 'overcast', X('kuina') ? { fogD: 0.006 } : {})
  const coast = X('malaria')
  S.ground((x, z) => {
    let h = 3 + fbm(x * 0.03, z * 0.03) * 7 * sm(18, 60, Math.hypot(x, z)) + bump(x, z, 0, -90, 60, X('mine') ? 30 : 12)
    if (coast) h = Math.min(h, (70 - z) * 0.08)
    if (X('kuina')) h -= (1 - sm(1.5, 5, Math.abs(x - 14 - Math.sin(z * 0.08) * 4))) * 3.6
    return Math.max(h, -8)
  }, { paint: coast ? sandPaint : (x, z, h) => (X('kuina') && h < 1.2 ? '#4f8fa0' : null) })
  S.sea()
  const c = camOf(S)
  const rad = X('settlers') ? 40 : X('kuina') ? 7 : 24
  const clear = (x, z) => Math.hypot(x, z) > rad && !(X('mine') && Math.abs(x) < 4 && z > -30 && z < 80)
  wood(S, R, 'broad', 240, [-380, -380, 380, 380], clear, [1.2, 2.3])
  wood(S, R, 'fern', 110, [-120, -120, 120, 120], clear)
  wood(S, R, 'palm', 40, [-150, -150, 150, 150], clear)
  wood(S, R, 'bush', 140, [-120, -120, 120, 120], (x, z) => Math.hypot(x, z) > rad * 0.8)
  birds(S, R, 5, 0, 0, 30)
  if (X('mine')) {
    const y = S.h(0, -24)
    S.add(box(4, 3.4, 5, '#0d0c0b', 0, y - 0.4, -27), box(0.5, 3.8, 0.5, '#5a4632', -2.2, y - 0.4, -24), box(0.5, 3.8, 0.5, '#5a4632', 2.2, y - 0.4, -24), box(5.4, 0.5, 0.5, '#5a4632', 0, y + 3.2, -24))
    for (const dx of [-0.5, 0.5]) for (let z = -24; z < 76; z += 4) S.put(box(0.12, 0.14, 4.1, '#3a3632'), dx, z)
    const sl = []
    for (let z = -24; z < 78; z += 1.2) sl.push({ x: 0, y: S.h(0, z) + 0.03, z, sx: 1.7, sy: 0.1, sz: 0.25 })
    S.add(instances(G('box', () => new THREE.BoxGeometry(1, 1, 1)), M('#5a4632'), sl))
    for (let i = 0; i < 3; i++) {
      S.walk(P.cart(), [[0, -22], [0, 74]], 1.1, { offset: i * 32 })
      S.walk(person(folk('miner', R)), [[0, -22], [0, 74]], 1.1, { offset: i * 32 - 1.5, mode: 'carry' })
    }
    for (let i = 0; i < 8; i++) for (const y2 of [0]) S.put(box(1.3, 6.4, 1.3, '#9a4a34'), 12 + (i % 4) * 5, 4 + Math.floor(i / 4) * 8, 0, y2)
    S.put(box(18, 0.4, 11, '#6e5236'), 19.5, 8, 0, 6.4)
    for (let i = 0; i < 4; i++) S.put(cone(rr(R, 2, 3.4), rr(R, 1.6, 2.6), '#1a1918', 0, 0, 0, 7), -10 - i * 4, 10 + (i % 2) * 6)
    people(S, R, { n: 10, kind: 'miner', at: [-10, 14], r: [8, 7], mode: (i) => (i % 2 ? 'hoe' : 'stand'), opt: { tool: 'hoe' } })
    people(S, R, { n: 1, kind: 'police', at: [8, 20], r: [0.2, 0.2], face: [-8, 14], mode: 'wave', opt: { top: '#d8d2c0', bottom: '#d8d2c0', hat: 'cap', hatColor: '#d8d2c0' } })
    S.put(group(cyl(0.6, 0.8, 11, '#8a4a36', 0, 0, 0, 8)), 28, -12)
    S.smoke(28, S.h(28, -12) + 11, -12, { size: 2, color: '#2a2826' })
    houseCluster(S, R, 'thatch', [[-22, 40, 0.3]])
  }
  if (coast) {
    for (let i = 0; i < 7; i++) S.put(P.pithut(rr(R, 0.8, 1.1)), -22 + (i % 4) * 13 + rr(R, -2, 2), -6 + Math.floor(i / 4) * 12, R() * 6)
    people(S, R, { n: 14, kind: 'refugee', at: [0, 6], r: [16, 8], mode: 'sit', opt: { tool: null } })
    people(S, R, { n: 4, kind: 'refugee', at: [4, 2], r: [10, 6], opt: { tool: null } })
    for (let i = 0; i < 14; i++) S.put(P.grave(), 22 + (i % 5) * 2.6, -12 + Math.floor(i / 5) * 3.2, 0.3)
    people(S, R, { n: 2, kind: 'refugee', at: [26, -6], r: [2, 1], face: [27, -10], mode: 'pray', opt: { tool: null } })
    S.put(P.sabani(null), -20, 62, 0.8, 0.3)
    S.smoke(-4, S.h(-4, 10) + 0.5, 10, { size: 0.7, n: 8, color: '#8a8a86', rise: 1.6, life: 5 })
    S.fire(-4, S.h(-4, 10), 10, 0.5)
  }
  if (X('settlers')) {
    S.add(plants('stump', Array.from({ length: 46 }, () => {
      const a = R() * 6.28
      const d = rr(R, 6, 38)
      return { x: Math.cos(a) * d, y: S.h(Math.cos(a) * d, Math.sin(a) * d), z: Math.sin(a) * d, s: rr(R, 0.7, 1.3), ry: a }
    })))
    people(S, R, { n: 14, kind: 'prewar', at: [0, 0], r: [26, 22], mode: 'hoe', opt: { robe: false, tool: 'hoe', hat: 'kasa' } })
    S.fire(-16, S.h(-16, -10), -10, 2.2, true)
    S.smoke(-16, S.h(-16, -10) + 4, -10, { size: 3, n: 14, color: '#6a6660' })
    S.put(P.thatch(6, 5), 16, -18, 0.3)
    S.put(group(box(0.2, 2.6, 0.2, '#8a6a44', -2.5, 0, -2), box(0.2, 2.6, 0.2, '#8a6a44', 2.5, 0, -2), box(0.2, 2.6, 0.2, '#8a6a44', -2.5, 0, 2), box(0.2, 2.6, 0.2, '#8a6a44', 2.5, 0, 2), box(5.4, 0.2, 0.2, '#8a6a44', 0, 2.6, -2), box(5.4, 0.2, 0.2, '#8a6a44', 0, 2.6, 2)), 24, 4, 0.2)
    walkers(S, R, { n: 6, kind: 'prewar', path: [[16, -14], [22, 6], [0, 20], [16, -14]], mode: 'carry', opt: { robe: true, tool: 'sack' } })
    const crops = {}
    paddy(S, R, -14, 22, 16, 11, 'soil', 'potato', crops)
    flush(S, crops)
  }
  if (X('kuina')) {
    for (let i = 0; i < 6; i++) {
      const a = [rr(R, -5, 5), rr(R, -3, 6)]
      const b = [rr(R, -6, 6), rr(R, -4, 6)]
      S.walk(kuina(), [a, b, [a[0] + 2, a[1] - 2], a], rr(R, 0.9, 1.6), { offset: i * 3 })
    }
    const y = S.h(14, -30)
    const fall = plane(3, 16, flatMat('#eaf6fa', { transparent: true, opacity: 0.8 }))
    fall.position.set(14, y + 6, -34)
    S.add(fall, box(16, 18, 6, '#6a6a60', 14, y - 3, -38))
    S.smoke(14, y - 1, -32, { size: 1.6, n: 10, color: '#eaf6fa', rise: 0.6, life: 3, opacity: 0.5 })
    S.shot(c(5, 0.6, 7), c(2.5, 0.55, 4.5), [0, S.h(0, 0) + 0.4, 0], null, 7)
  }
  S.shot(c(34, 12, 46), c(20, 7, 30), [0, S.h(0, 0) + 2, 0], null, 8)
  S.shot(c(-9, 1.9, 15), c(-3, 1.9, 10), [2, S.h(0, 0) + 1.5, 0], null, 7)
  S.shot([-50, S.h(0, 0) + 50, -30], [-30, S.h(0, 0) + 40, -10], [10, S.h(0, 0), 16], null, 7)
}

// ── 軽便鉄道 ──
export function rail(S, o, R) {
  S.env(o.env ?? 'day')
  S.ground((x, z) => 2 + fbm(x * 0.03, z * 0.03) * 0.3 + sm(100, 260, -z + fbm(x * 0.01, z * 0.01) * 60) * 30, { paint: (x, z) => (Math.abs(z) < 2.4 ? '#9a9488' : null) })
  const c = camOf(S)
  const y = S.h(0, 0)
  for (const dz of [-0.55, 0.55]) S.add(box(700, 0.14, 0.12, '#3a3632', 0, y + 0.12, dz))
  const sl = []
  for (let x = -350; x < 350; x += 1.3) sl.push({ x, y: y + 0.06, z: 0, sx: 0.25, sy: 0.12, sz: 1.9 })
  S.add(instances(G('box', () => new THREE.BoxGeometry(1, 1, 1)), M('#5a4632'), sl))
  const cane = []
  for (let x = -170; x < 170; x += 2.1)
    for (let z = -70; z < 70; z += 2.1) {
      if (Math.abs(z) < 6 || (Math.abs(x) < 34 && z < -5 && z > -44)) continue
      cane.push({ x: x + rr(R, -0.4, 0.4), y: S.h(x, z), z: z + rr(R, -0.4, 0.4), s: rr(R, 0.8, 1.2), ry: R() * 6 })
    }
  S.add(plants('cane', cane))
  const train = group(P.loco())
  for (let i = 0; i < 3; i++) {
    const cc = P.coach()
    cc.position.z = -8.6 - i * 7.6
    train.add(cc)
  }
  S.walk(train, [[-330, 0], [330, 0]], 9, { dy: 0.2 })
  const smk = S.smoke(0, y + 4.2, 0, { size: 1.6, n: 18, color: '#e8e6e0', rise: 1.6, wind: [-7, 0.5], life: 5, opacity: 0.7 })
  S.tick(() => smk.position.set(train.position.x + 2, 0, 0))
  S.add(box(34, 0.9, 5, '#a8a294', 0, y - 0.1, -6))
  S.put(P.redtile(10, 4), 0, -12)
  people(S, R, { n: 14, kind: 'prewar', at: [0, -6], r: [14, 1.6], face: [0, 30], mode: (i) => (i % 2 ? 'wave' : 'stand') })
  houseCluster(S, R, 'tile', [[-22, -30, 0], [0, -34, 0], [22, -30, 0]])
  people(S, R, { n: 8, kind: 'farmer', at: [40, 14], r: [20, 5], mode: 'hoe', opt: { tool: 'hoe' } })
  wood(S, R, 'broad', 90, [-380, -380, 380, -80])
  wood(S, R, 'palm', 8, [-30, -44, 30, -10], (x, z) => Math.abs(x) > 16)
  birds(S, R, 4, 0, 0, 22)
  S.shot(c(44, 1.6, 7.5), c(32, 1.9, 6.5), [-30, y + 2.6, 0], null, 8)
  S.shot([-70, 34, 56], [-36, 26, 48], [20, 2, 0], null, 8)
  S.shot(c(-12, 2.2, -15), c(0, 2.2, -14), [12, y + 2, -2], null, 7)
}

// ── 空襲 ──
export function airraid(S, o, R) {
  S.env('war')
  S.ground((x, z) => (z < 1 ? 2.3 + fbm(x * 0.04, z * 0.04) * 0.3 + sm(120, 260, -z) * 22 : Math.max(-9, -3 - z * 0.06)), { paint: (x, z, h) => (z > -12 && z < 1.5 ? '#bdb7a6' : h > 1 && (Math.abs(x % 40) < 2.5 || Math.abs((z + 20) % 34) < 2.5) ? '#a8a08e' : null), seg: 200 })
  S.sea({ color: '#3a6f7a' })
  S.add(box(300, 3.6, 3, '#a39d8c', 0, -1.2, 1.2))
  const c = camOf(S)
  const spots = []
  for (let r = 0; r < 5; r++) for (let i = 0; i < 9; i++) if ((r * 9 + i) % 7 !== 3) spots.push([-78 + i * 20 + (r % 2) * 8, -24 - r * 19, 0])
  houseCluster(S, R, 'tile', spots)
  for (const [x, z] of [[-30, -60], [40, -40], [10, -96]]) S.put(P.concrete(14, 12, 10), x, z)
  for (const [x, z, s] of [[-40, -30, 4], [22, -52, 5], [60, -26, 3.4], [-70, -70, 4.4], [0, -80, 5.5], [84, -78, 4], [-14, -44, 3]]) {
    S.fire(x, S.h(x, z) + 2.5, z, s, s > 4.3)
    S.smoke(x, S.h(x, z) + 8, z, { size: s * 1.7, n: 16, rise: 7, life: 9, color: '#2a2622' })
  }
  S.explosions([0, -60, 90, 50], { size: 8, every: 1.0 })
  for (let i = 0; i < 7; i++) {
    const z0 = -140 + i * 34
    S.walk(P.propPlane(), [[-460, z0 + 50], [0, z0], [460, z0 - 60]], 62, { offset: i * 150, fly: (x) => 34 + Math.abs(x) * 0.16 + i * 3 })
  }
  const s1 = S.float(P.steamer(), -60, 34, Math.PI / 2)
  S.fire(-60, 7, 34, 4, false)
  S.smoke(-60, 10, 34, { size: 6, n: 14, rise: 6, color: '#1e1c1a' })
  funnelSmoke(S, s1)
  S.float(P.steamer('#3a3d42'), 70, 60, Math.PI / 2 + 0.2)
  for (let i = 0; i < 26; i++) {
    const x = rr(R, -80, 80)
    walkers(S, R, { n: 1, kind: 'prewar', path: [[x, -8], [x + rr(R, -20, 20), -110]], mode: 'run', speed: 3.6, spread: 0 })
  }
  S.shot([110, 66, 70], [72, 54, 46], [0, 6, -50], null, 8)
  S.shot(c(-8, 2, -14), c(-2, 2.2, -24), [14, 9, -64], null, 7)
  S.shot([-56, 9, 80], [-30, 7, 66], [0, 12, -34], null, 7)
}

// ── 戦場 ──
export function battle(S, o, R) {
  S.env(o.env ?? 'war')
  S.ground((x, z) => 3 + 26 * Math.exp(-(((z + 44) / 30) ** 2)) + fbm(x * 0.06, z * 0.06) * 2.6 - fbm(x * 0.2, z * 0.2) * 1.2 + (o.peak ? bump(x, z, -70, -150, 30, 95) : 0), {
    paint: (x, z, h) => (fbm(x * 0.09, z * 0.09) > 0.42 ? '#6b5a44' : fbm(x * 0.3, 7 + z * 0.3) > 0.5 ? '#7a6a52' : '#6f7a48'),
    seg: 200,
  })
  const c = camOf(S)
  wood(S, R, 'dead', 90, [-200, -140, 200, 110])
  S.add(plants('rock', Array.from({ length: 60 }, () => {
    const x = rr(R, -140, 140)
    const z = rr(R, -90, 90)
    return { x, y: S.h(x, z), z, s: rr(R, 0.6, 1.8), ry: R() * 6 }
  })))
  for (let i = 0; i < 4; i++) S.walk(P.tank(), [[-54 + i * 36, 96], [-54 + i * 36, 4]], 1.4, { offset: i * 25 })
  const burnt = S.put(P.tank('#2a2824'), 14, -6, 2.3)
  S.fire(burnt.position.x, burnt.position.y + 1.5, -6, 2.4, true)
  S.smoke(14, burnt.position.y + 5, -6, { size: 3.6, n: 14, color: '#1e1c1a' })
  walkers(S, R, { n: 34, kind: 'marine', path: [[0, 100], [0, 8]], spread: 50, mode: 'march', speed: 0.9 })
  people(S, R, { n: 10, kind: 'marine', at: [0, 2], r: [40, 3], face: [0, -44], mode: 'aim' })
  S.explosions([0, -40, 100, 22], { size: 9, every: 0.8, count: 5 })
  for (let i = 0; i < 6; i++) S.smoke(-120 + i * 48, S.h(-120 + i * 48, -44) + 4, -44, { size: 7, n: 12, rise: 6, life: 9, color: '#3a342e' })
  for (let i = 0; i < 3; i++) S.fire(-60 + i * 55, S.h(-60 + i * 55, -30) + 0.5, -30, 2.6, i === 1)
  if (o.rain) S.rain()
  if (o.peak) for (let i = 0; i < 3; i++) S.walk(P.propPlane(), [[-420, -200 + i * 60], [420, -120 + i * 60]], 60, { offset: i * 280, fly: () => 110 + i * 10 })
  S.shot(c(-12, 2.6, 92), c(-5, 2.3, 76), [0, 18, -44], null, 8)
  S.shot(c(78, 12, 22), c(54, 9, 12), [-10, 10, -32], null, 8)
  S.shot(c(24, 5, -38), c(12, 4, -34), [-10, 3, 44], null, 7)
}

// ── 街 ──
const CARS = ['#c94a3a', '#e8e4d8', '#3f6fb5', '#2a2a2e', '#d9a441', '#58b368', '#b8c4c9']
const PASTEL = ['#8fc4c0', '#e8c8a0', '#d88a8a', '#f2ead8', '#9ab0d8']
export function city(S, o, R) {
  const v = o.v
  S.env(o.env ?? 'day', v === 'koza' ? { exp: 1.35 } : {})
  const runway = v === 'futenma'
  S.ground((x, z) => 1.5 + sm(170, 320, Math.hypot(x, z)) * 16, {
    seg: 200,
    paint: (x, z) => {
      if (Math.abs(z) < 7) return '#484a4e'
      if (Math.abs(z) < 10.5) return '#b8b4a8'
      if (runway && z < -44 && z > -96) return Math.abs(z + 70) < 1 && Math.floor(x / 14) % 2 ? '#e8e8e4' : '#5a5c60'
      if (o.yard && Math.abs(x) < 34 && z < -12 && z > -32) return '#d8cba8'
      if (Math.hypot(x, z) < 190) return fbm(x * 0.05, z * 0.05) > 0.55 ? '#8f9a78' : '#9a968a'
      return null
    },
  })
  const c = camOf(S)
  const y = S.h(0, 0)
  for (let x = -190; x < 190; x += 9) S.add(box(4, 0.03, 0.25, '#e8e6dc', x, y + 0.01, 0))
  const night = o.env === 'night'
  // 建物
  const low = o.low
  const signs = ['BAR', 'CLUB', 'A SIGN', 'HOTEL', 'PAWN', 'TAILOR', 'RESTAURANT']
  for (const side of [-1, 1])
    for (let i = 0; i < 18; i++) {
      const x = -170 + i * 20 + rr(R, -2, 2)
      if (side < 0 && o.center && Math.abs(x) < o.center) continue
      if (side > 0 && Math.abs(x) < (o.open ?? 44)) continue
      if (runway && side < 0) continue
      const hh = low ? rr(R, 3.4, 6) : rr(R, 6, 20)
      const b = low && R() < 0.5 ? P.redtile(9, 7) : P.concrete(rr(R, 11, 16), hh, 11, pick(R, ['#d9d4c6', '#c9c0ae', '#e6e0d4', '#b8c4c9', '#d8c9b8']))
      S.put(b, x, side * 18, side < 0 ? 0 : Math.PI)
      if (night && side < 0) {
        const sg = P.sign(pick(R, signs), 6, 1.5, pick(R, ['#e8336a', '#33b8e8', '#f2c230', '#58d868']), '#fff', true)
        sg.position.set(x, y + 4.6, -12.3)
        S.add(sg)
      }
    }
  if (!night) S.add(plants('palm', Array.from({ length: 22 }, (_, i) => ({ x: -160 + i * 15, y, z: i % 2 ? 9 : -9, s: 1, ry: i }))))
  // 車。米国統治下は右側通行
  const right = o.side === 'right'
  const nCars = o.cars ?? 8
  for (let i = 0; i < nCars; i++) {
    const dir = i % 2 ? 1 : -1
    const z = (right ? dir : -dir) * 3.5
    const m = o.buses && i % 5 === 0 ? P.bus(pick(R, ['#3f8f6a', '#d9a441', '#3f6fb5'])) : right && i % 4 === 1 ? P.jeep() : P.car(pick(R, right ? PASTEL : CARS))
    S.walk(m, dir > 0 ? [[-190, z], [190, z]] : [[190, z], [-190, z]], rr(R, 7, 10), { offset: i * 47 })
  }
  if (!v || v === 'walk') walkers(S, R, { n: 16, kind: 'modern', path: [[-120, 9], [120, 9]], spread: 0.8 })
  if (v === 'usa52') {
    S.put(P.govBuilding(), 0, -34)
    S.put(P.flagpole('usa', 12, 3.6), -9, -18)
    S.put(P.flagpole('ryukyu', 10, 3), 9, -18)
    people(S, R, { n: 5, kind: 'mp', at: [0, -16], r: [8, 1.5], face: [0, 20] })
    walkers(S, R, { n: 18, kind: 'prewar', path: [[-120, 9], [120, 9]], spread: 0.8 })
    walkers(S, R, { n: 10, kind: 'prewar', path: [[120, -9], [-120, -9]], spread: 0.8 })
    const sg = P.sign('RYUKYUS', 12, 2, '#e8e2d0', '#22303c')
    sg.position.set(0, y + 15, -25.8)
    S.add(sg)
  }
  if (v === 'school') {
    S.put(P.concrete(50, 7.6, 9, '#d8cfb8', false), 0, -40)
    S.put(P.flagpole('usa', 8, 2.4), -20, -30)
    people(S, R, { n: 34, kind: 'prewar', at: [0, -22], r: [26, 6], face: [8, -50], opt: { tool: null } })
    people(S, R, { n: 6, kind: 'fireman', at: [14, -30], r: [5, 2], face: [14, -50], mode: 'aim' })
    people(S, R, { n: 4, kind: 'mp', at: [-18, -30], r: [4, 2], face: [0, -22] })
    for (const [x, z, s] of [[12, -52, 7], [26, -60, 5], [-2, -58, 4.5]]) {
      S.smoke(x, y + 8, z, { size: s, n: 16, rise: 7, life: 9, color: '#2a2622' })
      S.fire(x, y + 2, z, s * 0.5, s > 6)
    }
    S.put(P.truck('#c8102e', '#c8102e'), 30, -24, -1.2)
    for (let i = 0; i < 3; i++) S.walk(P.jet(), [[-520, -200 - i * 26], [520, -160 - i * 26]], 90, { offset: i * 40, fly: () => 150 + i * 6 })
  }
  if (v === 'koza') {
    for (let i = 0; i < 7; i++) {
      const x = -44 + i * 15 + rr(R, -3, 3)
      const z = rr(R, -4.5, 4.5)
      const m = P.car(pick(R, PASTEL))
      S.put(m, x, z, R() * 6, i % 3 === 0 ? 0.9 : 0)
      if (i % 3 === 0) m.rotation.z = Math.PI / 2
      S.fire(x, y + 0.8, z, rr(R, 1.6, 2.6), i % 2 === 0 && i < 6)
      S.smoke(x, y + 4, z, { size: 2.6, n: 10, color: '#1e1c1a' })
    }
    people(S, R, { n: 46, kind: 'modern', at: [0, 2], r: [56, 7], mode: (i) => (i % 3 === 0 ? 'cheer' : i % 3 === 1 ? 'wave' : 'stand') })
    walkers(S, R, { n: 12, kind: 'modern', path: [[-80, 8.6], [80, 8.6]], mode: 'run', speed: 3.4, spread: 0.8 })
    rows(S, R, { nx: 9, nz: 2, kind: 'mp', at: [78, 0], ry: -Math.PI / 2, gap: [1.4, 1.6] })
    S.put(P.jeep(), 86, 3, -Math.PI / 2)
    for (let x = -150; x <= 150; x += 60) {
      S.add(cyl(0.1, 0.14, 8, '#555', x, y, -8.4, 6))
      const l = new THREE.PointLight('#ffd9a0', 45, 46)
      l.position.set(x, y + 8, -7.4)
      if (Math.abs(x) < 100) S.add(l)
    }
  }
  if (v === 'reversion') {
    S.put(P.govBuilding(), 0, -34)
    S.put(P.flagpole('hinomaru', 13, 4), 0, -17)
    const sg = P.sign('祝 沖縄復帰', 22, 3, '#f4f4f0', '#c8102e')
    sg.position.set(0, y + 15, -25.8)
    S.add(sg)
    people(S, R, { n: 44, kind: (i) => (i % 5 === 0 ? 'flag' : 'rain'), at: [0, -13], r: [26, 2.4], face: [0, -34], mode: (i) => (i % 5 === 0 ? 'wave' : 'stand') })
    people(S, R, { n: 16, kind: 'rain', at: [50, 9.4], r: [14, 0.8], face: [50, 0] })
    for (let i = 0; i < 5; i++) S.put(P.banner('#c8102e', 5), 40 + i * 5, 10.2)
    S.rain(1800)
  }
  if (v === '730') {
    for (const x of [-40, 20, 80]) {
      const sg = P.sign('730', 4.4, 2, '#1f4e9a', '#fff')
      sg.position.set(x, y + 6, -8)
      S.add(sg, cyl(0.1, 0.12, 6, '#888', x, y, -8, 6))
    }
    for (const [x, z] of [[0, 0], [-60, 0], [60, 0]]) people(S, R, { n: 1, kind: 'police', at: [x, z], r: [0.1, 0.1], face: [x + 30, z], mode: 'wave', opt: { hatColor: '#f4f4f0' } })
    people(S, R, { n: 30, kind: 'modern', at: [0, 9.2], r: [70, 0.8], face: [0, 0] })
    people(S, R, { n: 20, kind: 'modern', at: [0, -9.2], r: [70, 0.8], face: [0, 0] })
  }
  if (runway) {
    S.put(P.fence(360), 0, -36)
    for (let i = 0; i < 4; i++) S.put(P.hangar(32, 40), -120 + i * 80, -130)
    S.put(P.osprey(), -30, -70, 1.6)
    S.put(P.heli(), 40, -56, 1.2)
    S.put(P.heli(), 80, -58, 1.9)
    const fo = P.osprey()
    S.walk(fo, [[-320, -70], [0, -70], [320, -40], [200, 80], [-200, 60], [-320, -70]], 26, { fly: (x, z) => y + 22 + Math.sin(x * 0.01) * 8 })
    const spots = []
    for (let r = 0; r < 3; r++) for (let i = 0; i < 16; i++) if (Math.abs(-150 + i * 20) > 46 || r > 0) spots.push([-150 + i * 20 + (r % 2) * 8, 40 + r * 18])
    spots.forEach(([x, z]) => S.put(R() < 0.5 ? P.concrete(9, rr(R, 3.4, 7), 8, pick(R, ['#e6e0d4', '#d9d4c6', '#c9c0ae'])) : P.redtile(8, 6), x, z, Math.PI))
    people(S, R, { n: 60, kind: 'modern', at: [0, 20], r: [28, 7], face: [0, -36], mode: (i) => (i % 2 ? 'cheer' : 'stand') })
    for (let i = 0; i < 6; i++) S.put(P.banner(pick(R, ['#f2c14e', '#c8102e', '#f4f4f0']), 5), -20 + i * 8, 13)
    const sg = P.sign('県民大会', 14, 2.6, '#f4f4f0', '#1f3f8f')
    sg.position.set(0, y + 4.5, 12.6)
    S.add(sg)
  }
  birds(S, R, 3, 0, 0, 40)
  S.shot(c(-44, 3.2, 12.5), c(-22, 3.6, 11), [22, y + 5, -12], null, 8)
  S.shot([70, 44, 78], [36, 34, 60], [0, y + 3, -20], null, 8)
  S.shot(c(8, 1.7, runway ? 24 : -2), c(18, 1.8, runway ? 22 : -2.4), runway ? [0, y + 8, -60] : [70, y + 3, v === 'reversion' || v === 'usa52' ? -20 : 0], null, 7)
}

// ── リゾート・博覧会・橋 ──
export function resort(S, o, R) {
  const v = o.v
  S.env(o.env ?? 'day')
  const c = camOf(S)
  if (v === 'bridge') {
    S.ground((x, z) => Math.max(-9, bump(x, z, -130, 150, 110, 14) + bump(x, z, 330, -400, 150, 22) - 1.4 - fbm(x * 0.02, z * 0.02) * 3.2), { paint: (x, z, h) => (h > 0.12 && h < 1.6 ? '#f2ead0' : null) })
    S.sea({ color: '#22b5c4', opacity: 0.72 })
    const A = [-70, 80]
    const B = [270, -330]
    const len = Math.hypot(B[0] - A[0], B[1] - A[1])
    const hAt = (s) => 7 + 24 * Math.exp(-(((s - 0.42) / 0.13) ** 2))
    const ry = Math.atan2(B[0] - A[0], B[1] - A[1])
    const n = 46
    for (let i = 0; i < n; i++) {
      const s0 = i / n
      const s1 = (i + 1) / n
      const s = (s0 + s1) / 2
      const x = A[0] + (B[0] - A[0]) * s
      const z = A[1] + (B[1] - A[1]) * s
      const seg = box(9, 1.1, len / n + 0.3, '#e8e6e0', 0, 0, 0)
      seg.position.set(x, hAt(s), z)
      seg.rotation.order = 'YXZ'
      seg.rotation.y = ry
      seg.rotation.x = -Math.atan2(hAt(s1) - hAt(s0), len / n)
      S.add(seg)
      if (i % 3 === 0) S.add(cyl(1.4, 1.8, hAt(s) + 9, '#d8d6d0', x, -9, z, 8))
    }
    for (let i = 0; i < 8; i++) {
      const m = P.car(pick(R, CARS))
      const dir = i % 2 ? 1 : -1
      S.add(m)
      S.tick((t) => {
        const s = (((t * 0.022 * dir + i / 8) % 1) + 1) % 1
        const off = dir * 2
        m.position.set(A[0] + (B[0] - A[0]) * s + Math.cos(ry) * off, hAt(s) + 0.55, A[1] + (B[1] - A[1]) * s - Math.sin(ry) * off)
        m.rotation.y = ry + (dir > 0 ? 0 : Math.PI)
      })
    }
    for (let i = 0; i < 3; i++) S.walk(P.fishing(), [[-200 + i * 150, -100 + i * 60], [200 + i * 60, 60 + i * 30], [-200 + i * 150, -100 + i * 60]], 4, { sea: true })
    wood(S, R, 'palm', 30, [-240, 60, -40, 260])
    wood(S, R, 'bush', 70, [-240, 60, -20, 260])
    wood(S, R, 'broad', 60, [200, -390, 390, -290])
    S.put(P.car('#e8e4d8'), -96, 116, 0.6)
    people(S, R, { n: 6, kind: 'modern', at: [-90, 108], r: [4, 3], face: [100, -100], mode: (i) => (i % 2 ? 'wave' : 'stand') })
    birds(S, R, 6, 0, 0, 40)
    S.shot([-150, 44, 170], [-104, 32, 132], [120, 12, -150], null, 9)
    S.shot(c(-98, 2.6, 122), c(-92, 2.4, 114), [60, 18, -60], null, 7)
    S.shot([230, 130, 70], [180, 104, 40], [80, 6, -110], null, 8)
    return
  }
  S.ground((x, z) => Math.max(-9, Math.min((22 - z) * 0.06, 3 + fbm(x * 0.03, z * 0.03) * 0.5 + sm(110, 260, -z) * 24)), {
    paint: (x, z, h) => (h > 0.12 && h < 2 && z > 0 ? '#efe6c4' : z < -2 && z > -44 && Math.abs(x) < 120 ? '#d8d4c8' : Math.abs(z + 52) < 5 ? '#55575b' : null),
  })
  S.sea({ color: '#1fb0c4' })
  wood(S, R, 'palm', 40, [-170, -44, 170, -2], (x) => Math.abs(x) > 14)
  wood(S, R, 'broad', 110, [-380, -380, 380, -70])
  birds(S, R, 6, 0, 40, 26)
  const y = S.h(0, -20)
  if (v === 'expo') {
    const aq = group(box(72, 9, 72, '#f2f2ee', 0, 12, 0), box(40, 7, 40, '#e8e6e0', 0, 21, 0), box(74, 1.2, 74, '#c8102e', 0, 16.5, 0), cyl(9, 9, 0.6, '#58b368', 20, 28, -8, 16), box(8, 12, 8, '#f2f2ee', -16, 28, 10))
    for (const [x, z] of [[-26, -26], [26, -26], [-26, 26], [26, 26]]) aq.add(cyl(6, 6, 16, '#d8d8d4', x, -4, z, 12))
    aq.position.set(0, 0, 170)
    S.add(aq, box(5, 0.8, 124, '#d8d8d4', 0, 9, 74))
    for (let z = 20; z < 130; z += 18) S.add(cyl(0.8, 0.8, 14, '#c8c8c4', 0, -5, z, 8))
    for (let i = 0; i < 14; i++) S.put(P.banner(pick(R, ['#c8102e', '#f2c14e', '#3f6fb5', '#58b368', '#f4f4f0']), 8), -65 + i * 10, -6)
    S.put(P.flagpole('hinomaru', 14, 4), 0, -12)
    for (const [x, col] of [[-70, '#f2f2ee'], [60, '#e8d8c0']]) {
      const d = sph(13, col, x, y, -34)
      d.scale.set(13, 9, 13)
      S.add(d)
    }
    S.put(P.concrete(30, 8, 12, '#e6e0d4', false), -10, -36)
    people(S, R, { n: 50, kind: 'modern', at: [0, -16], r: [56, 9], mode: (i) => (i % 6 === 0 ? 'wave' : 'stand') })
    walkers(S, R, { n: 20, kind: 'modern', path: [[-90, -8], [90, -8]], spread: 3 })
    walkers(S, R, { n: 10, kind: 'modern', path: [[0, -6], [0, 20], [0, 130]], spread: 1 }).forEach((p) => S.tick(() => p.position.z > 18 && (p.position.y = 9.4)))
    for (let i = 0; i < 3; i++) S.walk(P.fishing(), [[-200, 60 + i * 30], [200, 80 + i * 30]], 3, { sea: true, offset: i * 120 })
    S.shot([70, 30, -50], [44, 20, -36], [0, 16, 150], null, 8)
    S.shot(c(-16, 2, -9), c(-6, 2.2, -12), [10, y + 6, 60], null, 7)
    S.shot([-160, 70, 230], [-120, 54, 210], [0, 14, 110], null, 8)
  }
  if (v === 'summit') {
    S.put(P.longHall(64, '#e8e2d4', '#b5492e'), 0, -24)
    for (const x of [-44, 44]) S.put(P.redtile(18, 12, '#e8e2d4'), x, -20)
    const flags = ['hinomaru', 'usa', '#1f3f8f', '#c8102e', '#f4f4f0', '#58b368', '#f2c14e', '#15151a']
    flags.forEach((f, i) => S.put(f[0] === '#' ? P.banner(f, 10) : P.flagpole(f, 11, 3), -31.5 + i * 9, -8))
    const road = [[-200, -52], [200, -52]]
    for (let i = 0; i < 7; i++) S.walk(i === 0 || i === 6 ? P.car('#f4f4f0') : P.car('#15151a'), road, 6, { offset: i * 8 })
    rows(S, R, { nx: 12, nz: 1, kind: 'police', at: [0, -45], ry: Math.PI, gap: [8, 1] })
    people(S, R, { n: 10, kind: 'modern', at: [0, -13], r: [9, 2], face: [0, 30], opt: { top: '#22303c', bottom: '#22303c', hat: null, scale: 1 } })
    people(S, R, { n: 20, kind: 'modern', at: [70, -40], r: [16, 3], face: [0, -52], mode: 'wave' })
    const hh = P.heli()
    S.walk(hh, [[-300, 40], [300, 80], [-300, 40]], 22, { fly: () => 60 })
    // 遠くを走るモノレール
    S.add(box(700, 1.2, 1.6, '#c8c6c0', 0, y + 14, -110))
    for (let x = -340; x <= 340; x += 34) S.add(cyl(0.9, 1, 14, '#c8c6c0', x, y, -110, 8))
    const mono = group(P.monocar())
    const m2 = P.monocar()
    m2.position.z = -14.6
    mono.add(m2)
    S.walk(mono, [[-340, -110], [340, -110]], 12, { fly: () => y + 14.8 })
    for (let i = 0; i < 12; i++) S.put(P.concrete(rr(R, 12, 18), rr(R, 8, 24), 12, pick(R, ['#d9d4c6', '#e6e0d4', '#b8c4c9'])), -170 + i * 30, -134)
    S.shot([60, 22, 40], [36, 15, 26], [0, y + 6, -24], null, 8)
    S.shot(c(-14, 2, -3), c(-4, 2.2, -5), [10, y + 6, -10], null, 7)
    S.shot([-120, 50, -20], [-90, 40, -30], [20, y + 10, -90], null, 8)
  }
}

// ── 埋め立て ──
export function reclaim(S, o, R) {
  S.env(o.env ?? 'day')
  S.ground((x, z) => Math.max(-9, Math.min((-54 - z) * 0.1, 5 + fbm(x * 0.03, z * 0.03) * 3 + sm(120, 260, -z) * 26) - (z > -50 ? fbm(x * 0.02, z * 0.02) * 2.4 : 0)), { paint: (x, z, h) => (h > 0.12 && h < 1.6 ? '#f2ead0' : null) })
  S.sea({ color: '#22aabb', opacity: 0.74 })
  const c = camOf(S)
  const wall = '#b8b4a8'
  S.add(box(150, 7, 6, wall, -10, -3.5, 64), box(6, 7, 114, wall, 62, -3.5, 10), box(6, 7, 114, wall, -82, -3.5, 10), box(6, 7, 114, wall, -12, -3.5, 10))
  S.add(box(66, 6, 108, '#8a6a48', -47, -3.2, 10), box(70, 2, 108, '#2f7f8f', 25, -1.4, 10, { roughness: 0.3 }))
  S.add(cone(9, 5, '#8a6a48', -40, 2.6, 20, 9), cone(7, 4, '#7a5a3c', -60, 2.6, -10, 9))
  for (let i = 0; i < 4; i++) S.walk(P.truck('#e0a82e', '#8a6a48'), [[-70, -44], [-70, 40], [-24, 40], [-24, -44], [-70, -44]], 3.6, { offset: i * 50, fly: () => 2.8 })
  S.walk(P.bulldozer(), [[-56, 0], [-30, 30], [-56, 0]], 1.2, { fly: () => 2.9 })
  ;[[110, 30, 0.2], [130, 110, 1.2], [-20, 120, 1.7]].forEach(([x, z, r]) => S.float(P.barge(), x, z, r))
  const buoys = []
  for (let i = 0; i < 44; i++) {
    const a = -0.5 + (i / 43) * 4.1
    buoys.push({ x: -10 + Math.cos(a) * 165, y: 0.2, z: 10 + Math.sin(a) * 150, s: 0.9 })
  }
  S.add(instances(G('ico', () => new THREE.IcosahedronGeometry(1, 1)), M('#f07a1e'), buoys.filter((b) => b.z > -40)))
  for (let i = 0; i < 9; i++) {
    const a0 = 0.2 + i * 0.3
    const pts = [0, 1, 2, 3].map((k) => [-10 + Math.cos(a0 + k * 0.12) * 185, 10 + Math.sin(a0 + k * 0.12) * 170])
    const k = P.kayak(pick(R, ['#e85d4a', '#f2c14e', '#4a90d9', '#58b368']))
    const p = person({ ...folk('modern', R), scale: 1 })
    animatePerson(p, 0, 'sit')
    p.position.y = -0.35
    k.add(p)
    S.walk(k, [...pts, ...pts.slice(0, 3).reverse()], 1.3, { sea: true, dy: 0.15 })
    S.tick((t) => {
      p.userData.armL.rotation.x = -1 + Math.sin(t * 3 + i) * 0.6
      p.userData.armR.rotation.x = -1 - Math.sin(t * 3 + i) * 0.6
    })
  }
  for (let i = 0; i < 2; i++) S.walk(P.fishing(), [[150 - i * 40, 150], [60 - i * 40, 190], [150 - i * 40, 150]], 2.4, { sea: true })
  for (let i = 0; i < 6; i++) S.put(P.concrete(rr(R, 16, 26), rr(R, 5, 9), 12, '#c9c4b4', false), -150 + i * 56, -110)
  S.put(P.hangar(30, 36), 60, -150)
  S.put(P.fence(300), 0, -70)
  wood(S, R, 'broad', 120, [-380, -380, 380, -70], (x, z) => z < -170 || Math.abs(x) > 200)
  wood(S, R, 'pine', 20, [-200, -70, 200, -56])
  people(S, R, { n: 8, kind: 'worker', at: [-48, 30], r: [14, 10] })
  birds(S, R, 6, 60, 80, 24)
  S.shot([170, 78, 190], [124, 60, 152], [-10, 0, 14], null, 9)
  S.shot([76, 1.7, 196], [60, 1.9, 182], [0, 5, 60], null, 7)
  S.shot(c(-36, 9, -68), c(-20, 7, -62), [24, 0, 50], null, 7)
}
