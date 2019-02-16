import Config from '../src/config'
import Indexer from '../src/indexer'
import Logger from '../src/logger'

// Mocks to avoid hitting ElasticSearch
import IndexerSuccessFake from '../__mocks__/indexer-success-fake'
import IndexerFailureFake from '../__mocks__/indexer-failure-fake'
import IndexerErrorFake from '../__mocks__/indexer-error-fake'

describe('Indexer', () => {
  let indexer = new Indexer()

  test('constructor creates a client with a hostname', () => {
    let host = `${Config.indexHost}:${Config.indexPort}`
    expect(indexer.client.transport._config.host).toEqual(host)
  })
  test('constructor creates a logger', () => {
    expect(indexer.logger).toBeInstanceOf(Logger)
  })
  describe('index()', () => {
    let clientMock = new IndexerSuccessFake()
    let indexSpy = jest.spyOn(clientMock, 'index')
    let json = JSON.stringify({ foo: 'bar' })

    beforeEach(() => {
      indexer.client = clientMock
    })
    test('calls index() on the client', () => {
      indexer.index(json)
      expect(indexSpy).toHaveBeenCalledWith({
        index: Config.indexName,
        type: Config.indexType,
        body: json
      })
    })
    describe('when indexing succeeds', () => {
      test('returns true', () => {
        indexer.index(json)
          .then(result => {
            expect(result).toEqual(true)
          })
      })
    })
    describe('when indexing fails', () => {
      let clientMock = new IndexerFailureFake()
      let logSpy = jest.spyOn(indexer.logger, 'error')

      beforeEach(() => {
        indexer.client = clientMock
      })
      test('throws and logs an error', () => {
        indexer.index(json)
          .then(() => {
            expect(logSpy).toHaveBeenCalledWith('indexing error: {}')
          })
      })
    })
    describe('when indexing raises an exception', () => {
      let clientMock = new IndexerErrorFake()
      let logSpy = jest.spyOn(indexer.logger, 'error')

      beforeEach(() => {
        indexer.client = clientMock
      })
      test('logs the error', () => {
        indexer.index(json)
          .catch(() => {
            expect(logSpy).toHaveBeenCalledWith('indexing error: what a useful error message this is')
          })
      })
    })
  })
})
