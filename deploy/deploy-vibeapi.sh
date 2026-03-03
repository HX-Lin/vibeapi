#!/bin/bash
# =============================================================
# 香港 VPS 部署 vibeapi（Docker + Nginx + Let's Encrypt）
# 用法: bash deploy-vibeapi.sh <你的域名>
# 示例: bash deploy-vibeapi.sh vibe-api.com
# =============================================================
set -e

if [ -z "$1" ]; then
    echo "用法: bash deploy-vibeapi.sh <你的域名>"
    exit 1
fi

DOMAIN="$1"
DEPLOY_DIR="/opt/vibeapi"

echo "========================================="
echo "  部署 vibeapi 到香港 VPS"
echo "  域名: ${DOMAIN}"
echo "========================================="

# 检查 root
if [ "$(id -u)" -ne 0 ]; then
    echo "请使用 root 用户运行此脚本"
    exit 1
fi

# 检查 WireGuard 通道
echo "[1/6] 检查 WireGuard 连通性..."
if ping -c 2 -W 3 10.0.0.1 &> /dev/null; then
    echo "WireGuard 隧道连通 ✓"
else
    echo "警告: 无法 ping 通 10.0.0.1，请检查 WireGuard 配置"
    read -p "是否继续部署？(y/N): " CONTINUE
    if [ "$CONTINUE" != "y" ] && [ "$CONTINUE" != "Y" ]; then
        exit 1
    fi
fi

# 检查 antigravity-manager 可达
echo "[2/6] 检查 antigravity-manager 可达性..."
if curl -s --connect-timeout 5 http://10.0.0.1:8045 &> /dev/null; then
    echo "antigravity-manager 可达 ✓"
else
    echo "警告: 无法连接 10.0.0.1:8045，请确认海外服务器的 antigravity-manager 已启动"
    read -p "是否继续部署？(y/N): " CONTINUE
    if [ "$CONTINUE" != "y" ] && [ "$CONTINUE" != "Y" ]; then
        exit 1
    fi
fi

# 申请 SSL 证书
echo "[3/6] 申请 Let's Encrypt 证书..."
if [ ! -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
    # 确保 80 端口没被占用
    systemctl stop nginx 2>/dev/null || true
    docker stop nginx 2>/dev/null || true

    certbot certonly --standalone -d "${DOMAIN}" --non-interactive --agree-tos --register-unsafely-without-email

    if [ $? -ne 0 ]; then
        echo "证书申请失败，请确认:"
        echo "  1. 域名 A 记录已指向本机 IP"
        echo "  2. 80 端口未被占用"
        exit 1
    fi
    echo "证书申请成功 ✓"
else
    echo "证书已存在，跳过申请"
fi

# 创建部署目录
echo "[4/6] 创建部署目录..."
mkdir -p ${DEPLOY_DIR}/{data,logs}

# 生成随机密码
DB_PASSWORD=$(openssl rand -hex 16)
SESSION_SECRET=$(openssl rand -hex 32)

# 写入 .env 文件
cat > ${DEPLOY_DIR}/.env <<EOF
SQL_DSN=postgresql://root:${DB_PASSWORD}@postgres:5432/vibeapi
DB_PASSWORD=${DB_PASSWORD}
REDIS_CONN_STRING=redis://redis
TZ=Asia/Shanghai
SESSION_SECRET=${SESSION_SECRET}
ERROR_LOG_ENABLED=true
BATCH_UPDATE_ENABLED=true
SYNC_FREQUENCY=60
EOF

echo "环境变量已生成 ✓"
echo "  DB 密码: ${DB_PASSWORD}"
echo "  Session Secret: ${SESSION_SECRET}"

# 写入 nginx.conf
echo "[5/6] 生成 Nginx 配置..."
cat > ${DEPLOY_DIR}/nginx.conf <<NGINXEOF
server {
    listen 80;
    server_name ${DOMAIN};
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    server_name ${DOMAIN};

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    # 静态资源长缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp)$ {
        proxy_pass http://vibeapi:3000;
        proxy_set_header Host \$host;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location / {
        proxy_pass http://vibeapi:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding on;
    }
}
NGINXEOF

# 写入 docker-compose.yml
cat > ${DEPLOY_DIR}/docker-compose.yml <<COMPOSEEOF
services:
  vibeapi:
    image: ghcr.io/hx-lin/vibeapi:latest
    container_name: vibeapi
    restart: always
    extra_hosts:
      - "host.docker.internal:host-gateway"
    command: --log-dir /app/logs
    volumes:
      - ./data:/data
      - ./logs:/app/logs
    env_file: .env
    depends_on:
      - redis
      - postgres
    healthcheck:
      test: ["CMD-SHELL", "wget -q -O - http://localhost:3000/api/status | grep -o '\"success\":\\\\s*true' || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    container_name: nginx
    restart: always
    ports:
      - "443:443"
      - "80:80"
    volumes:
      - /etc/letsencrypt/live/${DOMAIN}/fullchain.pem:/etc/nginx/ssl/fullchain.pem:ro
      - /etc/letsencrypt/live/${DOMAIN}/privkey.pem:/etc/nginx/ssl/privkey.pem:ro
      - /etc/letsencrypt/archive/${DOMAIN}:/etc/letsencrypt/archive/${DOMAIN}:ro
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - vibeapi

  redis:
    image: redis:7-alpine
    container_name: redis
    restart: always

  postgres:
    image: postgres:15-alpine
    container_name: postgres
    restart: always
    environment:
      POSTGRES_USER: root
      POSTGRES_PASSWORD: \${DB_PASSWORD}
      POSTGRES_DB: vibeapi
    volumes:
      - pg_data:/var/lib/postgresql/data

volumes:
  pg_data:
COMPOSEEOF

# 启动服务
echo "[6/6] 启动 vibeapi..."
cd ${DEPLOY_DIR}
docker compose pull
docker compose up -d

# 设置证书自动续期
echo "配置证书自动续期..."
CRON_CMD="0 3 * * * certbot renew --pre-hook 'docker compose -f ${DEPLOY_DIR}/docker-compose.yml stop nginx' --post-hook 'docker compose -f ${DEPLOY_DIR}/docker-compose.yml start nginx' >> /var/log/certbot-renew.log 2>&1"
(crontab -l 2>/dev/null | grep -v certbot; echo "$CRON_CMD") | crontab -

# 等待服务启动
echo ""
echo "等待服务启动..."
sleep 10

# 检查服务状态
echo ""
docker compose ps

echo ""
echo "========================================="
echo "  vibeapi 部署完成！"
echo "========================================="
echo ""
echo "访问地址: https://${DOMAIN}"
echo "部署目录: ${DEPLOY_DIR}"
echo ""
echo "常用命令:"
echo "  查看日志:   cd ${DEPLOY_DIR} && docker compose logs -f vibeapi"
echo "  重启服务:   cd ${DEPLOY_DIR} && docker compose restart"
echo "  更新版本:   cd ${DEPLOY_DIR} && docker compose pull && docker compose up -d"
echo "  查看状态:   cd ${DEPLOY_DIR} && docker compose ps"
echo ""
echo "重要提醒:"
echo "  1. 请在 vibeapi 后台将 antigravity-manager 渠道地址改为 http://10.0.0.1:8045"
echo "  2. 原来指向 localhost:8045 的渠道配置需要更新"
echo "  3. 域名 DNS A 记录需指向本机 IP"
echo ""
