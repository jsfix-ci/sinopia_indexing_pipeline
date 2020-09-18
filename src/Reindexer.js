import Logger from './Logger'
import Indexer from './Indexer'
import config from 'config'
import connect from './mongo'
import { replaceInKeys } from './utilities'

export default class Reindexer {
  constructor() {
    this.dbName = config.get('dbName')
    this.collectionName = config.get('collectionName')
    this.logger = new Logger()
    this.indexer = new Indexer()
  }

  /**
   * Runs the reindexer
   */
  async reindex() {
    await this.indexer.recreateIndices()
    connect()
      .then(async (client) => {
        try {
          this.logger.debug(`querying ${this.dbName}.${this.collectionName} for reindex`)
          const cursor = client.db(this.dbName).collection(this.collectionName).find()
          while(await cursor.hasNext()) {
            const doc = await cursor.next()

            // Need to map ! back to . in keys.
            await this.indexer.index(replaceInKeys(doc, '!', '.'))
          }
          this.logger.debug('done reindexing')
        } finally {
          client.close()
        }
      })
      .catch((error) => this.logger.error(error))
  }
}
