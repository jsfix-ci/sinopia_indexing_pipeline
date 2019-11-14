export default class ClientFailureFake {
  index() {
    return new Promise((resolve, _reject) => {
      return resolve({ body: {} })
    })
  }
  delete() {
    return new Promise((resolve, _reject) => {
      return resolve({})
    })
  }
}
