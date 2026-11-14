import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useGsiTerrainSource as createGsiTerrainSource } from 'maplibre-gl-gsi-terrain'
import { ERAS, EVENTS, eraOf } from './data/events'
import { cameraAltitude, compass, planFlight, pointAlong } from './flight'
import './App.css'

const GSI = 'https://cyberjapandata.gsi.go.jp/xyz'
const GSI_ATTR =
  '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noreferrer">国土地理院</a>'
const OVERVIEW = { center: [127.3, 26.2], zoom: 6.4, pitch: 35, bearing: 0 }
const LAST = EVENTS.length - 1
const EMPTY = { type: 'FeatureCollection', features: [] }

const terrainSource = createGsiTerrainSource(maplibregl.addProtocol)

const STYLE = {
  version: 8,
  sources: {
    photo: {
      type: 'raster',
      tiles: [`${GSI}/seamlessphoto/{z}/{x}/{y}.jpg`],
      tileSize: 256,
      maxzoom: 18,
      attribution: GSI_ATTR,
    },
    pale: {
      type: 'raster',
      tiles: [`${GSI}/pale/{z}/{x}/{y}.png`],
      tileSize: 256,
      maxzoom: 18,
      attribution: GSI_ATTR,
    },
    terrain: terrainSource,
  },
  layers: [
    { id: 'bg', type: 'background', paint: { 'background-color': '#0a2540' } },
    { id: 'photo', type: 'raster', source: 'photo' },
    { id: 'pale', type: 'raster', source: 'pale', layout: { visibility: 'none' } },
  ],
  terrain: { source: 'terrain', exaggeration: 1.6 },
  sky: {
    'sky-color': '#6fb3e8',
    'horizon-color': '#e6f4ff',
    'fog-color': '#d5e9f7',
    'sky-horizon-blend': 0.6,
    'horizon-fog-blend': 0.7,
    'fog-ground-blend': 0.4,
  },
}

const POINTS = {
  type: 'FeatureCollection',
  features: EVENTS.map((e) => ({
    type: 'Feature',
    properties: { id: e.id, era: e.era },
    geometry: { type: 'Point', coordinates: [e.lon, e.lat] },
  })),
}

const ERA_COLOR = ['match', ['get', 'era'], ...ERAS.flatMap((e) => [e.id, e.color]), '#ffffff']

const line = (coordinates) => ({
  type: 'Feature',
  properties: {},
  geometry: { type: 'LineString', coordinates },
})

// 進行方向を示す矢じりの画像
function chevronImage() {
  const size = 28
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  ctx.lineWidth = 5
  ctx.lineCap = ctx.lineJoin = 'round'
  ctx.strokeStyle = '#fff'
  ctx.beginPath()
  ctx.moveTo(9, 6)
  ctx.lineTo(19, 14)
  ctx.lineTo(9, 22)
  ctx.stroke()
  return ctx.getImageData(0, 0, size, size)
}

const formatAltitude = (m) =>
  m >= 10000 ? `${(m / 1000).toFixed(0)} km` : `${Math.round(m / 10) * 10} m`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
const formatKm = (km) => (km >= 10 ? Math.round(km) : km.toFixed(1))

