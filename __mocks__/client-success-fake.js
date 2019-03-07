export default class ClientSuccessFake {
  index() {
    return new Promise((resolve, _reject) => {
      return resolve({ result: 'created' })
    })
  }
  delete() {
    return new Promise((resolve, _reject) => {
      return resolve({ result: 'deleted' })
    })
  }
}
