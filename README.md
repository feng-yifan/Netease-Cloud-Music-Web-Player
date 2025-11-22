# Netease Cloud Music Web Player

⚠️ **法律声明**: 本项目为开源学习项目，非网易云音乐官方产品，与网易公司无任何关联。使用本项目请遵守网易云音乐服务条款。

网易云音乐网页版桌面客户端，将网页播放器封装为原生 Linux 桌面应用。

## 功能特性

- 原生桌面体验 - 无需浏览器即可使用网易云音乐
- 系统托盘支持 - 后台运行时可通过托盘图标控制
- 窗口状态记忆 - 自动保存窗口大小和位置
- 外部链接处理 - 应用内链接通过系统浏览器打开
- 统一日志管理 - 分级日志记录与错误追踪

## 快速开始

### 开发模式

```bash
npm install
npm start
```

### 构建 Linux 版本

```bash
npm run package:linux
```

构建完成后，应用将生成在 `dist/linux-unpacked/` 目录下。

## 技术架构

### 核心模块

- **src/main.js** - 应用主进程入口，负责生命周期管理
- **src/modules/WindowManager.js** - 窗口管理器，处理窗口创建和状态持久化
- **src/modules/TrayManager.js** - 系统托盘管理器
- **src/utils/logger.js** - 日志工具，支持 error/warn/info/debug 分级
- **src/config/default.js** - 应用默认配置

### 关键设计

- **模块化架构** - 功能模块独立封装，便于维护扩展
- **事件驱动** - 基于 Electron ipcMain 的进程通信
- **安全策略** - 禁用 Node 集成，启用上下文隔离
- **状态持久化** - 窗口状态自动保存到用户数据目录

### 技术栈

- Electron 38.7.1
- electron-builder 26.0.12
- 纯 JavaScript 实现（无前端框架依赖）

## 构建配置

- **electron-builder.yml** - Electron 构建配置（仅支持 Linux x64）
- **package/arch/aur/PKGBUILD** - Arch Linux AUR 包配置
- **.github/workflows/package-asar.yml** - 自动打包发布工作流

## CI/CD

推送版本标签（格式：`x.x.x`）时自动触发：

1. 构建应用并生成 ASAR 包
2. 创建压缩包和校验文件
3. 上传 GitHub Release
4. 生成并发布 AUR 包

## 注意事项

- 项目使用 pnpm 工作区模式，npm 也兼容
- 当前版本未配置自动化测试，依赖手动测试
- AUR 发布需要配置 `AUR_SSH_PRIVATE_KEY` 等变量
- 窗口默认尺寸 1200x800，最小尺寸 800x600

## 许可证

本项目采用 [MIT License](LICENSE) 开源协议。

MIT 许可证允许自由使用、修改和分发代码，包括商业用途。详见 [LICENSE](LICENSE) 文件。

**按"现状"提供**，作者不承担任何责任。
