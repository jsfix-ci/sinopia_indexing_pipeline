import config from 'config'
import elasticsearch from 'elasticsearch'

const query = process.argv.slice(2).join(' ')
const client = new elasticsearch.Client({ host: config.get('indexUrl') })

const fullTextSearch = async () => {
  console.log(`querying ElasticSearch for "${query}" (full-text search)`)

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

  console.dir(result.hits)
}

const suggestSearch = async () => {
  console.log(`querying ElasticSearch for "${query}" (suggest search)`)

  const suggestBody = { text: query }

  for (const [fieldName, fieldProperties] of Object.entries(config.get('indexFieldMappings'))) {
    if (!fieldProperties.autosuggest) {
      continue
    }

    suggestBody[fieldName] = {
      completion: {
        field: `${fieldName}-suggest`
      }
    }
  }

  const result = await client.search({
    index: config.get('resourceIndexName'),
    type: config.get('indexType'),
    body: {
      suggest: suggestBody
    }
  })

  console.dir(result)
  console.dir(result.suggest)
}

const runSearches = async () => {
  await fullTextSearch()
  await suggestSearch()
}

runSearches()
