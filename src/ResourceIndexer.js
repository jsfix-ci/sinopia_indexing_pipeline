import { JSONPath } from 'jsonpath-plus'

export default class {
  /**
   * Builds up an index entry out of a JSON body, given index field mappings from config
   * @param {Object} json - A Trellis RDFSource
   * @param {string} uri - Trellis URI of the document
   * @returns {Object} an object containing configured field values if any found
   */
  constructor(json, uri) {
    this.indexObject = {}

    this.uri = uri
    this.json = json
  }

  /**
   * Builds up an index entry out of a JSON body, given index field mappings from config
   * @returns {Object} an object containing configured field values if any found
   */
  index() {
    this.indexObject['uri'] = this.uri
    this.buildFromPath('title', '$..[mainTitle,P10223,P20315,P40085,P30156]') //BIBFRAME and RDA
    this.buildFromPath('subtitle', '$..subtitle')
    this.buildLabel()
    this.buildAllText()
    this.buildActivityStreamField('created', ['Create'])
    this.buildActivityStreamField('modified', ['Create', 'Update'])
    this.buildRDFTypes()
    this.buildGroup()

    if (!this.indexObject.uri || !this.indexObject.label) {
      throw `${this.uri} requires a uri and label: ${this.indexObject}`
    }
    return this.indexObject
  }

  buildFromPath(fieldName, path) {
    const fieldValues = JSONPath({
      json: this.json['@graph'],
      path: path,
      flatten: true
    })
      .filter(obj => obj['@value']) // Filter out fields without values, e.g., from the @context object
      .map(obj => obj['@value']) // Extract the value and ignore the @language for now (this is currently coupled to how titles are modeled)
      .filter(obj => typeof obj === 'string') // Remove anything not a string
    if (fieldValues.length > 0) this.indexObject[fieldName] = fieldValues

  }

  buildAllText() {
    const fieldValues = JSONPath({
      json: this.json['@graph'],
      path: '$..*',
      flatten: true
    })
      .filter(obj => obj['@value']) // Filter out fields without values
      .map(obj => obj['@value']) // Extract the value
      .filter(obj => typeof obj === 'string') // Remove anything not a string

    const labelValues = JSONPath({
      json: this.json['@graph'],
      path: '$..*',
      flatten: false
    })
      .filter(obj => obj['label']) // Filter out fields without labels
      .map(obj => obj['label']) // Extract label
      .filter(obj => typeof obj === 'string') // Remove anything not a string
    this.indexObject['text'] = [...fieldValues, ...labelValues]
  }

  buildLabel() {
    const labelValues = []
    const fieldNames = ['title', 'subtitle']
    fieldNames.forEach((fieldName) => {
      if (this.indexObject[fieldName] && this.indexObject[fieldName].length > 0) {
        labelValues.push(this.indexObject[fieldName])
      }
    })
    this.indexObject['label'] = labelValues.length > 0 ? labelValues.join(': ') : this.uri
  }

  buildActivityStreamField(fieldName, asTypes) {
    const dates = this.json['@graph']
      .filter((item) => item.atTime && item['@type'])
      .filter((item) => item['@type'].some((type) => asTypes.map((asType) => `as:${asType}`).includes(type)))
      .map((item) => item.atTime).sort().reverse()
    if (dates.length > 0) this.indexObject[fieldName] = dates[0]
  }

  buildRDFTypes() {
    // This handles resources that have relative URIs (<> or '') or URIs.
    // Our previous approach of saving resources as N-Triples resulted in resources
    // with relative URIs.
    this.indexObject['type'] = this.json['@graph']
      .filter((item) => item['@type'])
      .filter((item) => item['@id'] === '' || item['@id'] === this.uri)
      .map(item => item['@type'])
  }

  buildGroup() {
    this.indexObject['group'] = this.uri.split('/')[4]
  }

  static get indexMapping() {
    return {
      properties: {
        title: {
          type: 'text',
          store: true,
          index: true,
          fielddata: true
        },
        subtitle: {
          type: 'text',
          store: true,
          index: true,
          fielddata: true
        },
        type:  {
          type: 'keyword',
          store: true,
          index: true
        },
        uri: {
          type: 'keyword',
          store: true,
          index: true
        },
        label: {
          type: 'keyword',
          store: true,
          index: false
        },
        created: {
          type: 'date',
          store: true,
          index: true
        },
        modified: {
          type: 'date',
          store: true,
          index: true
        },
        text: {
          type: 'text',
          store: false,
          index: true
        },
        group: {
          type: 'keyword',
          store: true,
          index: true
        }
      }
    }
  }
}
