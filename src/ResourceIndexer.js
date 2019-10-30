import { JSONPath } from 'jsonpath-plus'

export default class {
  /**
   * Builds up an index entry out of a JSON body, given index field mappings from config
   * @param {Object} json - A Trellis RDFSource
   * @param {string} uri - Trellis URI of the document
   * @param {boolean} store_document - Whether to add the document to the indexed object
   * @param {Object} fields - Configuration for fields to be indexed
   * @returns {Object} an object containing configured field values if any found
   */
  constructor(json, uri, store_document, fields) {
    this.indexObject = {}

    if(store_document) {
      this.indexObject.document = json
    }
    this.uri = uri
    this.json = json
    this.fields = fields
  }

  /**
   * Builds up an index entry out of a JSON body, given index field mappings from config
   * @returns {Object} an object containing configured field values if any found
   */
  index() {
    this.buildIndexEntryFields()
    this.buildAggregateFields()
    this.buildAutosuggest()
    this.buildActivityStreamFields()
    this.buildRDFTypes()


    if (!this.indexObject.uri || !this.indexObject.label) {
      throw `${this.uri} requires a uri and label: ${this.indexObject}`
    }

    return this.indexObject
  }

  buildIndexEntryFields() {
    for (const [fieldName, fieldProperties] of Object.entries(this.fields)) {
      if(fieldProperties.id) {
        this.indexObject[fieldName] = this.uri
      } else if (fieldProperties.path) {
        const fieldValues = JSONPath({
          json: this.json,
          path: fieldProperties.path,
          flatten: true
        })
          .filter(obj => obj['@value']) // Filter out fields without values, e.g., from the @context object
          .map(obj => obj['@value']) // Extract the value and ignore the @language for now (this is currently coupled to how titles are modeled)
        if (fieldValues.length > 0) this.indexObject[fieldName] = fieldValues
      }
    }
  }

  buildAggregateFields() {
    for (const [fieldName, fieldProperties] of Object.entries(this.fields)) {
      if (fieldProperties.fields) {
        const fieldValues = fieldProperties.fields.map((fields) => {
          return this.getFieldValues(fields)
          // if (values.length > 0) return values.join(fieldProperties.joinby || ' ')
        }).filter((values) => values.length > 0)
        if(fieldValues.length > 0) {
          this.indexObject[fieldName] = fieldValues[0].join(fieldProperties.joinby || ' ')
        }
      }
    }
  }

  getFieldValues(fields) {
    const values = []
    fields.forEach((fieldName) => {
      if (this.indexObject[fieldName] && this.indexObject[fieldName].length > 0) {
        values.push(this.indexObject[fieldName])
      }
    })
    return values
  }

  buildAutosuggest() {
    for (const [fieldName, fieldProperties] of Object.entries(this.fields)) {
      if (fieldProperties.autosuggest && this.indexObject[fieldName] && this.indexObject[fieldName].length > 0) {
        this.indexObject[`${fieldName}-suggest`] = this.indexObject[fieldName].join(' ').split(' ').map(token => token.toLowerCase())
      }
    }
  }

  buildActivityStreamFields() {
    for (const [fieldName, fieldProperties] of Object.entries(this.fields)) {
      if(fieldProperties.asTypes) {
        const asDate = this.getActivityStreamDate(fieldProperties.asTypes, this.json['@graph'])
        if (asDate) this.indexObject[fieldName] = asDate
      }
    }
  }

  getActivityStreamDate(asTypes, graph) {
    const dates = graph
      .filter((item) => item.atTime && item['@type'])
      .filter((item) => item['@type'].some((type) => asTypes.map((asType) => `as:${asType}`).includes(type)))
      .map((item) => item.atTime).sort().reverse()
    return dates.length > 0 ? dates[0] : undefined
  }

  buildRDFTypes() {
    this.indexObject['type'] = this.json['@graph']
      .filter((item) => item['@type'])
      .filter((item) => item['@id'] === '')
      .map(item => item['@type'])
  }
}
