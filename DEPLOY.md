# KDesign 站点部署与维护操作手册

> 适用项目：`kcharts`（后续 UI 组件库、低代码等同理）
> 最后更新：2026-10-23
> 架构：**Cloudflare Pages 免费静态托管**，一个 Pages 项目（`kdesign-dev`）承载整个 kdesign-dev.com，各子站按路径挂载

---

## 一、关键信息速查

| 项目 | 值 |
|---|---|
| 正式网址（门户页） | https://kdesign-dev.com 与 https://www.kdesign-dev.com |
| KCharts 文档站 | https://kdesign-dev.com/kcharts/ |
| 临时域名 | https://kdesign-dev.pages.dev |
| Cloudflare 账号 | 3289009070@qq.com |
| Pages 项目名 | `kdesign-dev`（直接上传型，生产分支 main） |
| Cloudflare Account ID | `f76ea4b0e4b34446879b25070c3b950b` |
| 本地项目路径 | `C:\Users\Administrator\.meituan-catpaw\3036078262\desk_default_workspace\kcharts` |
| 部署目录 | 项目根目录 `deploy\`（根 = 门户页 index.html，`kcharts\` = 文档站产物） |
| git 分支 | `dev`（日常开发）→ 合 `master`（主线）。GitHub 暂未推送（国内网络不通，等有代理再推） |

---

## 二、一次性配置存档（已完成，无需重做）

以下是 2026-10-23 首次上线的完整流程存档。**以后更新网站完全不需要再走这一节**，仅当更换域名/账号时参考。

### 1. 域名购买与实名（阿里云）

阿里云 → 域名注册 → 购买 `kdesign-dev.com` → 实名认证 → 状态「正常」。

### 2. 域名接入 Cloudflare（NS 托管）

1. 登录 [dash.cloudflare.com](https://dash.cloudflare.com)（新版界面）：首页中间卡片「**Add a domain**」→ 输入 `kdesign-dev.com` → 提示已注册时点「**Connect**」→ 附加配置页全部默认 → Continue → 套餐选 **Free** → DNS 记录扫描页（0 条属正常）→「Continue to activation」。
2. 记下分配的两个 Nameserver：`porter.ns.cloudflare.com` / `vivienne.ns.cloudflare.com`。
3. 阿里云侧替换 NS：阿里云「**域名注册控制台**」（注意不是云解析 DNS 页面）→ 域名列表 → 管理 → **DNS 修改** → 修改 DNS 服务器 → 「使用自定义 DNS」填上面两个地址 → 确定（需短信验证）。
4. 回 Cloudflare 点「I updated my nameservers」→ 等邮件「Our network is now boosting kdesign-dev.com's speed and security」→ 域名状态 Active。

> 坑位记录：域名注册控制台进门会弹「快速添加解析」向导，直接取消；改 NS 必须在「域名注册控制台」，云解析 DNS 页面里没有该入口。

### 3. 创建 Pages 项目并首次部署

1. Cloudflare 左侧「Workers & Pages」→（新版首页选「**Continue to Pages**」旧版工作流）→「**Create Pages**」→「**Drag and drop your files**」→ Get started。
2. 项目名 `kdesign-dev`；上传方式：**打 zip 拖入**（Cloudflare 只接受单个文件夹或单个 zip，且以 zip **内容**为网站根目录）。
3. Deploy site → 得到 `kdesign-dev.pages.dev`。

> 坑位记录：混合拖拽多个文件/文件夹会报错；直接选 deploy 文件夹会把 `deploy/` 变成网址前缀多一层。所以固定用 zip。**新账号首次创建应用需先完成邮箱验证**（QQ 邮箱点 Cloudflare 验证链接，需在已登录 dash 的浏览器里点）；如遇「An unknown error occurred」重试或强刷即可。

### 4. 绑定自定义域名

Pages 项目 `kdesign-dev` →「**Custom domains**」标签 → Set up a custom domain：

- `kdesign-dev.com`：确认记录为 `CNAME @ → kdesign-dev.pages.dev` → Activate domain。
  > 坑位记录：若状态停在 Verifying 并提示 Complete DNS setup，去左侧「**DNS → Records → Add record**」手动补：Type=CNAME、Name=`@`、Target=`kdesign-dev.pages.dev`（橙云开启）→ 保存 → 回 Custom domains 点「Check DNS records」。
- `www.kdesign-dev.com`：同上，记录为 `CNAME www → kdesign-dev.pages.dev`。

两个域名都 **Active + SSL enabled** 即完成（证书自动签发）。

---

## 三、日常更新（网站有改动时）

### 方式 A：一键命令（推荐）

```powershell
cd C:\Users\Administrator\.meituan-catpaw\3036078262\desk_default_workspace\kcharts
npm run build && npm run deploy
```

流程自动完成：构建 → 同步到 `deploy/kcharts` → wrangler 上传 Pages → 线上即时生效。
首次使用前需配置 API Token，见「第五节」。

### 方式 B：手动拖 zip（Token 未配置时的兜底）

1. 本地构建并打包（或让 AI 助手代劳，会得到 `site.zip`）：

   ```powershell
   npm run build
   # 把 deploy\index.html 与 deploy\kcharts 打进 zip 根层（不能多包一层 deploy 文件夹！）
   ```

2. 浏览器打开 dash.cloudflare.com → Workers & Pages → 点 `kdesign-dev` 项目 → 右上角「**Create deployment**」→ 把 `site.zip` 拖入 → Deploy。
3. 几十秒后线上更新完成。

> 提示：Pages 的 Deployments 列表保留每次部署记录，出问题可在某次部署的「···」菜单里 **Rollback to this deployment** 一键回滚。

### git 习惯

改动先提交 `dev` 分支；阶段性稳定后合入 `master`。等网络可以访问 GitHub 时再推远端（届时 Pages 可改连仓库实现 push 自动部署，Direct Upload 项目无法直接转 Git 连接，需用 `wrangler pages deploy` 继续，效果等同）。

---

## 四、新项目上线（例：UI 组件库 → /ui/）

以新库 `kui` 为例，目标地址 `https://kdesign-dev.com/ui/`：

