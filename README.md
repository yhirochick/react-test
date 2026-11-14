# 稲と島の時空飛行

稲作のはじまりから現代まで、琉球・沖縄の歴史を年代順に、鳥の目でめぐる空の旅の Web アプリです。
奄美から与那国、大東諸島までの地点を 3D の航空写真の上で飛び、その場所で起きた出来事を解説します。

## 動かし方

```bash
npm install
```

```bash
npm run dev
```

## しくみ

- 地図: [MapLibre GL JS](https://maplibre.org/) と国土地理院の地理院タイル（航空写真・淡色地図・標高）
- `src/data/events.js`: 年表データ。出来事の場所、解説、カメラの向き、人や軍の動きを示す矢印
- `src/flight.js`: 離陸 → 巡航 → 降下の飛行カメラの計算
- `src/App.jsx`: 画面と操作

## 映像と解説

目的地に着くと、その場所の実物の写真・絵図（Wikimedia Commons）に切り替わり、解説が字幕で流れます。
読み上げは画面下の「読み上げ」で切り替えられます。画像の割り当ては `src/data/media.json`、
出典とライセンスの一覧は `public/media/CREDITS.md` にあります。

## ナレーション音声（VOICEVOX）

読み上げは、既定ではブラウザ内蔵の音声です。[VOICEVOX](https://voicevox.hiroshiba.jp/) で音声ファイルを作っておくと、
どの端末でも同じ自然な声で流れます。

1. VOICEVOX を起動する
2. 声の一覧を見る

```bash
node scripts/make-narration.mjs --list
```

3. 声の番号を指定して全件を生成する（`public/narration/` に書き出される）

```bash
node scripts/make-narration.mjs --speaker 13
```

`--speed 0.95` で少しゆっくり、`--only 5,12` で指定した出来事だけ作り直せます。ffmpeg があれば MP3 に変換します。
公開するときは、画面に出る「VOICEVOX:キャラクター名」の表記を残し、キャラクターごとの利用規約を確認してください。

## 注意

解説文は概説で、伝承や諸説あるものを含みます。年代や数値は公開前に資料で確認してください。
地図上の赤い矢印はおおよその向きを示すもので、正確な経路ではありません。
