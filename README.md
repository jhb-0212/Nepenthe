# 忘忧居 · 动态站（Next.js）

原来的 Astro 静态站 + FastAPI 构建式发布，改成了**单个 Next.js 应用**：App Router + Server Actions + Prisma + PostgreSQL 16，内容改完即时生效，服务器上不再跑 `astro build`。

```
浏览器
  │
  ├── Next.js (App Router, standalone, :3100)
  │     ├── 前台页面：服务端直连数据库渲染（force-dynamic）
  │     ├── /admin：Server Actions + HttpOnly Cookie 鉴权
  │     ├── /api/music   网易云音频流代理（Range / Cookie）
  │     ├── /api/hit     访问埋点（sendBeacon，脱敏入库）
  │     ├── /api/stream  SSE：最近 5 分钟在读什么
  │     ├── /api/publish/stream  SSE：发布任务进度
  │     └── /api/search  Meilisearch / PostgreSQL 兜底
  │
  ├── PostgreSQL 16    内容 + 访问 + 版本快照 + 发布任务
  ├── Meilisearch      中文分词检索（可选，不配就退回 PG）
  └── nginx            反代 + 静态长缓存 + SSE 关缓冲 + 限流
```

## 为什么这么选

- **不重画页面**：`global.css` / `extra.css` 原样复用（8 万行样式零改动），组件逐个从 `.astro` 迁成 `.tsx`，类名不变。
- **发布即生效**：内容全部来自数据库，页面 `force-dynamic`；「发布」变成「重建搜索索引 + 失效缓存」，毫秒级，不再有「构建失败但线上还是旧版」的中间态。
- **Prisma 替代 SQLAlchemy + Alembic**：schema 即文档，`prisma migrate deploy` 一条命令升级；Alembic 只在纯 Python 栈里存在，这里不需要，也不该同时维护两套迁移。
- **SSE 而不是轮询**：实时阅读和发布进度都是一条长连接，nginx 那侧关掉 buffering，服务端每 3 秒推一次聚合快照，断开自动重连。

## 本地跑

### 方式 A：一条命令起整套（推荐，和线上同一份镜像）

```powershell
pwsh deploy/local-up.ps1          # 首次会构建镜像，之后走缓存，几十秒
```

脚本会做四件事：确认 `node:22-alpine` 基础镜像在本地（没有就从 `docker.m.daocloud.io` 拉再打标签）→ `docker compose -f docker-compose.local.yml up -d --build` → 等 `/api/health` 返回 `db:true` → 发现库里没文章时自动 `db:seed` 灌旧站内容。

起起来后：

- 前台 <http://127.0.0.1:3100/>
- 后台 <http://127.0.0.1:3100/admin>（`admin` / `.env` 里的 `ADMIN_PASSWORD`）
- 数据库 `127.0.0.1:55433`（user/pass/db 都是 `nepenthe`，方便 DBeaver 直连）

三个容器：`nepenthe-local-db-1`（PostgreSQL 16）、`nepenthe-local-migrate-1`（跑完 `prisma migrate deploy` 就退出）、`nepenthe-local-web-1`（standalone 产物 `node server.js`）。

- 停：`pwsh deploy/local-up.ps1 -Down`（数据留在 `pgdata-local` 卷里，下次 up 接着用；要清空加 `--volumes`）
- 不上传图片也能跑；上传的照片落在宿主机 `data/uploads/`，重建容器不丢
- 本地不跑 Meilisearch，`MEILI_HOST` 留空 → 搜索自动退回 PostgreSQL
- 改代码后重建：`docker compose -f docker-compose.local.yml up -d --build web`
- 换端口：改 `docker-compose.local.yml` 里 `127.0.0.1:3100:3100` 左边

### 方式 B：宿主机直接跑（改代码最快，热更新）

```powershell

# 1) 起一个本地 PostgreSQL（宿主机 5432 常被占用，这里用 55432）
docker run -d --name nepenthe-pg-dev -p 55432:5432 ^
  -e POSTGRES_PASSWORD=nepenthe -e POSTGRES_USER=nepenthe -e POSTGRES_DB=nepenthe ^
  postgres:16-alpine

# 2) 依赖 + 建表 + 灌旧站内容
npm install
npm run db:migrate     # prisma migrate deploy，按 prisma/migrations 建表
npm run db:seed

# 3) 跑起来
npm run dev        # http://127.0.0.1:3100
```

