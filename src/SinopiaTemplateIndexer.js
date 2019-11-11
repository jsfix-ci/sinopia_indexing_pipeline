export default class {
  /**
   * Builds up an index entry out of a JSON body, given index field mappings from config
   * @param {Object} json - A Trellis resource (of some kind: RDFSource, BasicContainer, NonRDFSource, etc.)
   * @returns {Object} an object containing configured field values if any found
   */
  constructor(json) {
    this.indexObject = {}
    this.json = json
  }

  /**
   * Builds up an index entry out of a JSON body, given index field mappings from config
   * @returns {Object} an object containing configured field values if any found
   */
  index() {
    this.indexObject.id = this.json.id
    this.indexObject.author = this.json.author
    this.indexObject.date = this.json.date
    this.indexObject.remark = this.json.remark
    this.indexObject.resourceLabel = this.json.resourceLabel
    this.indexObject.resourceURI = this.json.resourceURI

    return this.indexObject
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