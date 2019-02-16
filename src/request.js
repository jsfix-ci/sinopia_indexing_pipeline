import superagent from 'superagent'
import Config from './config'
import Logger from './logger'

export default class Request {
  /**
   * @param {string} uri - URI to make request to
   * @param {string} mimeType = MIME type for Accept header in request
   */
  constructor(uri, mimeType) {
    this.mimeType = mimeType || Config.defaultMimeType
    this.logger = new Logger()
    this.uri = uri
    this.agent = superagent.get(this.uri).accept(this.mimeType)
  }

  /**
   * Make HTTP request
   * @returns {?string} response body if successful; null if not
   */
  body() {
    return this.agent
      .then(res => res.body)
      .catch(err => {
        this.logger.error(`error resolving ${this.uri}: ${err.message}`)
        return null
      })
  }
}
