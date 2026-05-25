# vibeapi 香港 + 海外双机部署

## 架构

```
大陆用户 → 香港阿里云 VPS (vibeapi:443)
                |
            WireGuard 加密隧道 (10.0.0.x)
                |
           海外服务器 (antigravity-manager:8045)
                |
           Claude / GPT APIs
```

## 部署步骤

1. 在海外服务器执行: `bash setup-overseas.sh`
2. 在香港 VPS 执行: `bash setup-hk.sh <海外服务器公网IP>`
3. 回到海外服务器，完成 WireGuard 对端配置: `bash setup-overseas-peer.sh <香港VPS的WireGuard公钥>`
4. 在香港 VPS 上部署 vibeapi: `bash deploy-vibeapi.sh <你的域名>`
