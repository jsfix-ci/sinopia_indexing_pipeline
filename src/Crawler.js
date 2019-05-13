import Config from './Config'
import Logger from './Logger'
import Request from './Request'

const linkHeaderRegex = /<(?<link>.+)>; rel="type"/

export default class Crawler {
  constructor() {
    this.logger = new Logger()
  }

  /**
   * @callback resourceCallback
   * @param {Object} resource - Resource object
   * @param {string} uri - URI of crawled resource
   * @param {Array} types - List of LDP resource types
   */

  /**
   * Kicks off the crawl process, making a request to the root resource
   * @param {resourceCallback} onResource - Callback that handles the resource
   */
  async crawl(onResource) {
    this.logger.debug(`connecting to Trellis at ${Config.platformUrl}`)
    await this.request(Config.platformUrl, onResource)
  }

  /**
   * Makes a request to a URI, builds a list of children, executes a callback,
   * and recurses to do the same for child URIs
   *
   * @param {string} uri - URI to make an HTTP request to
   * @param {resourceCallback} onResource - Callback that handles the resource
   */
  async request(uri, onResource) {
    const types = await this.ldpTypesFrom(uri)

    try {
      // This request has the type information, so it can deal with both RDF and
      // non-RDF requests. Thus the body of the response is what we want to
      // index.
      const response = await this.typeSpecificRequest(uri, types).response()

      // Execute the callback, allowing the caller to index the content
      // properly
      onResource(response.body, uri, types)

      // `body.contains` will be a string, not an array, if there is but one
      // child.
      this.toArray(response.body.contains).forEach(async child => {
        if (child)
          // Recurse down into child resources
          await this.request(child, onResource)
      })
    } catch(error) {
      this.logger.error(`during crawl, error making mime type-specific request to ${uri}: ${error}`)
    }
  }

  toArray(object) {
    return Array.isArray(object) ? object : Array.of(object)
  }

  async ldpTypesFrom(uri) {
    try {
      // This request is made w/o an Accept header to learn the LDP types of the
      // resource
      const response = await this.typeRevealingRequest(uri).response()

      return response.headers['link']
        .split(', ') // split string into array
        .filter(link => link.endsWith('rel="type"')) // filter out non-type links
        .map(link => link.match(linkHeaderRegex)) // extract URI from string
        .map(match => match?.groups?.link) // uses optional chaining (safe navigation operator) in case match failed
    } catch(error) {
      this.logger.error(`during crawl, error making type-revealing request to ${uri}: ${error}`)
      return []
    }
  }

  /**
   * Return a new Request instance w/o specifying type information, to reveal
   * the LDP types of the resource returned. This makes stubbing and testing
   * easier.
   *
   * @private
   */
  typeRevealingRequest(uri) {
    return new Request(uri)
  }

  /**
   * Return a new Request instance w/ type information specified, to return RDF
   * if the resource if an RDFSource and to return non-RDF if it is a
   * NonRDFSource. This makes stubbing and testing easier.
   *
   * @private
   */
  typeSpecificRequest(uri, types) {
    return new Request(uri, types)
  }
}