注意 `.env` 里的 `DATABASE_URL` 要跟着选的方式走：方式 A 用 `127.0.0.1:55433`，方式 B 用 `127.0.0.1:55432`。

改了 `schema.prisma` 之后：`npx prisma migrate dev --name 说明` 生成迁移文件，提交进仓库；服务器上只跑 `migrate deploy`，不会再 `db push` 猜结构。

- 健康检查：`/api/health`（数据库不通返回 503）

## 已验证

- 生产模式（`npm run start`）全站路由 200，`/admin` 未登录 307 跳登录页，`/api/health` 返回 `{"ok":true,"db":true}`。
- 端到端脚本 `tools/e2e.mjs`：登录 → 发布（重建索引）→ 保存文章 → 前台新文章 callout/高亮渲染 → 搜索命中 → 埋点后实时条出现「最近 5 分钟 N 次阅读」。
- 迁移：空库上 `prisma migrate deploy` 一次建全所有表；本地库由 `migrate reset + seed` 重建。
- standalone 产物：把 `.next/standalone` + `.next/static` + `public` 拼起来直接 `node server.js`，健康检查和首页都正常 —— 这就是容器里的运行形态。
- `docker compose config` 通过。
- 本轮新增也都验过：`/sitemap.xml`（15 条 URL，含 3 篇文章与 2 个章节）、`/robots.txt` 指向 sitemap、`/writing` 在停库时出 500 错误页、版本历史「保存两次 → 回滚到上一版 → 正文正确回来 → 再保存恢复原样」。
- 后台五个模块全链路跑过：随记、小说 + 章节、曲目、站点设置、相册。`tools/verify-admin.mjs` 走完 14 步（登录 → 发文 → 插图 → 上传 → 改随记 → 建小说 → 建章节 → 加曲目 → 改站点 → 相册上传 2 张 → 导出 JSON / Markdown）。
- 上传管道：非图片文件被 400 拒、超大文件 413、正常 JPG 落成 `public/uploads/202611/<hex>.webp`（2592B）、GET 该 URL 返回 `image/webp`、文章页 `<img>` 正常渲染。
- 导出：`/api/admin/export` 全量 JSON 200，`/api/admin/export/md` 3KB 且正文完整。
- **Linux 侧独立复验过一遍**（Ubuntu 22.04 + PostgreSQL 14，等价于容器的运行形态）：`npm ci` → `prisma migrate deploy`（两份迁移一次过）→ seed 拿到与线上一致的 3 篇 / 3 随记 / 1 部 2 章 / 5 曲目 → `next build` 13.9s 编译成功、standalone 产物正常生成（Windows 上那个 tracing symlink 报错在 Linux 不存在）。
- standalone 产物里 `sharp 0.35.5 / libvips 8.18.7` 与 `@img/sharp-linux-x64` 都在，`node server.js` 起后 16 条路由（含 `/admin/login`、`/wall`、`/uploads`、`/api/health`）全 200，`/api/health` 返回 `{"ok":true,"db":true}`，`/sitemap.xml` 16 条 URL。
- 该环境下带会话真实上传：1600×1200 JPG → `{"ok":true,"url":"/uploads/202611/…webp","bytes":3484}`，回读 200 / `image/webp`；伪造 JPG 被 400 拒（「这个文件不是能识别的图片」）；未登录 401；`/uploads/../etc/passwd` 与非法文件名均 404。
- 停掉 PostgreSQL 后：`/api/health` 立刻 `db:false`，前台页面降级为空列表（`lib/prisma.ts` 的兜底）而不是 500；恢复后立即回正。
- **本机 Docker 镜像真的构建出来了**：`docker build` 通过（`node:22-alpine` 从 `docker.m.daocloud.io` 取后打标签绕开 registry-1.docker.io 不通的问题），`docker-compose.local.yml` 三个容器全部 healthy，容器内 `sharp 0.35.5 / libvips 8.18.7` 可用；15 条路由全 200；带会话上传 1400×1000 JPG → `/uploads/202611/…webp` 2592B，回读 `image/webp`，文件落在宿主机 `data/uploads`。



见 `.env.example`，关键几项：

