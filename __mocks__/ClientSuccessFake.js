export default class ClientSuccessFake {
  constructor(exists=false) {
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
          return resolve({ body: exists })
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
