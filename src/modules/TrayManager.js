const { Tray, Menu, nativeImage } = require('electron');
const fs = require('fs');
const logger = require('../utils/logger');
const config = require('../config/default');

class TrayManager {
  constructor(windowManager) {
    this.tray = null;
    this.windowManager = windowManager;
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