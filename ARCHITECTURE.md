# 项目架构

此工程使用 Electron 框架，采用模块化分层架构设计，将网易云音乐网页版封装为原生桌面应用。

## 目录结构总览

```
netease-cloud-music-web-player/
├── src/                    # 应用核心代码
│   ├── main.js             # 主进程入口，应用生命周期管理
│   ├── modules/            # 功能模块层
│   ├── config/             # 配置中心
│   └── utils/              # 工具层
├── build/                  # 构建资源
├── dist/                   # 构建产物
├── package/                # 包管理配置（含 AUR）
├── .github/                # CI/CD 工作流
├── electron-builder.yml    # Electron 构建配置
├── package.json            # 项目配置
└── pnpm-lock.yaml          # 依赖锁定文件
```

## 目录结构详解

### src/ 目录详解

此目录包含应用的核心代码，采用模块化分层架构设计。

```
src/
├── main.js                   # 应用入口，生命周期管理
├── modules/
│   ├── WindowManager.js      # 窗口管理器（含缩放功能）
│   ├── TrayManager.js        # 托盘管理器
│   └── PlaybackController.js # 播放控制
├── config/
│   ├── index.js              # 配置导出
│   └── default.js            # 默认配置定义
└── utils/
    └── logger.js             # 日志工具
```

### src/main.js — 应用主进程入口

此文件是 Electron 应用的启动入口，负责应用生命周期管理和模块编排。

**职责说明**：
- 处理 app.ready / app.quit / window-all-closed 等生命周期事件
- 初始化并协调各功能模块（WindowManager、TrayManager）
- 通过 IPC 通信桥接模块间交互

**关键设计**：
- 应用关闭时先触发窗口销毁（saveWindowState），再退出进程
- 启动时支持 --start-minimized 参数（后台启动到托盘）

### src/modules/ — 功能模块层

此目录封装各独立功能模块，每个模块通过类实现，职责单一。

#### WindowManager.js — 窗口管理器

**核心职责**：
- BrowserWindow 的创建、显示、隐藏、销毁
- 窗口状态（尺寸、位置、缩放级别）的持久化与恢复
- 外部链接拦截与系统浏览器跳转

**窗口状态持久化**：
- 状态文件：window-state.json（存储于 userData 目录）
- 触发时机：窗口移动（moved）、调整大小（resized）、缩放变更、窗口销毁
- 恢复时机：应用启动时通过 loadWindowState() 读取
- 存储内容：width、height、x、y、zoomLevel

**缩放功能架构**：
- 缩放级别范围：-5 到 5，步长 0.5，由 config.zoom 定义
- 缩放级别持久化到窗口状态文件，应用启动时恢复
- 用户输入方式：
  - Ctrl + 滚轮（zoom-changed 事件）
  - Ctrl + +/-/0（before-input-event 事件）
- 数据流：用户输入 -> 事件处理 -> setZoomLevel()（取整 + 钳位）-> webContents.setZoomLevel() + saveWindowState()

#### TrayManager.js — 托盘管理器

**核心职责**：
- 系统托盘图标创建与销毁
- 左键点击显示/隐藏主窗口
- 右键菜单提供退出、播放控制等操作

#### PlaybackController.js — 播放控制器

**核心职责**：
- 通过 IPC 注入到网页上下文，控制音乐播放
- 处理上一首/下一首/播放暂停等播放命令

### src/config/ — 配置中心

此目录集中管理应用所有可配置项。

**配置结构**（src/config/default.js）：

| 配置段 | 用途 |
|--------|------|
| app | 应用名称、版本、目标 URL、用户代理 |
| window | 窗口默认尺寸与最小尺寸 |
| zoom | 缩放级别范围与步长 |
| state | 窗口状态文件路径 |
| logger | 日志级别、文件路径、轮转策略 |
| tray | 托盘提示文本与图标路径 |

**设计要点**：
- 默认配置通过 config/index.js 导出
- 支持用户自定义配置覆盖（config.custom 机制）

### src/utils/ — 工具层

#### logger.js — 日志工具

- 支持分级日志（error / warn / info / debug）
- 支持控制台输出和文件输出
- 文件自动轮转（默认 10 MB / 5 个文件）
- 支持模块名称标记（setModule）

## 架构原则与约束

1. **模块单一职责**：每个模块类封装一项独立功能，不跨模块耦合
2. **配置集中管理**：所有可配置项统一在 config/ 中定义，模块不硬编码常量
3. **状态持久化**：窗口状态（含缩放级别）在变动时即时写入文件，应用启动时恢复
4. **安全隔离**：禁用 Node 集成（nodeIntegration: false），启用上下文隔离（contextIsolation: true）
5. **事件驱动通信**：模块间通过 Electron IPC 和事件机制交互，不直接引用对方实例

## 变更记录

| 日期 | 版本 | 变更内容 |
|------|------|----------|
| 2026-06-02 | 1.0.0 | 新增缩放功能：支持 Ctrl+滚轮 / Ctrl+/-/0 缩放，缩放级别持久化到窗口状态文件 |
