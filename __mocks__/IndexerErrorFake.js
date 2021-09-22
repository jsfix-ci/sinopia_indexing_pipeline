export default class IndexerErrorFake {
  index(_json, _uri, _types) {
    throw "ElasticSearch is down"
  }

  async recreateIndices() {
    return await new Promise((resolve, _reject) => {
      return resolve()
    })
  }
}
