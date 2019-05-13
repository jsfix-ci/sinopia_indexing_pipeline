import Config from './Config'

export default class Logger {
  /**
   * Logs a debug message if configured
   * @param {string} message - The message to be logged
   */
  debug(message) {
    if (Config.debug)
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
