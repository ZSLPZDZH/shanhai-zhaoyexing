# 开发说明

游戏使用静态 HTML、CSS、JavaScript 与本地图片，没有构建步骤或运行时第三方依赖。

```sh
git clone https://github.com/ZSLPZDZH/shanhai-zhaoyexing.git
cd shanhai-zhaoyexing
python -m http.server 4187
```

访问 http://localhost:4187 。也可直接打开 `index.html`；浏览器按不同入口分别保存进度。

## 项目结构

| 路径 | 职责 |
| --- | --- |
| `index.html` / `style.css` / `app.js` | 界面、输入、图鉴、合成音频与自动存档 |
| `engine.js` | 种子、旅程、战斗、卡牌、事件与胜负 |
| `profile.js` | 成就、结算历史、收集、存档迁移与导入导出 |
| `data.js` / `assets/` | 图鉴资料、1692 幅 WebP 和完整来源文档 |
| `engine-test.cjs` / `profile-test.cjs` | 规则、旅程、旧档兼容与幂等检查 |
| `tests/fixtures/nine-realms-engine.cjs` | 从九境版归档逐字节提取的旧引擎，用于真实旧档回归 |
| `scripts/verify-publication.cjs` | 资源、链接、来源路径与静态发布检查 |
| `docs/` | 游玩指南、展示图片、来源说明 |
| `trailer/` | 60秒横屏与30秒竖屏宣传片、封面和字幕 |

## 验证

使用 Node.js 24。所有测试仅使用 Node 内置模块，无需 `npm install`。

```sh
node scripts/verify-publication.cjs
node engine-test.cjs
node --test profile-test.cjs
```

GitHub Actions 在 main 更新和 Pull Request 时执行同样的检查。引擎检查覆盖确定性、24种契牌、18境域、六篇幅、三流派与三档难度、完整旅程、恢复与旧版迁移；档案检查覆盖成就、历史、导入导出和结算幂等。

## 发布方式

GitHub Pages 保留现有 `main / (root)` 发布源。推送 main 后由 GitHub Pages 自动发布，`verify.yml` 独立负责校验。无须将仓库嵌套到额外的 dist 目录。

离线 Release 包含游戏六个运行文件、完整 assets 及入门说明；解压后可直接打开。仓库另含开发测试、文档和宣传视频。

存档保存在浏览器 localStorage 中，不提交进仓库。更换站点入口前可以在游戏内导出 JSON，再在新入口导入。
