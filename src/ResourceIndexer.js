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
    if (fieldValues.length > 0) this.indexObject[fieldName] = fieldValues

  }

  buildAllText() {
    const fieldValues = JSONPath({
      json: this.json['@graph'],
      path: '$..*',
      flatten: true
    })
      .filter(obj => obj['@value']) // Filter out fields without values or labels
      .map(obj => obj['@value']) // Extract the value or label
    const labelValues = JSONPath({
      json: this.json['@graph'],
      path: '$..*',
      flatten: false
    })
      .filter(obj => obj['label']) // Filter out fields without values or labels
      .map(obj => obj['label']) // Extract the value or label

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
    this.indexObject['type'] = this.json['@graph']
      .filter((item) => item['@type'])
      .filter((item) => item['@id'] === '')
      .map(item => item['@type'])
  }

  static get indexMapping() {
    return {
      properties: {
        title: {
          type: 'text',
          store: true,
          index: true
        },
        subtitle: {
          type: 'text',
          store: true,
          index: true
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
        }
      }
    }
  }
}
