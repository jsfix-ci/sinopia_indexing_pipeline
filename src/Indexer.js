import config from 'config'
import elasticsearch from '@elastic/elasticsearch'
import Logger from './Logger'
import TemplateIndexer from './TemplateIndexer'
import ResourceIndexer from './ResourceIndexer'
import rdf from 'rdf-ext'
import { datasetFromJsonld } from './utilities'

export default class Indexer {
  constructor() {
    this.client = new elasticsearch.Client({
      node: config.get('indexUrl'),
      log: 'warning',
      apiVersion: '7.4'
    })
    this.logger = new Logger()
    this.knownIndexResults = ['created', 'updated']
    this.knownDeleteResults = ['deleted']
    this.indexers = {
      template: TemplateIndexer,
      resource: ResourceIndexer
    }
    this.indexes = {
      template: 'sinopia_templates',
      resource: 'sinopia_resources'
    }
  }

  /**
   * Uses client to create or update index entry
   * @param {Object} doc - Document for resource, including resource and headers
   * @returns {Promise} resolves to true if successful; null if not
   */
  async index(doc) {
    try {
      const dataset = await datasetFromJsonld(doc.data)
    } catch (err) {
      this.logger.error(`Could not load dataset for ${doc.uri}: ${err}. ${JSON.stringify(doc)}`)
      return null
    }
    const resourceType = this.resourceTypeFor(dataset, doc.uri)
    if(!resourceType) {
      this.logger.error(`Could not determine resource type for ${doc.uri}: ${JSON.stringify(doc)}`)
      return null
    }

    const index = this.indexes[resourceType]

    const indexer = this.indexers[resourceType]
    if (!indexer) {
      this.logger.debug(`skipping indexing ${doc.uri} (${resourceType})`)
      return true
    }

    const body = new indexer(doc, dataset).index()
    if (!body) {
      this.logger.debug(`skipping indexing ${doc.uri} (${resourceType})`)
      return true
    }

    this.logger.debug(`Indexing ${doc.uri} (${resourceType}) into index ${index}: ${JSON.stringify(body)}`)

    return this.client.index({
      index: index,
      type: config.get('indexType'),
      id: doc.id,
      body
    }).then(indexResponse => {
      if (!this.knownIndexResults.includes(indexResponse.body.result))
        throw { message: JSON.stringify(indexResponse) }
      return true
    }).catch(err => {
      this.logger.error(`error indexing: ${err.message}`, err)
      return null
    })
  }

  /**
   * Uses client to delete index entry
   * @param {Object} doc - Document for resource, including resource and headers
   * @returns {?boolean} true if successful; null if not
   */
  async delete(doc) {
    const uri = `${config.get('uriPrefix')}/${doc.id}`

    const dataset = await datasetFromJsonld(doc.data)

    const resourceType = this.resourceTypeFor(dataset, doc.uri)
    if(!resourceType) {
      this.logger.error(`Could not determine resource type for ${doc.uri}`)
      return false
    }
    const index = this.indexes[resourceType]
    this.logger.debug(`deleting ${uri} from index`)

    return this.client.delete({
      index,
      type: config.get('indexType'),
      id: doc.id
    }).then(indexResponse => {
      if (!this.knownDeleteResults.includes(indexResponse.result))
        throw { message: JSON.stringify(indexResponse) }
      return true
    }).catch(err => {
      this.logger.error(`error deleting: ${err.message}`, err)
      return false
    })
  }

  // https://www.elastic.co/guide/en/elasticsearch/plugins/current/analysis-icu-folding.html
  indexSettings() {
    return {
      analysis: {
        analyzer: {
          default: {
            tokenizer: 'icu_tokenizer',
            filter: ['icu_folding', 'lowercase']
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
      for (const resourceType of Object.keys(this.indexers)) {
        const index = this.indexes[resourceType]
        const indexExists = await this.client.indices.exists({ index: index })

        if (!indexExists.body) {
          // analysis and filter settings must be provided at index creation time; alternatively, the index can be closed, configured, and reopened.
          // otherwise, an error is thrown along the lines of "error setting up indices: [illegal_argument_exception] Can't update non dynamic settings"
          // https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/6.x/api-reference.html#_indices_create
          await this.client.indices.create({ index: index, body: { settings: this.indexSettings() } })
        }
        await this.client.indices.putMapping({
          index: index,
          type: config.get('indexType'),
          body: this.indexers[resourceType].indexMapping,
          include_type_name: true
        })
      }
    } catch(error) {
      this.logger.error(`error setting up indices: ${error}`, error)
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
      this.logger.error(`error recreating indices: ${error}`, error)
    }
    return null
  }

  resourceTypeFor(dataset, uri) {
    const typeQuads = dataset.match(rdf.namedNode(uri), rdf.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type')).toArray()
    if(typeQuads.length === 0) return null
    const resourceClass = typeQuads[0].object.value
    return resourceClass === 'http://sinopia.io/vocabulary/ResourceTemplate' ? 'template' : 'resource'
  }

}
