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
  const pipeline = new Pipeline()

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
  describe('mimeTypeFrom()', () => {
    test('returns the default mime type by default', () => {
      expect(pipeline.mimeTypeFrom([])).toBe('application/ld+json')
    })
    test('returns the non RDF mime type when types includes LDP-NRS', () => {
      expect(pipeline.mimeTypeFrom(['http://www.w3.org/ns/ldp#NonRDFSource'])).toBe('application/json')
    })
  })
  describe('run()', () => {
    const logSpy = jest.spyOn(pipeline.logger, 'debug')
    const errorSpy = jest.spyOn(pipeline.logger, 'error')
    const objectUri = 'http://example.org/foo'
    const objectTypes = ['http://www.w3.org/ns/ldp#BasicContainer']
    const fakeBody = JSON.stringify({
      object: {
        id: objectUri,
        type: objectTypes
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
      const listenerSpy = jest.spyOn(pipeline.listener, 'listen')

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
      const fakeBody = JSON.stringify({
        object: {
          id: objectUri,
          type: objectTypes
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
        const indexerSpy = jest.spyOn(pipeline.indexer, 'delete')
        pipeline.run()
        expect(indexerSpy).toHaveBeenCalledWith(objectUri, objectTypes)
      })
    })
    describe('when handling unsupported operations', () => {
      const fakeBody = JSON.stringify({
        object: {
          id: objectUri,
          type: objectTypes
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
