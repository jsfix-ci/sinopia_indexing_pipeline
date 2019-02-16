export default class RequestSuccessFake {
  constructor(bodyString) {
    return new Promise((resolve, _reject) => {
      return resolve({ body: bodyString })
    })
  }
}
