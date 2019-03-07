export default class ClientFailureFake {
  index() {
    return new Promise((resolve, _reject) => {
      return resolve({})
    })
  }
  delete() {
    return new Promise((resolve, _reject) => {
      return resolve({})
    })
  }
}
