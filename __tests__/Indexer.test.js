import mockConsole from 'jest-mock-console'
import Config from '../src/Config'
import Indexer from '../src/Indexer'
import Logger from '../src/Logger'

// Mocks to avoid hitting ElasticSearch
import ClientErrorFake from '../__mocks__/ClientErrorFake'
import ClientFailureFake from '../__mocks__/ClientFailureFake'
import ClientSuccessFake from '../__mocks__/ClientSuccessFake'

// Outermost-scope variable to support mocking/restoring the `console` object
let restoreConsole

describe('Indexer', () => {
  const indexer = new Indexer()
  const objectUri = 'http://foo.bar/12345'
  const objectTypes = ['http://www.w3.org/ns/ldp#BasicContainer']

  describe('constructor()', () => {
    it('creates a client with the configured endpoint URL', () => {
      expect(indexer.client.transport._config.host).toEqual(Config.indexUrl)
    })
    it('creates a logger', () => {
      expect(indexer.logger).toBeInstanceOf(Logger)
    })
    it('creates known index results', () => {
      expect(indexer.knownIndexResults).toEqual(['created', 'updated'])
    })
    it('creates known delete results', () => {
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
    it('calls index() on the client', () => {
      indexer.index(json, objectUri, objectTypes)
      expect(indexSpy).toHaveBeenCalledWith({
        index: Config.resourceIndexName,
        type: Config.indexType,
        id: '12345',
        body: json
      })
    })
    describe('when indexing succeeds', () => {
      it('returns true', () => {
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
      it('throws and logs an error', () => {
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
      it('logs the error', async () => {
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
    it('calls delete() on the client', () => {
      indexer.delete(objectUri, objectTypes)
      expect(deleteSpy).toHaveBeenCalledWith({
        index: Config.resourceIndexName,
        type: Config.indexType,
        id: '12345'
      })
    })
    describe('when delete succeeds', () => {
      it('returns true', () => {
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
      it('throws and logs an error', () => {
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
      it('logs the error', async () => {
        expect.assertions(1)
        await indexer.delete(objectUri, objectTypes)
        expect(logSpy).toHaveBeenCalledWith('error deleting: what a useful error message this is')
      })
    })
  })
  describe('recreateIndices()', () => {
    const logSpy = jest.spyOn(indexer.logger, 'error')

    describe('when successful', () => {
      const clientMock = new ClientSuccessFake()
      const deleteSpy = jest.spyOn(clientMock.indices, 'delete')
      const createSpy = jest.spyOn(clientMock.indices, 'create')

      beforeEach(() => {
        indexer.client = clientMock
      })
      it('does not log an error', async () => {
        await indexer.recreateIndices()
        expect(createSpy).toHaveBeenCalledTimes(2)
        expect(deleteSpy).toHaveBeenCalledTimes(1)
        expect(logSpy).not.toHaveBeenCalled()
      })
    })
    describe('when erroring', () => {
      const clientMock = new ClientErrorFake()
      const deleteSpy = jest.spyOn(clientMock.indices, 'delete')

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
      it('logs an error', async () => {
        await indexer.recreateIndices()
        expect(deleteSpy).toHaveBeenCalledTimes(1)
        expect(logSpy).toHaveBeenCalledWith('error recreating indices: could not delete indices')
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
    it('removes URI scheme/host/port', () => {
      expect(indexer.identifierFrom('https://localhost:8080/one-two-three')).toBe('one-two-three')
    })
    describe('with a pathless URI', () => {
      it('returns pre-configured value', () => {
        expect(indexer.identifierFrom('https://localhost:8080/')).toBe(Config.rootNodeIdentifier)
      })
    })
  })
  describe('indexNameFrom()', () => {
    it('returns the resource index name by default', () => {
      expect(indexer.indexNameFrom([])).toBe('sinopia_resources')
    })
    it('returns the non RDF index name when types includes LDP-NRS', () => {
      expect(indexer.indexNameFrom(['http://www.w3.org/ns/ldp#NonRDFSource'])).toBe('sinopia_templates')
    })
  })
})
