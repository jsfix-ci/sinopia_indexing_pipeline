export default class Config {
  static get platformUrl() {
    // If configured in environment (hence, prod-like), use that value
    if (process.env.TRELLIS_BASE_URL)
      return process.env.TRELLIS_BASE_URL

    // Else, we're in a dev/test env, so use localhost if not in container, or
    // container value if in container
    return Boolean(process.env.INSIDE_CONTAINER) ? 'http://platform:8080' : 'http://localhost:8080'
  }

  static get rootNodeIdentifier() {
    return process.env.ROOT_NODE_IDENTIFIER || '__root_node__'
  }

  static get brokerHost() {
    return process.env.BROKER_HOST || 'localhost'
  }

  static get brokerPort() {
    return process.env.BROKER_PORT || 61613
  }

  static get queueName() {
    return process.env.QUEUE_NAME || '/queue/trellis'
  }

  static get defaultMimeType() {
    return process.env.DEFAULT_MIME_TYPE || 'application/ld+json'
  }

  static get resourceIndexName() {
    return process.env.RESOURCE_INDEX_NAME || 'sinopia_resources'
  }

  static get nonRdfIndexName() {
    return process.env.NON_RDF_INDEX_NAME || 'sinopia_templates'
  }

  static get indexType() {
    return process.env.INDEX_TYPE || 'sinopia'
  }

  static get indexHost() {
    return process.env.INDEX_HOST || 'localhost'
  }

  static get indexPort() {
    return process.env.INDEX_PORT || 9200
  }

  static get nonRdfTypeURI() {
    return process.env.NON_RDF_TYPE_URI || 'http://www.w3.org/ns/ldp#NonRDFSource'
  }

  static get nonRdfMimeType() {
    return process.env.NON_RDF_MIME_TYPE || 'application/json'
  }

  static get debug() {
    if (process.env.DEBUG !== undefined) {
      return process.env.DEBUG
    }
    return true
  }
}
