import config from 'config'
import elasticsearch from '@elastic/elasticsearch'
import Url from 'url-parse'
import Logger from './Logger'
import SinopiaTemplateIndexer from './SinopiaTemplateIndexer'
import ResourceIndexer from './ResourceIndexer'

export default class Indexer {
  constructor() {
    this.client = new elasticsearch.Client({
      node: config.get('indexUrl'),
      log: 'warning',
      apiVersion: '6.8'
    })
    this.logger = new Logger()
    this.knownIndexResults = ['created', 'updated']
    this.knownDeleteResults = ['deleted']
    this.indexers = {
      sinopia_templates: SinopiaTemplateIndexer,
      sinopia_resources: ResourceIndexer
    }
  }

  /**
   * Uses client to create or update index entry
   * @param {Object} json - Object to be indexed
   * @param {string} uri - URI of object to be indexed
   * @param {string} types - one or more LDP type URIs
   * @returns {Promise} resolves to true if successful; null if not
   */
  async index(json, uri, types) {
    const index = this.indexFrom(types)
    this.logger.debug(`${uri} (${types}) has index ${index}`)

    const indexer = this.indexers[index]
    if (indexer === undefined) {
      this.logger.debug(`skipping indexing ${uri} (${types})`)
      return true
    }

    return this.client.index({
      index: index,
      type: config.get('indexType'),
      id: this.identifierFrom(uri),
      body: new indexer(json, uri).index()
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
   * @param {Promise} resolves to types - one or more LDP type URIs
   */
  async delete(uri, types) {
    const index = this.indexFrom(types)
    if (index === undefined) {
      this.logger.debug(`skipping deleting ${uri} (${types})`)
      return true
    }
    return this.client.delete({
      index,
      type: config.get('indexType'),
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

  // https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-asciifolding-tokenfilter.html
  indexSettings() {
    return {
      analysis: {
        analyzer: {
          default: {
            tokenizer: 'standard',
            filter: ['lowercase', 'asciifolding']
          }
        },
        normalizer: {
          lowercase_normalizer: {
            type: 'custom',
            char_filter: [],
            filter: ['lowercase']
          }
        }
      }
    }
  }

  /**
   * Create indices, if needed, and add field mappings
   */
  async setupIndices() {
    try {
      for (const index of Object.keys(this.indexers)) {
        const indexExists = await this.client.indices.exists({ index: index })

        if (!indexExists) {
          // analysis and filter settings must be provided at index creation time; alternatively, the index can be closed, configured, and reopened.
          // otherwise, an error is thrown along the lines of "error setting up indices: [illegal_argument_exception] Can't update non dynamic settings"
          // https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/6.x/api-reference.html#_indices_create
          await this.client.indices.create({ index: index, body: { settings: this.indexSettings() } })
        }

        await this.client.indices.putMapping({
          index: index,
          type: config.get('indexType'),
          body: this.indexers[index].indexMapping
        })
      }
    } catch(error) {
      this.logger.error(`error setting up indices: ${error}`)
    }
    return null
  }

  /**
   * Remove and recreate all known indices
   * @returns {Promise} resolves to null upon completion (errors, if any, are logged)
   */
  async recreateIndices() {
    try {
      await this.client.indices.delete({ index: '_all' })
      await this.setupIndices()
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
    const identifier = new Url(uri).pathname.substr(1) || config.get('rootNodeIdentifier')
    this.logger.debug(`identifier from ${uri} is ${identifier}`)
    return identifier
  }

  /**
   * Returns index information given a list of LDP types.
   * @param {Array} types - LDP type URIs of object
   * @returns {string]} name of index or undefined
   */
  indexFrom(types) {
    if (types.includes('http://www.w3.org/ns/ldp#BasicContainer')) return undefined
    return types.includes(config.get('nonRdfTypeURI')) ? 'sinopia_templates' : 'sinopia_resources'
  }
}
