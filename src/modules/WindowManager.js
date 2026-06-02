const { BrowserWindow, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { URL } = require('url');
const logger = require('../utils/logger');
const config = require('../config');

class WindowManager {
  constructor() {
    this.mainWindow = null;
    this.isQuiting = false;
    this.zoomLevel = 0;
    // 设置日志模块名称
    logger.setModule('WindowManager');
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
          y: state.y,
          zoomLevel: state.zoomLevel !== undefined ? state.zoomLevel : config.zoom.defaultLevel
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
        y: bounds.y,
        zoomLevel: this.zoomLevel
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
  createMainWindow(options = {}) {
    try {
      const windowState = this.loadWindowState();
      const startMinimized = options.startMinimized || false;

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

      // 应用保存的缩放级别
      this.zoomLevel = windowState.zoomLevel;
      this.mainWindow.webContents.setZoomLevel(this.zoomLevel);

      // 设置用户代理
      this.mainWindow.webContents.setUserAgent(config.app.userAgent);

      // 加载网易云音乐网页版
      this.mainWindow.loadURL(config.app.url, {
        userAgent: config.app.userAgent
      });

      // 页面加载完成后显示窗口
      this.mainWindow.once('ready-to-show', () => {
        if (startMinimized) {
          // 启动时最小化，不显示窗口
          logger.info('主窗口已创建（启动时最小化到托盘）');
        } else {
          this.mainWindow.show();
          logger.info('主窗口已显示');
        }
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

      // 窗口状态变化事件监听
      this.mainWindow.on('minimize', () => logger.debug('窗口已最小化'));
      this.mainWindow.on('maximize', () => logger.debug('窗口已最大化'));
      this.mainWindow.on('unmaximize', () => logger.debug('窗口已还原'));
      this.mainWindow.on('focus', () => logger.debug('窗口获得焦点'));
      this.mainWindow.on('blur', () => logger.debug('窗口失去焦点'));

      // 缩放事件 (Ctrl + 滚轮)
      this.mainWindow.webContents.on('zoom-changed', (_event, direction) => {
        const delta = direction === 'in' ? config.zoom.step : -config.zoom.step;
        const newLevel = Math.max(config.zoom.minLevel,
          Math.min(config.zoom.maxLevel, this.zoomLevel + delta));
        this.setZoomLevel(newLevel);
      });

      // 键盘缩放快捷键 (Ctrl + +/-/0)
      this.mainWindow.webContents.on('before-input-event', (event, input) => {
        if (!input.control && !input.meta) return;

        if (input.key === '=' || input.key === '+') {
          event.preventDefault();
          const newLevel = Math.min(this.zoomLevel + config.zoom.step, config.zoom.maxLevel);
          this.setZoomLevel(newLevel);
        } else if (input.key === '-') {
          event.preventDefault();
          const newLevel = Math.max(this.zoomLevel - config.zoom.step, config.zoom.minLevel);
          this.setZoomLevel(newLevel);
        } else if (input.key === '0') {
          event.preventDefault();
          this.setZoomLevel(config.zoom.defaultLevel);
        }
      });

      // 页面加载事件监听
      this.mainWindow.webContents.on('did-start-loading', () => logger.debug('页面开始加载'));
      this.mainWindow.webContents.on('did-finish-load', () => logger.debug('页面加载完成'));
      this.mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        logger.error(`页面加载失败: ${errorCode} - ${errorDescription}`);
      });

      // URL变化追踪
      this.mainWindow.webContents.on('did-navigate', (event, url) => {
        logger.info(`页面导航完成: ${url}`);
      });

      this.mainWindow.webContents.on('did-navigate-in-page', (event, url, isMainFrame) => {
        if (isMainFrame) {
          logger.debug(`页面内导航: ${url}`);
        }
      });


      // 处理新窗口打开事件
      this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        try {
          const urlObj = new URL(url);
          // 如果是网易云音乐域名，在应用内打开
          if (urlObj.hostname.includes('music.163.com')) {
            logger.debug('应用内打开链接:', url);
            return { action: 'allow' };
          }
          // 其他链接在外部浏览器打开
          logger.debug('外部浏览器打开链接:', url);
          shell.openExternal(url);
        } catch (error) {
          logger.error('处理新窗口链接失败:', error.message);
        }
        return { action: 'deny' };
      });

      // 处理页面内链接点击
      this.mainWindow.webContents.on('will-navigate', (event, url) => {
        logger.debug(`即将导航到: ${url}`);
        const currentUrl = this.mainWindow.webContents.getURL();
        // 如果链接与当前页面相同，允许导航（正常页面跳转）
        if (url === currentUrl) {
          logger.debug('允许同页面导航:', url);
          return;
        }

        try {
          const urlObj = new URL(url);
          // 如果是网易云音乐域名，允许在应用内导航
          if (urlObj.hostname.includes('music.163.com')) {
            logger.debug('应用内导航到:', url);
            return;
          }
          // 其他链接在外部浏览器打开
          logger.debug('外部浏览器打开导航链接:', url);
          event.preventDefault();
          shell.openExternal(url);
        } catch (error) {
          logger.error('处理导航链接失败:', error.message);
          event.preventDefault();
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

  // 设置缩放级别
  setZoomLevel(level) {
    const rounded = Math.round(level / config.zoom.step) * config.zoom.step;
    const clamped = Math.max(config.zoom.minLevel,
      Math.min(config.zoom.maxLevel, rounded));

    if (this.zoomLevel !== clamped) {
      this.zoomLevel = clamped;
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.setZoomLevel(clamped);
      }
      this.saveWindowState();
      logger.debug(`缩放级别已更新: ${clamped}`);
    }
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