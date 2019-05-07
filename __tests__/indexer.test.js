import mockConsole from 'jest-mock-console'
import Config from '../src/config'
import Indexer from '../src/indexer'
import Logger from '../src/logger'

// Mocks to avoid hitting ElasticSearch
import ClientSuccessFake from '../__mocks__/client-success-fake'
import ClientFailureFake from '../__mocks__/client-failure-fake'
import ClientErrorFake from '../__mocks__/client-error-fake'

// Outermost-scope variable to support mocking/restoring the `console` object
let restoreConsole = null

describe('Indexer', () => {
  const indexer = new Indexer()
  const objectUri = 'http://foo.bar/12345'
  const objectTypes = ['http://www.w3.org/ns/ldp#BasicContainer']

  describe('constructor()', () => {
    test('creates a client with a hostname', () => {
      const host = `${Config.indexHost}:${Config.indexPort}`
      expect(indexer.client.transport._config.host).toEqual(host)
    })
    test('creates a logger', () => {
      expect(indexer.logger).toBeInstanceOf(Logger)
    })
    test('creates known index results', () => {
      expect(indexer.knownIndexResults).toEqual(['created', 'updated'])
    })
    test('creates known delete results', () => {
      expect(indexer.knownDeleteResults).toEqual(['deleted'])
    })
  })
  describe('index()', () => {
    const clientMock = new ClientSuccessFake()
    const indexSpy = jest.spyOn(clientMock, 'index')
    const json = { '@id': objectUri, foo: 'bar' }

    beforeAll(() => {
      indexer.client = clientMock
      // Eat console output
      restoreConsole = mockConsole(['error', 'debug'])
    })
    afterAll(() => {
      restoreConsole()
    })
    test('calls index() on the client', () => {
      indexer.index(json, objectUri, objectTypes)
      expect(indexSpy).toHaveBeenCalledWith({
        index: Config.resourceIndexName,
        type: Config.indexType,
        id: '12345',
        body: json
      })
    })
    describe('when indexing succeeds', () => {
      test('returns true', () => {
        return indexer.index(json, objectUri, objectTypes)
          .then(result => {
            expect(result).toEqual(true)
          })
      })
    })
    describe('when indexing fails', () => {
      const clientMock = new ClientFailureFake()
      const logSpy = jest.spyOn(indexer.logger, 'error')

      beforeEach(() => {
        indexer.client = clientMock
      })
      test('throws and logs an error', () => {
        return indexer.index(json, objectUri, objectTypes)
          .then(() => {
            expect(logSpy).toHaveBeenCalledWith('error indexing: {}')
          })
      })
    })
    describe('when indexing raises an exception', () => {
      const clientMock = new ClientErrorFake()
      const logSpy = jest.spyOn(indexer.logger, 'error')

      beforeEach(() => {
        indexer.client = clientMock
      })
      test('logs the error', async () => {
        expect.assertions(1)
        await indexer.index(json, objectUri, objectTypes)
        expect(logSpy).toHaveBeenCalledWith('error indexing: what a useful error message this is')
      })
    })
  })
  describe('delete()', () => {
    const clientMock = new ClientSuccessFake()
    const deleteSpy = jest.spyOn(clientMock, 'delete')

    beforeEach(() => {
      indexer.client = clientMock
    })
    beforeAll(() => {
      // Eat console output
      restoreConsole = mockConsole(['error', 'debug'])
    })
    afterAll(() => {
      restoreConsole()
    })
    test('calls delete() on the client', () => {
      indexer.delete(objectUri, objectTypes)
      expect(deleteSpy).toHaveBeenCalledWith({
        index: Config.resourceIndexName,
        type: Config.indexType,
        id: '12345'
      })
    })
    describe('when delete succeeds', () => {
      test('returns true', () => {
        return indexer.delete(objectUri, objectTypes)
          .then(result => {
            expect(result).toEqual(true)
          })
      })
    })
    describe('when delete fails', () => {
      const clientMock = new ClientFailureFake()
      const logSpy = jest.spyOn(indexer.logger, 'error')

      beforeEach(() => {
        indexer.client = clientMock
      })
      test('throws and logs an error', () => {
        return indexer.delete(objectUri, objectTypes)
          .then(() => {
            expect(logSpy).toHaveBeenCalledWith('error deleting: {}')
          })
      })
    })
    describe('when delete raises an exception', () => {
      const clientMock = new ClientErrorFake()
      const logSpy = jest.spyOn(indexer.logger, 'error')

      beforeEach(() => {
        indexer.client = clientMock
      })
      test('logs the error', async () => {
        expect.assertions(1)
        await indexer.delete(objectUri, objectTypes)
        expect(logSpy).toHaveBeenCalledWith('error deleting: what a useful error message this is')
      })
    })
  })
  describe('identifierFrom()', () => {
    beforeAll(() => {
      // Eat console output
      restoreConsole = mockConsole(['error', 'debug'])
    })
    afterAll(() => {
      restoreConsole()
    })
    test('removes URI scheme/host/port', () => {
      expect(indexer.identifierFrom('https://localhost:8080/one-two-three')).toBe('one-two-three')
    })
    describe('with a pathless URI', () => {
      test('returns pre-configured value', () => {
        expect(indexer.identifierFrom('https://localhost:8080/')).toBe(Config.rootNodeIdentifier)
      })
    })
  })
  describe('indexNameFrom()', () => {
    test('returns the resource index name by default', () => {
      expect(indexer.indexNameFrom([])).toBe('sinopia_resources')
    })
    test('returns the non RDF index name when types includes LDP-NRS', () => {
      expect(indexer.indexNameFrom(['http://www.w3.org/ns/ldp#NonRDFSource'])).toBe('sinopia_templates')
    })
  })
})
