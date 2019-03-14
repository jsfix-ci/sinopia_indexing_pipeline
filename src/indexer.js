import elasticsearch from 'elasticsearch'
import Url from 'url-parse'
import Config from './config'
import Logger from './logger'

export default class Indexer {
  constructor() {
    this.client = new elasticsearch.Client({
      host: `${Config.indexHost}:${Config.indexPort}`,
      log: 'warning'
    })
    this.logger = new Logger()
    this.knownIndexResults = ['created', 'updated']
    this.knownDeleteResults = ['deleted']
  }

  /**
   * Uses client to create or update index entry
   * @param {string} uri - URI of object to be indexed
   * @param {Object} json - Object to be indexed
   * @returns {?boolean} true if successful; null if not
   */
  index(json, uri) {
    return this.client.index({
      index: Config.indexName,
      type: Config.indexType,
      id: this.identifier_from(uri),
      body: json
    }).then(indexResponse => {
      if (!this.knownIndexResults.includes(indexResponse.result)) {
        throw {
          message: JSON.stringify(indexResponse)
        }
      }
      return true
    }).catch(err => {
      this.logger.error(`error indexing: ${err.message}`)
      return null
    })
  }

  /**
   * Uses client to delete index entry
   * @param {string} uri - URI of object to be indexed
   * @returns {?boolean} true if successful; null if not
   */
  delete(uri) {
    return this.client.delete({
      index: Config.indexName,
      type: Config.indexType,
      id: this.identifier_from(uri)
    }).then(indexResponse => {
      if (!this.knownDeleteResults.includes(indexResponse.result)) {
        throw {
          message: JSON.stringify(indexResponse)
        }
      }
      return true
    }).catch(err => {
      this.logger.error(`error deleting: ${err.message}`)
      return null
    })
  }

  /**
   * Strips scheme/host/port from URI
   * @param {string} uri - URI of object, e.g., https://foo.bar/baz-quux-quuux
   * @returns {string} path from URI, e.g., baz-quux-quuux
   */
  identifier_from(uri) {
    // pathname looks like /baz-quux-quuux; remove the slash
    let identifier = new Url(uri).pathname.substr(1) || Config.rootNodeIdentifier
    this.logger.debug(`identifier from ${uri} is ${identifier}`)
    return identifier
  }
}
