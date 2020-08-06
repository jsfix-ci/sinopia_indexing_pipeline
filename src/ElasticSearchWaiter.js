import config from 'config'
import waitOn from 'wait-on'
import Logger from './Logger'

export default class ElasticSearchWaiter {
  constructor() {
    this.options = {
      resources: [
        // indexUrl begins with `http[s]`, so the `tcp:` prefix is not needed
        config.get('indexUrl')
      ],
      log: true, // print status reports
      interval: 1000, // check to see whether ES are up every 5s
      timeout: 180000, // give up after 3m
      tcpTimeout: 180000, // give up after 3m
    }
    this.logger = new Logger()
  }

  async wait() {
    try {
      await waitOn(this.options)
    } catch(error) {
      this.logger.error(`dependencies did not start up in time: ${error}`, error)
    }
  }
}
