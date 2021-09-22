import Pipeline from "./src/Pipeline"
import ElasticSearchWaiter from "./src/ElasticSearchWaiter"
import MongoWaiter from "./src/MongoWaiter"
import Indexer from "./src/Indexer"

const runner = async () => {
  await new ElasticSearchWaiter().wait()
  await new Indexer().setupIndices()

  await new MongoWaiter().wait()
  await new Pipeline().run()
}

runner()
