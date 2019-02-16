import Stomp from 'stomp-client'
import Config from './config'
import Logger from './logger'

export default class Listener {
  constructor() {
    this.logger = new Logger()
    this.client = new Stomp(Config.brokerHost, Config.brokerPort)
  }

  /**
   * @callback messageCallback
   * @param {string} body - Message body
   * @param {Object} headers - Message headers as key-value pairs
   */

  /**
   * Listens for messages on a queue
   * @param {messageCallback} onNewMessage - Callback that handles the message
   */
  listen(onNewMessage) {
    this.logger.debug(`connecting to stomp at ${this.client.address}:${this.client.port}`)
    this.client.connect((_sessionId) => {
      this.logger.debug(`subscribing to ${Config.queueName}, waiting for messages`)
      this.client.subscribe(Config.queueName, onNewMessage)
    })
  }
}
