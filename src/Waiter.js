import waitOn from 'wait-on'
import Config from './Config'
import Logger from './Logger'

export default class Waiter {
  constructor(options = {}) {
    this.options = {
      resources: [
        // indexUrl begins with `http[s]`, so the `tcp:` prefix is not needed
        Config.indexUrl,
        `tcp:${Config.brokerHost}:${Config.brokerPort}`
      ],
      log: true, // print status reports
      interval: 1000, // check to see whether ES and MQ are up every 5s
      timeout: 180000, // give up after 3m
      tcpTimeout: 180000, // give up after 3m
      ...options // allow injection of options via constructor
    }
    this.logger = new Logger()
  }

  async wait() {
    try {
      await waitOn(this.options)
    } catch(error) {
      this.logger.error(`dependencies did not start up in time: ${error}`)
    }
  }
}
