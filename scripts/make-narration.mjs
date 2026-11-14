#!/usr/bin/env node
// VOICEVOX で全解説のナレーション音声を作り、public/narration/ に書き出す。
//
// 使い方:
//   1. VOICEVOX を起動する（起動している間、http://127.0.0.1:50021 で音声合成を受け付ける）
//   2. node scripts/make-narration.mjs --list        声の一覧を見る
//   3. node scripts/make-narration.mjs --speaker 13   その声で全件を生成する
//
// 主なオプション:
//   --speaker <id>   声（スタイル）の番号。既定は 13
//   --speed <n>      話す速さ。既定 1.0（0.9 でゆっくり）
//   --pitch <n>      声の高さ。既定 0（-0.05 で少し低く）
//   --intonation <n> 抑揚。既定 1.0
//   --only <a,b,..>  出来事の番号（0 始まり）を指定して、その分だけ作り直す
//   --force          すでにある音声も作り直す
//   --wav            MP3 に変換せず WAV のまま置く
//   --host <url>     VOICEVOX の場所。既定 http://127.0.0.1:50021
//
// ffmpeg が入っていれば MP3 に変換する（全件で 15MB 前後）。無ければ WAV のまま（100MB 近くになる）。
// 解説文を直したら、もう一度実行すれば変わった文だけ作り直す。

import { execFileSync, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { EVENTS } from '../src/data/events.js'
import { sentencesOf, textHash, toSpoken } from '../src/narration.js'

const args = process.argv.slice(2)
const flag = (name) => args.includes('--' + name)
const opt = (name, fallback) => {
  const i = args.indexOf('--' + name)
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback
}

const HOST = opt('host', 'http://127.0.0.1:50021').replace(/\/$/, '')
const SPEAKER = Number(opt('speaker', '13'))
const SPEED = Number(opt('speed', '1.0'))
const PITCH = Number(opt('pitch', '0'))
const INTONATION = Number(opt('intonation', '1.0'))
const ONLY = opt('only', '') ? opt('only', '').split(',').map(Number) : null
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'narration')
const INDEX = path.join(OUT, 'index.json')

async function api(pathname, init) {
  let res
  try {
    res = await fetch(HOST + pathname, init)
  } catch {
    console.error(`VOICEVOX に接続できません（${HOST}）。VOICEVOX を起動してから、もう一度実行してください。`)
    process.exit(1)
  }
  if (!res.ok) throw new Error(`${pathname} が失敗しました: ${res.status} ${await res.text()}`)
  return res
}

const speakers = await (await api('/speakers')).json()
const styles = speakers.flatMap((s) => s.styles.map((st) => ({ id: st.id, name: s.name, style: st.name })))

if (flag('list')) {
  console.log('番号  キャラクター（スタイル）')
  for (const s of styles.sort((a, b) => a.id - b.id)) console.log(String(s.id).padStart(4), ' ', `${s.name}（${s.style}）`)
  console.log('\n落ち着いた語りに向く声を選び、--speaker <番号> で指定してください。')
  console.log('各キャラクターには利用規約があります。公開する前に VOICEVOX の公式サイトで確認してください。')
  process.exit(0)
}

const who = styles.find((s) => s.id === SPEAKER)
if (!who) {
  console.error(`番号 ${SPEAKER} の声が見つかりません。--list で一覧を確認してください。`)
  process.exit(1)
}

const hasFfmpeg = !flag('wav') && spawnSync('ffmpeg', ['-version']).status === 0
const ext = hasFfmpeg ? 'mp3' : 'wav'
if (!hasFfmpeg && !flag('wav')) console.log('ffmpeg が見つからないので WAV のまま保存します（容量が大きくなります）。')

fs.mkdirSync(OUT, { recursive: true })
const old = fs.existsSync(INDEX) ? JSON.parse(fs.readFileSync(INDEX, 'utf8')) : null
// 声や話し方を変えたら全部作り直す
const settings = { speaker: SPEAKER, speed: SPEED, pitch: PITCH, intonation: INTONATION, ext }
const same = old && JSON.stringify(old.settings) === JSON.stringify(settings)
const index = { engine: 'VOICEVOX', credit: `VOICEVOX:${who.name}`, speaker: who, settings, items: {} }

console.log(`声: ${who.name}（${who.style}） / 形式: ${ext} / 出力先: ${OUT}`)
let made = 0
let kept = 0
let seconds = 0
for (const e of EVENTS) {
  const lines = sentencesOf(e.text)
  index.items[e.id] = []
  for (const [i, line] of lines.entries()) {
    const spoken = toSpoken(line)
    const hash = textHash(spoken)
    const file = `${String(e.id).padStart(2, '0')}-${i}.${ext}`
    const target = path.join(OUT, file)
    const prev = old?.items?.[e.id]?.[i]
    const skip = ONLY ? !ONLY.includes(e.id) : false
    const reusable = fs.existsSync(target) && prev?.hash === hash && prev?.file === file && (same || skip)
    if (reusable && !(flag('force') && !skip)) {
      index.items[e.id].push(prev)
      kept++
      continue
    }
    if (skip) continue // 指定外で、使える音声もない文は載せない（アプリは内蔵音声で読む）

    const query = await (await api(`/audio_query?speaker=${SPEAKER}&text=${encodeURIComponent(spoken)}`, { method: 'POST' })).json()
    Object.assign(query, {
      speedScale: SPEED,
      pitchScale: PITCH,
      intonationScale: INTONATION,
      prePhonemeLength: 0.1,
      postPhonemeLength: 0.25,
    })
    const wav = Buffer.from(
      await (
        await api(`/synthesis?speaker=${SPEAKER}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(query) })
      ).arrayBuffer(),
    )
    // WAV の長さ（秒）= データの大きさ ÷ 1 秒あたりのバイト数
    const sec = (wav.length - 44) / wav.readUInt32LE(28)
    seconds += sec
    if (hasFfmpeg) {
      const tmp = target.replace(/\.mp3$/, '.tmp.wav')
      fs.writeFileSync(tmp, wav)
      execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', tmp, '-ac', '1', '-b:a', '64k', target])
      fs.unlinkSync(tmp)
    } else {
      fs.writeFileSync(target, wav)
    }
    index.items[e.id].push({ file, hash, sec: Math.round(sec * 10) / 10 })
    made++
    process.stdout.write(`\r${e.id + 1}/${EVENTS.length} ${e.title.slice(0, 20)}… ${i + 1}/${lines.length}    `)
  }
  // 途中で止めても続きから再開できるよう、出来事ごとに一覧を保存する
  fs.writeFileSync(INDEX, JSON.stringify(index, null, 1))
}

// 使わなくなった音声ファイルを片づける
const used = new Set(Object.values(index.items).flat().map((x) => x.file))
for (const f of fs.readdirSync(OUT)) if (/^\d+-\d+\.(mp3|wav)$/.test(f) && !used.has(f)) fs.unlinkSync(path.join(OUT, f))

const bytes = [...used].reduce((s, f) => s + fs.statSync(path.join(OUT, f)).size, 0)
console.log(`\n完了: 新しく作った音声 ${made} 件（約 ${Math.round(seconds / 60)} 分）、そのまま使った音声 ${kept} 件、合計 ${(bytes / 1e6).toFixed(1)} MB`)
console.log(`アプリで「読み上げ」をオンにすると、この音声が流れます。クレジット表記: ${index.credit}`)
