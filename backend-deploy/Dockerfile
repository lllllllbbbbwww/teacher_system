# 云托管部署用: CloudBase (腾讯云) 容器型
# Node 22+: @supabase/supabase-js 需要 Node 22+ 原生 WebSocket
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY . .

# 确保安装 Linux 版依赖, 使用国内 npm 源加速
RUN rm -rf node_modules && npm install --omit=dev --registry=https://registry.npmmirror.com

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000
CMD ["npm", "start"]
