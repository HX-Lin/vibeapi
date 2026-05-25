#!/bin/bash
# =============================================================
# 海外服务器 WireGuard 添加香港 Peer
# 用法: bash setup-overseas-peer.sh <香港VPS的WireGuard公钥>
# =============================================================
set -e

if [ -z "$1" ]; then
    echo "用法: bash setup-overseas-peer.sh <香港VPS的WireGuard公钥>"
    exit 1
fi

HK_PUBLIC_KEY="$1"

echo "========================================="
echo "  添加香港 VPS 为 WireGuard Peer"
echo "========================================="

# 检查 root
if [ "$(id -u)" -ne 0 ]; then
    echo "请使用 root 用户运行此脚本"
    exit 1
fi

# 检查配置文件存在
if [ ! -f /etc/wireguard/wg0.conf ]; then
    echo "错误: /etc/wireguard/wg0.conf 不存在，请先运行 setup-overseas.sh"
    exit 1
fi

# 移除已有的 Peer 配置（如果有）
sed -i '/^\[Peer\]/,$d' /etc/wireguard/wg0.conf

# 添加 Peer
cat >> /etc/wireguard/wg0.conf <<EOF

[Peer]
PublicKey = ${HK_PUBLIC_KEY}
AllowedIPs = 10.0.0.2/32
EOF

# 启动/重启 WireGuard
echo "启动 WireGuard..."
systemctl enable wg-quick@wg0
if systemctl is-active --quiet wg-quick@wg0; then
    systemctl restart wg-quick@wg0
else
    systemctl start wg-quick@wg0
fi

echo ""
echo "========================================="
echo "  WireGuard Peer 配置完成！"
echo "========================================="
echo ""
echo "验证连接（等香港 VPS 也启动 WireGuard 后）:"
echo "  wg show"
echo "  ping 10.0.0.2"
echo ""
