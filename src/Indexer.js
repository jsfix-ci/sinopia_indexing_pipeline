import config from 'config'
import elasticsearch from 'elasticsearch'
import { JSONPath } from 'jsonpath-plus'
import Url from 'url-parse'
import Logger from './Logger'

export default class Indexer {
  constructor() {
    this.client = new elasticsearch.Client({
      host: config.get('indexUrl'),
      log: 'warning'
    })
    this.logger = new Logger()
    this.knownIndexResults = ['created', 'updated']
    this.knownDeleteResults = ['deleted']
    this.indices = [config.get('resourceIndexName'), config.get('nonRdfIndexName')]
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
      type: config.get('indexType'),
      id: this.identifierFrom(uri),
      body: this.buildIndexEntryFrom(json)
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
          type: config.get('get')('indexType'),
          body: this.buildMappingsFromConfig()
        })
      }
    } catch(error) {
      this.logger.error(`error setting up indices: ${error}`)
    }
    return null
  }

  /**
   * Build field mappings from configuration
   * @returns {Object}
   */
  buildMappingsFromConfig() {
    const mappingObject = { properties: {} }

    for (const fieldName in config.get('indexFieldMappings')) {
      mappingObject.properties[fieldName] = {
        type: config.get('indexFieldMappings')[fieldName].type
      }
    }

    return mappingObject
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
    const identifier = new Url(uri).pathname.substr(1) || config.get('rootNodeIdentifier')
    this.logger.debug(`identifier from ${uri} is ${identifier}`)
    return identifier
  }

  /**
   * Builds up an index entry out of a JSON body, given index field mappings from config
   * @param {Object} json - A Trellis resource (of some kind: RDFSource, BasicContainer, NonRDFSource, etc.)
   * @returns {Object} an object containing configured field values if any found
   */
  buildIndexEntryFrom(json) {
    // Begin by tossing the entire object into the index, giving us more leeway to search on full documents later
    const indexObject = { document: json }

    for (const fieldName in config.get('indexFieldMappings')) {
      indexObject[fieldName] = JSONPath({
        json: json,
        path: config.get('indexFieldMappings')[fieldName].path,
        flatten: true
      })
        .filter(obj => obj['@value']) // Filter out fields without values, e.g., from the @context object
        .map(obj => obj['@value']) // Extract the value and ignore the @language for now (this is currently coupled to how titles are modeled)
    }

    return indexObject
  }

  /**
   * Returns appropriate index name given a list of LDP types
   * @param {Array} types - LDP type URIs of object
   * @returns {string} name of index
   */
  indexNameFrom(types) {
    if (types.includes(config.get('nonRdfTypeURI')))
      return config.get('nonRdfIndexName')
    return config.get('resourceIndexName')
  }
}
