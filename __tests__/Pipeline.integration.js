import config from 'config'
import elasticsearch from 'elasticsearch'
import superagent from 'superagent'
import Indexer from '../src/Indexer'

describe('integration tests', () => {
  const client = new elasticsearch.Client({
    host: config.get('indexUrl'),
    log: 'warning'
  })
  const resourceSlug = 'stanford12345'
  const resourceTitle = 'A cool title'
  const nonRdfSlug = 'resourceTemplate:foo123:Something:Excellent'
  const nonRdfBody = { foo: 'bar', baz: 'quux' }
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

  beforeAll(async () => {
    await new Indexer().recreateIndices()
  })

  afterAll(async () => {
    // Remove test resources from indices
    await client.delete({
      index: config.get('resourceIndexName'),
      type: config.get('indexType'),
      id: resourceSlug
    })
    await client.delete({
      index: config.get('nonRdfIndexName'),
      type: config.get('indexType'),
      id: nonRdfSlug
    })
  })

  test('resource index is clear of test document', () => {
    return client.search({
      index: config.get('resourceIndexName'),
      type: config.get('indexType'),
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
      index: config.get('nonRdfIndexName'),
      type: config.get('indexType'),
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
    superagent.post(config.get('platformUrl'))
      .type('application/ld+json')
      .send(`{ "@context": { "mainTitle": { "@id": "http://id.loc.gov/ontologies/bibframe/mainTitle" } }, "@id": "", "mainTitle": [{ "@value": "${resourceTitle}", "@language": "en" }] }`)
      .set('Link', '<http://www.w3.org/ns/ldp#BasicContainer>; rel="type"')
      .set('Slug', resourceSlug)
      .then(res => res.body)

    // Give the pipeline a chance to run
    await sleep(4900)

    return client.search({
      index: config.get('resourceIndexName'),
      type: config.get('indexType'),
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
      expect(firstHit._source.document['@id']).toEqual(`${config.get('platformUrl')}/${resourceSlug}`)
      expect(firstHit._source.title[0]).toEqual(resourceTitle)
    })
  })

  test('new Trellis resource template is indexed', async () => {
    superagent.post(config.get('platformUrl'))
      .type('application/json')
      .send(nonRdfBody)
      .set('Link', '<http://www.w3.org/ns/ldp#NonRDFSource>; rel="type"')
      .set('Slug', nonRdfSlug)
      .then(res => res.body)

    // Give the pipeline a chance to run
    await sleep(4900)

    return client.search({
      index: config.get('nonRdfIndexName'),
      type: config.get('indexType'),
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
      expect(firstHit._source.document.foo).toEqual('bar')
      expect(firstHit._source.document.baz).toEqual('quux')
    })
  })

  test('deleted Trellis resource is removed from resource index', async () => {
    superagent.delete(`${config.get('platformUrl')}/${resourceSlug}`)
      .then(res => res.body)

    // Give the pipeline a chance to run
    await sleep(4500)

    return client.search({
      index: config.get('resourceIndexName'),
      type: config.get('indexType'),
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
    superagent.delete(`${config.get('platformUrl')}/${nonRdfSlug}`)
      .then(res => res.body)

    // Give the pipeline a chance to run
    await sleep(4500)

    return client.search({
      index: config.get('nonRdfIndexName'),
      type: config.get('indexType'),
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
