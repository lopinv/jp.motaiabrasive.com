# MoTai Abrasives — 日语站点

Hubei MoTai Abrasives Materials Co., Ltd. 的日语企业级工业 B2B 站点。纯静态构建，部署于 GitHub Pages，生产域名为 `https://jp.motaiabrasive.com`（`public/CNAME` 已配置）。

## 项目简介

网站面向日语市场的工业采购商、进口商与经销商，覆盖五个产品族（磨料带、百叶片、网布砂碟/砂碟、Hook & Loop 碟、砂海绵，31 个型号规格页）、七个应用行业（木工、金属加工、汽车与维保、造船、油气、建筑建材、一般工业）以及质量、资源、文章与询价转化路径。

站点在构建时会自动校验 SEO 元数据、JSON-LD 结构、页面内容厚度、内部链接图与 Sitemap 完整性，防止出现薄内容页与孤岛页面。

文章库为 **300 篇手写日语 B2B 技术文章**（`src/content/articles/*.mdx`，已入库）：选题由 `src/content/manifest.ts` + `manifest-topics.ts` 的覆盖清单驱动（全 31 型号 × 7 行业 × 7 地域 × 13 文章类型 × B2B 服务全覆盖），正文按 `AUTHORING_CONTRACT.md` 契约逐篇手写（事实仅取自 `models.ts`/`site.ts`/`glossary.ts`，禁脚本堆词、禁模板化），发布前经同质化门禁、SEO 质量门禁与链接门禁三道校验。

## 技术栈

