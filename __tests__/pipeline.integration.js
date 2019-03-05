import elasticsearch from 'elasticsearch'
import superagent from 'superagent'
import Config from '../src/config'

describe('integration tests', () => {
  const client = new elasticsearch.Client({
    host: `${Config.indexHost}:${Config.indexPort}`,
    log: 'debug'
  })
  const resourceSlug = Math.floor(Math.random() * 1000000).toString()
  const resourceId = `${Config.platformUrl}/${resourceSlug}`
  const resourceTitle = 'A cool title'
  // Use localhost if not in container, else use configured value
  const trellisEndpoint = Boolean(process.env.INSIDE_CONTAINER) ? Config.platformUrl : 'http://localhost:8080'
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

  beforeAll(() => {
    return client.indices.create({
      index: Config.indexName
    })
  })
  afterAll(() => {
    return client.indices.delete({
      index: Config.indexName
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
  test('new Trellis resource is indexed as expected', async () => {
    superagent.post(trellisEndpoint)
      .type('text/turtle; charset=UTF-8')
      .send(`@prefix dcterms: <http://purl.org/dc/terms/> .\n@prefix ldp: <http://www.w3.org/ns/ldp#> .\n<> a ldp:BasicContainer;\n dcterms:title '${resourceTitle}' .`)
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
})
