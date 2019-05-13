import elasticsearch from 'elasticsearch'
import Url from 'url-parse'
import Config from './Config'
import Logger from './Logger'

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
   * @param {Object} json - Object to be indexed
   * @param {string} uri - URI of object to be indexed
   * @param {string} types - one or more LDP type URIs
   * @returns {?boolean} true if successful; null if not
   */
  index(json, uri, types) {
    return this.client.index({
      index: this.indexNameFrom(types),
      type: Config.indexType,
      id: this.identifierFrom(uri),
      body: json
    }).then(indexResponse => {
      if (!this.knownIndexResults.includes(indexResponse.result))
        throw { message: JSON.stringify(indexResponse) }
      return true
    }).catch(err => {
      this.logger.error(`error indexing: ${err.message}`)
      return null
    })
  }

  /**
   * Uses client to delete index entry
   * @param {string} uri - URI of object to be indexed
   * @param {string} types - one or more LDP type URIs
   * @returns {?boolean} true if successful; null if not
   * @param {string} types - one or more LDP type URIs
   */
  delete(uri, types) {
    return this.client.delete({
      index: this.indexNameFrom(types),
      type: Config.indexType,
      id: this.identifierFrom(uri)
    }).then(indexResponse => {
      if (!this.knownDeleteResults.includes(indexResponse.result))
        throw { message: JSON.stringify(indexResponse) }
      return true
    }).catch(err => {
      this.logger.error(`error deleting: ${err.message}`)
      return null
    })
  }

  /**
   * Remove and recreate all known indices
   * @returns {null}
   */
  async recreateIndices() {
    try {
      await this.client.indices.delete({ index: '_all' })
      await this.client.indices.create({ index: Config.resourceIndexName })
      await this.client.indices.create({ index: Config.nonRdfIndexName })
    } catch(error) {
      this.logger.error(`error recreating indices: ${error}`)
    }
    return null
  }

  /**
   * Strips scheme/host/port from URI
   * @param {string} uri - URI of object, e.g., https://foo.bar/baz-quux-quuux
   * @returns {string} path from URI, e.g., baz-quux-quuux
   */
  identifierFrom(uri) {
    // pathname looks like /baz-quux-quuux; remove the slash
    const identifier = new Url(uri).pathname.substr(1) || Config.rootNodeIdentifier
    this.logger.debug(`identifier from ${uri} is ${identifier}`)
    return identifier
  }

  /**
   * Returns appropriate index name given a list of LDP types
   * @param {Array} types - LDP type URIs of object
   * @returns {string} name of index
   */
  indexNameFrom(types) {
    if (types.includes(Config.nonRdfTypeURI))
      return Config.nonRdfIndexName
    return Config.resourceIndexName
  }
}
