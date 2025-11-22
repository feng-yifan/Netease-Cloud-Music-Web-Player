# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个 Electron 桌面应用，将网易云音乐网页版封装为原生桌面应用。使用纯 JavaScript 开发，无前端框架依赖。

## 常用开发命令

```bash
# 开发模式启动
npm start

# 构建 Linux 版本（生成 dist/linux-unpacked/）
npm run package:linux

# 安装依赖
npm install
```

## 架构设计

### 核心模块结构
- **src/main.js** - 应用主进程入口，负责应用生命周期管理
- **src/modules/WindowManager.js** - 窗口管理器，处理 BrowserWindow 创建和状态持久化
- **src/modules/TrayManager.js** - 系统托盘管理器，处理托盘图标和菜单
- **src/utils/logger.js** - 日志工具，提供分级日志记录
- **src/config/default.js** - 应用默认配置

### 关键设计模式
1. **模块化架构**：每个功能模块独立封装，通过类实现
2. **事件驱动**：使用 Electron 的 ipcMain 处理进程间通信
3. **状态持久化**：窗口大小位置自动保存到用户数据目录
4. **安全配置**：禁用 Node 集成，启用上下文隔离

### 构建配置
- **electron-builder.yml** - Electron 构建配置，目标平台为 Linux x64
- **package/arch/aur/PKGBUILD** - Arch Linux 包配置模板
- **.github/workflows/package-asar.yml** - 自动打包发布工作流

### 重要实现细节
1. **网页加载**：加载 `https://music.163.com/st/webplayer`，需要处理登录状态
2. **外部链接**：应用内点击的链接通过系统浏览器打开
3. **窗口状态**：默认尺寸 1200x800，最小尺寸 800x600
4. **托盘功能**：左键显示/隐藏窗口，右键提供退出菜单
5. **日志级别**：默认 info，支持 error/warn/info/debug

### CI/CD 流程
工作流在推送版本标签（格式：x.x.x）时触发：
1. 构建应用并生成 ASAR 包
2. 创建包含资源的压缩包和校验文件
3. 上传到 GitHub Release
4. 生成 AUR 包文件（PKGBUILD 和 .SRCINFO）
5. 自动发布到 AUR 仓库

### 注意事项
- 项目使用 pnpm 工作区模式，但 npm 也兼容
- 当前未配置自动化测试，主要依赖手动测试
- AUR 发布需要配置 AUR_SSH_PRIVATE_KEY 密钥
- makepkg 命令需要通过 nobody 用户执行以避免权限问题