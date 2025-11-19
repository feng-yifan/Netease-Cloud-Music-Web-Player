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
    file: false // 不写入文件，保持简单
  },

  // 托盘配置
  tray: {
    tooltip: '网易云音乐',
    iconPath: path.join(__dirname, '../assets/icon.png')
  }
};

module.exports = config;