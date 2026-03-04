# 多阶段构建
FROM node:16-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制项目文件
COPY package*.json ./
COPY client/package*.json ./client/

# 安装依赖
RUN npm install --production
RUN cd client && npm install

# 复制源代码
COPY . .

# 构建前端
RUN cd client && npm run build

# 生产镜像
FROM node:16-alpine

WORKDIR /app

# 复制构建产物
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server ./server
COPY --from=builder /app/client/build ./client/build
COPY --from=builder /app/log.txt ./

# 创建必要的目录
RUN mkdir -p uploads logs

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

# 暴露端口
EXPOSE 3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/parse-default-log', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 启动命令
CMD ["node", "server/index.js"]
