# Home Gym — تصویر تولیدی: فرانت‌اند ساخته‌شده + سرور Express (Node)
# docker compose --profile app up -d --build

# ── ۱. وابستگی‌ها و build ──
FROM oven/bun:1.3-alpine AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build && bun run build:server

# ── ۲. وابستگی‌های اجرایی (بدون devDependencies) ──
FROM oven/bun:1.3-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# ── ۳. اجرا ──
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    TZ=Asia/Tehran \
    PORT=3000
RUN apk add --no-cache tzdata && addgroup -S app && adduser -S app -G app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/build ./build
COPY --from=build /app/drizzle ./drizzle
COPY package.json ./
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "build/server.cjs"]
