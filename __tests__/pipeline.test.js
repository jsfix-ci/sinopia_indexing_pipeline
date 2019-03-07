import mockConsole from 'jest-mock-console'
import Indexer from '../src/indexer'
import Listener from '../src/listener'
import Logger from '../src/logger'
import Pipeline from '../src/pipeline'

// This monstrosity mocks out the Request instance created in the pipeline,
// preventing it from attempting to hit Trellis. It mimics a successful request.
jest.mock('../src/request', () => {
  return jest.fn().mockImplementation(() => {
    return {
      body: jest.fn().mockImplementation(() => {
        return new Promise((resolve, _reject) => {
          return resolve({ foo: 'bar' })
        })
      })
    }
  })
})

// Mock out dependencies to avoid testing implementation details
import ListenerFake from '../__mocks__/listener-fake'
import ClientSuccessFake from '../__mocks__/client-success-fake'

// Outermost-scope variable to support mocking/restoring the `console` object
let restoreConsole = null

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
    let errorSpy = jest.spyOn(pipeline.logger, 'error')
    let objectUri = 'http://example.org/foo'
    let fakeBody = JSON.stringify({
      object: {
        id: objectUri
      },
      type: [
        'this is usually a PROV URI in string form but our code does not care',
        'Create'
      ]
    })

    beforeAll(() => {
      pipeline.listener = new ListenerFake(fakeBody)
      pipeline.indexer.client = new ClientSuccessFake()

      // Eat console output
      restoreConsole = mockConsole(['error', 'debug'])
    })
    afterAll(() => {
      restoreConsole()
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
      expect(logSpy).toHaveBeenCalledWith(`resource ${objectUri} needs indexing`)
    })
    describe('when request fails', () => {
      test.skip('logs an error foo', () => {
        // TODO: Figure out why even when Request().body() is mocked to reject
        //       (in an immediate `beforeAll`), the expectation fails
        //
        // pipeline.run()
        // expect(errorSpy).toHaveBeenCalledWith(`error processing ${objectUri}: Trellis is down`)
      })
    })
    describe('when handling deletes', () => {
      let fakeBody = JSON.stringify({
        object: {
          id: objectUri
        },
        type: [
          'this is usually a PROV URI in string form but our code does not care',
          'Delete'
        ]
      })

      beforeEach(() => {
        pipeline.listener = new ListenerFake(fakeBody)
      })
      test('logs a debug message', () => {
        pipeline.run()
        expect(logSpy).toHaveBeenCalledWith(`deleting ${objectUri} from index`)
      })
      test('calls delete on the indexer', () => {
        let indexerSpy = jest.spyOn(pipeline.indexer, 'delete')
        pipeline.run()
        expect(indexerSpy).toHaveBeenCalledWith(objectUri)
      })
    })
    describe('when handling unsupported operations', () => {
      let fakeBody = JSON.stringify({
        object: {
          id: objectUri
        },
        type: [
          'this is usually a PROV URI in string form but our code does not care',
          'Foobar'
        ]
      })

      beforeEach(() => {
        pipeline.listener = new ListenerFake(fakeBody)
      })
      test('logs an error', () => {
        pipeline.run()
        expect(errorSpy).toHaveBeenCalledWith('unsupported operation: foobar')
      })
    })
  })
})
