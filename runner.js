import Pipeline from './src/Pipeline'
import Waiter from './src/Waiter'

const runner = async () => {
  await new Waiter().wait()

  new Pipeline().run()
}

runner()
