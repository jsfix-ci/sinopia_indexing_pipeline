export default class ClientErrorFake {
  constructor() {
    this.indices = {
      delete: () => {
        return new Promise((_resolve, reject) => {
          return reject("could not delete indices")
        })
      },
      create: () => {
        return new Promise((_resolve, reject) => {
          return reject("could not create indices")
        })
      },
      exists: () => {
        return new Promise((resolve, _reject) => {
          return resolve({ body: false })
        })
      },
    }
  }

  index() {
    return new Promise((_resolve, reject) => {
      return reject({ message: "what a useful error message this is" })
    })
  }

  delete() {
    return new Promise((_resolve, reject) => {
      return reject({ message: "what a useful error message this is" })
    })
  }
}
