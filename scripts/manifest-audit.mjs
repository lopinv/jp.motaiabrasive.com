// マニフェスト検証：件数・slug 重複・セル重複・網羅性をチェック（只読）
// 実行：node --import tsx/esbuild scripts/manifest-audit.mjs  （または tsx 経由）
import { TOPICS } from '../src/content/manifest-topics.ts';
import { MODEL_CATALOG, INDUSTRIES, REGIONS, TYPES } from '../src/content/manifest.ts';

const topics = TOPICS;
console.log('件数:', topics.length);

const slugSet = new Set();
let dupSlug = 0;
for (const t of topics) {
  if (slugSet.has(t.slug)) { dupSlug++; console.log('  DUP slug:', t.slug); }
  slugSet.add(t.slug);
}
console.log('slug 重複:', dupSlug);

// title 重複
const titleSet = new Set();
let dupTitle = 0;
for (const t of topics) {
  if (titleSet.has(t.title)) { dupTitle++; console.log('  DUP title:', t.title); }
  titleSet.add(t.title);
}
console.log('title 重複:', dupTitle);

// cell (model|type|industry|region) 重複
const cellSet = new Set();
let dupCell = 0;
const cellCount = new Map();
for (const t of topics) {
  const cell = `${t.model ?? ''}|${t.type}|${t.industry ?? ''}|${t.region ?? ''}`;
  cellCount.set(cell, (cellCount.get(cell) ?? 0) + 1);
  if (cellSet.has(cell)) dupCell++;
  cellSet.add(cell);
}
console.log('セル重複(同 model|type|ind|region):', dupCell);
const topCells = [...cellCount.entries()].filter(([, c]) => c > 1).sort((a, b) => b[1] - a[1]).slice(0, 10);
for (const [c, n] of topCells) console.log(`  ×${n} ${c}`);

// 網羅性
const modelsSeen = new Set(topics.map((t) => t.model).filter(Boolean));
console.log('\n=== 網羅性 ===');
console.log(`モデル網羅: ${modelsSeen.size}/${MODEL_CATALOG.length}`);
const missingModels = MODEL_CATALOG.filter((m) => !modelsSeen.has(m));
if (missingModels.length) console.log('  未カバーモデル:', missingModels.join(', '));

for (const list of [INDUSTRIES, REGIONS, TYPES]) {
  const seen = new Set(topics.map((t) => (t.industry && list.includes(t.industry)) ? t.industry : (t.region && list.includes(t.region) ? t.region : t.type)).filter(Boolean));
  // 個別で
  if (list === INDUSTRIES) {
    const s = new Set(topics.map((t) => t.industry).filter(Boolean));
    console.log(`業界網羅: ${s.size}/${INDUSTRIES.length} → ${INDUSTRIES.filter((i) => !s.has(i)).join(',') || '全カバー'}`);
  } else if (list === REGIONS) {
    const s = new Set(topics.map((t) => t.region).filter(Boolean));
    console.log(`地域網羅: ${s.size}/${REGIONS.length} → ${REGIONS.filter((i) => !s.has(i)).join(',') || '全カバー'}`);
  } else {
    const s = new Set(topics.map((t) => t.type).filter(Boolean));
    console.log(`タイプ網羅: ${s.size}/${TYPES.length} → ${TYPES.filter((i) => !s.has(i)).join(',') || '全カバー'}`);
  }
}
