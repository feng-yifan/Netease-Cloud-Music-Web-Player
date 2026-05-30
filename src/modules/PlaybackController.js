const { URL } = require('url');
const logger = require('../utils/logger');

const PLAYBACK_CONTROLS = {
  previous: {
    label: '上一首',
    selectors: [
      'footer button[title="上一首"]',
      'button[title="上一首"]',
      'footer [aria-label="pre"]',
      '[aria-label="pre"].cmd-icon-pre',
      '.cmd-icon-pre',
      'footer button:has([aria-label="pre"])',
      'footer button:has(.cmd-icon-pre)',
      '#g_player [data-action="prev"]',
      '.m-playbar [data-action="prev"]',
      '#g_player .prv'
    ]
  },
  toggle: {
    label: '播放/暂停',
    selectors: [
      '#btn_pc_minibar_play',
      'footer button.play-pause-btn',
      'button.play-pause-btn',
      'footer button[title="播放"]',
      'footer button[title="暂停"]',
      '#g_player [data-action="play"]',
      '.m-playbar [data-action="play"]',
      '#g_player .ply',
      '#g_player .pas'
    ]
  },
  next: {
    label: '下一首',
    selectors: [
      'footer button[title="下一首"]',
      'button[title="下一首"]',
      'footer [aria-label="next"]',
      '[aria-label="next"].cmd-icon-next',
      '.cmd-icon-next',
      'footer button:has([aria-label="next"])',
      'footer button:has(.cmd-icon-next)',
      '#g_player [data-action="next"]',
      '.m-playbar [data-action="next"]',
      '#g_player .nxt'
    ]
  }
};

class PlaybackController {
  constructor(windowManager) {
    this.windowManager = windowManager;
  }

  previous() {
    return this.control('previous');
  }

  togglePlayPause() {
    return this.control('toggle');
  }

  next() {
    return this.control('next');
  }

  async control(action) {
    const control = PLAYBACK_CONTROLS[action];
    if (!control) {
      logger.warn(`未知播放控制命令: ${action}`);
      return false;
    }

    const webContents = this.getMusicWebContents();
    if (!webContents) {
      logger.warn(`播放控制失败，播放器页面未就绪: ${control.label}`);
      return false;
    }

    try {
      const result = await webContents.executeJavaScript(
        this.buildClickScript(control.selectors),
        true
      );

      if (result && result.success) {
        logger.debug(`播放控制执行成功: ${control.label}`);
        return true;
      }

      logger.warn(`播放控制失败，未找到可用控件: ${control.label}`);
      return false;
    } catch (error) {
      logger.error(`播放控制执行异常: ${control.label}`, error.message);
      return false;
    }
  }

  getMusicWebContents() {
    const window = this.windowManager.getWindow();

    if (!window || window.isDestroyed()) {
      return null;
    }

    const { webContents } = window;
    if (!webContents || webContents.isDestroyed() || webContents.isLoading()) {
      return null;
    }

    if (!this.isMusicPage(webContents.getURL())) {
      return null;
    }

    return webContents;
  }

  isMusicPage(url) {
    try {
      const { hostname } = new URL(url);
      return hostname === 'music.163.com' || hostname.endsWith('.music.163.com');
    } catch {
      return false;
    }
  }

  buildClickScript(selectors) {
    return `
      (() => {
        const selectors = ${JSON.stringify(selectors)};

        const getClickTarget = (element) => {
          return element && element.closest ? element.closest('button') || element : element;
        };

        const isUsable = (element) => {
          if (!element || element.disabled) return false;
          if (element.getAttribute('aria-disabled') === 'true') return false;

          let current = element;
          while (current && current !== document.documentElement) {
            const style = window.getComputedStyle(current);
            if (
              style.display === 'none' ||
              style.visibility === 'hidden' ||
              style.pointerEvents === 'none' ||
              style.contentVisibility === 'hidden'
            ) {
              return false;
            }
            current = current.parentElement;
          }

          return true;
        };

        for (const selector of selectors) {
          let candidates = [];
          try {
            candidates = Array.from(document.querySelectorAll(selector));
          } catch {
            continue;
          }

          const element = candidates
            .map(getClickTarget)
            .find(isUsable);

          if (element) {
            element.click();
            return { success: true, selector };
          }
        }

        return { success: false };
      })();
    `;
  }
}

module.exports = PlaybackController;
