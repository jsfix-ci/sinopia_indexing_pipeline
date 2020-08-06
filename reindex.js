import Reindexer from './src/Reindexer'
import MongoWaiter from './src/MongoWaiter'
import ElasticSearchWaiter from './src/ElasticSearchWaiter'

const reindexer = async () => {
  await new ElasticSearchWaiter().wait()
  await new MongoWaiter().wait()

  await new Reindexer().reindex()
}

reindexer()
