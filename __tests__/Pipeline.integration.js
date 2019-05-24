import elasticsearch from 'elasticsearch'
import superagent from 'superagent'
import Config from '../src/Config'

describe('integration tests', () => {
  const client = new elasticsearch.Client({
    host: Config.indexUrl,
    log: 'warning'
  })
  const resourceSlug = 'stanford12345'
  const resourceTitle = 'A cool title'
  const nonRdfSlug = 'resourceTemplate:foo123:Something:Excellent'
  const nonRdfBody = { foo: 'bar', baz: 'quux' }
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
  const createIndexIfAbsent = async indexName => {
    const indexExists = await client.indices.exists({ index: indexName })
    if (!indexExists) {
      return client.indices.create({
        index: indexName
      })
    }
    return null
  }

  beforeAll(async () => {
    await createIndexIfAbsent(Config.resourceIndexName)
    await createIndexIfAbsent(Config.nonRdfIndexName)
  })
  afterAll(async () => {
    // Remove test resources from indices
    await client.delete({
      index: Config.resourceIndexName,
      type: Config.indexType,
      id: resourceSlug
    })
    await client.delete({
      index: Config.nonRdfIndexName,
      type: Config.indexType,
      id: nonRdfSlug
    })
  })
  test('resource index is clear of test document', () => {
    return client.search({
      index: Config.resourceIndexName,
      type: Config.indexType,
      body: {
        query: {
          term: {
            _id: {
              value: resourceSlug
            }
          }
        }
      }
    }).then(response => {
      expect(response.hits.total).toEqual(0)
    })
  })
  test('resource template index is clear of test document', () => {
    return client.search({
      index: Config.nonRdfIndexName,
      type: Config.indexType,
      body: {
        query: {
          term: {
            _id: {
              value: nonRdfSlug
            }
          }
        }
      }
    }).then(response => {
      expect(response.hits.total).toEqual(0)
    })
  })
  test('new Trellis resource is indexed', async () => {
    superagent.post(Config.platformUrl)
      .type('application/ld+json')
      .send(`{ "@context": { "dcterms": "http://purl.org/dc/terms/" }, "@id": "", "dcterms:title": "${resourceTitle}" }`)
      .set('Link', '<http://www.w3.org/ns/ldp#BasicContainer>; rel="type"')
      .set('Slug', resourceSlug)
      .then(res => res.body)

    // Give the pipeline a chance to run
    await sleep(4900)

    return client.search({
      index: Config.resourceIndexName,
      type: Config.indexType,
      body: {
        query: {
          term: {
            _id: {
              value: resourceSlug
            }
          }
        }
      }
    }).then(response => {
      expect(response.hits.total).toEqual(1)
      const firstHit = response.hits.hits[0]
      expect(firstHit._source['@id']).toEqual(`${Config.platformUrl}/${resourceSlug}`)
      expect(firstHit._source.title).toEqual(resourceTitle)
    })
  })
  test('new Trellis resource template is indexed', async () => {
    superagent.post(Config.platformUrl)
      .type('application/json')
      .send(nonRdfBody)
      .set('Link', '<http://www.w3.org/ns/ldp#NonRDFSource>; rel="type"')
      .set('Slug', nonRdfSlug)
      .then(res => res.body)

    // Give the pipeline a chance to run
    await sleep(4900)

    return client.search({
      index: Config.nonRdfIndexName,
      type: Config.indexType,
      body: {
        query: {
          term: {
            _id: {
              value: nonRdfSlug
            }
          }
        }
      }
    }).then(response => {
      expect(response.hits.total).toEqual(1)
      const firstHit = response.hits.hits[0]
      expect(firstHit._source.foo).toEqual('bar')
      expect(firstHit._source.baz).toEqual('quux')
    })
  })
  test('deleted Trellis resource is removed from resource index', async () => {
    superagent.delete(`${Config.platformUrl}/${resourceSlug}`)
      .then(res => res.body)

    // Give the pipeline a chance to run
    await sleep(4500)

    return client.search({
      index: Config.resourceIndexName,
      type: Config.indexType,
      body: {
        query: {
          term: {
            _id: {
              value: resourceSlug
            }
          }
        }
      }
    }).then(response => {
      expect(response.hits.total).toEqual(0)
    })
  })
  test('deleted Trellis resource template is removed from resource template index', async () => {
    superagent.delete(`${Config.platformUrl}/${nonRdfSlug}`)
      .then(res => res.body)

    // Give the pipeline a chance to run
    await sleep(4500)

    return client.search({
      index: Config.nonRdfIndexName,
      type: Config.indexType,
      body: {
        query: {
          term: {
            _id: {
              value: nonRdfSlug
            }
          }
        }
      }
    }).then(response => {
      expect(response.hits.total).toEqual(0)
    })
  })
})
