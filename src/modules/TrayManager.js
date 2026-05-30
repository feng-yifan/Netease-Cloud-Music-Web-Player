const { Tray, Menu, nativeImage, shell } = require('electron');
const fs = require('fs');
const logger = require('../utils/logger');
const config = require('../config');

class TrayManager {
  constructor(windowManager, playbackController = null) {
    this.tray = null;
    this.windowManager = windowManager;
    this.playbackController = playbackController;
    // 设置日志模块名称
    logger.setModule('TrayManager');
  }

  // 加载托盘图标
  loadTrayIcon() {
    if (fs.existsSync(config.tray.iconPath)) {
      try {
        const icon = nativeImage.createFromPath(config.tray.iconPath);
        logger.info('使用本地图标');
        return icon;
      } catch (error) {
        logger.error('本地图标加载失败:', error.message);
        throw new Error(`无法加载图标: ${error.message}`);
      }
    } else {
      const errorMsg = `图标文件不存在: ${config.tray.iconPath}`;
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }
  }

  // 创建托盘图标
  createTray() {
    try {
      // 加载托盘图标（可能抛出异常）
      const trayIcon = this.loadTrayIcon();

      // 创建托盘
      this.tray = new Tray(trayIcon);
      logger.info('系统托盘创建成功');

      // 设置托盘提示
      this.tray.setToolTip(config.tray.tooltip);

      // 创建右键菜单
      this.createContextMenu();

      // 绑定左键点击事件
      this.tray.on('click', () => {
        this.handleTrayClick();
      });

      // 绑定右键点击事件
      this.tray.on('right-click', () => {
        logger.debug('托盘右键菜单显示');
      });

      logger.info('系统托盘事件绑定完成');
    } catch (error) {
      logger.error('创建系统托盘失败:', error.message);
      throw error;
    }
  }

  // 创建右键菜单
  createContextMenu() {
    if (!this.tray) return;

    const contextMenu = Menu.buildFromTemplate([
      {
        label: '显示窗口',
        click: () => {
          this.windowManager.showWindow();
          logger.debug('托盘菜单：显示窗口');
        }
      },
      {
        label: '隐藏窗口',
        click: () => {
          this.windowManager.hideWindow();
          logger.debug('托盘菜单：隐藏窗口');
        }
      },
      { type: 'separator' },
      {
        label: '上一首',
        enabled: !!this.playbackController,
        click: () => {
          logger.debug('托盘菜单：上一首');
          this.handlePlaybackControl('previous');
        }
      },
      {
        label: '播放/暂停',
        enabled: !!this.playbackController,
        click: () => {
          logger.debug('托盘菜单：播放/暂停');
          this.handlePlaybackControl('togglePlayPause');
        }
      },
      {
        label: '下一首',
        enabled: !!this.playbackController,
        click: () => {
          logger.debug('托盘菜单：下一首');
          this.handlePlaybackControl('next');
        }
      },
      { type: 'separator' },
      {
        label: '查看日志目录',
        click: () => {
          logger.debug('托盘菜单：查看日志目录');
          this.openLogDirectory();
        }
      },
      { type: 'separator' },
      {
        label: '退出',
        click: () => {
          logger.info('用户通过托盘菜单退出应用');
          const { app } = require('electron');
          app.quit();
        }
      }
    ]);

    this.tray.setContextMenu(contextMenu);
    logger.debug('托盘右键菜单已创建');
  }

  // 处理播放控制
  handlePlaybackControl(action) {
    if (!this.playbackController) return;

    const control = this.playbackController[action];
    if (typeof control !== 'function') {
      logger.warn(`未知播放控制命令: ${action}`);
      return;
    }

    Promise.resolve(control.call(this.playbackController)).catch(error => {
      logger.error(`托盘播放控制执行失败: ${error.message}`);
    });
  }

  // 打开日志目录
  openLogDirectory() {
    try {
      const logDir = config.logger.logDir;

      // 确保日志目录存在
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
        logger.info(`创建日志目录: ${logDir}`);
      }

      // 打开目录
      shell.openPath(logDir).then(() => {
        logger.debug(`已打开日志目录: ${logDir}`);
      }).catch(error => {
        logger.error(`打开日志目录失败: ${error.message}`);
      });
    } catch (error) {
      logger.error(`处理日志目录打开请求失败: ${error.message}`);
    }
  }

  // 处理托盘点击事件
  handleTrayClick() {
    if (!this.tray) return;

    try {
      const isVisible = this.windowManager.isWindowVisible();

      if (isVisible) {
        this.windowManager.hideWindow();
        logger.debug('托盘点击：隐藏窗口');
      } else {
        this.windowManager.showWindow();
        logger.debug('托盘点击：显示窗口');
      }
    } catch (error) {
      logger.error('处理托盘点击事件失败:', error.message);
    }
  }

  // 销毁托盘
  destroyTray() {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
      logger.info('系统托盘已销毁');
    }
  }

  // 获取托盘实例
  getTray() {
    return this.tray;
  }
}

module.exports = TrayManager;