| 变量 | 说明 |
| --- | --- |
| `DATABASE_URL` | PostgreSQL 连接串 |
| `PUBLIC_SITE_URL` | 对外地址，决定 canonical、埋点来源白名单、Cookie 是否 Secure |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | 首次登录时据此建管理员；生产环境拒绝默认口令 |
| `SECRET_KEY` | JWT 签名密钥，多实例必须一致 |
| `MEILI_HOST` / `MEILI_KEY` | 留空则搜索退回 PostgreSQL |
| `NETEASE_COOKIE` | 填了能放完整歌曲，不填只有试听片段 |
| `TRUST_PROXY` | 只信任反代写的 `X-Forwarded-For` 时才设 1 |

## 数据模型

| 表 | 内容 |
| --- | --- |
| `Post` / `Note` / `Novel` / `Chapter` | 文章、随记、作品、章节；`draft` 只影响前台展示 |
| `Album` / `Photo` | 相册与照片，照片文件在 `public/uploads/YYYYMM/`（上传时压成 WebP） |
| `Track` / `Doing` / `SiteSetting` | 曲目、在做的事、站点文案 |
| `Visit` | 访问记录：只存 `sha256(IP+UA+当日盐)` 前 16 位，原始 IP 不入库 |
| `ContentVersion` | 每次改文章/随记前后自动存快照，误删能回滚 |
| `LoginFailure` | 登录失败记录，落库保证重启后限流依然生效 |
| `PublishJob` | 发布任务，SSE 读它的进度 |
| `Message` | 匿名留言：`approved` 前前台不可见，`hidden` 为软删，`ipHash` 只存加盐哈希 |

## 后台能做什么

- 登录：bcrypt + JWT Cookie（HttpOnly / SameSite=Lax），失败 6 次锁 15 分钟。
- 文章：增删改（Server Actions），保存时自动写版本快照，slug 冲突有明确提示。
- 版本历史：文章页底部列出最近 12 份快照，可展开看正文、一键回滚；回滚前会把当前版本再存一份，所以回滚也能回滚。
- 发布：重建 Meilisearch 索引，进度通过 SSE 推送；不跑构建、不重启进程。
- 仪表盘：各类计数（文章 / 随记 / 小说 / 照片 / 曲目 / 访问 / 留言待审）、最近更新、发布记录，以及 11 个入口按钮。
- 随记 `/admin/notes`：列表 + 编辑器，slug 自动生成、可草稿。
- 小说 `/admin/novels`：作品列表 + 简介 / 封面 / 状态；进入作品后是章节列表，章节按 `order` 排序编辑，`novelId + slug` 唯一。
- 曲目 `/admin/music`：歌名 / 歌手 / 网易云 songId（必须纯数字，前端校验后落库）/ 封面 / 排序。
- 站点设置 `/admin/site`：标量字段表单 + `bio` / `doing` / `facts` 三个 JSON 数组文本框；JSON 解析失败不写库，整份 `upsert key='site'` 后 `revalidatePath('/', 'layout')` 即时生效。
- 相册 `/admin/gallery`：多选上传 → 逐张走上传接口 → 落 `Photo` 行；图说 / 排序可改、照片与相簿可删；空相簿有「还没有照片」提示。
- 访问统计 `/admin/stats`：近 14 天补零柱状图、近 7 天热门路径、浏览器与来源两栏，全部 `groupBy` 聚合；全零时给空态文案而不是一排空柱子。
- 导出：`/api/admin/export`（全量 JSON）、`/api/admin/export/md`（拼成单份 Markdown），登录态保护。

## 图片上传管道

`src/lib/upload.ts` 是唯一入口，规则：

- 只认 magic bytes，不认后缀（`sharp` 解不出图就 400），SVG 天然被挡（避免 `<script>` 型 XSS）。
- 上限 12MB、4000 万像素（解压炸弹）；`rotate()` 按 EXIF 摆正，长边压到 2560，转 WebP q88，元数据剥光（原图 GPS 不会带到公网）。
- 落盘 `public/uploads/YYYYMM/<20 位 hex>.webp`，文件名不含原始名，避免中文 / 空格 / 路径穿越。
- 接口 `/api/admin/upload` 走 Cookie 会话鉴权：401 未登录 / 413 请求过大 / 400 非图片。
- **为什么要 `/uploads/[...path]` 这条路由**：Next 的 `public/` 在构建时生成静态清单，运行期新写进去的文件直接 404。所以文件仍然落在 `public/uploads/`（方便本地预览、也方便挂 volume），但对外由 `src/app/uploads/[...path]/route.ts` 读盘返回，正则白名单 `^\d{6}/[a-f0-9]{16,40}\.(webp|jpg|jpeg|png|gif|avif)$` 挡路径穿越，响应头带 `immutable` 长缓存。
- 编辑器里「插入图片」按钮：上传成功把 `![name](/uploads/…)` 插到光标处，写完直接发布就能看到。
- 部署时 `./data/uploads` 挂到 `/app/public/uploads`（compose 已配），不挂 volume 重建镜像照片就没了。

