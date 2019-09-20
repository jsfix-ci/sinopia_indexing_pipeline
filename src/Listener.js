import config from 'config'
import Stomp from 'stomp-client'
import Logger from './Logger'

export default class Listener {
  constructor() {
    const stompOptions = {
      host: config.get('brokerHost'),
      port: config.get('brokerPort'),
      user: config.get('brokerUsername'),
      pass: config.get('brokerPassword'),
      reconnectOpts: {
        retries: config.get('brokerRetries'),
        delay: config.get('brokerRetryDelay')
      }
    }

    if (config.get('brokerTlsEnabled'))
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
      this.logger.debug(`subscribing to ${config.get('queueName')}, waiting for messages`)
      this.client.subscribe(config.get('queueName'), onNewMessage)
    })
  }
}
