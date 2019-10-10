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
  const resourceTitle = 'A cøol tītlé'
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

    await client.search({
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
      expect(firstHit._source.title[0]).toEqual(resourceTitle)
    })

    const searchExpectations = [
      { phrase: resourceTitle, totalHits: 1},
      { phrase: 'cøol tītlé', totalHits: 1},
      { phrase: 'cool title', totalHits: 1},
      { phrase: 'cöôl title', totalHits: 1},
      { phrase: 'COOL title', totalHits: 1},
      { phrase: 'cool', totalHits: 1},
      { phrase: 'title', totalHits: 1},
      { phrase: 'coooool tiiiitle', totalHits: 0},
    ]
    for (const {phrase, totalHits} of searchExpectations) {
      await client.search({
        index: config.get('resourceIndexName'),
        type: config.get('indexType'),
        body: {
          query: {
            match: {
              title: phrase
            }
          }
        }
      }).then(response => {
        // including phrase makes it easier to find the one that fails the test, should the test fail
        expect([phrase, response.hits.total]).toEqual([phrase, totalHits])
      })
    }
  })

  test('new Trellis resource template is not indexed', async () => {
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
      expect(response.hits.total).toEqual(0)
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
