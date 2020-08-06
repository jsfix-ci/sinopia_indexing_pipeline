module.exports = {
  // If configured in environment (hence, prod-like), use that value
  // Else, we're in a dev/test env, so use localhost if not in container, or
  // container value if in container
  indexType: process.env.INDEX_TYPE || 'sinopia',
  indexUrl: process.env.INDEX_URL || 'http://localhost:9200',
  debug:  process.env.DEBUG !== undefined ? process.env.DEBUG : true,
  dbUsername: process.env.MONGODB_USERNAME || 'sinopia',
  dbPassword: process.env.MONGODB_PASSWORD || 'sekret',
  dbName: process.env.MONGODB_DB || 'sinopia_repository',
  dbHost: process.env.MONGODB_HOST || 'localhost',
  dbPort: process.env.MONGODB_PORT || '27017',
  isAws: process.env.MONGODB_IS_AWS === 'true',
  collectionName: process.env.MONGODB_COLLECTION || 'resources',
  uriPrefix: process.env.URI_PREFIX || 'http://localhost:3000/repository'
}