## SEO 与分享

- `/sitemap.xml` 运行时从库里生成：静态页 + 已发布文章 + 小说 + 章节，带 `lastmod`；数据库挂了也至少保住静态页。
- `/robots.txt` 动态生成，`Disallow /search/`、`/admin`，并指向 sitemap（不再写死域名）。
- 分享图 `/og-image.jpg`（1200×630，71KB）。生成方式：`node tools/og.mjs`（用 Edge 渲染 `tools/og.mjs` 里那段 HTML 再压成 JPEG，所以中文字体不会掉）。
- `themeColor` 已挪到 `viewport` 导出，跟宣纸底色 `#f8f6f1` 对齐，手机状态栏不会再压一条深色。

## 出错与加载

- `app/error.tsx`：数据库没起来 / 部署中，页面显示「这条河，暂时断流了」+ 再试一次 + 错误编号，而不是白屏。
- `app/loading.tsx`：取数慢时给骨架屏，不再是空白。
- 两者都实测过：`docker stop` 掉数据库再访问 `/writing`，错误页正确出现；恢复后 `/api/health` 立即回正。

## 留言墙（匿名 + 人工审核）

前台 `/wall`，后台 `/admin/wall`。不用注册、不用登录，写一句就走；进库时 `approved=false`，前台查不到，必须人工点「通过」才出现。

防刷不靠验证码，靠四层（都不打扰真人）：

1. **蜜罐字段**：`website` 藏在视口外、不吃 tab 焦点，bot 会自动填 → 假装成功但丢弃。
2. **时间闸**：页面渲染到提交不足 3 秒、或超过 6 小时（页面挂太久）→ 不落库。
3. **同 IP 哈希**：10 分钟最多 2 条、24 小时 5 条、两条之间至少 60 秒。IP 只存 `sha256(IP+UA+当日盐)` 前 16 位，跟 `Visit` 表同一套脱敏。
4. **内容门槛**：4–400 字、昵称 ≤12 字、正文不许出现链接（`http://`、`www.`、常见 TLD 都拦）。

审核操作：通过 / 下架（软删，`hidden=true` 保留原文备查）/ 放回待审 / 彻底删除 / 备注（`note` 只有自己能看）。后台仪表盘有「留言待审」计数，待审时入口按钮带数字。

已验证：带链接的提交被拒、正常提交后前台不可见、后台待审出现、点「通过」后前台立即可见。

## 部署到阿里云（Ubuntu 22.04 / 24.04）

1. **装 Docker**（官方脚本），打开 80 端口安全组。
2. 把仓库传到 `/opt/nepenthe`。
3. 写 `.env`（和 `docker-compose.yml` 同目录）：

```bash
POSTGRES_PASSWORD=换成强口令
ADMIN_USERNAME=admin
ADMIN_PASSWORD=换成强口令
SECRET_KEY=$(openssl rand -hex 32)
MEILI_KEY=$(openssl rand -hex 24)
PUBLIC_SITE_URL=http://你的公网IP
# NETEASE_COOKIE=...
```

4. 起服务：

```bash
cd /opt/nepenthe
docker compose up -d --build
# migrate 会先跑完 prisma migrate deploy，web 才启动
curl -fsS http://127.0.0.1:3100/api/health
```

5. 只有第一次需要把旧站内容灌进库（之后都在后台写）：

```bash
docker compose --profile seed run --rm seed
# 或者更稳的做法：本地 pg_dump 出来，服务器 pg_restore 进去
```

6. 访问 `http://公网IP/`，后台 `http://公网IP/admin`。

