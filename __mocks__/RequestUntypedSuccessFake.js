export default class RequestUntypedSuccessFake {
  constructor(headers) {
    this.headers = headers
  }

  response() {
    return new Promise((resolve, _reject) => {
      return resolve({ headers: this.headers })
    })
  }
}
