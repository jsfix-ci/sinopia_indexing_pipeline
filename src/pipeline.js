import Listener from './listener'
import Logger from './logger'
import Request from './request'
import Indexer from './indexer'

export default class Pipeline {
  constructor() {
    this.listener = new Listener()
    this.logger = new Logger()
    this.indexer = new Indexer()
  }

  /**
   * Runs the pipeline
   */
  run() {
    this.listener.listen((body, _headers) => {
      this.logger.debug(`received message: ${body}`)
      let uri = JSON.parse(body).object.id
      this.logger.debug(`uri needs indexing: ${uri}`)
      new Request(uri).body()
        .then(json => {
          this.logger.debug(`indexing resource: ${JSON.stringify(json)}`)
          this.indexer.index(json)
        })
        .catch(err => {
          this.logger.error(`error processing ${uri}: ${err.message}`)
        })
    })
  }
}
