import config from 'config'
import elasticsearch from 'elasticsearch'

const query = process.argv.slice(2).join(' ')
const client = new elasticsearch.Client({ host: config.get('indexUrl') })

const search = async () => {
  const result = await client.search({
    index: config.get('resourceIndexName'),
    type: config.get('indexType'),
    body: {
      query: {
        multi_match: {
          query: query,
          fields: Object.keys(config.get('indexFieldMappings'))
        }
      }
    }
  })

  console.dir(result.hits.hits)
}

search()
