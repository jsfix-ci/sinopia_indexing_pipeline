import rdf from 'rdf-ext'

export default class {
  /**
   * Builds up an index entry out of a JSON body, given index field mappings from config
   * @param {Object} doc - Document for resource, including resource and headers
   * @param {rdf.Dataset} dataset - dataset containing resource
   * @returns {Object} an object containing configured field values if any found
   */
  constructor(doc, dataset) {
    this.indexObject = {}
    this.doc = doc
    this.dataset = dataset
  }

  /**
   * Builds up an index entry out of a JSON body, given index field mappings from config
   * @returns {Object} an object containing configured field values if any found
   */
  index() {
    this.indexObject.id = this.valueFor('http://sinopia.io/vocabulary/hasResourceId')
    this.indexObject.uri = this.doc.uri
    this.indexObject.author = this.valueFor('http://sinopia.io/vocabulary/hasAuthor')
    this.indexObject.date = this.valueFor('http://sinopia.io/vocabulary/hasDate')
    this.indexObject.remark = this.valueFor('http://sinopia.io/vocabulary/hasRemark')
    this.indexObject.resourceLabel = this.valueFor('http://www.w3.org/2000/01/rdf-schema#label')
    this.indexObject.resourceURI = this.valueFor('http://sinopia.io/vocabulary/hasClass')

    return this.indexObject
  }

  valueFor(predicate) {
    const quads = this.dataset.match(rdf.namedNode(this.doc.uri), rdf.namedNode(predicate)).toArray()
    if(quads.length === 0) return undefined
    return quads[0].object.value
  }

  static get indexMapping() {
    return {
      properties: {
        id: {
          type: 'keyword',
          store: true,
          index: true,
          normalizer: 'lowercase_normalizer'
        },
        uri: {
          type: 'keyword',
          store: true,
          index: true,
          normalizer: 'lowercase_normalizer'
        },
        author: {
          type: 'keyword',
          store: true,
          index: true,
          normalizer: 'lowercase_normalizer'
        },
        date: {
          type: 'date',
          store: true,
          index: false
        },
        remark: {
          type: 'keyword',
          store: true,
          index: true,
          normalizer: 'lowercase_normalizer'
        },
        resourceLabel: {
          type: 'keyword',
          store: true,
          index: true,
          normalizer: 'lowercase_normalizer'
        },
        resourceURI: {
          type: 'keyword',
          store: true,
          index: true,
          normalizer: 'lowercase_normalizer'
        },
      }
    }
  }
}
