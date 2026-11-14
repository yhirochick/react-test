import { useEffect, useMemo, useRef, useState } from 'react'
import MEDIA from './data/media.json'

// 到着した場所の「映像」: 実物の写真や絵図をゆっくり動かしながら、解説を字幕（と読み上げ）で流す

const sentencesOf = (text) =>
  text
    .split(/(?<=。)/)
    .map((s) => s.trim())
    .filter(Boolean)

export const mediaOf = (event) => MEDIA[event.title] ?? []

function speak(text, onEnd) {
  const synth = window.speechSynthesis
  if (!synth) return false
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'ja-JP'
  u.rate = 1.02
  const ja = synth.getVoices().find((v) => v.lang?.startsWith('ja'))
  if (ja) u.voice = ja
  u.onend = onEnd
  u.onerror = onEnd
  synth.speak(u)
  return true
}

export default function Film({ event, active, voice, onDone }) {
  const media = useMemo(() => mediaOf(event), [event])
  const lines = useMemo(() => sentencesOf(event.text), [event])
  const [step, setStep] = useState(-1) // -1 = タイトル、0〜 = 字幕の行
  const doneRef = useRef(onDone)
  useEffect(() => {
    doneRef.current = onDone
  })

  // 場面が変わったら最初から
  useEffect(() => {
    setStep(-1)
  }, [event, active])

  // 字幕を 1 行ずつ進める。読み上げ中は読み終わりを待つ
  useEffect(() => {
    if (!active) return
    let timer = 0
    let cancelled = false
    const next = () => {
      if (cancelled) return
      if (step >= lines.length - 1) doneRef.current?.()
      else setStep(step + 1)
    }
    if (step < 0) {
      timer = setTimeout(next, 3200)
    } else {
      const text = lines[step]
      const fallback = Math.max(3600, text.length * 170)
      if (voice && speak(text, () => (timer = setTimeout(next, 500)))) {
        // 読み上げが止まってしまった場合の保険
        timer = setTimeout(next, fallback * 2.2)
      } else {
        timer = setTimeout(next, fallback)
      }
    }
    return () => {
      cancelled = true
      clearTimeout(timer)
      window.speechSynthesis?.cancel()
    }
  }, [active, step, lines, voice])

  // 字幕の進み具合に合わせて画像を切り替える
  const shot = media.length ? Math.min(media.length - 1, Math.floor((Math.max(step, 0) / lines.length) * media.length)) : -1
  const pic = shot >= 0 ? media[shot] : null

  return (
    <div className={'film' + (active ? ' on' : '') + (media.length ? ' has-media' : '')} aria-hidden={!active}>
      {active &&
        media.map((m, i) => {
          const ratio = m.w / m.h
          const fit = ratio > 1.25 && ratio < 2.4 ? 'cover' : 'contain'
          return (
            <div key={m.src} className={'film-shot' + (i === shot ? ' show' : '')}>
              {fit === 'contain' && <img className="film-back" src={m.src} alt="" />}
              <img className={`film-img kb${i % 4}`} style={{ objectFit: fit }} src={m.src} alt={m.caption} />
            </div>
          )
        })}
      <div className="film-shade" />

      {active && pic && (
        <p className="film-caption" key={pic.src}>
          {pic.caption}
        </p>
      )}

      {active && (
        <div className="film-text">
          {step < 0 ? (
            <div className="film-title" key="title">
              <p className="film-when">{event.when}</p>
              <h2>{event.title}</h2>
              <p className="film-place">{event.place}</p>
            </div>
          ) : (
            <p className="film-sub" key={step}>
              {lines[step]}
            </p>
          )}
          <div className="film-progress" aria-hidden="true">
            {lines.map((_, i) => (
              <i key={i} className={i <= step ? 'done' : ''} />
            ))}
          </div>
        </div>
      )}

      {active && pic && (
        <a className="film-credit" href={pic.page} target="_blank" rel="noreferrer">
          {pic.credit} ／ {pic.license} ／ Wikimedia Commons
        </a>
      )}
    </div>
  )
}
