export default class RequestFailureFake {
  constructor(errorMessage) {
    return new Promise((_resolve, reject) => {
      return reject({ message: errorMessage })
    })
  }
}
