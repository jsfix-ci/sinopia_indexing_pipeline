import elasticsearch from 'elasticsearch'
import Config from './config'
import Logger from './logger'

export default class Indexer {
  constructor() {
    this.client = new elasticsearch.Client({
      host: `${Config.indexHost}:${Config.indexPort}`,
      log: 'trace'
    })
    this.logger = new Logger()
  }

  /**
   * Uses client to index json
   * @param {Object} json - Object to be indexed
   * @returns {?boolean} true if successful; null if not
   */
  index(json) {
    return this.client.index({
      index: Config.indexName,
      type: Config.indexType,
      body: json
    }).then(indexResponse => {
      if (indexResponse.result != 'created') {
        throw {
          message: JSON.stringify(indexResponse)
        }
      }
      return true
    }).catch(err => {
      this.logger.error(`indexing error: ${err.message}`)
      return null
    })
  }
}
