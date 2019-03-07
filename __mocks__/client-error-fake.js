export default class ClientErrorFake {
  index() {
    return new Promise((_resolve, reject) => {
      return reject({ message: 'what a useful error message this is' })
    })
  }
  delete() {
    return new Promise((_resolve, reject) => {
      return reject({ message: 'what a useful error message this is' })
    })
  }
}
