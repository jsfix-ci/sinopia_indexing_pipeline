export default class ClientErrorFake {
  constructor() {
    this.indices = {
      delete: () => {
        return new Promise((_resolve, reject) => {
          return reject('could not delete indices')
        })
      }
    }
  }

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
