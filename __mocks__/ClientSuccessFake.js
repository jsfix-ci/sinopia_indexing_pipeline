export default class ClientSuccessFake {
  constructor() {
    this.indices = {
      delete: () => {
        return new Promise((resolve, _reject) => {
          return resolve()
        })
      },
      create: () => {
        return new Promise((resolve, _reject) => {
          return resolve()
        })
      }
    }
  }

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
