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
      },
      exists: () => {
        return new Promise((resolve, _reject) => {
          return resolve(false)
        })
      },
      putMapping: () => {
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
