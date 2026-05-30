/**
 * Copyright (c) 2025 冯一凡 <fengyifan@blocgo.com>
 *
 * 本项目采用 MIT License 开源协议，详见 LICENSE 文件
 *
 * Netease Cloud Music Web Player - Electron 桌面客户端
 * 本项目非网易云音乐官方产品，与网易公司无任何关联
 */

const {app, Menu} = require('electron');
const WindowManager = require('./modules/WindowManager');
const TrayManager = require('./modules/TrayManager');
const PlaybackController = require('./modules/PlaybackController');
const logger = require('./utils/logger');

// 设置主进程日志模块名称
logger.setModule('Main');

// 全局错误处理
process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常:', error.message);
  logger.error('错误堆栈:', error.stack);
});

process.on('unhandledRejection', (reason, _promise) => {
  logger.error('未处理的Promise拒绝:', reason);
});

// 命令行参数解析
function parseCommandLineArgs() {
  const args = process.argv.slice(1); // 跳过 electron 路径
  const options = {
    minimize: args.includes('--minimize')
  };
  logger.debug('命令行参数解析结果:', options);
  return options;
}

// 应用实例
let windowManager;
let trayManager;
let playbackController;

// 请求单实例锁
const gotTheLock = app.requestSingleInstanceLock();

// 如果获取锁失败，说明已经有实例在运行
if (!gotTheLock) {
  logger.warn('检测到另一个应用实例正在运行，当前实例将退出');
  app.quit();
  process.exit(0);
}

// 监听 second-instance 事件，当有新实例尝试启动时触发
app.on('second-instance', (_event, commandLine, _workingDirectory) => {
  // 解析新实例的命令行参数
  const newInstanceOptions = {
    minimize: commandLine.includes('--minimize')
  };
  logger.info('检测到新的应用实例启动，命令行参数:', newInstanceOptions);

  if (windowManager) {
    // 根据用户要求，无论新实例是否带 --minimize 参数，都显示窗口
    windowManager.showWindow();
  }
});

// 初始化应用
function initializeApp(options = {}) {
  try {
    logger.info('应用初始化开始', options);
    // 创建窗口管理器
    windowManager = new WindowManager();
    // 创建主窗口，传递启动选项
    windowManager.createMainWindow({ startMinimized: options.minimize });
    // 创建播放控制器
    playbackController = new PlaybackController(windowManager);
    // 创建托盘管理器
    trayManager = new TrayManager(windowManager, playbackController);
    try {
      trayManager.createTray();
    } catch (error) {
      logger.warn('托盘创建失败，应用将在没有托盘图标的情况下运行:', error.message);
      // 托盘创建失败不是致命错误，应用可以继续运行
    }
    // 隐藏应用菜单（完全移除菜单栏）
    Menu.setApplicationMenu(null);
    logger.info('应用初始化完成');
  } catch (error) {
    logger.error('应用初始化失败:', error.message);
    throw error;
  }
}

// 清理资源
function cleanup() {
  try {
    logger.info('应用清理开始');

    if (windowManager) {
      windowManager.setQuiting(true);
      windowManager.destroyWindow();
    }

    if (trayManager) {
      trayManager.destroyTray();
    }

    logger.info('应用清理完成');
    // 关闭日志文件流
    logger.close();
  } catch (error) {
    logger.error('应用清理失败:', error.message);
  }
}

// 应用事件监听
app.whenReady().then(() => {
  logger.info('应用准备就绪');
  // 解析命令行参数并初始化应用
  const options = parseCommandLineArgs();
  initializeApp(options);
});

app.on('window-all-closed', () => {
  logger.info('所有窗口已关闭');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  logger.info('应用即将退出');
  cleanup();
});

app.on('activate', () => {
  logger.debug('应用被激活');
  // Linux 下点击 dock 图标时显示窗口
  if (windowManager) {
    windowManager.showWindow();
  }
});

logger.info('网易云音乐桌面版已启动');
