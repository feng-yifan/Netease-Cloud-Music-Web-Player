const config = require('../config/default');

class Logger {
  constructor() {
    this.level = config.logger.level;
    this.console = config.logger.console;
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
  }

  shouldLog(level) {
    return this.levels[level] <= this.levels[this.level];
  }

  formatMessage(level, message, ...args) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    return [prefix, message, ...args];
  }

  error(message, ...args) {
    if (this.shouldLog('error')) {
      const formatted = this.formatMessage('error', message, ...args);
      if (this.console) {
        console.error(...formatted);
      }
    }
  }

  warn(message, ...args) {
    if (this.shouldLog('warn')) {
      const formatted = this.formatMessage('warn', message, ...args);
      if (this.console) {
        console.warn(...formatted);
      }
    }
  }

  info(message, ...args) {
    if (this.shouldLog('info')) {
      const formatted = this.formatMessage('info', message, ...args);
      if (this.console) {
        console.log(...formatted);
      }
    }
  }

  debug(message, ...args) {
    if (this.shouldLog('debug')) {
      const formatted = this.formatMessage('debug', message, ...args);
      if (this.console) {
        console.debug(...formatted);
      }
    }
  }
}

module.exports = new Logger();