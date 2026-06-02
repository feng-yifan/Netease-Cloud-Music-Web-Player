const path = require('path');
const { app } = require('electron');

const config = {
  // 应用基本配置
  app: {
    name: '网易云音乐',
    version: '1.0.0',
    url: 'https://music.163.com/st/webplayer',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  },

  // 窗口配置
  window: {
    defaultWidth: 1200,
    defaultHeight: 800,
    minWidth: 800,
    minHeight: 600
  },

  // 状态文件配置
  state: {
    fileName: 'window-state.json',
    filePath: path.join(app.getPath('userData'), 'window-state.json')
  },

  // 日志配置
  logger: {
    level: 'info', // error, warn, info, debug
    console: true,
    file: true, // 启用文件输出
    fileName: 'app.log',
    logDir: path.join(app.getPath('userData'), 'logs'),
    maxSize: 10 * 1024 * 1024, // 10MB日志轮转
    maxFiles: 5 // 保留5个旧日志文件
  },

  // 托盘配置
  tray: {
    tooltip: '网易云音乐',
    iconPath: path.join(__dirname, '../assets/icon.png')
  },

  // 缩放配置
  zoom: {
    defaultLevel: 0,
    minLevel: -5,
    maxLevel: 5,
    step: 0.5
  },
};

module.exports = config;