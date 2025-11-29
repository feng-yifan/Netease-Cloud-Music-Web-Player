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
const logger = require('./utils/logger');

// 全局错误处理
process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常:', error.message);
  logger.error('错误堆栈:', error.stack);
});

process.on('unhandledRejection', (reason, _promise) => {
  logger.error('未处理的Promise拒绝:', reason);
});

// 应用实例
let windowManager;
let trayManager;

// 请求单实例锁
const gotTheLock = app.requestSingleInstanceLock();

// 如果获取锁失败，说明已经有实例在运行
if (!gotTheLock) {
  logger.warn('检测到另一个应用实例正在运行，当前实例将退出');
  app.quit();
  process.exit(0);
}

// 监听 second-instance 事件，当有新实例尝试启动时触发
app.on('second-instance', (_event, _commandLine, _workingDirectory) => {
  logger.info('检测到新的应用实例启动，激活已存在的窗口');

  if (windowManager) {
    // 显示并聚焦已存在的窗口
    windowManager.showWindow();
  }
});

// 初始化应用
function initializeApp() {
  try {
    logger.info('应用初始化开始');
    // 创建窗口管理器
    windowManager = new WindowManager();
    // 创建主窗口
    windowManager.createMainWindow();
    // 创建托盘管理器
    trayManager = new TrayManager(windowManager);
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
  } catch (error) {
    logger.error('应用清理失败:', error.message);
  }
}

// 应用事件监听
app.whenReady().then(() => {
  logger.info('应用准备就绪');
  initializeApp();
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