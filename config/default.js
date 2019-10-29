module.exports = {
  // If configured in environment (hence, prod-like), use that value
  // Else, we're in a dev/test env, so use localhost if not in container, or
  // container value if in container
  platformUrl: process.env.TRELLIS_BASE_URL ? process.env.TRELLIS_BASE_URL : Boolean(process.env.INSIDE_CONTAINER) ? 'http://platform:8080' : 'http://localhost:8080',
  rootNodeIdentifier: process.env.ROOT_NODE_IDENTIFIER || '__root_node__',
  brokerHost: process.env.BROKER_HOST || 'localhost',
  brokerPort: process.env.BROKER_PORT || 61613,
  brokerUsername: process.env.BROKER_USERNAME || '',
  brokerPassword: process.env.BROKER_PASSWORD || '',
  brokerTlsEnabled: process.env.BROKER_TLS_ENABLED === 'true',
  brokerRetries: process.env.BROKER_RETRIES || 10,
  brokerRetryDelay: process.env.BROKER_RETRY_DELAY || 500,
  queueName: process.env.QUEUE_NAME || '/queue/trellis',
  defaultMimeType: process.env.DEFAULT_MIME_TYPE || 'application/ld+json',
  indexType: process.env.INDEX_TYPE || 'sinopia',
  indexUrl: process.env.INDEX_URL || 'http://localhost:9200',
  // Note that InputLookupSinopia expects uri and label fields.
  indexMappings: process.env.INDEX_FIELD_MAPPINGS
    ? JSON.parse(process.env.INDEX_FIELD_MAPPINGS)
    : {
      sinopia_resources: {
        store_document: false,
        fields: {
          title: {
            type: 'text',
            path: '$..[mainTitle,P10223,P20315,P40085,P30156]', //BIBFRAME and RDA
            autosuggest: true
          },
          subtitle: {
            type: 'text',
            path: '$..subtitle',
            autosuggest: true
          },
          type:  {
            type: 'keyword',
            store: true
          },
          uri: {
            type: 'keyword',
            id: true,
            store: true,
            index: true
          },
          label: {
            type: 'keyword',
            // If not title, then URI.
            fields: [['title', 'subtitle'], ['uri']],
            joinby: ': ',
            store: true,
            index: false
          },
          created: {
            type: 'date',
            asTypes: ['Create'],
            store: true,
            index: true
          },
          modified: {
            type: 'date',
            asTypes: ['Create', 'Update'],
            store: true,
            index: true
          },
          text: {
            type: 'text',
            path: '$..*',
            store: false,
            index: true
          }
        }
      },
      // Not yet mapped
      sinopia_templates: {
        store_document: true,
        fields: {}
      }
    },
  nonRdfTypeURI: process.env.NON_RDF_TYPE_URI || 'http://www.w3.org/ns/ldp#NonRDFSource',
  nonRdfMimeType: process.env.NON_RDF_MIME_TYPE || 'application/json',
  debug:  process.env.DEBUG !== undefined ? process.env.DEBUG : true
}