**没有域名时**：直接用 `http://IP` 访问，`PUBLIC_SITE_URL` 也填 IP；此时 Cookie 不加 `Secure`（脚本会按 `PUBLIC_SITE_URL` 是否 `https://` 自动判断）。等备案下来再挂域名 + 证书，改一行 `PUBLIC_SITE_URL` 重启即可。

**关于备案**：阿里云大陆节点绑定域名解析必须备案，未备案的域名会被拦；IP 直连不受影响，但 80 端口备案前也可能被限制，必要时先用 `8080` 之类的高位端口验收。

### 用 GitHub Actions 做 CD

`.github/workflows/deploy.yml` 已配好：

1. `ci`：起 Postgres 服务，`prisma migrate deploy` + seed + `next build`，类型错误和迁移冲突直接拦在合并前。
2. `deploy`：构建镜像推 GHCR，SSH 到服务器 `docker compose pull web` → `run --rm migrate` → `up -d --no-deps web`，最后 `curl /api/health` 做健康检查。

需要在仓库 Secrets 里配：`SSH_HOST`、`SSH_USER`、`SSH_KEY`、`GHCR_TOKEN`。

## 安全取舍

- 口令 bcrypt，比较前按 72 字节截断（bcrypt 硬限制）；登录失败限流落库。
- Cookie HttpOnly + SameSite=Lax，HTTPS 下自动 Secure。
- Server Actions 自带 Origin 校验与加密 action id；埋点接口另做 Origin 白名单 + IP 限流。
- Markdown 渲染走白名单 sanitize（`javascript:` / `data:` 链接直接删，`on*` 属性全删），后台写的内容不会变成存储型 XSS。
- 访客 IP 不落库、不进日志；`X-Forwarded-For` 只在 `TRUST_PROXY=1` 时采信。
- 反向代理只暴露 nginx，应用端口绑 `127.0.0.1`，数据库不对外映射。

## 已知限制 / 下一步

- 上传没有做「按需缩略图」：列表页直接加载 2560px 的 WebP，照片多了会吃流量；后续可以再加一层 `<img srcset>` 或 `sharp` 预生成 480 / 960 两档。
- 相册删除只删库行，磁盘文件保留（避免误删；定时清理脚本还没写）。
- 缓存目前靠 `force-dynamic` 直连 PG；流量上来后再加 Redis 版本号失效（`REDIS_URL` 预留了）。
- 音乐歌单 ID 仍是旧站那份，如果换网易云歌单要改 `settings.site.playlistId`。
- 生产镜像里 `sharp` 的 `@img/sharp-linux-x64` 需要在 Linux 侧跑一次 `node -e "require('sharp')"` 确认（Windows 本机 tracing 报 symlink 失败，Dockerfile 已显式 COPY `node_modules/sharp` 与 `@img` 兜底）。

## 音乐：网易云 + QQ 双源

曲目 `songId` 有两种形态，前端按形态自动选源，一个站点可以混着放：

- **纯数字**（如 `7072290`）→ 网易云歌曲 id
- **字母数字混排**（如 `001if23h0TDFmD`）→ QQ 音乐 songmid

歌词两家都不需要登录：网易云走 `music.163.com/api/song/lyric`，QQ 走 `c.y.qq.com/.../fcg_query_lyric_new`。前台 `/music` 有歌词面板：跟着播放高亮当前句、自动居中、点一句跳过去。遇到「纯音乐/未收录」的歌，接口只给占位文本，面板里会显示一行提示。

播放地址的差别：

| 源 | 没 cookie | 有 cookie |
| --- | --- | --- |
| 网易云 | 自动退到 30 秒试听（Apple 公开片段） | `NETEASE_COOKIE` → 完整歌曲 |
| QQ 音乐 | 自动退到 30 秒试听（Apple 公开片段） | `QQ_COOKIE` → VIP 完整地址 |

`QQ_COOKIE` 至少要有 `uin=` 和 `qm_keyst=`，从登录 y.qq.com 的浏览器里复制整条。

试听的实现：`/api/music?type=url` 在拿不到完整地址时，用曲目名 + 歌手去 iTunes Search API 查 30 秒公开试听片段（港 → 台 → 美 三个区依次尝试），缓存 6 小时。这不需要任何账号，也不算绕版权——就是官方公开试听。前端会把进度条按 30 秒显示，并在时间轴右侧标「试听 · 30 秒」。

