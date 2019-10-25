import Crawler from './Crawler'
import Logger from './Logger'
import Indexer from './Indexer'

export default class Reindexer {
  constructor() {
    this.crawler = new Crawler()
    this.logger = new Logger()
    this.indexer = new Indexer()
  }

  /**
   * Runs the reindexer
   */
  async reindex() {
    await this.indexer.recreateIndices()
    await this.crawler.crawl((resource, uri, types) => {
      this.logger.debug(`found resource for ${uri} with types: ${types}`)
      try {
        // pass along the .index() returned Promise in case caller wants to wait on it
        return this.indexer.index(resource, uri, types)
      } catch(error) {
        this.logger.error(`error reindexing ${uri}: ${error}`)
      }
    })
  }
}