1. **新项目 vite 配置**设置子路径：

   ```ts
   // kui/vite.config.ts
   export default defineConfig({ base: '/ui/', /* ... */ })
   ```

2. 构建：`npm run build` → 产物在 `kui/dist`。
3. 把产物拷入 kcharts 的聚合部署目录：`kcharts\deploy\ui\`（与 `kcharts\` 平级）。
4. **门户页加卡片**：编辑 `kcharts\deploy\index.html`，把对应「敬请期待」占位卡改为真实链接（仿照 KCharts 卡片：`<a class="card" href="/ui/">`）。门户页只有一张 index.html，改起来直观。
5. 发布：`npm run deploy`（方式 A）或重打 zip 拖拽（方式 B）。

验证：浏览器访问 `https://kdesign-dev.com/ui/` 与门户页卡片跳转。

> 注意：如果新项目路由使用 history 模式（无 `#`），需确认托管回退策略；hash 路由（如 KCharts）则零配置。

---

## 五、Cloudflare API Token 配置（方式 A 一次性准备）

1. Cloudflare 控制台 → 右上角头像 →「**My Profile**」→ 左侧「**API Tokens**」→「**Create Token**」。
2. 用「**Create Custom Token**」：
   - 权限：`Account` → `Cloudflare Pages` → **Edit**（再加一条 `Account` → `Account Settings` → Read 更稳）
   - Account Resources：Include → 你的账号
   - Zone Resources：不用配
3. 创建后**立即复制 Token**（只显示一次），发给 AI 助手或自行写入文件：

   ```
   C:\Users\Administrator\.meituan-catpaw\3036078262\desk_default_workspace\kcharts\.cloudflare-token
   ```

   （该文件已加入 .gitignore，不会被提交；泄露风险仅限本机。）
4. 验证：`npm run deploy` 看到「Upload complete」即成功。

---

## 六、常见问题

| 现象 | 原因与处理 |
|---|---|
| 网址里有 `#` | hash 路由的标志，对静态托管零配置、永不怕刷新 404；想去掉需切 history 模式（当前决定：保持现状） |
| 更新后页面没变化 | CDN/浏览器缓存：Ctrl+F5 强刷；Pages 默认对带 hash 文件名的资源长期缓存，index.html 不缓存，一般无此问题 |
| `npm run deploy` 报未找到 Token | 见第五节；或确认 `.cloudflare-token` 文件在项目根目录且无多余空行 |
| `npm install` 报 `@volar/language-service@2.4.30 notarget` | 已在 package.json `overrides` 钉住 `@volar/typescript@2.4.28` 修复；若将来升级依赖再遇到，可同步更新 overrides |
| 首页打开 404 | zip 结构错误（多包了一层文件夹）——zip 根层必须直接是 `index.html` 和 `kcharts\` |
| 子路径页面 404（如 /kcharts/xxx） | hash 路由不该出现；若某子站用了 history 路由，需在该站根放 `_redirects` 或确认 Pages SPA 回退 |
| 证书警告 | Custom domains 状态需为 Active + SSL enabled；新加域名证书签发需几分钟 |
| GitHub 推不动 | 国内网络直连 github.com:443 被阻。开代理后告诉 AI 助手代理端口，配置 `git config http.proxy http://127.0.0.1:端口` 再推；仓库结构已备好（dev/master） |

---

## 七、一次完整发布的检查清单

1. [ ] `npm run build` 无报错
2. [ ] `npm run deploy`（或手动 zip）成功，输出 Upload complete
3. [ ] 浏览器强刷门户页与 `/kcharts/` 确认更新生效
4. [ ] git 提交到 dev 分支（重要改动合 master）
