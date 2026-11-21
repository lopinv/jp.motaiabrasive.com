// 300 篇文章一次性自检：文件齐全、YAML 可解析、必备字段、内链白名单、标题/描述唯一
// 只读。运行：node scripts/articles-verify.mjs  （tsx 需 .ts 时：用 tsx 调）
import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';

const ART = path.resolve('src/content/articles');
const TOPICS = path.resolve('src/content/_topics.json');
const files = (await readdir(ART)).filter((f) => f.endsWith('.mdx'));
const topics = JSON.parse(await readFile(TOPICS, 'utf8'));
const modelSlugs = new Set(JSON.parse(await readFile(path.resolve('src/content/_models.json'), 'utf8')).models);

// 内链白名单（合同 §4）
const WHITELIST_PREFIX = ['/products/', '/industries', '/resources', '/quality', '/company', '/contact', '/quote', '/shipping-oem', '/technical-specs', '/articles', '/'];
const knownRoutes = [
  '/products', '/products/abrasive-belts', '/products/flap-discs', '/products/sanding-discs', '/products/hook-loop', '/products/sanding-sponges',
  '/industries', '/industries/woodworking', '/industries/metalworking', '/industries/automotive', '/industries/shipbuilding', '/industries/oil-gas', '/industries/construction', '/industries/general',
  '/resources', '/resources/abrasive-grit-guide', '/resources/oem-packaging-guide',
  '/quality', '/company', '/contact', '/quote', '/shipping-oem', '/technical-specs', '/articles', '/',
];
// 模型 slug（静态 _models.json）
const validModelRoutes = new Set(['', '/products']);
for (const s of modelSlugs) validModelRoutes.add('/products/models/' + s);

let missingTopics = [];
const fmErrors = [];
const dupTitle = new Map();
const dupDesc = new Map();
const badLinks = [];

for (const t of topics) {
  const f = path.join(ART, t.slug + '.mdx');
  if (!existsSync(f)) { missingTopics.push(t.slug); continue; }
  const raw = (await readFile(f, 'utf8')).replace(/\r\n/g, '\n');
  const lines = raw.split('\n');
  let fmEnd = -1;
  for (let i = 1; i < lines.length; i++) if (lines[i].trim() === '---') { fmEnd = i; break; }
  if (lines[0].trim() !== '---' || fmEnd === -1) { fmErrors.push(`${t.slug}: frontmatter 缺 --- 定界符`); continue; }
  let fm;
  try { fm = parse(lines.slice(1, fmEnd).join('\n')); }
  catch (e) { fmErrors.push(`${t.slug}: YAML 解析失败 → ${e.message.split('\n')[0]}`); continue; }
  for (const req of ['title', 'description', 'publishDate', 'category']) {
    if (fm[req] === undefined || fm[req] === '') fmErrors.push(`${t.slug}: 缺必备字段 ${req}`);
  }
  if (fm.category && !['product-comparison','multi-product-comparison','buying-guide','technical-guide','application-guide','process-tutorial','troubleshooting','product-spec-detail','procurement-guide','wholesale-oem-guide','industry-market','jp-regional-sourcing','faq-buyers-guide'].includes(fm.category))
    fmErrors.push(`${t.slug}: category 非法 → ${fm.category}`);
  // 品牌名护栏：错写「摩泰」必须为 0（正写为「墨泰」）
  if (/摩泰/.test(raw)) fmErrors.push(`${t.slug}: 出现品牌错字「摩泰」（应为「墨泰」）`);
  dupTitle.set(fm.title ?? '', (dupTitle.get(fm.title ?? '') ?? 0) + 1);
  dupDesc.set(fm.description ?? '', (dupDesc.get(fm.description ?? '') ?? 0) + 1);
  // 内链
  for (const link of fm.internalLinks ?? []) {
    const url = link.url;
    const ok = validModelRoutes.has(url) || knownRoutes.includes(url);
    if (!ok) badLinks.push(`${t.slug}: ${url}`);
  }
}

const dupT = [...dupTitle.entries()].filter(([, c]) => c > 1);
const dupD = [...dupDesc.entries()].filter(([, c]) => c > 1);

console.log('=== 文件齐全 ===');
console.log(`topics=${topics.length} 存在 mdx=${files.length} 缺失=${missingTopics.length}`);
if (missingTopics.length) console.log('缺失:', missingTopics.join(', '));

console.log('\n=== frontmatter ===');
console.log(`YAML 错误: ${fmErrors.length}`);
fmErrors.slice(0, 40).forEach((e) => console.log('  ✖ ' + e));

console.log('\n=== 唯一性 ===');
console.log(`重复 title 组: ${dupT.length}`);
dupT.slice(0, 10).forEach(([t, c]) => console.log(`  ×${c} ${t}`));
console.log(`重复 description 组: ${dupD.length}`);
dupD.slice(0, 10).forEach(([d, c]) => console.log(`  ×${c} ${d}`));

console.log('\n=== 内链白名单 ===');
console.log(`非法内链: ${badLinks.length}`);
[...new Set(badLinks)].slice(0, 30).forEach((l) => console.log('  ✖ ' + l));

const pass = missingTopics.length === 0 && fmErrors.length === 0 && dupT.length === 0 && dupD.length === 0 && badLinks.length === 0;
console.log('\n' + (pass ? '✅ 全部通过' : '❌ 存在问题（见上）'));
process.exit(pass ? 0 : 1);
