import Config from './src/Config'
import Reindexer from './src/Reindexer'
import Waiter from './src/Waiter'

const waitOptions = {
  resources: [
    Config.platformUrl,
    `tcp:${Config.indexHost}:${Config.indexPort}`
  ]
}

const reindexer = async () => {
  await new Waiter(waitOptions).wait()

  await new Reindexer().reindex()
}

reindexer()
