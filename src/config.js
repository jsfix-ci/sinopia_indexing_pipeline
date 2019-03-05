export default class Config {
  static get platformUrl() {
    return process.env.TRELLIS_BASE_URL || 'http://platform:8080'
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

  static get indexName() {
    return process.env.INDEX_NAME || 'sinopia_index'
  }

  static get indexType() {
    return process.env.INDEX_TYPE || 'sinopia_resource'
  }

  static get indexHost() {
    return process.env.INDEX_HOST || 'localhost'
  }

  static get indexPort() {
    return process.env.INDEX_PORT || 9200
  }

  static get debug() {
    if (process.env.DEBUG !== undefined) {
      return process.env.DEBUG
    }
    return true
  }
}
