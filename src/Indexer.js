import config from 'config'
import elasticsearch from 'elasticsearch'
import { JSONPath } from 'jsonpath-plus'
import Url from 'url-parse'
import Logger from './Logger'

export default class Indexer {
  constructor() {
    this.client = new elasticsearch.Client({
      host: config.get('indexUrl'),
      log: 'warning',
      apiVersion: '6.8'
    })
    this.logger = new Logger()
    this.knownIndexResults = ['created', 'updated']
    this.knownDeleteResults = ['deleted']
    this.indices = [config.get('resourceIndexName'), config.get('nonRdfIndexName')]
    this.storeDocumentIndices = [config.get('nonRdfIndexName')]
  }

  /**
   * Uses client to create or update index entry
   * @param {Object} json - Object to be indexed
   * @param {string} uri - URI of object to be indexed
   * @param {string} types - one or more LDP type URIs
   * @returns {Promise} resolves to true if successful; null if not
   */
  index(json, uri, types) {
    const index = this.indexNameFrom(types)
    const store_document = this.storeDocumentIndices.indexOf(index) > -1
    const body = this.buildIndexEntryFrom(uri, json, store_document)
    if(!body.uri || !body.label) {
      this.logger.debug(`skipping indexing ${uri} since no uri and/or label`)
      return true
    }
    return this.client.index({
      index: index,
      type: config.get('indexType'),
      id: this.identifierFrom(uri),
      body: body
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

  // https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-asciifolding-tokenfilter.html
  indexSettings() {
    return {
      analysis : {
        analyzer : {
          default : {
            tokenizer : 'standard',
            filter : ['lowercase', 'asciifolding']
          }
        }
      }
    }
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
          // analysis and filter settings must be provided at index creation time; alternatively, the index can be closed, configured, and reopened.
          // otherwise, an error is thrown along the lines of "error setting up indices: [illegal_argument_exception] Can't update non dynamic settings"
          // https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/6.x/api-reference.html#_indices_create
          await this.client.indices.create({ index: index, body: { settings: this.indexSettings() } })
        }

        await this.client.indices.putMapping({
          index: index,
          type: config.get('indexType'),
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

    for (const [fieldName, fieldProperties] of Object.entries(config.get('indexFieldMappings'))) {
      mappingObject.properties[fieldName] = {
        type: fieldProperties.type,
        store: fieldProperties.store == true,
        index: fieldProperties.index == false ? false : true
      }

      if (fieldProperties.autosuggest) {
        mappingObject.properties[`${fieldName}-suggest`] = {
          type: 'completion'
        }
      }
    }

    return mappingObject
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
   * Builds up an index entry out of a JSON body, given index field mappings from config
   * @param {string} uri - Trellis URI of the document
   * @param {Object} json - A Trellis resource (of some kind: RDFSource, BasicContainer, NonRDFSource, etc.)
   * @param {boolean} store_document - Whether to add the document to the indexed object
   * @returns {Object} an object containing configured field values if any found
   */
  buildIndexEntryFrom(uri, json, store_document) {
    const indexObject = {}

    if(store_document) {
      indexObject.document = json
    }

    this.buildIndexEntryFields(indexObject, uri, json)
    this.buildAggregateFields(indexObject)
    this.buildAutosuggest(indexObject)
    this.buildActivityStreamFields(indexObject, json)
    this.buildRDFTypes(indexObject, json)
    return indexObject
  }

  buildIndexEntryFields(indexObject, uri, json) {
    for (const [fieldName, fieldProperties] of Object.entries(config.get('indexFieldMappings'))) {
      if(fieldProperties.id) {
        indexObject[fieldName] = uri
      } else if (fieldProperties.path) {
        indexObject[fieldName] = JSONPath({
          json: json,
          path: fieldProperties.path,
          flatten: true
        })
          .filter(obj => obj['@value']) // Filter out fields without values, e.g., from the @context object
          .map(obj => obj['@value']) // Extract the value and ignore the @language for now (this is currently coupled to how titles are modeled)
      }
    }
  }

  buildAggregateFields(indexObject) {
    for (const [fieldName, fieldProperties] of Object.entries(config.get('indexFieldMappings'))) {
      if (fieldProperties.fields) {
        const values = this.getFieldValues(fieldProperties.fields, indexObject)
        if(values.length > 0) {
          indexObject[fieldName] = values.join(fieldProperties.joinby || ' ')
        }
      }
    }
  }

  getFieldValues(fields, indexObject) {
    const values = []
    fields.forEach((fieldName) => {
      if (indexObject[fieldName].length > 0) {
        values.push(indexObject[fieldName])
      }
    })
    return values
  }

  buildAutosuggest(indexObject) {
    for (const [fieldName, fieldProperties] of Object.entries(config.get('indexFieldMappings'))) {
      if (fieldProperties.autosuggest && indexObject[fieldName].length > 0) {
        indexObject[`${fieldName}-suggest`] = indexObject[fieldName].join(' ').split(' ').map(token => token.toLowerCase())
      }
    }
  }

  buildActivityStreamFields(indexObject, json) {
    for (const [fieldName, fieldProperties] of Object.entries(config.get('indexFieldMappings'))) {
      if(fieldProperties.asTypes) {
        const asDate = this.getActivityStreamDate(fieldProperties.asTypes, json['@graph'])
        if (asDate) indexObject[fieldName] = asDate
      }
    }
  }

  getActivityStreamDate(asTypes, json) {
    const dates = json
      .filter((item) => item.atTime && item['@type'])
      .filter((item) => item['@type'].some((type) => asTypes.map((asType) => `as:${asType}`).includes(type)))
      .map((item) => item.atTime).sort().reverse()
    return dates.length > 0 ? dates[0] : undefined
  }

  buildRDFTypes(indexObject, json) {
    indexObject['type'] = json['@graph']
      .filter((item) => item['@type'])
      .filter((item) => !item['@type'].includes('prov:Activity'))
      .map(item => item['@type'])
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
