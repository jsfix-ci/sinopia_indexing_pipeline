export default class RequestTypedSuccessFake {
  response() {
    return new Promise((resolve, _reject) => {
      return resolve({
        body: {
          // TODO: change this when ready to test recursive Crawler.request() function
          contains: []
        }
      })
    })
  }
}