**安全提醒**：cookie 是登录凭证，把它放在服务器上等于把会员权益开放给所有访问者。QQ 音乐的用户协议禁止账号共享，公开站点长期这么跑有封号风险，cookie 过期还得手动换。更稳的做法是把想听的音频自己托管（上传 mp3 走现有 `/uploads` 管道），或只在本地/私密环境里用 cookie。

### 播放器只有一台，全站共用

`src/components/PlayerProvider.tsx` 挂在根布局里，里面放唯一那个 `<audio>`。首页的 `NowPlaying` 和 `/music` 的 `MusicStage` 都只读这份状态（曲目、进度、播放/暂停），所以：

- 在音乐页点「山丘」，回首页那张 NOW PLAYING 卡就是山丘，进度也接得上；
- 在首页点播放，跳去 `/music` 歌不重头，歌词直接从当前时间对齐；
- **站内跳转（点导航）播放不中断**——布局不会被卸载，`<audio>` 一直在；只有整页刷新（F5）才会断，这是浏览器行为，前端路由下正常。
- 切到别的浏览器标签页再回来，会重新同步一次时间，避免时间轴漂移。

歌词与曲目改成左右两列（`\.music-cols`，980px 以下自动叠成一列）：左栏歌词跟唱高亮、点句跳转，右栏是曲目单。


### 关于我页：从「标签格子」改成「一页自述」

原来的 `/about` 是一堆等宽信息卡（基本信息 / 联系方式 / 技能栈 / 爱好 / 时间线 / 喜欢），信息全但没有语气。重做后按「一篇短文的顺序」组织，读者从上往下读完就大致知道这人什么性子：

| 段落 | 作用 | 数据来源 |
|---|---|---|
| 开篇 | 一句判断做标题（「三件事并行，一件都还没做完」）+ 三行自述 + 三个身份小签 + 落款月份 | `site.bio` / `site.mark` |
| 壹 · 三句实话 | 三句自嘲式的自我判断，右侧配一句括注 | 组件内 `truths` 常量 |
| 贰 · 此刻在做 | 三件正在推进的事，各带状态标签（推进中 / 想起就写 / 未收尾）和一句现状 | 组件内 `now` + `site.facts` |
| 叁 · 手上这些工具，拿它做什么 | 技能改成「用途 → 工具」，每行先一句它拿来干什么 | 组件内 `skills` |
| 肆 · 玩什么 | 两张大卡（时长最长的）+ 三张小卡，每张底下一句为什么玩 | 组件内 `games` |
| 伍 · 来路 | 时间线每节点加一句当时的心境旁白 | 组件内 `timeline` |
| 陆 · 听什么，看什么 | 常听 / 爱看 + 一段「写不出东西时听什么」 | 组件内 `likes` |
| 落款 | 一段邀约 + 四个联系方式，收在带渐变的卡片里 | `site.contact` |

视觉上的几处「人味」：头像做成圆形照片压在朱砂印章上（印章是纯 CSS，`writing-mode: vertical-rl` 竖排「忘忧」）；小节标题用汉字编号（壹 贰 叁…）+ 延伸细线；括注与旁白统一用衬线斜体，弱一档颜色；卡片和分隔线从「盒子」退成「纸上的横线」，整页更接近版式而不是仪表盘。

> 改文案的位置：`truths` / `now` / `skills` / `games` / `timeline` / `likes` 都是 `src/app/about/page.tsx` 顶部的常量数组，改字不用碰样式；自我介绍那三行仍在后台「站点设置 → 简介」里（`site.bio`）。样式集中在 `src/styles/live.css` 末尾的「关于我 · 重做」段。

#### 「玩什么」的配图

五张插图是 AI 生成的水墨/版画风（`public/games/`），不是游戏官方美术，所以既没有版权问题，页面右上角也明确写了一句「跟游戏官方美术没有关系」。文件：

| 卡片 | 文件 | 原始尺寸 |
|---|---|---|
| 王者荣耀 | `public/games/wangzhe.webp` | 1280×720 · 122KB |
| 三角洲行动 | `public/games/delta.webp` | 1280×720 · 89KB |
| 黑神话：悟空 | `public/games/wukong.webp` | 1280×720 · 103KB |
| 凡人修仙传 | `public/games/fanren.webp` | 1280×720 · 61KB |
| 剑来 | `public/games/jianlai.webp` | 1280×720 · 134KB |

