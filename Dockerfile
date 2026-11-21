# ---------- 依赖层 ----------
FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci || npm install
RUN npx prisma generate

# ---------- 构建层（也被 migrate 服务复用：里面有 prisma CLI） ----------
FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# 构建期不需要真连数据库：页面全是 force-dynamic，Prisma 只做类型生成
RUN npx prisma generate && npm run build

# ---------- 运行层 ----------
FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl curl \
 && npm i -g prisma@6.19.3 \
 && npm cache clean --force
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3100 \
    HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
# Prisma 引擎在 standalone 追踪里可能被裁掉，显式补一份
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
# sharp 是上传图片要用的本地二进制，同样显式带上（@img 里是 libvips 的预编译包）
COPY --from=builder /app/node_modules/sharp ./node_modules/sharp
COPY --from=builder /app/node_modules/@img ./node_modules/@img

# 上传目录：容器里给 volume 挂点上，权限要在切用户前给好
RUN mkdir -p /app/public/uploads && chown -R nextjs:nodejs /app/public

USER nextjs
EXPOSE 3100

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3100/api/health || exit 1

CMD ["node", "server.js"]
