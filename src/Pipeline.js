import Listener from './Listener'
import Logger from './Logger'
import Request from './Request'
import Indexer from './Indexer'

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
    this.indexer.setupIndices()

    this.listener.listen((body, _headers) => {
      this.logger.debug(`received message: ${body}`)
      body = JSON.parse(body)

      const uri = body.object.id
      // Trellis returns an array for `object.type`
      const types = body.object.type
      this.logger.debug(`resource ${uri} needs indexing`)

      // `body.type` looks like { ... "type": [ "http://www.w3.org/ns/prov#Activity", "Delete" ] ... }
      const operation = body.type[1].toLowerCase()
      switch(operation) {
        case 'update':
        case 'create':
        case 'delete':
          // This works because the expressions in the above case statement are
          // functions in this class
          this[operation](uri, types)
          break
        // We only understand the above operation types. Log an error and keep listening.
        default:
          this.logger.error(`unsupported operation: ${operation}`)
      }
    })
  }

  create(uri, types) {
    new Request(uri, types).response()
      .then(res => {
        const json = res.body
        this.logger.debug(`indexing ${uri}: ${JSON.stringify(json)}`)
        this.indexer.index(json, uri, types)
      })
      .catch(err => {
        this.logger.error(`error processing ${uri}: ${err.message}`)
      })
  }

  // Updates and creates are handled the same way since we index w/ an ID
  update(uri, types) {
    this.create(uri, types)
  }

  delete(uri, types) {
    this.logger.debug(`deleting ${uri} from index`)
    this.indexer.delete(uri, types)
  }
}
