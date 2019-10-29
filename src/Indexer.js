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
  }

  /**
   * Uses client to create or update index entry
   * @param {Object} json - Object to be indexed
   * @param {string} uri - URI of object to be indexed
   * @param {string} types - one or more LDP type URIs
   * @returns {Promise} resolves to true if successful; null if not
   */
  async index(json, uri, types) {
    const [index, store_document, fields] = this.indexFrom(types)
    this.logger.debug(`${uri} (${types}) has index ${index}`)
    if (index === undefined) {
      this.logger.debug(`skipping indexing ${uri} (${types})`)
      return true
    }
    const body = this.buildIndexEntryFrom(uri, json, store_document, fields)

    if (! body.uri || ! body.label) {
      throw `${uri} requires a uri and label: ${body}`
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
  async delete(uri, types) {
    const [index] = this.indexFrom(types)
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
    const indexMappings = config.get('indexMappings')
    try {
      for (const index of Object.keys(indexMappings)) {
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
          body: this.buildMappingsFromConfig(indexMappings[index].fields)
        })
      }
    } catch(error) {
      this.logger.error(`error setting up indices: ${error}`)
    }
    return null
  }

  /**
   * Build field mappings from configuration
   * @param {Object} fields - Field configuration
   * @returns {Object}
   */
  buildMappingsFromConfig(fields) {
    const mappingObject = { properties: {} }

    for (const [fieldName, fieldProperties] of Object.entries(fields)) {
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
   * @param {Object} fields - Configuration for fields to be indexed
   * @returns {Object} an object containing configured field values if any found
   */
  buildIndexEntryFrom(uri, json, store_document, fields) {
    const indexObject = {}

    if(store_document) {
      indexObject.document = json
    }

    this.buildIndexEntryFields(indexObject, uri, json, fields)
    this.buildAggregateFields(indexObject, fields)
    this.buildAutosuggest(indexObject, fields)
    this.buildActivityStreamFields(indexObject, json, fields)
    this.buildRDFTypes(indexObject, json)
    return indexObject
  }

  buildIndexEntryFields(indexObject, uri, json, fields) {
    for (const [fieldName, fieldProperties] of Object.entries(fields)) {
      if(fieldProperties.id) {
        indexObject[fieldName] = uri
      } else if (fieldProperties.path) {
        const fieldValues = JSONPath({
          json: json,
          path: fieldProperties.path,
          flatten: true
        })
          .filter(obj => obj['@value']) // Filter out fields without values, e.g., from the @context object
          .map(obj => obj['@value']) // Extract the value and ignore the @language for now (this is currently coupled to how titles are modeled)
        if (fieldValues.length > 0) indexObject[fieldName] = fieldValues
      }
    }
  }

  buildAggregateFields(indexObject, fields) {
    for (const [fieldName, fieldProperties] of Object.entries(fields)) {
      if (fieldProperties.fields) {
        const fieldValues = fieldProperties.fields.map((fields) => {
          return this.getFieldValues(fields, indexObject)
          // if (values.length > 0) return values.join(fieldProperties.joinby || ' ')
        }).filter((values) => values.length > 0)
        if(fieldValues.length > 0) {
          indexObject[fieldName] = fieldValues[0].join(fieldProperties.joinby || ' ')
        }
      }
    }
  }

  getFieldValues(fields, indexObject) {
    const values = []
    fields.forEach((fieldName) => {
      if (indexObject[fieldName] && indexObject[fieldName].length > 0) {
        values.push(indexObject[fieldName])
      }
    })
    return values
  }

  buildAutosuggest(indexObject, fields) {
    for (const [fieldName, fieldProperties] of Object.entries(fields)) {
      if (fieldProperties.autosuggest && indexObject[fieldName] && indexObject[fieldName].length > 0) {
        indexObject[`${fieldName}-suggest`] = indexObject[fieldName].join(' ').split(' ').map(token => token.toLowerCase())
      }
    }
  }

  buildActivityStreamFields(indexObject, json, fields) {
    for (const [fieldName, fieldProperties] of Object.entries(fields)) {
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
   * Returns index information given a list of LDP types.
   * @param {Array} types - LDP type URIs of object
   * @returns {[string, store_document, fields]} name of index | undefined if should not index, whether to store document, field configuration
   */
  indexFrom(types) {
    if (types.includes('http://www.w3.org/ns/ldp#BasicContainer')) return [undefined, undefined, undefined]
    const indexMappings = config.get('indexMappings')
    const index = types.includes(config.get('nonRdfTypeURI')) ? 'sinopia_templates' : 'sinopia_resources'
    // For now, not indexing resource templates
    if (index === 'sinopia_templates') return [undefined, undefined, undefined]
    return [index, indexMappings[index].store_document, indexMappings[index].fields]
  }
}
