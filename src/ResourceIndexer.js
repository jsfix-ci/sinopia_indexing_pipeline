import rdf from "rdf-ext"

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
  async index() {
    this.indexObject["uri"] = this.doc.uri
    this.buildTitles()
    this.buildSubtitles()
    this.buildLabel()
    this.buildAllText()
    // TODO: created
    // this.buildActivityStreamField('created', ['Create'])
    this.indexObject["modified"] = this.doc.timestamp
    this.buildRDFTypes()
    this.indexObject["group"] = this.doc.group
    this.indexObject["editGroups"] = this.doc.editGroups
    this.indexObject["mongoId"] = this.doc["_id"]
    return this.indexObject
  }

  buildTitles() {
    const titles = this.valuesFor([
      "http://id.loc.gov/ontologies/bibframe/mainTitle",
      "http://rdaregistry.info/Elements/w/P10223",
      "http://rdaregistry.info/Elements/w/P20315",
      "http://rdaregistry.info/Elements/w/P40085",
      "http://rdaregistry.info/Elements/w/P30156",
      "http://rdaregistry.info/Elements/m/P30156",
    ])
    if (titles.length > 0) this.indexObject["title"] = titles
  }

  buildSubtitles() {
    const subtitles = this.valuesFor([
      "http://id.loc.gov/ontologies/bibframe/subtitle",
    ])
    if (subtitles.length > 0) this.indexObject["subtitle"] = subtitles
  }

  valuesFor(predicates) {
    const quadArrays = predicates.map((predicate) =>
      this.dataset.match(null, rdf.namedNode(predicate)).toArray()
    )
    return quadArrays.flat().map((quad) => quad.object.value)
  }

  labelValues() {
    return this.dataset
      .match(
        rdf.namedNode(this.doc.uri),
        rdf.namedNode("http://www.w3.org/2000/01/rdf-schema#label")
      )
      .toArray()
      .map((quad) => quad.object.value)
  }

  buildAllText() {
    this.indexObject["text"] = this.dataset
      .toArray()
      .filter((quad) => quad.object.termType === "Literal")
      .map((quad) => quad.object.value)
  }

  buildLabel() {
    const labelValues = this.labelValues()

    if (labelValues.length > 0) {
      this.indexObject["label"] = labelValues[0]
      return
    }

    const fieldNames = ["title", "subtitle"]
    fieldNames.forEach((fieldName) => {
      if (
        this.indexObject[fieldName] &&
        this.indexObject[fieldName].length > 0
      ) {
        labelValues.push(this.indexObject[fieldName])
      }
    })
    this.indexObject["label"] =
      labelValues.length > 0 ? labelValues.join(": ") : this.doc.uri
  }

  buildRDFTypes() {
    this.indexObject["type"] = this.dataset
      .match(
        rdf.namedNode(this.doc.uri),
        rdf.namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type")
      )
      .toArray()
      .map((quad) => quad.object.value)
  }

  static get indexMapping() {
    return {
      properties: {
        title: {
          type: "text",
          store: true,
          index: true,
          fielddata: true,
        },
        subtitle: {
          type: "text",
          store: true,
          index: true,
          fielddata: true,
        },
        type: {
          type: "keyword",
          store: true,
          index: true,
        },
        uri: {
          type: "keyword",
          store: true,
          index: true,
        },
        label: {
          type: "keyword",
          store: true,
          index: false,
        },
        created: {
          type: "date",
          store: true,
          index: true,
        },
        modified: {
          type: "date",
          store: true,
          index: true,
        },
        text: {
          type: "text",
          store: false,
          index: true,
        },
        group: {
          type: "keyword",
          store: true,
          index: true,
        },
        editGroups: {
          type: "keyword",
          store: true,
          index: true,
        },
      },
    }
  }
}
