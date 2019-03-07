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
      body = JSON.parse(body)

      let uri = body.object.id
      this.logger.debug(`resource ${uri} needs indexing`)

      // `body.type` looks like { ... "type": [ "http://www.w3.org/ns/prov#Activity", "Delete" ] ... }
      let operation = body.type[1].toLowerCase()
      switch(operation) {
        case 'update':
        case 'create':
        case 'delete':
          // This works because the expressions in the above case statement are
          // functions in this class
          this[operation](uri)
          break
        // We only understand the above operation types. Log an error and keep listening.
        default:
          this.logger.error(`unsupported operation: ${operation}`)
      }
    })
  }

  // TODO: Figure out a more Javascript-y way to have class functions share behavior
  create(uri) {
    new Request(uri).body()
      .then(json => {
        this.logger.debug(`indexing ${uri}: ${JSON.stringify(json)}`)
        this.indexer.index(json, uri)
      })
      .catch(err => {
        this.logger.error(`error processing ${uri}: ${err.message}`)
      })
  }

  // TODO: Figure out a more Javascript-y way to have class functions share behavior
  // Updates and creates are handled the same way since we index w/ an ID
  update(uri) {
    this.create(uri)
  }

  delete(uri) {
    this.logger.debug(`deleting ${uri} from index`)
    this.indexer.delete(uri)
  }
}
