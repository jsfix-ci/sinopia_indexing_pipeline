import config from 'config'
import mockConsole from 'jest-mock-console'
import Stomp from 'stomp-client'
import Listener from '../src/Listener'
import Logger from '../src/Logger'

// Mocks to avoid making real stomp connections
import BrokerFake from '../__mocks__/BrokerFake'

// Outermost-scope variable to support mocking/restoring the `console` object
let restoreConsole = null

describe('Listener', () => {
  const listener = new Listener()

  describe('constructor', () => {
    test('sets this.logger', () => {
      expect(listener.logger).toBeInstanceOf(Logger)
    })
    test('sets this.client', () => {
      expect(listener.client).toBeInstanceOf(Stomp)
    })
    test('does not turn on TLS unless enabled in configuration', () => {
      const originalConfigValue = config.get('brokerTlsEnabled')
      config.brokerTlsEnabled = false
      expect(new Listener().client.tls).toBeUndefined()
      config.brokerTlsEnabled = originalConfigValue
    })
    test('turns on TLS when enabled in configuration', () => {
      const originalConfigValue = config.get('brokerTlsEnabled')
      config.brokerTlsEnabled = true
      expect(new Listener().client.tls.tls).toEqual(true)
      config.brokerTlsEnabled = originalConfigValue
    })
  })

  describe('listen()', () => {
    const newMessageHandler = jest.fn()
    const logSpy = jest.spyOn(listener.logger, 'debug')

    beforeEach(() => {
      listener.client = new BrokerFake(config.get('brokerHost'), config.get('brokerPort'))
    })
    beforeAll(() => {
      // Eat console output
      restoreConsole = mockConsole(['error', 'debug'])
    })
    afterAll(() => {
      restoreConsole()
    })
    test('logs a debug message before connecting', () => {
      listener.listen(newMessageHandler)
      expect(logSpy).toHaveBeenCalledWith(`connecting to stomp at ${config.get('brokerHost')}:${config.get('brokerPort')}`)
    })
    test('calls connect on the client', () => {
      const clientSpy = jest.spyOn(listener.client, 'connect')

      listener.listen(newMessageHandler)
      expect(clientSpy).toHaveBeenCalledTimes(1)
    })
    test('logs a debug message before subscribing to queue', () => {
      listener.listen(newMessageHandler)
      expect(logSpy).toHaveBeenCalledWith(`subscribing to ${config.get('queueName')}, waiting for messages`)
    })
    test('subscribes to specified queue with given callback', () => {
      const clientSpy = jest.spyOn(listener.client, 'subscribe')

      listener.listen(newMessageHandler)
      expect(clientSpy).toHaveBeenCalledWith(config.get('queueName'), newMessageHandler)
    })
  })
})
