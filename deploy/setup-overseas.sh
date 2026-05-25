#!/bin/bash
# =============================================================
# 海外服务器 WireGuard 安装与配置
# 用法: bash setup-overseas.sh
# =============================================================
set -e

echo "========================================="
echo "  海外服务器 WireGuard 配置"
echo "========================================="

# 检查 root
if [ "$(id -u)" -ne 0 ]; then
    echo "请使用 root 用户运行此脚本"
    exit 1
fi

# 安装 WireGuard
echo "[1/4] 安装 WireGuard..."
if command -v apt &> /dev/null; then
    apt update && apt install -y wireguard
elif command -v yum &> /dev/null; then
    yum install -y epel-release && yum install -y wireguard-tools
else
    echo "不支持的包管理器，请手动安装 wireguard"
    exit 1
fi

# 生成密钥
echo "[2/4] 生成密钥对..."
mkdir -p /etc/wireguard
if [ ! -f /etc/wireguard/private.key ]; then
    wg genkey | tee /etc/wireguard/private.key | wg pubkey > /etc/wireguard/public.key
    chmod 600 /etc/wireguard/private.key
    echo "密钥对已生成"
else
    echo "密钥对已存在，跳过"
fi

PRIVATE_KEY=$(cat /etc/wireguard/private.key)
PUBLIC_KEY=$(cat /etc/wireguard/public.key)

# 生成 WireGuard 配置（不含 Peer，等香港那边配好后再加）
echo "[3/4] 生成 WireGuard 配置..."
cat > /etc/wireguard/wg0.conf <<EOF
[Interface]
Address = 10.0.0.1/24
ListenPort = 51820
PrivateKey = ${PRIVATE_KEY}

# Peer 配置将在运行 setup-overseas-peer.sh 后添加
EOF
chmod 600 /etc/wireguard/wg0.conf

# 防火墙放行 WireGuard 端口
echo "[4/4] 配置防火墙..."
if command -v ufw &> /dev/null; then
    ufw allow 51820/udp
    # 只允许 WireGuard 内网访问 8045
    ufw allow from 10.0.0.0/24 to any port 8045
    echo "ufw 规则已添加"
elif command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-port=51820/udp
    firewall-cmd --permanent --add-rich-rule='rule family="ipv4" source address="10.0.0.0/24" port port="8045" protocol="tcp" accept'
    firewall-cmd --reload
    echo "firewalld 规则已添加"
else
    echo "未检测到防火墙工具，请手动放行 UDP 51820 端口"
fi

echo ""
echo "========================================="
echo "  海外服务器配置完成！"
echo "========================================="
echo ""
echo "本机 WireGuard 公钥（发给香港 VPS 使用）:"
echo ""
echo "  ${PUBLIC_KEY}"
echo ""
echo "下一步:"
echo "  1. 在香港 VPS 上执行: bash setup-hk.sh <本机公网IP>"
echo "  2. 拿到香港 VPS 的公钥后执行: bash setup-overseas-peer.sh <香港公钥>"
echo ""
