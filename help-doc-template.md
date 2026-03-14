## 方式一：一键安装脚本（推荐）

我们提供了三个平台的一键安装脚本，自动完成环境检测、依赖安装、配置写入等全部步骤。

### Linux

[📥 下载 install_linux.sh](/uploads/替换为实际链接.sh)

下载后执行：
```bash
bash install_linux.sh
```

### macOS

[📥 下载 install_macos.sh](/uploads/替换为实际链接.sh)

下载后执行：
```bash
bash install_macos.sh
```

### Windows

[📥 下载 install_windows.ps1](/uploads/替换为实际链接.ps1)

下载后在 PowerShell 中执行：
```powershell
.\install_windows.ps1
```

> 如果 Windows 提示执行策略限制，先运行：
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
> ```

脚本运行后会提示你选择安装模式（VSCode 插件版 或 CLI 终端版），并要求输入你的 API Key，全程交互式引导。

---
