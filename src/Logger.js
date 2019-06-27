import config from 'config'

export default class Logger {
  /**
   * Logs a debug message if configured
   * @param {string} message - The message to be logged
   */
  debug(message) {
    if (config.debug)
      console.debug(message)
  }

  /**
   * Logs an error message
   * @param {string} message - The message to be logged
   */
  error(message) {
    console.error(message)
  }
}
