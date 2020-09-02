import mockConsole from 'jest-mock-console'
import Indexer from '../src/Indexer'
import Listener from '../src/Listener'
import Logger from '../src/Logger'
import Pipeline from '../src/Pipeline'


// Mock out dependencies to avoid testing implementation details
import ListenerFake from '../__mocks__/ListenerFake'
import ClientSuccessFake from '../__mocks__/ClientSuccessFake'

// Outermost-scope variable to support mocking/restoring the `console` object
let restoreConsole = null

describe('Pipeline', () => {
  const pipeline = new Pipeline()

  describe('constructor', () => {
    it('sets this.listener', () => {
      expect(pipeline.listener).toBeInstanceOf(Listener)
    })

    it('sets this.logger', () => {
      expect(pipeline.logger).toBeInstanceOf(Logger)
    })

    it('sets this.indexer', () => {
      expect(pipeline.indexer).toBeInstanceOf(Indexer)
    })
  })

  describe('run()', () => {
    const logSpy = jest.spyOn(pipeline.logger, 'debug')

    beforeAll(() => {
      pipeline.listener = new ListenerFake({})
      pipeline.indexer.client = new ClientSuccessFake()

      // Eat console output
      restoreConsole = mockConsole(['error', 'debug'])
    })
    afterAll(() => {
      restoreConsole()
    })

    it('listens for messages', () => {
      const listenerSpy = jest.spyOn(pipeline.listener, 'listen')

      pipeline.run({})
      expect(listenerSpy).toHaveBeenCalledTimes(1)
    })

    it('logs debug message when message received', () => {
      pipeline.run({})
      expect(logSpy).toHaveBeenCalledWith('received message: {}')
    })

    describe('when handling insert', () => {
      const message = {
        operationType: 'insert',
        fullDocument: {
          _id: 'abcde4345q23'
        }
      }

      beforeEach(() => {
        pipeline.listener = new ListenerFake(message)
        restoreConsole = mockConsole(['error', 'debug'])
      })

      afterAll(() => {
        restoreConsole()
      })

      it('calls index on the indexer', () => {
        const indexerSpy = jest.spyOn(pipeline.indexer, 'index')
        pipeline.run(message)
        expect(indexerSpy).toHaveBeenCalledWith(message.fullDocument)
      })
    })

    describe('when handling deletes', () => {
      const message = {
        operationType: 'delete',
        fullDocument: {}
      }

      beforeEach(() => {
        pipeline.listener = new ListenerFake(message)
      })

      it('calls delete on the indexer', () => {
        const indexerSpy = jest.spyOn(pipeline.indexer, 'delete')
        pipeline.run(message)
        expect(indexerSpy).toHaveBeenCalledWith(message.fullDocument)
      })
    })
    describe('when handling unsupported operations', () => {
      const message = {
        operationType: 'fooBall',
        fullDocument: {
          borked: true
        }
      }

      beforeEach(() => {
        pipeline.listener = new ListenerFake(message)
      })

      it('returns undefined', async () => {
        expect(await pipeline.run(message)).toBeUndefined()
      })
    })
  })
})
