export default class IndexerFailureFake {
  index() {
    return new Promise((resolve, _reject) => {
      return resolve({})
    })
  }
}
