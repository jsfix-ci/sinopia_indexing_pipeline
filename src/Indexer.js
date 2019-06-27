import config from 'config'
import elasticsearch from 'elasticsearch'
import { JSONPath } from 'jsonpath-plus'
import Url from 'url-parse'
import Logger from './Logger'

export default class Indexer {
  constructor() {
    this.client = new elasticsearch.Client({
      host: config.indexUrl,
      log: 'warning'
    })
    this.logger = new Logger()
    this.knownIndexResults = ['created', 'updated']
    this.knownDeleteResults = ['deleted']
    this.indices = [config.resourceIndexName, config.nonRdfIndexName]
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
      type: config.indexType,
      id: this.identifierFrom(uri),
      body: this.titlesAndSubtitlesFrom(json)
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
      type: config.indexType,
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
   * Create indices, if needed, and add field mappings
   * @returns {null}
   */
  async setupIndices() {
    try {
      for (const index of this.indices) {
        const indexExists = await this.client.indices.exists({ index: index })

        if (!indexExists) {
          await this.client.indices.create({ index: index })
        }

        await this.client.indices.putMapping({
          index: index,
          type: config.indexType,
          body: {
            properties: {
              title: {
                type: 'text'
              },
              subtitle: {
                type: 'text'
              }
            }
          }
        })
      }
    } catch(error) {
      this.logger.error(`error setting up indices: ${error}`)
    }
    return null
  }

  /**
   * Remove and recreate all known indices
   * @returns {null}
   */
  async recreateIndices() {
    try {
      await this.client.indices.delete({ index: '_all' })
      for (const index of this.indices) {
        await this.client.indices.create({ index: index })
      }
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
    const identifier = new Url(uri).pathname.substr(1) || config.rootNodeIdentifier
    this.logger.debug(`identifier from ${uri} is ${identifier}`)
    return identifier
  }

  /**
   * Parses titles and subtitles out of a JSON body
   * @param {Object} json - A Trellis resource (of some kind: RDFSource, BasicContainer, NonRDFSource, etc.)
   * @returns {Object} an object containing title and subtitle strings if any found, null if not
   */
  titlesAndSubtitlesFrom(json) {
    const titles = JSONPath({
      json: json,
      path: '$..mainTitle',
      flatten: true
    })
      .filter(obj => obj['@value']) // Filter out hits without values, e.g., from the @context object
      .map(obj => obj['@value']) // Extract the title value and ignore the @language for now

    const subtitles = JSONPath({
      json: json,
      path: '$..subtitle',
      flatten: true
    })
      .filter(obj => obj['@value']) // Filter out hits without values, e.g., from the @context object
      .map(obj => obj['@value']) // Extract the title value and ignore the @language for now

    return { title: titles, subtitle: subtitles }
  }

  /**
   * Returns appropriate index name given a list of LDP types
   * @param {Array} types - LDP type URIs of object
   * @returns {string} name of index
   */
  indexNameFrom(types) {
    if (types.includes(config.nonRdfTypeURI))
      return config.nonRdfIndexName
    return config.resourceIndexName
  }
}
