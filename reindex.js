import config from 'config'
import Reindexer from './src/Reindexer'
import Waiter from './src/Waiter'

const waitOptions = {
  resources: [
    config.get('platformUrl'),
    config.get('indexUrl')
  ]
}

const reindexer = async () => {
  await new Waiter(waitOptions).wait()

  await new Reindexer().reindex()
}

reindexer()
