import rdf from "rdf-ext"
import GroupCache from "./GroupCache"

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
    this.groupCache = new GroupCache()
  }

  /**
   * Builds up an index entry out of a JSON body, given index field mappings from config
   * @returns {Object} an object containing configured field values if any found
   */
  async index() {
    const resourceId = this.valueFor(
      "http://sinopia.io/vocabulary/hasResourceId"
    )
    // Don't index base templates (i.e., templates for templates).
    if (resourceId.startsWith("sinopia:template:")) return null
    this.indexObject["id"] = resourceId
    this.indexObject["uri"] = this.doc.uri
    this.indexObject["author"] = this.valueFor(
      "http://sinopia.io/vocabulary/hasAuthor"
    )
    this.indexObject["date"] = this.indexDate()
    this.indexObject["remark"] = this.valueFor(
      "http://sinopia.io/vocabulary/hasRemark"
    )
    this.indexObject["resourceLabel"] = this.valueFor(
      "http://www.w3.org/2000/01/rdf-schema#label"
    )
    this.indexObject["resourceURI"] = this.valueFor(
      "http://sinopia.io/vocabulary/hasClass"
    )
    this.indexObject["group"] = this.doc.group
    this.indexObject["editGroups"] = this.doc.editGroups
    this.indexObject["groupLabel"] = await this.groupCache.getLabel(
      this.doc.group
    )

    return this.indexObject
  }

  valueFor(predicate) {
    const quads = this.dataset
      .match(rdf.namedNode(this.doc.uri), rdf.namedNode(predicate))
      .toArray()
    if (quads.length === 0) return undefined
    return quads[0].object.value
  }

  indexDate() {
    const date = this.valueFor("http://sinopia.io/vocabulary/hasDate")
    if (/\d{4}-\d{2}-\d{2}/.test(date)) return date
    return undefined
  }

  static get indexMapping() {
    return {
      properties: {
        id: {
          type: "keyword",
          store: true,
          index: true,
          normalizer: "lowercase_normalizer",
        },
        uri: {
          type: "keyword",
          store: true,
          index: true,
          normalizer: "lowercase_normalizer",
        },
        author: {
          type: "keyword",
          store: true,
          index: true,
          normalizer: "lowercase_normalizer",
        },
        date: {
          type: "date",
          store: true,
          index: false,
        },
        remark: {
          type: "keyword",
          store: true,
          index: true,
          normalizer: "lowercase_normalizer",
        },
        resourceLabel: {
          type: "keyword",
          store: true,
          index: true,
          normalizer: "lowercase_normalizer",
        },
        resourceURI: {
          type: "keyword",
          store: true,
          index: true,
          normalizer: "lowercase_normalizer",
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
        groupLabel: {
          type: "keyword",
          store: true,
          index: true,
          normalizer: "lowercase_normalizer",
        },
      },
    }
  }
}
