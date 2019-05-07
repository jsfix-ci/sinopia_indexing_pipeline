export default class IndexerSuccessFake {
  index(_json, _uri, _types) {
    return true
  }

  async recreateIndices() {
    return await new Promise((resolve, _reject) => {
      return resolve()
    })
  }
}
