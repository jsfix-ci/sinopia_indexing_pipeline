import config from 'config'
import mockConsole from 'jest-mock-console'
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
      expect(indexer.client.transport._config.host).toEqual(config.get('indexUrl'))
    })

    it('creates a logger', () => {
      expect(indexer.logger).toBeInstanceOf(Logger)
    })

    it('sets known index results', () => {
      expect(indexer.knownIndexResults).toEqual(['created', 'updated'])
    })

    it('sets known delete results', () => {
      expect(indexer.knownDeleteResults).toEqual(['deleted'])
    })

    it('sets known indices', () => {
      expect(indexer.indices).toEqual(['sinopia_resources', 'sinopia_templates'])
    })
  })

  describe('index()', () => {
    const clientMock = new ClientSuccessFake()
    const indexSpy = jest.spyOn(clientMock, 'index')
    const json = {
      '@id': objectUri,
      foo: 'bar',
      mainTitle: { '@value': 'Hamlet' },
      subtitle: { '@value': 'A Tragic Tale about a Prince of Denmark' }
    }

    beforeAll(() => {
      indexer.client = clientMock
      // Eat console output
      restoreConsole = mockConsole(['error', 'debug'])
    })

    beforeEach(() => {
      indexer.storeDocumentIndices = []
    })

    afterAll(() => {
      restoreConsole()
    })

    describe('when not storing the document', () => {
      it('calls index() on the client without the document', () => {
        indexer.index(json, objectUri, objectTypes)
        expect(indexSpy).toHaveBeenCalledWith({
          index: config.get('resourceIndexName'),
          type: config.get('indexType'),
          id: '12345',
          body: {
            author: [],
            label: 'Hamlet: A Tragic Tale about a Prince of Denmark',
            subject: [],
            subtitle: ['A Tragic Tale about a Prince of Denmark'],
            'subtitle-suggest': ['a', 'tragic', 'tale', 'about', 'a', 'prince', 'of', 'denmark'],
            title: ['Hamlet'],
            'title-suggest': ['hamlet'],
            uri: 'http://foo.bar/12345',
          }
        })
      })
    })

    describe('when storing the document', () => {
      it('calls index() on the client with the document', () => {
        indexer.storeDocumentIndices.push(config.get('resourceIndexName'))
        indexer.index(json, objectUri, objectTypes)
        expect(indexSpy).toHaveBeenCalledWith({
          index: config.get('resourceIndexName'),
          type: config.get('indexType'),
          id: '12345',
          body: {
            author: [],
            document: json,
            label: 'Hamlet: A Tragic Tale about a Prince of Denmark',
            subject: [],
            subtitle: ['A Tragic Tale about a Prince of Denmark'],
            'subtitle-suggest': ['a', 'tragic', 'tale', 'about', 'a', 'prince', 'of', 'denmark'],
            title: ['Hamlet'],
            'title-suggest': ['hamlet'],
            uri: 'http://foo.bar/12345',
          }
        })
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
        index: config.get('resourceIndexName'),
        type: config.get('indexType'),
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

  describe('setupIndices()', () => {
    const logSpy = jest.spyOn(indexer.logger, 'error')

    describe('when indexes already exist', () => {
      const clientMock = new ClientSuccessFake(true)
      const createSpy = jest.spyOn(clientMock.indices, 'create')

      beforeEach(() => {
        indexer.client = clientMock
      })

      it('skips creating them', async () => {
        await indexer.setupIndices()
        expect(createSpy).not.toHaveBeenCalled()
        expect(logSpy).not.toHaveBeenCalled()
      })
    })

    describe('when successful', () => {
      const clientMock = new ClientSuccessFake()
      const createSpy = jest.spyOn(clientMock.indices, 'create')
      const mappingSpy = jest.spyOn(clientMock.indices, 'putMapping')

      beforeEach(() => {
        indexer.client = clientMock
      })

      it('does not log an error', async () => {
        await indexer.setupIndices()
        expect(createSpy).toHaveBeenCalledTimes(indexer.indices.length)
        expect(mappingSpy).toHaveBeenCalledTimes(indexer.indices.length)
        expect(logSpy).not.toHaveBeenCalled()
      })
    })

    describe('when erroring', () => {
      const clientMock = new ClientErrorFake()
      const createSpy = jest.spyOn(clientMock.indices, 'create')

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
        await indexer.setupIndices()
        expect(createSpy).toHaveBeenCalledTimes(1)
        expect(logSpy).toHaveBeenCalledWith('error setting up indices: could not create indices')
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
        expect(indexer.identifierFrom('https://localhost:8080/')).toBe(config.get('rootNodeIdentifier'))
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
