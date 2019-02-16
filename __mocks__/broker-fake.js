export default class BrokerFake {
  constructor(host, port) {
    this.address = host
    this.port = port
  }

  connect(onConnection) {
    onConnection()
  }

  subscribe(_queueName, onMessageReceived) {
    onMessageReceived()
  }
}
