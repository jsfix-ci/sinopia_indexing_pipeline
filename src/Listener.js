import Stomp from 'stomp-client'
import Config from './Config'
import Logger from './Logger'

export default class Listener {
  constructor() {
    const stompOptions = {
      host: Config.brokerHost,
      port: Config.brokerPort,
      user: Config.brokerUsername,
      pass: Config.brokerPassword
    }

    if (Config.brokerTlsEnabled)
      stompOptions.tls = true

    this.client = new Stomp(stompOptions)
    this.logger = new Logger()
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
