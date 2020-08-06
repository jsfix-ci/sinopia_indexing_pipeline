import config from 'config'
import Logger from './Logger'
import connect from './mongo'

export default class Listener {
  constructor() {
    this.dbName = config.get('dbName')
    this.collectionName = config.get('collectionName')
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
  async listen(onNewMessage) {
    return connect()
      .then(async (client) => {
        this.logger.debug(`watching ${this.dbName}.${this.collectionName}`)
        // See https://developer.mongodb.com/quickstart/nodejs-change-streams-triggers
        // AWS requires setting readPreference for collection.
        const changeStream = client
          .db(this.dbName)
          .collection(this.collectionName, { readPreference: 'primary' })
          .watch({ fullDocument: 'updateLookup' })

        while (await changeStream.hasNext()) {
          onNewMessage(await changeStream.next())
        }
        // changeStream.on('change', onNewMessage)
      })
      .catch((error) => this.logger.error(error))
  }
}
