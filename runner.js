import waitOn from 'wait-on'
import Config from './src/config'
import Pipeline from './src/pipeline'

const waitOptions = {
  resources: [
    `tcp:${Config.indexHost}:${Config.indexPort}`,
    `tcp:${Config.brokerHost}:${Config.brokerPort}`
  ],
  log: true, // print status reports
  interval: 1000, // check to see whether ES and MQ are up every 5s
  timeout: 180000, // give up after 3m
  tcpTimeout: 180000 // give up after 3m
}

const runner = async () => {
  try {
    await waitOn(waitOptions)
  } catch(error) {
    console.error(`dependencies did not start up in time: ${error}`)
    return
  }

  new Pipeline().run()
}

runner()