图片走 `/games/...`，是构建期就在 `public/` 里的静态资源，不经过上传管道。想换图：直接替换同名文件（保持 1280×720、WebP），或改 `page.tsx` 里 `games` 数组的 `img` 字段。卡片比例桌面 16:9（大卡 16:8）、移动 3:2，`object-fit: cover` 会自己裁，不用先裁图。生成脚本留了 `tools/games-webp.cjs`，下载后重跑就能重新压缩成 WebP。


### 关于页内容搬进后台（可维护性）

之前这一页的全部文案和配图都硬编码在 `src/app/about/page.tsx` 的常量里，改一个标点都要改代码 + 重新构建。现在改成数据库驱动：

- **存储**：`SiteSetting` 表的 `about` 键（JSON），与 `site` 键并列；页面每次请求都读库（全站 `force-dynamic`），所以保存后前台刷新即生效，**不需要重新构建，也不需要重启容器**。
- **编辑入口**：后台导航栏「关于页」→ `/admin/about`。每一段是一个折叠区块，字段直接对应前台的位置；列表都能「＋ 加一行」、`↑ ↓` 调顺序、`删` 删掉。
- **配图**：每张卡的缩略图旁边有「上传 / 换图 / 去掉」，走已有的 `/api/admin/upload`（校验 magic bytes、压 WebP、剥 EXIF），也可以直接填图片地址（`/games/xxx.webp` 或 `/uploads/…`）。
- **容错**：`src/lib/about.ts` 里的 `normalizeAbout()` 对每个字段做宽松解析——库里少字段、类型不对、甚至整行写坏，都退回 `DEFAULT_ABOUT` 的对应值，不会让前台 500。库连不上时 `getAbout()` 直接返回默认内容。
- **代码结构**：`src/lib/about.ts`（类型 + 默认值 + 读取）、`src/actions/about.ts`（`saveAbout`，带 `requireAdmin`、校验后 upsert、`revalidatePath`）、`src/components/AboutForm.tsx`（可视化编辑器）、`src/app/admin/about/page.tsx`。

> 还没搬的部分：三段自我介绍仍在「站点设置 → 个人简介」（`site.bio`），落款月份在「站点设置 → 角标文字」（`site.mark`），联系方式也在站点设置里——它们本来就和首页共用，放一起更合理。


### 其他页面：文案也进了后台（`/admin/pages`）

起先只有「关于我」是数据驱动的，其余页面的页头、空态、横幅还写死在各个 `page.tsx` 里。现在统一抽成一份配置：

- **存储**：`SiteSetting` 的 `pages` 键，结构是每个页面一份 `{ kicker, title, lead, sub, note }`：
  - `kicker` 小标签（WORDS / NOTES / SOUND…）
  - `title` 大标题
  - `lead` 一句说明，同时**作为该页的 SEO description**（`generateMetadata()` 从库里读）
  - `sub` 副句 / 第二段（「在做」页那段自述、相册横幅第二行都在这儿）
  - `note` 空态提示或页脚小字
- **覆盖页面**：文章、随记、小说、相册（含横幅背景图）、归档、音乐、在做、留言、搜索，共 9 个。
- **入口**：后台「页面文案」→ `/admin/pages`，九个区块，每块带「看这一页 ↗」。
- **容错**：`normalizePages()` 逐页逐字段兜底，少一页或某页少字段都退回 `DEFAULT_PAGES`。
- **代码**：`src/lib/pages.ts`（类型 + 默认值 + `getPages()`）、`src/actions/pages.ts`（`savePages`）、`src/components/PagesForm.tsx`、`src/app/admin/pages/page.tsx`；各页 `page.tsx` 里原来的 `export const metadata` 改成 `generateMetadata()`，正文改成读 `pages.xxx`。

实测：在后台把文章页标题改成「写字的地方」、说明改成一段测试文字，保存后 `/writing` 立刻变（标题、说明、`<meta name="description">` 全部同步），再改回去也正常；11 条路由全部 200。

> 仍然写在代码里的：`about/page.tsx` 的汉字序号（壹贰叁…）、各页的结构性小标题（如「手上这些工具，拿它做什么」属于 about 配置里，可改）、SVG 装饰与动画参数（归档页那条河、随记页的云气线）——这些是版式而非文案，改它们就是改设计。
