import Logger from "./Logger"
import connect from "./mongo"
import promiseRetry from "promise-retry"

export default class MongoWaiter {
  constructor() {
    this.logger = new Logger()
  }

  async wait() {
    const logger = this.logger
    return promiseRetry(
      function (retry, number) {
        logger.debug(`Attempting to connect to Mongo ${number}`)
        return connect()
          .then((client) => client.close())
          .catch(retry)
      },
      { factor: 1, retries: 30 }
    ).then(() => logger.debug("Mongo connection succeeded"))
  }
}