export default function App() {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const pinRef = useRef(null)
  const labelsRef = useRef([])
  const orbitRef = useRef(0)
  const flightRef = useRef(0)
  const moversRef = useRef(0)
  const prevIdxRef = useRef(-1)
  // 毎フレーム書き換える表示は React を通さず直接更新する
  const yearRef = useRef(null)
  const altRef = useRef(null)
  const hdgRef = useRef(null)
  const posRef = useRef(null)
  const restRef = useRef(null)

  const [ready, setReady] = useState(false)
  const [idx, setIdx] = useState(-1) // -1 = タイトル画面
  const [arrivedIdx, setArrivedIdx] = useState(null)
  const [leg, setLeg] = useState(null) // 今の区間 { from, km, heading }
  const [auto, setAuto] = useState(false)
  const [base, setBase] = useState('photo')
  const [collapsed, setCollapsed] = useState(false)

  const event = idx >= 0 ? EVENTS[idx] : null
  const era = event ? eraOf(event.era) : null
  const flying = event != null && arrivedIdx !== idx
  const eraStarts = useMemo(
    () => Object.fromEntries(ERAS.map((e) => [e.id, EVENTS.findIndex((x) => x.era === e.id)])),
    [],
  )

  const stopOrbit = useCallback(() => {
    cancelAnimationFrame(orbitRef.current)
    orbitRef.current = 0
  }, [])

  const startOrbit = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    stopOrbit()
    let last = performance.now()
    const tick = (t) => {
      const dt = Math.min(t - last, 100)
      last = t
      map.setBearing(map.getBearing() + dt * 0.0035)
      orbitRef.current = requestAnimationFrame(tick)
    }
    orbitRef.current = requestAnimationFrame(tick)
  }, [stopOrbit])

  // 地図の初期化
  useEffect(() => {
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE,
      ...OVERVIEW,
      minZoom: 4,
      maxPitch: 78,
      attributionControl: { compact: true },
    })
    mapRef.current = map
    // スマホでは下半分を解説カードが覆うので、目的地を画面の上寄りに置く
    if (window.innerWidth <= 640) map.setPadding({ bottom: Math.round(window.innerHeight * 0.42) })
    if (import.meta.env.DEV) window.__map = map
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right')

    map.on('load', () => {
      map.addImage('chevron', chevronImage())
      map.addSource('trail', { type: 'geojson', data: EMPTY })
      map.addSource('moves', { type: 'geojson', data: EMPTY })
      map.addSource('movers', { type: 'geojson', data: EMPTY })
      map.addSource('events', { type: 'geojson', data: POINTS })

      // これまでに飛んだ航跡
      map.addLayer({
        id: 'trail',
        type: 'line',
        source: 'trail',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#fff', 'line-width': 2, 'line-opacity': 0.6, 'line-dasharray': [2, 3] },
      })
      // 出来事の中での人や船、軍の動き
      map.addLayer({
        id: 'moves-casing',
        type: 'line',
        source: 'moves',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': 'rgba(20,10,0,0.6)', 'line-width': 9 },
      })
      map.addLayer({
        id: 'moves',
        type: 'line',
        source: 'moves',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#ff5a36', 'line-width': 5 },
      })
      map.addLayer({
        id: 'moves-arrows',
        type: 'symbol',
        source: 'moves',
        layout: {
          'symbol-placement': 'line',
          'symbol-spacing': 60,
          'icon-image': 'chevron',
          'icon-size': 0.6,
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
        },
      })
      map.addLayer({
        id: 'movers',
        type: 'circle',
        source: 'movers',
        paint: {
          'circle-radius': 6,
          'circle-color': '#fff',
          'circle-stroke-color': '#ff5a36',
          'circle-stroke-width': 3,
        },
      })
      map.addLayer({
        id: 'events',
        type: 'circle',
        source: 'events',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 3.5, 12, 7],
          'circle-color': ERA_COLOR,
          'circle-stroke-color': '#fff',
          'circle-stroke-width': 1.5,
          'circle-opacity': 0.9,
          'circle-stroke-opacity': 0.9,
        },
      })

      map.on('click', 'events', (e) => {
        const id = e.features?.[0]?.properties?.id
        if (id != null) setIdx(Number(id))
      })
      map.on('mouseenter', 'events', () => (map.getCanvas().style.cursor = 'pointer'))
      map.on('mouseleave', 'events', () => (map.getCanvas().style.cursor = ''))
      setReady(true)
    })

    // 計器の表示
    map.on('move', () => {
      const c = map.getCenter()
      const b = ((map.getBearing() % 360) + 360) % 360
      if (altRef.current) altRef.current.textContent = formatAltitude(cameraAltitude(map))
      if (hdgRef.current) hdgRef.current.textContent = `${compass(b)} ${Math.round(b)}°`
      if (posRef.current)
        posRef.current.textContent = `北緯${c.lat.toFixed(3)}° 東経${c.lng.toFixed(3)}°`
    })

    // 手で動かしたら旋回を止める
    const halt = () => stopOrbit()
    const canvas = map.getCanvas()
    canvas.addEventListener('pointerdown', halt)
    canvas.addEventListener('wheel', halt, { passive: true })

    return () => {
      stopOrbit()
      cancelAnimationFrame(flightRef.current)
      cancelAnimationFrame(moversRef.current)
      pinRef.current = null
      labelsRef.current = []
      map.remove()
      mapRef.current = null
    }
  }, [stopOrbit])

  // 出来事が変わったら、その場所へ飛ぶ
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    stopOrbit()
    cancelAnimationFrame(flightRef.current)
    cancelAnimationFrame(moversRef.current)
    labelsRef.current.forEach((m) => m.remove())
    labelsRef.current = []

    if (idx < 0) {
      prevIdxRef.current = -1
      pinRef.current?.remove()
      map.getSource('trail').setData(EMPTY)
      map.getSource('moves').setData(EMPTY)
      map.getSource('movers').setData(EMPTY)
      map.flyTo({ ...OVERVIEW, duration: 2500, essential: true })
      return
    }

    const e = EVENTS[idx]
    const prev = prevIdxRef.current >= 0 ? EVENTS[prevIdxRef.current] : null
    prevIdxRef.current = idx

    // 過去の地点は濃く、未来の地点は薄く
    const fade = ['case', ['<=', ['get', 'id'], idx], 0.95, 0.3]
    map.setPaintProperty('events', 'circle-opacity', fade)
    map.setPaintProperty('events', 'circle-stroke-opacity', fade)
    // 航跡は直近の2区間だけ残す
    map.getSource('trail').setData(
      line(EVENTS.slice(Math.max(0, idx - 2), idx + 1).map((x) => [x.lon, x.lat])),
    )

    // 現在地のピン
    if (!pinRef.current) {
      const el = document.createElement('div')
      el.className = 'pin'
      pinRef.current = new maplibregl.Marker({ element: el, anchor: 'bottom' })
    }
    const pin = pinRef.current.getElement()
    pin.textContent = e.place
    pin.style.setProperty('--era', eraOf(e.era).color)
    pinRef.current.setLngLat([e.lon, e.lat]).addTo(map)

    // 人や軍の動きを矢印で描く
    map.getSource('moves').setData({
      type: 'FeatureCollection',
      features: e.moves.map((m) => line(m.path)),
    })
    labelsRef.current = e.moves
      .filter((m) => m.label)
      .map((m) => {
        const el = document.createElement('div')
        el.className = 'move-label'
        el.textContent = m.label
        return new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat(pointAlong(m.path, 0.45))
          .addTo(map)
      })
    if (e.moves.length) {
      const movers = map.getSource('movers')
      const animate = (t) => {
        const features = e.moves.flatMap((m) =>
          [0, 0.5].map((offset) => ({
            type: 'Feature',
            properties: {},
            geometry: { type: 'Point', coordinates: pointAlong(m.path, (t / 2800 + offset) % 1) },
          })),
        )
        movers.setData({ type: 'FeatureCollection', features })
        moversRef.current = requestAnimationFrame(animate)
      }
      moversRef.current = requestAnimationFrame(animate)
    } else {
      map.getSource('movers').setData(EMPTY)
    }

    // 飛行
    const plan = planFlight(map, e)
    setLeg({ from: prev?.place ?? null, km: plan.km, heading: plan.heading })
    const y0 = prev?.year
    const y1 = e.year
    const countYears = y0 != null && y1 != null
    if (yearRef.current && !countYears) yearRef.current.textContent = e.when

    const t0 = performance.now()
    const tick = (now) => {
      const t = Math.max(0, Math.min(1, (now - t0) / plan.duration))
      const cam = plan.at(t)
      map.jumpTo(cam)
      if (restRef.current) restRef.current.textContent = formatKm(cam.remainingKm)
      if (yearRef.current && countYears) {
        yearRef.current.textContent =
          t < 1 ? `${Math.floor(y0 + (y1 - y0) * (1 - cam.remainingKm / (plan.km || 1)))}年` : e.when
      }
      if (t < 1) {
        flightRef.current = requestAnimationFrame(tick)
      } else {
        if (yearRef.current) yearRef.current.textContent = e.when
        setArrivedIdx(idx)
        startOrbit()
      }
    }
    flightRef.current = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(flightRef.current)
  }, [idx, ready, startOrbit, stopOrbit])

  // 自動飛行: 到着して読む時間が過ぎたら次へ
  useEffect(() => {
    if (!auto || idx < 0 || arrivedIdx !== idx) return
    const dwell = 5000 + EVENTS[idx].text.length * 60
    const timer = setTimeout(() => {
      if (idx >= LAST) setAuto(false)
      else setIdx(idx + 1)
    }, dwell)
    return () => clearTimeout(timer)
  }, [auto, idx, arrivedIdx])

  // 背景地図の切り替え
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    map.setLayoutProperty('photo', 'visibility', base === 'photo' ? 'visible' : 'none')
    map.setLayoutProperty('pale', 'visibility', base === 'pale' ? 'visible' : 'none')
  }, [base, ready])

  const go = useCallback((n) => setIdx(Math.max(0, Math.min(LAST, n))), [])

  // キーボード操作
  useEffect(() => {
    const onKey = (e) => {
      if (e.target instanceof HTMLInputElement) return
      if (e.key === 'ArrowRight') setIdx((i) => Math.min(LAST, i + 1))
      else if (e.key === 'ArrowLeft') setIdx((i) => Math.max(0, i - 1))
      else if (e.key === ' ') {
        e.preventDefault()
        setAuto((a) => !a)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const start = (withAuto) => {
    setAuto(withAuto)
    setIdx(0)
  }

  return (
    <div className="app">
      <div ref={containerRef} className="map" />
      <div className={'clouds' + (flying && leg && leg.km > 6 ? ' on' : '')} aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </div>

      {idx < 0 && (
        <div className="intro">
          <div className="intro-box">
            <p className="intro-kicker">琉球・沖縄 千年の空の旅</p>
            <h1>稲と島の時空飛行</h1>
            <p className="intro-lead">
              ひと粒の稲が島に根づいた日から、グスクの時代、琉球王国、沖縄戦、そして現代まで。
              奄美から与那国、大東の島々まで{EVENTS.length}の地点を、鳥の目で年代順にめぐります。
            </p>
            <div className="intro-actions">
              <button className="btn primary" onClick={() => start(true)} disabled={!ready}>
                {ready ? '空の旅をはじめる' : '地図を準備中…'}
              </button>
              <button className="btn" onClick={() => start(false)} disabled={!ready}>
                自分のペースでめぐる
              </button>
            </div>
            <p className="intro-note">
              ← → キーで前後、スペースで自動飛行の切り替え。地図はドラッグで自由に見回せます。
            </p>
          </div>
        </div>
      )}

      {event && (
        <>
          <nav className="eras" aria-label="時代">
            <button
              className="era-chip home"
              onClick={() => {
                setAuto(false)
                setIdx(-1)
              }}
            >
              全体
            </button>
            {ERAS.map((e) => (
              <button
                key={e.id}
                className={'era-chip' + (e.id === event.era ? ' active' : '')}
                style={{ '--era': e.color }}
                onClick={() => go(eraStarts[e.id])}
                title={e.span}
              >
                {e.name}
              </button>
            ))}
          </nav>

          {/* 機内アナウンス: いまどこを飛んでいるか */}
          <div className={'hud' + (flying ? ' flying' : '')} style={{ '--era': era.color }}>
            <div className="hud-year" ref={yearRef}>
              {event.when}
            </div>
            <div className="hud-status">
              {flying ? (
                <>
                  <span className="plane">✈</span>
                  {leg?.from && leg.km >= 1.5 ? `${leg.from} → ` : ''}
                  <b>{event.place}</b>
                  {leg && leg.km >= 1.5 && (
                    <>
                      {' '}
                      ／ {compass(leg.heading)}へ あと <span ref={restRef}>{formatKm(leg.km)}</span> km
                    </>
                  )}
                </>
              ) : (
                <>
                  <span className="dot" />
                  <b>{event.place}</b> の上空を旋回中
                </>
              )}
            </div>
          </div>

          {/* 計器 */}
          <dl className="gauges">
            <div>
              <dt>高度</dt>
              <dd ref={altRef}>–</dd>
            </div>
            <div>
              <dt>機首</dt>
              <dd ref={hdgRef}>–</dd>
            </div>
            <div className="wide">
              <dt>位置</dt>
              <dd ref={posRef}>–</dd>
            </div>
          </dl>

          <article className={'card' + (collapsed ? ' collapsed' : '')} style={{ '--era': era.color }}>
            <header className="card-head">
              <span className="era-tag">{era.name}</span>
              <span className="region">{event.region}</span>
              {event.rice && (
                <span className="rice" title="稲作・農業に関わる出来事">
                  🌾 稲と農
                </span>
              )}
              <button
                className="collapse"
                onClick={() => setCollapsed((c) => !c)}
                aria-label={collapsed ? '解説を開く' : '解説をたたむ'}
              >
                {collapsed ? '▲' : '▼'}
              </button>
            </header>
            <p className="when">{event.when}</p>
            <h2>{event.title}</h2>
            <p className="place">📍 {event.place}</p>
            {!collapsed && <p className="text">{event.text}</p>}
            {!collapsed && event.moves.length > 0 && (
              <p className="legend">
                <span className="legend-line" /> 地図の赤い矢印は、このとき人や船・軍が動いた向き（おおよその経路）
              </p>
            )}

            <footer className="controls">
              <input
                type="range"
                min={0}
                max={LAST}
                value={idx}
                onChange={(e) => go(Number(e.target.value))}
                aria-label="年表の位置"
              />
              <div className="buttons">
                <button className="btn" onClick={() => go(idx - 1)} disabled={idx === 0}>
                  ◀ 前へ
                </button>
                <button className={'btn' + (auto ? ' primary' : '')} onClick={() => setAuto((a) => !a)}>
                  {auto ? '⏸ 自動飛行中' : '▶ 自動飛行'}
                </button>
                <button className="btn" onClick={() => go(idx + 1)} disabled={idx === LAST}>
                  次へ ▶
                </button>
              </div>
              <div className="meta">
                <span>
                  {idx + 1} / {EVENTS.length}
                </span>
                <button
                  className="link"
                  onClick={() => setBase((b) => (b === 'photo' ? 'pale' : 'photo'))}
                >
                  {base === 'photo' ? '地図に切り替え' : '航空写真に切り替え'}
                </button>
              </div>
            </footer>
          </article>
        </>
      )}
    </div>
  )
}
