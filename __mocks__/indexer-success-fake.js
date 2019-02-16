export default class IndexerSuccessFake {
  index() {
    return new Promise((resolve, _reject) => {
      return resolve({ result: 'created' })
    })
  }
}
