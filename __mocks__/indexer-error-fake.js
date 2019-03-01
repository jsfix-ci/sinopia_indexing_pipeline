export default class IndexerErrorFake {
  index() {
    return new Promise((_resolve, reject) => {
      return reject({ message: 'what a useful error message this is' })
    })
  }
}
