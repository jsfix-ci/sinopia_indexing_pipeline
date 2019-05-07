export default class RequestUntypedErrorFake {
  response() {
    return new Promise((_resolve, reject) => {
      return reject('foobarbaz')
    })
  }
}
