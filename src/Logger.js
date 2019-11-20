import config from 'config'
import Honeybadger from 'honeybadger'

export default class Logger {
  /**
   * Logs a debug message if configured
   * @param {string} message - The message to be logged
   */
  debug(message) {
    if (config.get('debug'))
      console.debug(message)
  }

  /**
   * Logs an error message
   * @param {string} message - The message to be logged
   * @param {Object} exception - The exception object
   */
  error(message, exception) {
    console.error(message)

    Honeybadger.notify(exception, {
      context: {
        message: message,
        config: config,
        env: process.env
      }
    })
  }
}
