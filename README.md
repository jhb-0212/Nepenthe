# 忘忧居 · Nepenthe

> 闲来无事，坐看云起。

个人站点。宣纸底 + 水墨山水，正文用宋体，配色只有墨青和一点琥珀。

## 结构

| 目录 | 是什么 |
| --- | --- |
| `web/` | 站点本体：Next.js 16 + Prisma + PostgreSQL，前台、后台 `/admin`、API 都在这里 |
| `web/prisma/seed-data/` | 随仓库带的内容种子（文章、随记、小说、站点设置），空库时灌入 |
| `web/deploy/` | 本地 Docker 预览，以及服务器用的 nginx 配置 |
| `server/` | 旧站（Astro 时代）的 FastAPI 后台，已停用，待清理 |
| `deploy/` | 旧站的 nginx / systemd 文件，已被 `web/deploy/` 取代，待清理 |

## 本地跑

```powershell
cd web
./deploy/local-up.ps1     # 起数据库 + web，跑在 http://127.0.0.1:3100
```

只调样式时也可以只跑 Next：

```powershell
cd web
npm ci
npm run dev
```

## 部署

`web/` 自带 `Dockerfile` 与 `docker-compose.yml`，静态资源交给 `web/deploy/nginx.conf`。

旧的 Astro 部署流程（`.github/workflows/deploy.yml`）已随旧站一起删除，CI 待重建。

## 内容怎么改

后台 `http://127.0.0.1:3100/admin`，账号 `admin`，密码见 `web/.env`。

数据库是编辑时的唯一数据源；`web/prisma/seed-data/` 只在空库时使用，不会覆盖后台改过的内容。

更多细节见 [`web/README.md`](web/README.md)。