- [Astro](https://astro.build/) 7.x — 静态站点生成（`@astrojs/mdx` + `@astrojs/sitemap`）
- TypeScript（strict）
- `@astrojs/sitemap` — 自动生成 Sitemap
- 原生 CSS（设计令牌 + CSS 逻辑属性）
- 无前端框架，无运行时依赖

## 环境要求

- Node.js 22 或更高版本（CI 使用 22）
- npm 11 或更高版本

## 快速开始

```bash
npm ci
npm run dev                 # 本地开发，默认 http://localhost:4321
npm run build               # 类型检查 + 静态构建，输出到 dist/
npm run preview              # 本地预览构建产物
npm run check               # Astro 类型检查 + SEO/内容/内链检查
npm run check:site          # 同质化门禁 + SEO/内容/内链检查（需先 build）
npm run check:links         # 全链路内链真实 HTTP GET 校验（需先 astro preview）
npm run check:homogeneity   # 内容同质化审计（非门禁）
npm run dedupe:delete       # 预览将删除的重复地域版/变体（dry-run）
npm run dedupe:delete:execute # 实际执行删除并同步 _index.json

# 文章库维护（非 npm script，直接 node 执行）
node scripts/articles-verify.mjs   # 300 篇全量自检：文件齐全 / YAML / 内链白名单 / 唯一性 / 「墨泰」错字护栏
node scripts/manifest-audit.mjs    # manifest 覆盖与去重校验（需 tsx 加载 .ts：见下）
```

manifest-audit 导入 `.ts` 模块，需经 tsx 执行（本机 node 不在 PATH 时经 mise shims）：

```bash
npx tsx scripts/manifest-audit.mjs
```

## 目录结构

```text
src/
├── components/   # 导航、页脚、面包屑、CTA、表单、FAQ 与侧边栏组件
├── data/
│   ├── site.ts   # 站点信息、导航、产品族、行业、应用场景、质量流程与资源
│   ├── models.ts # 31 个型号规格数据（belt/disc/sponge）
│   └── glossary.ts # 行业术语表
├── layouts/      # BaseLayout（元数据/JSON-LD）与 Layout（页面骨架）
├── pages/        # 全部静态路由（见下表）
├── content/
│   ├── articles/        # 300 篇手写 MDX 技术文章（已入库，见 AUTHORING_CONTRACT.md）
│   ├── manifest.ts      # 文章覆盖清单（31 型号 / 7 行业 / 7 地域 / 13 类型常量）
│   ├── manifest-topics.ts # 300 篇选题计划（slug/title/angle，生成 _topics.json 的单一事实源）
│   ├── _topics.json     # 选题计划快照（供撰写与 articles-verify 校验）
│   └── _models.json     # 型号 slug 快照（供内链白名单校验）
├── styles/       # 设计令牌、组件样式、页面样式、文章正文样式
└── templates/    # 增量文章生成管线（选题矩阵、13 类文章模板、MDX 生成器，供 publish-cycle 逐篇增发）
AUTHORING_CONTRACT.md    # 手写文章契约：frontmatter 模式 / 正文 HTML 规则 / 内链白名单 / 事实来源 / 反模板化
public/
├── images/       # 公开产品与工厂图片
├── favicon.svg
├── site.webmanifest
├── CNAME
├── .nojekyll     # 告知 GitHub Pages 使用 astro 预构建产物，不再二次运行 jekyll
└── prompts_ja.md  # 日语文章生成提示词规范（随站点根路径发布）
scripts/
├── quality-check.mjs        # SEO、内容厚度、孤岛页面检查
├── link-check.mjs           # 内链完整性
├── audit-urls.mjs           # 构建产物全量 URL 审计（站内文件存在性 + 站外可达性 + mailto/tel 格式）
├── check-all-links.mjs      # 全链路内链真实 HTTP GET 200 校验（需先 astro preview）
├── link-density.mjs        # 内链密度统计（每页本地 <a href> 数量分布，不请求）
├── homogeneity-audit.mjs    # 内容同质化审计（标题/描述/DedupeKey/正文 Jaccard；--gate 门禁模式）
├── articles-verify.mjs      # 300 篇全量自检：文件齐全 / YAML 可解析 / 内链白名单 / 标题描述唯一 / 「墨泰」错字护栏
├── manifest-audit.mjs       # manifest 覆盖与去重校验（件数 / slug / title / cell / 型号·行业·地域·类型网罗）
├── generate-articles.ts     # 批量生成文章（写入 src/content/articles/*.mdx + _index.json）
├── publish-next.ts         # 发布循环单步：生成下一篇「幸存」选题（逐篇发布，规避 scaled content abuse）
├── publish-cycle.mjs        # 发布编排器：peek 选题→生成→build→三层门禁→提交→gh-pages worktree 部署
├── delete-duplicate-articles.mjs # 直接删除重复地域版/焦点变体（替代 noindex），并同步 _index.json
├── fix-frontmatter.mjs      # 修复 .mdx frontmatter 未加引号含冒号的 YAML 标量（--check 仅检测）
├── verify-frontmatter.mjs  # 校验所有 .mdx frontmatter 的 YAML 可解析性
├── test-batch*.ts           # 批量生成冒烟测试（按索引/产品族）
└── test-single*.ts          # 单篇生成冒烟测试
check_keywords.mjs           # 根目录 ad-hoc 调试脚本：抽检前 10 篇 mdx 的主/长尾关键词正文密度（开发用，不入 CI，非 package.json 脚本）
```

## 页面与内容策略

| 类型 | 路由 | 内容要求 |
| --- | --- | --- |
| 首页 | `/` | Hero、产品入口、企业能力、行业方案、流程、FAQ |
| 产品目录 | `/products` | 5 个产品族入口 + 型号浏览器 + 选型引导 |
| 产品详情 | `/products/[slug]` | 用途、选型要点、规格表、FAQ、相关产品、询价入口 |
| 型号详情 | `/products/models/[slug]` | 31 个型号页：规格、粒度范围、FAQ、相关型号 |
| 行业目录 | `/industries` | 7 个行业场景 + 挑战清单 |
| 行业详情 | `/industries/[slug]` | 挑战、选型步骤、推荐产品、FAQ、相邻行业 |
| 企业/质量 | `/company`、`/quality` | 能力、流程、检查清单、FAQ |
| 技术规格 | `/technical-specs` | FEPA grit 表、英寸/毫米换算、磨料/基体类型 |
| 物流与 OEM | `/shipping-oem` | 海运/空运步骤、OEM 流程、包装选项、FAQ |
| 资源中心 | `/resources`、`/resources/[slug]` | 技术指南与采购准备清单 |
| 文章 | `/articles`、`/articles/[slug]` | MDX 技术文章：现有 300 篇手写文章（manifest 驱动，见 `AUTHORING_CONTRACT.md`）；`scripts/templates` 增量管线可逐篇增发 |
| 转化 | `/quote`、`/contact`、`/thankyou` | 分步询价表单、WhatsApp、邮箱、电话 |
| 合规 | `/privacy` | 数据收集、使用、保留与权利说明 |
| 404 | `/404` | 未找到页面（`src/pages/404.astro`），提供导航与返回 |

**防孤岛规则**：每个可索引页面必须至少有一条来自站内其他页面的上下文入链（导航、面包屑、正文链接或相关推荐）。`scripts/quality-check.mjs` 会解析构建产物中的真实链接并阻断孤岛页面。

**内容发布门槛**：资料不足的页面不生成可索引路由；不虚构认证、客户案例、性能数据或库存。

## SEO 与结构化数据

- 每页唯一 Title、Meta Description、单 H1、Canonical、OGP 与 Twitter 卡片
- JSON-LD：`Organization`、`WebSite`、`BreadcrumbList`、`Product`、`FAQPage`、`Article`
- 自动生成 `sitemap-index.xml` 与 `robots.txt`（指向生产域名）
- `Product` 结构化数据仅填充可核验字段，不写入虚假价格、库存或评分

## 表单与 WhatsApp

询价表单通过 `form.lopins.cn` 表单服务提交（`src/pages/quote.astro` 的表单 `action` 指向 `form.lopins.cn` 的子路径），静态托管无需服务端。`SITE.email`（`motai-01@motaiabrasive.com`，定义于 `src/data/site.ts`）仅用于联系页的 `mailto:` 链接。若更换 CRM 或表单服务，只需修改 `src/pages/quote.astro` 中的表单 `action`。

WhatsApp 号码为 `+86 181 1863 5597`（来自企业官网公开信息），统一在 `src/data/site.ts` 中维护。产品页的 WhatsApp 链接会预填产品名与询价话术。

## 部署到 GitHub Pages

**双推模型**：`main` 存源码（含 `src/content/articles/` 300 篇手写文章），`gh-pages` 存构建产物。发布流程为 `astro build` 后用独立 worktree（`.ghpages-worktree`）全量同步 `dist/`（保留 `CNAME`/`.nojekyll`）提交并推送 `gh-pages`。

仓库**不含** `.github/workflows/` 工作流；**增量**文章（300 篇之外）由 `scripts/publish-cycle.mjs` 编排（供定时任务调用，默认每 30 分钟一篇）：

1. peek 选题池（`generate-articles.remainingTopics()` 单一事实源）；耗尽则打印 `PUBLISH_EXHAUSTED` 并 `exit 0`。
2. 生成下一篇「幸存」选题（`publish-next.ts`，落盘 1 篇 mdx + `_index.json`）。
3. 全量构建（`astro check` + 静态产物 `dist/`）。
4. 三层门禁：同质化（`--gate`）/ SEO-quality / 链接与外链 nofollow（`quality-check` + `link-check` + `audit-urls`）。
5. 提交并推送 `main`（仅新 mdx + `_index.json`）。
6. 部署 gh-pages：独立 worktree（`.ghpages-worktree`）同步 `dist/`、保留 `CNAME`，推送 `gh-pages`。

失败可重入：生成后、提交前任一环节失败 → 回滚 mdx + `_index.json`，下次循环重发同一篇。

域名配置：`public/CNAME` 已写入 `jp.motaiabrasive.com`，需在 GitHub 仓库 **Settings → Pages → Custom domain** 中启用，并为该域名添加 DNS `CNAME` 记录指向 `<user>.github.io`。`astro.config.mjs` 的 `site` 已配置为 `https://jp.motaiabrasive.com`，Canonical 与 Sitemap 均基于此域名生成。

## 业务资料待补充

以下内容需要企业方提供真实资料后替换，当前仅使用官网可核验的公开信息：

- 可公开的认证证书与编号
- 客户案例与参考项目
- 完整产品型号库与扩展规格（`src/data/models.ts` 现有 31 个 kebab-case 型号，企业方补充后扩展）
- 目标市场的合规与标签要求
- 正式的询价收件服务（若不使用当前表单服务）

## 贡献流程

1. 在功能分支开发：`type/developer/description`
2. 本地执行 `npm run check` 确保类型与站点质量检查通过
3. 提交信息遵循 `<type>(<scope>): <subject>`，涉及逻辑变更时补充 Body 说明原因
4. 推送 `main` 后，由 `scripts/publish-cycle.mjs` 定时任务逐篇生成并部署到 gh-pages（详见上文「部署到 GitHub Pages」）；无 GitHub Actions 工作流。
