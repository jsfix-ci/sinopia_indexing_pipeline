import Config from './src/Config'
import Reindexer from './src/Reindexer'
import Waiter from './src/Waiter'

const waitOptions = {
  resources: [
    Config.platformUrl,
    Config.indexUrl
  ]
}

const reindexer = async () => {
  await new Waiter(waitOptions).wait()

  await new Reindexer().reindex()
}

reindexer()
