# 本地一键起 / 停：pwsh deploy/local-up.ps1   |   pwsh deploy/local-up.ps1 -Down
# 作用：确保基础镜像可用 → 构建 nepenthe-web:local → 起 db/migrate/web → 等健康 → 库空时灌种子 → 打印地址
param([switch]$Down, [switch]$NoBuild)

$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)   # web/

function Say($m) { Write-Host "[local] $m" }

if ($Down) {
  docker compose -f docker-compose.local.yml down
  Say '已停止（数据保留在 pgdata-local 卷里，下次 up 直接接着用；要清空加 --volumes）'
  exit 0
}

# 1) 基础镜像：Dockerfile 用 node:22-alpine，国内经常拉不动，先从镜像站取再打标签
$hasBase = docker images node:22-alpine --format '{{.Repository}}:{{.Tag}}'
if (-not $hasBase) {
  Say '没有 node:22-alpine，尝试从 docker.m.daocloud.io 拉取…'
  docker pull docker.m.daocloud.io/library/node:22-alpine
  if ($LASTEXITCODE -ne 0) { throw '基础镜像拉取失败：请给 Docker Desktop 配一个可用镜像源，或手动 docker pull node:22-alpine' }
  docker tag docker.m.daocloud.io/library/node:22-alpine node:22-alpine
}

# 2) 构建 + 启动
if ($NoBuild) {
  Say '跳过构建，直接 up'
  docker compose -f docker-compose.local.yml up -d
} else {
  Say '构建镜像并启动（首次会比较慢，之后走缓存）'
  docker compose -f docker-compose.local.yml up -d --build
}
if ($LASTEXITCODE -ne 0) { throw 'compose up 失败，看上面日志' }

# 3) 等健康
Say '等待 web 健康检查…'
$ok = $false
for ($i = 0; $i -lt 40; $i++) {
  Start-Sleep -Seconds 2
  try {
    $r = Invoke-WebRequest 'http://127.0.0.1:3100/api/health' -UseBasicParsing -TimeoutSec 5
    if ($r.StatusCode -eq 200 -and $r.Content -match '"db":true') { $ok = $true; break }
  } catch { }
}
if (-not $ok) { throw 'web 没起来，docker compose -f docker-compose.local.yml logs web --tail 40 看日志' }

# 4) 空库灌种子（宿主机跑，读的是 web/prisma/seed-data）
$counts = docker exec nepenthe-local-db-1 psql -U nepenthe -d nepenthe -tAc 'select count(*) from "Post";' 2>$null
if ([string]::IsNullOrWhiteSpace($counts) -or [int]$counts -eq 0) {
  Say '库里还没有文章，导入旧站内容…'
  if (Test-Path 'node_modules\.bin\tsx.cmd') {
    $env:DATABASE_URL = 'postgresql://nepenthe:nepenthe@127.0.0.1:55433/nepenthe?schema=public'
    npm run db:seed
  } else {
    Say '宿主机没装依赖（缺 node_modules），先 npm ci 再跑一次本脚本即可自动灌种子'
  }
} else {
  Say "库里已有 $counts 篇文章，跳过种子"
}

Say '起来了：'
Say '  前台  http://127.0.0.1:3100'
Say '  后台  http://127.0.0.1:3100/admin'
Say "  账号  $($env:ADMIN_USERNAME ?? 'admin') / 密码见 web/.env"
Say '  数据库 127.0.0.1:55433（user/pass/db 都是 nepenthe）'
Say '  关掉  pwsh deploy/local-up.ps1 -Down'
