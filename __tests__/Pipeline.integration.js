import config from 'config'
import elasticsearch from '@elastic/elasticsearch'
import superagent from 'superagent'
import Indexer from '../src/Indexer'
import Reindexer from '../src/Reindexer'

describe('integration tests', () => {
  const client = new elasticsearch.Client({
    node: config.get('indexUrl'),
    log: 'warning'
  })
  const resourceSlug = `stanford_${Math.floor(Math.random() * 10000)}`
  const resourceTitle = 'A cøol tītlé'
  const reindexingResourceTitle = 'Title for reindexing'
  const reindexingResourceSlug = `stanford_re_${Math.floor(Math.random() * 10000)}`
  const nonRdfSlug = 'resourceTemplate:foo123:Something:Excellent'
  const nonRdfBody = { foo: 'bar', baz: 'quux' }
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

  beforeAll(async () => {
    await new Indexer().recreateIndices()
  })

  jest.setTimeout(15000)

  test('resource index is clear of test document', () => {
    return client.search({
      index: 'sinopia_resources',
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
      expect(response.body.hits.total).toEqual(0)
    })
  })

  test('resource template index is clear of test document', () => {
    return client.search({
      index: 'sinopia_templates',
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
      expect(response.body.hits.total).toEqual(0)
    })
  })

  test('new Trellis resource is indexed', async () => {
    superagent.post(config.get('platformUrl'))
      .type('application/ld+json')
      .send(`{ "@context": { "mainTitle": { "@id": "http://id.loc.gov/ontologies/bibframe/mainTitle" } }, "@id": "", "mainTitle": [{ "@value": "${resourceTitle}", "@language": "en" }] }`)
      .set('Link', '<http://www.w3.org/ns/ldp#RDFSource>; rel="type"')
      .set('Slug', resourceSlug)
      .then(res => res.body)
    // Give the pipeline a chance to run
    await sleep(4900)

    await client.search({
      index: 'sinopia_resources',
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
      expect(response.body.hits.total).toEqual(1)
      const firstHit = response.body.hits.hits[0]
      expect(firstHit._source.title[0]).toEqual(resourceTitle)
    })

    const searchExpectations = [
      { phrase: resourceTitle, totalHits: 1},
      { phrase: 'cøol tītlé', totalHits: 1},
      { phrase: 'cool title', totalHits: 1},
      { phrase: 'cöôl title', totalHits: 1},
      { phrase: 'COOL title', totalHits: 1},
      { phrase: 'COOL TITLE', totalHits: 1},
      { phrase: 'cool', totalHits: 1},
      { phrase: 'title', totalHits: 1},
      { phrase: 'coooool tiiiitle', totalHits: 0},
    ]
    for (const {phrase, totalHits} of searchExpectations) {
      await client.search({
        index: 'sinopia_resources',
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
        expect([phrase, response.body.hits.total]).toEqual([phrase, totalHits])
      })
    }
  })

  test('Trellis resources are re-indexed', async () => {
    // if not already present, create the base repository container as we'd have in practice, so there's some structure to crawl
    await superagent.head(`${config.get('platformUrl')}/repository`)
      .catch(async _err => {
        await superagent.post(`${config.get('platformUrl')}`)
          .type('application/ld+json')
          .send('{ "@context": { "rdfs": "http://www.w3.org/2000/01/rdf-schema#", "ldp": "http://www.w3.org/ns/ldp#" }, "@id": "", "@type": [ "ldp:Container", "ldp:BasicContainer" ], "rdfs:label": "Sinopia LDP Server" }')
          .set('Link', '<http://www.w3.org/ns/ldp#BasicContainer>; rel="type"')
          .set('Slug', 'repository')
          .then(res => res.body)
          .catch(err => { console.dir(err); throw err })
      })

    const resourceCount = 5
    await Promise.all([...Array(resourceCount).keys()].map(i =>
      superagent.post(config.get('platformUrl'))
        .type('application/ld+json')
        .send(`{ "@context": { "mainTitle": { "@id": "http://id.loc.gov/ontologies/bibframe/mainTitle" } }, "@id": "", "mainTitle": [{ "@value": "${reindexingResourceTitle} ${i}", "@language": "en" }] }`)
        .set('Link', '<http://www.w3.org/ns/ldp#RDFSource>; rel="type"')
        .set('Slug', `${reindexingResourceSlug}_${i}`)
        .then(res => res.body)
        .catch(err => { console.dir(err); throw err })
    ))

    // Give the pipeline a chance to run
    await sleep(4900)

    await Promise.all([...Array(resourceCount).keys()].map(i => {
      const identifier = `repository/${reindexingResourceSlug}_${i}`
      return client.search({
        index: 'sinopia_resources',
        type: config.get('indexType'),
        body: {
          query: {
            term: {
              _id: {
                value: identifier
              }
            }
          }
        }
      }).then(response => {
        // including phrase makes it easier to find the one that fails the test, should the test fail
        expect([identifier, response.body.hits.total]).toEqual([identifier, 1])
      })
    }))

    // simulate indexing catastrophe
    await new Indexer().recreateIndices()

    // sanity check simulated catastrophe
    await client.search({
      index: 'sinopia_resources',
      type: config.get('indexType'),
      body: {
        query: {
          match: {
            title: '*'
          }
        }
      }
    }).then(response => {
      expect(response.body.hits.total).toEqual(0)
    })

    // The .reindex() code should work such that the Promise it returns will
    // settle iff the Promises it spawns have all settled (e.g. the trellis crawl,
    // and the indexing requests spawned by the callback the crawl uses).
    // If things change and cause that assumption not to hold any longer, change the
    // test to do as is done above for the regular pipeline, and follow this with e.g.
    // `await sleep(4900)` (the pipeline listener doesn't await any of the indexing requests
    // it spawns, because it does nothing itself with those results).
    await new Reindexer().reindex()

    await Promise.all([...Array(resourceCount).keys()].map(i => {
      const identifier = `repository/${reindexingResourceSlug}_${i}`
      return client.search({
        index: 'sinopia_resources',
        type: config.get('indexType'),
        body: {
          query: {
            term: {
              _id: {
                value: identifier
              }
            }
          }
        }
      }).then(response => {
        // including phrase makes it easier to find the one that fails the test, should the test fail
        expect([identifier, response.body.hits.total]).toEqual([identifier, 1])
      })
    }))
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
      index: 'sinopia_templates',
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
      expect(response.body.hits.total).toEqual(1)
    })
  })

  test('deleted Trellis resource is removed from resource index', async () => {
    superagent.delete(`${config.get('platformUrl')}/${resourceSlug}`)
      .then(res => res.body)

    // Give the pipeline a chance to run
    await sleep(4500)

    return client.search({
      index: 'sinopia_resources',
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
      expect(response.body.hits.total).toEqual(0)
    })
  })

  test('deleted Trellis resource template is removed from resource template index', async () => {
    superagent.delete(`${config.get('platformUrl')}/${nonRdfSlug}`)
      .then(res => res.body)

    // Give the pipeline a chance to run
    await sleep(4500)

    return client.search({
      index: 'sinopia_templates',
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
      expect(response.body.hits.total).toEqual(0)
    })
  })
})
