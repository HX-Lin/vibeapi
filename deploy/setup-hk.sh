#!/bin/bash
# =============================================================
# 香港 VPS 初始化：WireGuard + Docker + 基础环境
# 支持同时连接多台海外服务器
# 用法: bash setup-hk.sh <海外服务器A公网IP> [海外服务器B公网IP]
# =============================================================
set -e

if [ -z "$1" ]; then
    echo "用法: bash setup-hk.sh <海外服务器A公网IP> [海外服务器B公网IP]"
    echo "  服务器A -> 10.0.0.1"
    echo "  服务器B -> 10.0.0.3 (可选)"
    exit 1
fi

OVERSEAS_IP_A="$1"
OVERSEAS_IP_B="${2:-}"

echo "========================================="
echo "  香港 VPS 初始化配置"
echo "========================================="
echo ""
echo "  服务器 A: ${OVERSEAS_IP_A} -> 10.0.0.1"
if [ -n "$OVERSEAS_IP_B" ]; then
    echo "  服务器 B: ${OVERSEAS_IP_B} -> 10.0.0.3"
fi
echo ""

# 检查 root
if [ "$(id -u)" -ne 0 ]; then
    echo "请使用 root 用户运行此脚本"
    exit 1
fi

# ===================== 系统更新 =====================
echo "[1/6] 系统更新..."
if command -v apt &> /dev/null; then
    apt update && apt upgrade -y
    apt install -y curl wget git ufw software-properties-common
elif command -v yum &> /dev/null; then
    yum update -y
    yum install -y curl wget git
fi

# ===================== BBR =====================
echo "[2/6] 开启 TCP BBR..."
if ! sysctl net.ipv4.tcp_congestion_control | grep -q bbr; then
    echo "net.core.default_qdisc=fq" >> /etc/sysctl.conf
    echo "net.ipv4.tcp_congestion_control=bbr" >> /etc/sysctl.conf
    sysctl -p
    echo "BBR 已开启"
else
    echo "BBR 已启用，跳过"
fi

# ===================== 安装 Docker =====================
echo "[3/6] 安装 Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable --now docker
    echo "Docker 安装完成"
else
    echo "Docker 已安装，跳过"
fi

# 安装 docker compose plugin（如果没有）
if ! docker compose version &> /dev/null 2>&1; then
    apt install -y docker-compose-plugin 2>/dev/null || true
fi

# Docker 日志轮转
mkdir -p /etc/docker
cat > /etc/docker/daemon.json <<'DAEMON'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
DAEMON
systemctl restart docker

# ===================== 安装 WireGuard =====================
echo "[4/6] 安装并配置 WireGuard..."
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

# 收集海外服务器 A 的公钥
echo ""
read -p "请输入海外服务器 A (${OVERSEAS_IP_A}) 的 WireGuard 公钥: " OVERSEAS_PUBKEY_A

# 生成 WireGuard 配置
cat > /etc/wireguard/wg0.conf <<EOF
[Interface]
Address = 10.0.0.2/24
PrivateKey = ${PRIVATE_KEY}
ListenPort = 51820

# ===== 海外服务器 A (10.0.0.1) =====
[Peer]
PublicKey = ${OVERSEAS_PUBKEY_A}
Endpoint = ${OVERSEAS_IP_A}:51820
AllowedIPs = 10.0.0.1/32
PersistentKeepalive = 25
EOF

# 如果有服务器 B，添加第二个 Peer
if [ -n "$OVERSEAS_IP_B" ]; then
    echo ""
    read -p "请输入海外服务器 B (${OVERSEAS_IP_B}) 的 WireGuard 公钥: " OVERSEAS_PUBKEY_B

    cat >> /etc/wireguard/wg0.conf <<EOF

# ===== 海外服务器 B (10.0.0.3) =====
[Peer]
PublicKey = ${OVERSEAS_PUBKEY_B}
Endpoint = ${OVERSEAS_IP_B}:51820
AllowedIPs = 10.0.0.3/32
PersistentKeepalive = 25
EOF
fi

chmod 600 /etc/wireguard/wg0.conf

# 启动 WireGuard
systemctl enable wg-quick@wg0
if systemctl is-active --quiet wg-quick@wg0; then
    systemctl restart wg-quick@wg0
else
    systemctl start wg-quick@wg0
fi

# ===================== 防火墙 =====================
echo "[5/6] 配置防火墙..."
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
echo "[6/6] 安装 certbot..."
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
echo "本机 WireGuard 公钥（发给所有海外服务器使用）:"
echo ""
echo "  ${PUBLIC_KEY}"
echo ""
echo "WireGuard 节点:"
echo "  本机 (香港 VPS):   10.0.0.2"
echo "  海外服务器 A:      10.0.0.1 (${OVERSEAS_IP_A})"
if [ -n "$OVERSEAS_IP_B" ]; then
echo "  海外服务器 B:      10.0.0.3 (${OVERSEAS_IP_B})"
fi
echo ""
echo "验证连接:"
echo "  ping 10.0.0.1      # 服务器 A"
if [ -n "$OVERSEAS_IP_B" ]; then
echo "  ping 10.0.0.3      # 服务器 B"
fi
echo ""
echo "下一步:"
echo "  1. 在海外服务器 A 执行: bash setup-overseas-peer.sh ${PUBLIC_KEY}"
if [ -n "$OVERSEAS_IP_B" ]; then
echo "  2. 在海外服务器 B 执行: bash setup-overseas-peer.sh ${PUBLIC_KEY}"
echo "  3. 验证 WireGuard 连通后执行: bash deploy-vibeapi.sh <你的域名>"
else
echo "  2. 验证 WireGuard 连通后执行: bash deploy-vibeapi.sh <你的域名>"
fi
echo ""
