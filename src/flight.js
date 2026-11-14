// 飛行カメラの計算。離陸 → 進行方向を向いて巡航 → 目的地へ降下、の順に動かす。

const RAD = Math.PI / 180
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
const lerp = (a, b, t) => a + (b - a) * t
const smooth = (t) => {
  const x = clamp(t, 0, 1)
  return x * x * (3 - 2 * x)
}
const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2
// 角度は近い回り方で補間する
const angLerp = (a, b, t) => a + ((((b - a) % 360) + 540) % 360 - 180) * t

export function distanceKm(a, b) {
  const dLat = (b.lat - a.lat) * RAD
  const dLon = (b.lng - a.lng) * RAD
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * RAD) * Math.cos(b.lat * RAD) * Math.sin(dLon / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(h))
}

export function headingDeg(a, b) {
  const y = Math.sin((b.lng - a.lng) * RAD) * Math.cos(b.lat * RAD)
  const x =
    Math.cos(a.lat * RAD) * Math.sin(b.lat * RAD) -
    Math.sin(a.lat * RAD) * Math.cos(b.lat * RAD) * Math.cos((b.lng - a.lng) * RAD)
  return (Math.atan2(y, x) / RAD + 360) % 360
}

const COMPASS = ['北', '北東', '東', '南東', '南', '南西', '西', '北西']
export const compass = (deg) => COMPASS[Math.round((((deg % 360) + 360) % 360) / 45) % 8]

// 画面中心を見下ろすカメラのおおよその高度（メートル）
export function cameraAltitude(map) {
  const c = map.getCenter()
  const metersPerPixel = (40075016.686 * Math.cos(c.lat * RAD)) / (512 * 2 ** map.getZoom())
  const distance = 1.5 * map.getContainer().clientHeight * metersPerPixel
  return distance * Math.cos(map.getPitch() * RAD)
}

/**
 * 現在のカメラ位置から目的地までの飛行計画を作る。
 * 返り値の at(t) に 0〜1 の進み具合を渡すと、その瞬間のカメラが得られる。
 */
export function planFlight(map, dest) {
  const from = {
    c: map.getCenter(),
    z: map.getZoom(),
    b: map.getBearing(),
    p: map.getPitch(),
  }
  const to = { lng: dest.lon, lat: dest.lat }
  const km = distanceKm(from.c, to)
  const near = km < 1.5
  const heading = near ? dest.b : headingDeg(from.c, to)
  // 遠いほど高く上がる
  const cruiseZoom = Math.min(from.z, dest.z, clamp(13.6 - Math.log2(km / 8 + 1), 8.6, 13.6))
  const duration = near ? 3500 : clamp(5000 + Math.sqrt(km) * 520, 5500, 15000)

  return {
    km,
    duration,
    heading,
    at(t) {
      const k = easeInOutSine(t)
      const base = lerp(from.z, dest.z, k)
      // 早めに上昇し、目的地の手前で降下を終えて最後は低空で近づく
      const climb = smooth(k / 0.25) * (1 - smooth((k - 0.5) / 0.42))
      const bearing =
        t < 0.68
          ? angLerp(from.b, heading, smooth(t / 0.22))
          : angLerp(heading, dest.b, smooth((t - 0.68) / 0.32))
      const pitch =
        t < 0.55
          ? lerp(from.p, near ? dest.pitch : 72, smooth(t / 0.3))
          : lerp(near ? dest.pitch : 72, dest.pitch, smooth((t - 0.55) / 0.45))
      return {
        center: [lerp(from.c.lng, to.lng, k), lerp(from.c.lat, to.lat, k)],
        zoom: base - Math.max(0, base - cruiseZoom) * climb,
        bearing,
        pitch,
        remainingKm: km * (1 - k),
      }
    },
  }
}

// 折れ線の上を frac(0〜1) だけ進んだ位置
export function pointAlong(path, frac) {
  const segs = []
  let total = 0
  for (let i = 1; i < path.length; i++) {
    const d = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1])
    segs.push(d)
    total += d
  }
  let rest = frac * total
  for (let i = 0; i < segs.length; i++) {
    if (rest <= segs[i]) {
      const t = segs[i] ? rest / segs[i] : 0
      return [lerp(path[i][0], path[i + 1][0], t), lerp(path[i][1], path[i + 1][1], t)]
    }
    rest -= segs[i]
  }
  return path[path.length - 1]
}
