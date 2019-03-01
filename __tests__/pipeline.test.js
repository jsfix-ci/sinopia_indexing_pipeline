import Indexer from '../src/indexer'
import Listener from '../src/listener'
import Logger from '../src/logger'
import Pipeline from '../src/pipeline'

// Mock out dependencies to avoid testing implementation details
import ListenerFake from '../__mocks__/listener-fake'

describe('Pipeline', () => {
  let pipeline = new Pipeline()

  describe('constructor', () => {
    test('sets this.listener', () => {
      expect(pipeline.listener).toBeInstanceOf(Listener)
    })
    test('sets this.logger', () => {
      expect(pipeline.logger).toBeInstanceOf(Logger)
    })
    test('sets this.indexer', () => {
      expect(pipeline.indexer).toBeInstanceOf(Indexer)
    })
  })
  describe('run()', () => {
    let logSpy = jest.spyOn(pipeline.logger, 'debug')
    let objectUri = 'http://example.org/foo'
    let fakeBody = JSON.stringify({
      object: {
        id: objectUri
      }
    })

    beforeAll(() => {
      pipeline.listener =  new ListenerFake(fakeBody)
    })
    test('listens for messages', () => {
      let listenerSpy = jest.spyOn(pipeline.listener, 'listen')

      pipeline.run()
      expect(listenerSpy).toHaveBeenCalledTimes(1)
    })
    test('logs debug message when message received', () => {
      pipeline.run()
      expect(logSpy).toHaveBeenCalledWith(`received message: ${fakeBody}`)
    })
    test('parses uri out of message and logs it', () => {
      pipeline.run()
      expect(logSpy).toHaveBeenCalledWith(`uri needs indexing: ${objectUri}`)
    })
    test.skip('makes a request to the uri', () => {
      // TODO: refactor pipeline/request interaction to make testing this easier
    })
    test.skip('sends json from request to indexer and logs', () => {
      // TODO: refactor pipeline/request interaction to make testing this easier
    })
    test.skip('logs an error when request fails', () => {
      // TODO: refactor pipeline/request interaction to make testing this easier
    })
  })
})
