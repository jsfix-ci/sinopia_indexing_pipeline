import Listener from './Listener'
import Logger from './Logger'
import Indexer from './Indexer'
import { replaceInKeys } from './utilities'

export default class Pipeline {
  constructor() {
    this.listener = new Listener()
    this.logger = new Logger()
    this.indexer = new Indexer()
  }

  /**
   * Runs the pipeline
   */
  async run() {
    await this.listener.listen(async (message) => {
      this.logger.debug(`received message: ${JSON.stringify(message)}`)

      if(!['insert', 'replace', 'delete'].includes(message.operationType)) return

      // Need to map ! back to . in keys.
      const doc = replaceInKeys(message.fullDocument, '!', '.')

      // Invoke the method for the operation type
      this[message.operationType](doc)
    })
  }

  insert(doc) {
    this.indexer.index(doc)
  }

  // Updates and creates are handled the same way since we index w/ an ID
  replace(doc) {
    this.insert(doc)
  }

  delete(doc) {
    this.indexer.delete(doc)
  }
}
