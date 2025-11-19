const { BrowserWindow, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');
const config = require('../config/default');

class WindowManager {
  constructor() {
    this.mainWindow = null;
    this.isQuiting = false;
  }

  // 加载窗口状态
  loadWindowState() {
    try {
      if (fs.existsSync(config.state.filePath)) {
        const state = JSON.parse(fs.readFileSync(config.state.filePath, 'utf8'));
        logger.debug('加载窗口状态:', state);
        return {
          width: state.width || config.window.defaultWidth,
          height: state.height || config.window.defaultHeight,
          x: state.x,
          y: state.y
        };
      }
    } catch (error) {
      logger.error('读取窗口状态失败:', error.message);
    }
    return {
      width: config.window.defaultWidth,
      height: config.window.defaultHeight
    };
  }

  // 保存窗口状态
  saveWindowState() {
    if (!this.mainWindow) return;

    try {
      const bounds = this.mainWindow.getBounds();
      const state = {
        width: bounds.width,
        height: bounds.height,
        x: bounds.x,
        y: bounds.y
      };

      // 确保目录存在
      const dir = path.dirname(config.state.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(config.state.filePath, JSON.stringify(state));
      logger.debug('保存窗口状态:', state);
    } catch (error) {
      logger.error('保存窗口状态失败:', error.message);
    }
  }

  // 创建主窗口
  createMainWindow() {
    try {
      const windowState = this.loadWindowState();

      this.mainWindow = new BrowserWindow({
        width: windowState.width,
        height: windowState.height,
        x: windowState.x,
        y: windowState.y,
        minWidth: config.window.minWidth,
        minHeight: config.window.minHeight,
        title: config.window.title,
        icon: config.window.iconPath,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          enableRemoteModule: false,
          webSecurity: true
        },
        show: false // 先不显示，等加载完成后再显示
      });

      // 设置用户代理
      this.mainWindow.webContents.setUserAgent(config.app.userAgent);

      // 加载网易云音乐网页版
      this.mainWindow.loadURL(config.app.url, {
        userAgent: config.app.userAgent
      });

      // 页面加载完成后显示窗口
      this.mainWindow.once('ready-to-show', () => {
        this.mainWindow.show();
        logger.info('主窗口已显示');
      });

      // 监听窗口关闭事件
      this.mainWindow.on('close', (event) => {
        if (!this.isQuiting) {
          event.preventDefault();
          this.mainWindow.hide();
          logger.info('窗口已隐藏到托盘');
        }
      });

      // 窗口移动或调整大小时保存状态
      this.mainWindow.on('moved', () => this.saveWindowState());
      this.mainWindow.on('resized', () => this.saveWindowState());

      // 处理新窗口打开事件
      this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
      });

      // 处理页面内链接点击
      this.mainWindow.webContents.on('will-navigate', (event, url) => {
        if (url !== this.mainWindow.webContents.getURL()) {
          event.preventDefault();
          shell.openExternal(url);
        }
      });

      logger.info('主窗口创建成功');
      return this.mainWindow;

    } catch (error) {
      logger.error('创建主窗口失败:', error.message);
      throw error;
    }
  }

  // 显示窗口
  showWindow() {
    if (this.mainWindow) {
      this.mainWindow.show();
      this.mainWindow.focus();
      logger.debug('窗口已显示');
    }
  }

  // 隐藏窗口
  hideWindow() {
    if (this.mainWindow) {
      this.mainWindow.hide();
      logger.debug('窗口已隐藏');
    }
  }

  // 检查窗口是否可见
  isWindowVisible() {
    return this.mainWindow ? this.mainWindow.isVisible() : false;
  }

  // 获取窗口实例
  getWindow() {
    return this.mainWindow;
  }

  // 设置退出标志
  setQuiting(isQuiting) {
    this.isQuiting = isQuiting;
  }

  // 销毁窗口
  destroyWindow() {
    if (this.mainWindow) {
      this.saveWindowState();
      this.mainWindow.destroy();
      this.mainWindow = null;
      logger.info('窗口已销毁');
    }
  }
}

module.exports = WindowManager;