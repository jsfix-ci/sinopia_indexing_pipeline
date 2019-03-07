import elasticsearch from 'elasticsearch'
import superagent from 'superagent'
import Config from '../src/config'

describe('integration tests', () => {
  const client = new elasticsearch.Client({
    host: `${Config.indexHost}:${Config.indexPort}`,
    log: 'warning'
  })
  const resourceSlug = Math.floor(Math.random() * 1000000).toString()
  const resourceId = `${Config.platformUrl}/${resourceSlug}`
  const resourceTitle = 'A cool title'
  // Use localhost if not in container, else use configured value
  const endpointBaseUrl = Boolean(process.env.INSIDE_CONTAINER) ? Config.platformUrl : 'http://localhost:8080'
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

  beforeAll(async () => {
    let indexExists = await client.indices.exists({index: Config.indexName})
    if (!indexExists) {
      return client.indices.create({
        index: Config.indexName
      })
    }
    return null
  })
  afterAll(() => {
    // Remove test resource from index
    return client.delete({
      index: Config.indexName,
      type: Config.indexType,
      id: resourceId
    })
  })
  test('index is clear of test document', () => {
    return client.search({
      index: Config.indexName,
      type: Config.indexType,
      body: {
        query: {
          term: {
            _id: {
              value: resourceId
            }
          }
        }
      }
    }).then(response => {
      expect(response.hits.total).toEqual(0)
    })
  })
  test('new Trellis resource is indexed', async () => {
    superagent.post(endpointBaseUrl)
      .type('application/ld+json')
      .send(`{ "@context": { "dcterms": "http://purl.org/dc/terms/" }, "@id": "", "dcterms:title": "${resourceTitle}" }`)
      .set('Link', '<http://www.w3.org/ns/ldp#BasicContainer>; rel="type"')
      .set('Slug', resourceSlug)
      .then(res => res.body)

    // Give the pipeline a chance to run
    await sleep(4500)

    return client.search({
      index: Config.indexName,
      type: Config.indexType,
      body: {
        query: {
          term: {
            _id: {
              value: resourceId
            }
          }
        }
      }
    }).then(response => {
      expect(response.hits.total).toEqual(1)
      let firstHit = response.hits.hits[0]
      expect(firstHit._source['@id']).toEqual(resourceId)
      expect(firstHit._source.title).toEqual(resourceTitle)
    })
  })
  test('deleted Trellis resource is removed from index', async () => {
    superagent.delete(`${endpointBaseUrl}/${resourceSlug}`)
      .then(res => res.body)

    // Give the pipeline a chance to run
    await sleep(4500)

    return client.search({
      index: Config.indexName,
      type: Config.indexType,
      body: {
        query: {
          term: {
            _id: {
              value: resourceId
            }
          }
        }
      }
    }).then(response => {
      expect(response.hits.total).toEqual(0)
    })
  })
})
