#!/bin/bash
# =============================================================
# 香港 VPS 初始化：WireGuard + Docker + 基础环境
# 用法: bash setup-hk.sh <海外服务器公网IP>
# =============================================================
set -e

if [ -z "$1" ]; then
    echo "用法: bash setup-hk.sh <海外服务器公网IP>"
    exit 1
fi

OVERSEAS_IP="$1"

echo "========================================="
echo "  香港 VPS 初始化配置"
echo "========================================="

# 检查 root
if [ "$(id -u)" -ne 0 ]; then
    echo "请使用 root 用户运行此脚本"
    exit 1
fi

# ===================== 系统更新 =====================
echo "[1/5] 系统更新..."
if command -v apt &> /dev/null; then
    apt update && apt upgrade -y
    apt install -y curl wget git ufw software-properties-common
elif command -v yum &> /dev/null; then
    yum update -y
    yum install -y curl wget git
fi

# ===================== 安装 Docker =====================
echo "[2/5] 安装 Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable --now docker
    echo "Docker 安装完成"
else
    echo "Docker 已安装，跳过"
fi

# 安装 docker compose plugin（如果没有）
if ! docker compose version &> /dev/null; then
    apt install -y docker-compose-plugin 2>/dev/null || true
fi

# ===================== 安装 WireGuard =====================
echo "[3/5] 安装并配置 WireGuard..."
if command -v apt &> /dev/null; then
    apt install -y wireguard
elif command -v yum &> /dev/null; then
    yum install -y epel-release && yum install -y wireguard-tools
fi

# 生成密钥
mkdir -p /etc/wireguard
if [ ! -f /etc/wireguard/private.key ]; then
    wg genkey | tee /etc/wireguard/private.key | wg pubkey > /etc/wireguard/public.key
    chmod 600 /etc/wireguard/private.key
fi

PRIVATE_KEY=$(cat /etc/wireguard/private.key)
PUBLIC_KEY=$(cat /etc/wireguard/public.key)

# 生成 WireGuard 配置
cat > /etc/wireguard/wg0.conf <<EOF
[Interface]
Address = 10.0.0.2/24
PrivateKey = ${PRIVATE_KEY}

[Peer]
PublicKey = REPLACE_WITH_OVERSEAS_PUBLIC_KEY
Endpoint = ${OVERSEAS_IP}:51820
AllowedIPs = 10.0.0.1/32
PersistentKeepalive = 25
EOF
chmod 600 /etc/wireguard/wg0.conf

echo ""
echo "  !! 重要：请编辑 /etc/wireguard/wg0.conf"
echo "  !! 将 REPLACE_WITH_OVERSEAS_PUBLIC_KEY 替换为海外服务器的 WireGuard 公钥"
echo ""

read -p "请输入海外服务器的 WireGuard 公钥: " OVERSEAS_PUBKEY
if [ -n "$OVERSEAS_PUBKEY" ]; then
    sed -i "s|REPLACE_WITH_OVERSEAS_PUBLIC_KEY|${OVERSEAS_PUBKEY}|" /etc/wireguard/wg0.conf
    echo "公钥已写入配置"
fi

# 启动 WireGuard
systemctl enable --now wg-quick@wg0

# ===================== 防火墙 =====================
echo "[4/5] 配置防火墙..."
if command -v ufw &> /dev/null; then
    ufw --force enable
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow 22/tcp      # SSH
    ufw allow 80/tcp      # HTTP
    ufw allow 443/tcp     # HTTPS
    ufw allow 51820/udp   # WireGuard
    echo "ufw 配置完成"
fi

# ===================== 安装 certbot =====================
echo "[5/5] 安装 certbot..."
if command -v apt &> /dev/null; then
    apt install -y certbot
else
    yum install -y certbot
fi

echo ""
echo "========================================="
echo "  香港 VPS 初始化完成！"
echo "========================================="
echo ""
echo "本机 WireGuard 公钥（发给海外服务器使用）:"
echo ""
echo "  ${PUBLIC_KEY}"
echo ""
echo "验证 WireGuard 连接:"
echo "  ping 10.0.0.1"
echo "  curl http://10.0.0.1:8045"
echo ""
echo "下一步:"
echo "  1. 在海外服务器执行: bash setup-overseas-peer.sh ${PUBLIC_KEY}"
echo "  2. 验证 WireGuard 连通后执行: bash deploy-vibeapi.sh <你的域名>"
echo ""
