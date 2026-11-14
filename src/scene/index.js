// 出来事ごとの映像シーンの割り当て
import { rng } from './kit'
import * as A from './recipes-a'
import * as B from './recipes-b'

export { Stage } from './stage'

const RECIPES = { ...A, ...B }

// キーは年表のタイトル。t が場面の種類、あとは演出の指定
export const SCENES = {
  '稲作発祥の地・受水走水': { t: 'farm', env: 'dawn', coast: true, x: ['spring'], n: 12 },
  '五穀が流れ着いた島・久高島': { t: 'beach', env: 'dawn', x: ['pot'] },
  '発掘された最古級の畑': { t: 'farm', crop: 'barley', surf: 'soil', work: 'hoe', houses: 'thatch', n: 16 },
  '北から来た器と農耕の波': { t: 'beach', env: 'day', x: ['kiln'] },
  '先島がひとつの文化圏に': { t: 'village', coast: true, x: ['trade'] },
  'グスクと按司の登場': { t: 'gusuku', x: ['build'] },
  '三山分立・北山の王城': { t: 'gusuku', mount: true, sea: true, height: 30, env: 'day' },
  '三山分立・南山の拠点': { t: 'gusuku', x: ['spring'], height: 16 },
  '中山王察度、明へ使いを送る': { t: 'harbor', env: 'dawn', town: 'thatch', ships: [['junk', 0, 0, 0, [[6, 26], [60, 260]]], ['sabani', -40, 14, 80]], crowd: [[22, 'villager', 'wave'], [6, 'noble', 'stand', 6, 5]] },
  '宮古・八重山が中山と結ぶ': { t: 'beach', env: 'day', x: ['chief'] },
  '久米村の誕生': { t: 'harbor', town: 'chinese', ships: [['junk', 30, 16, 100], ['junk', -50, 20, 80]], crowd: [[14, 'chinese', 'stand'], [8, 'villager', 'stand', -20, 10]], x: ['load'] },
  '尚巴志、立つ': { t: 'gusuku', x: ['march'], height: 14, env: 'dawn' },
  '琉球王国の成立': { t: 'shuri', mode: 'found' },
  '名築城家・護佐丸の城': { t: 'gusuku', x: ['build'], sea: true, height: 20 },
  '護佐丸・阿麻和利の乱（中城）': { t: 'gusuku', env: 'night', x: ['siege'], sea: true },
  '護佐丸・阿麻和利の乱（勝連）': { t: 'gusuku', env: 'dusk', x: ['battle'], sea: true, height: 28 },
  '農民の子、王になる': { t: 'farm', x: ['drought', 'crowd'], n: 1, mount: true },
  '万国津梁・大交易時代': { t: 'harbor', town: 'tile', ships: [['junk', 34, 16, 95], ['junk', -44, 22, 80], ['junk', 0, 0, 0, [[100, 70], [-200, 200]]], ['sabani', 0, 0, 0, [[-90, 40], [90, 60]]]], crowd: [[18, 'villager', 'stand'], [8, 'noble', 'stand', 10, 8], [5, 'chinese', 'stand', -18, 5]], x: ['load'] },
  '尚真王の黄金時代': { t: 'shuri', mode: 'court' },
  '国家の祈りと聖地': { t: 'grove' },
  'オヤケアカハチの乱': { t: 'landing', era: 'ryukyu', env: 'dusk' },
  '久米島の按司たちの終わり': { t: 'gusuku', height: 40, mount: true, x: ['battle'], env: 'overcast' },
  '国境の島・与那国': { t: 'cliff', env: 'dusk', x: ['chief'] },
  '芋が人々を救う': { t: 'farm', crop: 'potato', surf: 'soil', work: 'hoe', x: ['official'], coast: true, junkBay: true },
  '薩摩軍の上陸': { t: 'landing', era: 'satsuma', env: 'overcast' },
  '人頭税の時代': { t: 'village', x: ['tax'] },
  '海を渡って田を作る': { t: 'farm', env: 'dawn', coast: true, x: ['boats'], noHuts: true, mount: true },
  '王国文化の開花': { t: 'shuri', mode: 'dance', env: 'dusk' },
  '蔡温の治水と羽地の田': { t: 'farm', crop: 'rice', x: ['river'], mount: true },
  '明和の大津波': { t: 'tsunami' },
  'ペリー艦隊、那覇に現る': { t: 'harbor', town: 'tile', ships: [['blackship', 20, 70, 100], ['blackship', -110, 130, 80], ['blackship', 150, 170, 95]], crowd: [[10, 'villager', 'stand', -40, 12]], x: ['march', 'flagUS'], faceLand: false },
  '琉球処分・王国の終わり': { t: 'shuri', mode: 'annex', env: 'overcast' },
  '密林の炭坑': { t: 'jungle', x: ['mine'] },
  '海を渡る沖縄人': { t: 'harbor', env: 'dawn', town: 'tile', ships: [['steamer', 10, 60, 95]], crowd: [[26, 'prewar', 'wave']], x: ['emigrants'] },
  '絶海の島の開拓': { t: 'cliff', x: ['pioneers'] },
  '人頭税の廃止': { t: 'village', x: ['festival'] },
  '軽便鉄道が走る': { t: 'rail' },
  'ソテツ地獄': { t: 'village', env: 'overcast', x: ['famine'] },
  '台湾から来た稲とパイン': { t: 'farm', surf: 'mud', crop: null, x: ['buffalo', 'pine'], houses: 'tile', n: 8, mount: true },
  '十・十空襲': { t: 'airraid' },
  '慶良間諸島への上陸': { t: 'landing', era: 'us', env: 'war', bombard: true, villagers: true },
  '沖縄本島上陸': { t: 'landing', era: 'us', env: 'day' },
  '伊江島の戦い': { t: 'battle', peak: true },
  '中部戦線と首里攻防': { t: 'battle', env: 'storm', rain: true },
  '摩文仁・戦いの終わり': { t: 'cliff', env: 'war', x: ['refugees'] },
  '戦争マラリア': { t: 'jungle', x: ['malaria'] },
  '切り離された島': { t: 'city', v: 'usa52', side: 'right', center: 30, low: true },
  '銃剣とブルドーザー': { t: 'farm', env: 'dawn', crop: 'rice', x: ['dozed'], n: 0, houses: 'tile' },
  '開拓移民とマラリアとの闘い': { t: 'jungle', env: 'day', x: ['settlers'] },
  '宮森小学校ジェット機墜落': { t: 'city', v: 'school', side: 'right', center: 40, low: true, yard: true, cars: 3 },
  '田んぼがキビ畑に変わる': { t: 'farm', crop: 'rice', x: ['cane', 'truck'], work: 'hoe', houses: 'tile' },
  'コザ暴動': { t: 'city', v: 'koza', env: 'night', side: 'right', cars: 0, low: true, open: 200 },
  '日本復帰': { t: 'city', v: 'reversion', env: 'storm', side: 'right', center: 30, cars: 4 },
  '沖縄国際海洋博覧会': { t: 'resort', v: 'expo' },
  'ナナサンマル': { t: 'city', v: '730', env: 'dawn', side: 'left', cars: 14, buses: true },
  '首里城、よみがえる': { t: 'shuri', mode: 'restored' },
  '普天間と県民の声': { t: 'city', v: 'futenma', side: 'left', cars: 6, low: true },
  '九州・沖縄サミット': { t: 'resort', v: 'summit' },
  '橋でつながる島々と観光の時代': { t: 'resort', v: 'bridge' },
  '国境の島々の今': { t: 'cliff', x: ['radar'] },
  '辺野古の海': { t: 'reclaim' },
  '首里城炎上、そして再建へ': { t: 'shuri', mode: 'fire', env: 'night' },
  'やんばるの森、世界自然遺産に': { t: 'jungle', env: 'dawn', x: ['kuina'] },
  '日本一早い新米': { t: 'farm', crop: 'gold', surf: 'gold', x: ['combine', 'stubble'], folk: 'mfarmer', work: 'plant', houses: 'modern', n: 6, mount: true },
  '田んぼの残る島': { t: 'farm', crop: 'rice', x: ['tractor'], folk: 'mfarmer', houses: 'modern', n: 6, mount: true, coast: true },
  '旅の終わり、はじまりの田へ': { t: 'farm', env: 'dusk', coast: true, x: ['spring'], folk: 'mfarmer', n: 12 },
}

export function buildScene(stage, event) {
  stage.clear()
  const cfg = SCENES[event.title] ?? { t: 'farm' }
  RECIPES[cfg.t](stage, cfg, rng(event.id * 977 + 13))
}
