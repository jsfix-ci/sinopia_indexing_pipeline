export default class ListenerFake {
  constructor(fakeBody) {
    this.fakeBody = fakeBody
  }

  listen(onMessage) {
    onMessage(this.fakeBody)
  }
}
