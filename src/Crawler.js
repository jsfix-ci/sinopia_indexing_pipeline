import config from 'config'
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
    this.logger.debug(`connecting to Trellis at ${config.get('platformUrl')}`)
    await this.request(config.get('platformUrl'), onResource)
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

      const containedResourcesArray = this.containedResourcesArray(response.body)
      this.logger.debug(`${uri} contains ${containedResourcesArray}`)

      const containedResourcePromises = containedResourcesArray.map(async child => {
        if (child)
          // Recurse down into each child resource
          await this.request(child, onResource)
      })

      // await promises for the callback on this resource as well as the requests for any child resources
      await Promise.all([onResource(response.body, uri, types)].concat(containedResourcePromises))
    } catch(error) {
      this.logger.error(`during crawl, error making mime type-specific request to ${uri}: ${error}`)
    }
  }

  // `body.contains` will be a string, not an array, if there is but one
  // child.
  toArray(object) {
    return Array.isArray(object) ? object : Array.of(object)
  }

  containedResourcesArray(responseBody) {
    if (responseBody && responseBody.contains)
      return this.toArray(responseBody.contains)

    if (responseBody && responseBody['@graph']) {
      const containsElt = responseBody['@graph'].find((elt) => 'contains' in elt)
      return containsElt ? this.toArray(containsElt.contains) : []
    }

    return []
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
