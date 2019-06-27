import elasticsearch from 'elasticsearch'
import Config from './src/Config'

const query = process.argv.slice(2).join(' ')
const client = new elasticsearch.Client({ host: Config.indexUrl })

const search = async () => {
  const result = await client.search({
    index: Config.resourceIndexName,
    type: Config.indexType,
    body: {
      query: {
        multi_match: {
          query: query,
          fields: ['title', 'subtitle']
        }
      }
    }
  })

  console.dir(result.hits.hits)
}

search()
