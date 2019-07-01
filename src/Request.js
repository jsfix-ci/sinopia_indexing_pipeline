import config from 'config'
import superagent from 'superagent'
import Logger from './Logger'

export default class Request {
  /**
   * @param {string} uri - URI to make request to
   * @param {string} typeURIs = LDP type URIs
   */
  constructor(uri, typeURIs) {
    this.logger = new Logger()
    this.uri = uri
    this.agent = typeURIs ? superagent.get(this.uri).accept(this.mimeTypeFrom(typeURIs)) : superagent.get(this.uri)
  }

  /**
   * Make HTTP request
   * @returns {Promise} Promise containing response body & headers
   */
  response() {
    return this.agent
      .then(response => {
        return {
          body: response.body,
          headers: response.headers
        }
      })
      .catch(err => {
        this.logger.error(`error resolving ${this.uri}: ${err.message}`)
        return null
      })
  }

  /**
   * Returns MIME type given LDP resource types
   * @param {Array} types - LDP type URIs of object
   * @returns {string} MIME type
   */
  mimeTypeFrom(types) {
    if (types.includes(config.get('nonRdfTypeURI')))
      return config.get('nonRdfMimeType')
    return config.get('defaultMimeType')
  }
}
