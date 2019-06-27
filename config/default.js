module.exports = {
  // If configured in environment (hence, prod-like), use that value
  // Else, we're in a dev/test env, so use localhost if not in container, or
  // container value if in container
  platformUrl: process.env.TRELLIS_BASE_URL ? process.env.TRELLIS_BASE_URL : Boolean(process.env.INSIDE_CONTAINER) ? 'http://platform:8080' : 'http://localhost:8080',
  rootNodeIdentifier: process.env.ROOT_NODE_IDENTIFIER || '__root_node__',
  brokerHost: process.env.BROKER_HOST || 'localhost',
  brokerPort: process.env.BROKER_PORT || 61613,
  brokerUsername: process.env.BROKER_USERNAME,
  brokerPassword: process.env.BROKER_PASSWORD,
  brokerTlsEnabled: process.env.BROKER_TLS_ENABLED === 'true',
  queueName: process.env.QUEUE_NAME || '/queue/trellis',
  defaultMimeType: process.env.DEFAULT_MIME_TYPE || 'application/ld+json',
  resourceIndexName: process.env.RESOURCE_INDEX_NAME || 'sinopia_resources',
  nonRdfIndexName: process.env.NON_RDF_INDEX_NAME || 'sinopia_templates',
  indexType: process.env.INDEX_TYPE || 'sinopia',
  indexUrl: process.env.INDEX_URL || 'http://localhost:9200',
  indexFieldMappings: process.env.INDEX_FIELD_MAPPINGS
    ? JSON.parse(process.env.INDEX_FIELD_MAPPINGS)
    : { title: { type: 'text', path: '$..mainTitle' }, subtitle: { type: 'text', path: '$..subtitle' } },
  nonRdfTypeURI: process.env.NON_RDF_TYPE_URI || 'http://www.w3.org/ns/ldp#NonRDFSource',
  nonRdfMimeType: process.env.NON_RDF_MIME_TYPE || 'application/json',
  debug:  process.env.DEBUG !== undefined ? process.env.DEBUG : true
}
