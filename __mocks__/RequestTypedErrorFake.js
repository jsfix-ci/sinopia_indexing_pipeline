export default class RequestTypedErrorFake {
  response() {
    return new Promise((_resolve, reject) => {
      return reject("quuxquuux")
    })
  }
}
