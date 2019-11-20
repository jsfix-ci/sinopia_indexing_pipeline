import mockConsole from 'jest-mock-console'
import Crawler from '../src/Crawler'
import Indexer from '../src/Indexer'
import Logger from '../src/Logger'
import Reindexer from '../src/Reindexer'

// Mock out dependencies to avoid testing implementation details
import CrawlerFake from '../__mocks__/CrawlerFake'
import IndexerErrorFake from '../__mocks__/IndexerErrorFake'
import IndexerSuccessFake from '../__mocks__/IndexerSuccessFake'

// Outermost-scope variable to support mocking/restoring the `console` object
let restoreConsole = null

describe('Reindexer', () => {
  const reindexer = new Reindexer()

  describe('constructor', () => {
    test('sets this.crawler', () => {
      expect(reindexer.crawler).toBeInstanceOf(Crawler)
    })
    test('sets this.logger', () => {
      expect(reindexer.logger).toBeInstanceOf(Logger)
    })
    test('sets this.indexer', () => {
      expect(reindexer.indexer).toBeInstanceOf(Indexer)
    })
  })

  describe('reindex()', () => {
    const logSpy = jest.spyOn(reindexer.logger, 'debug')
    const errorSpy = jest.spyOn(reindexer.logger, 'error')
    const fakeResource1 = {
      body: { foo: 'bar' },
      uri: 'http://example.org/foo',
      types: ['http://www.w3.org/ns/ldp#BasicContainer']
    }
    const fakeResource2 = {
      body: { baz: 'quux' },
      uri: 'http://example.org/baz',
      types: ['http://www.w3.org/ns/ldp#NonRDFSource']
    }
    const fakeResources = [
      fakeResource1,
      fakeResource2
    ]

    beforeAll(() => {
      reindexer.crawler = new CrawlerFake(fakeResources)
      reindexer.indexer = new IndexerSuccessFake()

      // Eat console output
      restoreConsole = mockConsole(['error', 'debug'])
    })

    afterAll(() => {
      restoreConsole()
    })

    it('recreates the indices to clear out resources removed from Trellis', async () => {
      const indexerSpy = jest.spyOn(reindexer.indexer, 'recreateIndices')

      await reindexer.reindex()
      expect(indexerSpy).toHaveBeenCalledTimes(1)
    })

    it('crawls the resource tree within the server', async () => {
      const crawlerSpy = jest.spyOn(reindexer.crawler, 'crawl')

      await reindexer.reindex()
      expect(crawlerSpy).toHaveBeenCalledTimes(1)
    })

    it('logs debug message when resource crawled', async () => {
      await reindexer.reindex()
      expect(logSpy).toHaveBeenNthCalledWith(1, `found resource for ${fakeResource1.uri} with types: ${fakeResource1.types}`)
      expect(logSpy).toHaveBeenNthCalledWith(2, `found resource for ${fakeResource2.uri} with types: ${fakeResource2.types}`)
    })

    it('calls the indexer and does not log an error', async () => {
      const indexerSpy = jest.spyOn(reindexer.indexer, 'index')
      await reindexer.reindex()
      expect(indexerSpy).toHaveBeenCalledTimes(2)
      expect(errorSpy).not.toHaveBeenCalled()
    })

    describe('when indexing fails', () => {
      beforeAll(() => {
        reindexer.indexer = new IndexerErrorFake()
      })

      it('calls the indexer and logs an error', async () => {
        const indexerSpy = jest.spyOn(reindexer.indexer, 'index')
        await reindexer.reindex()
        expect(indexerSpy).toHaveBeenCalledTimes(2)
        expect(errorSpy).toHaveBeenNthCalledWith(1, `error reindexing ${fakeResource1.uri}: ElasticSearch is down`, expect.anything())
        expect(errorSpy).toHaveBeenNthCalledWith(2, `error reindexing ${fakeResource2.uri}: ElasticSearch is down`, expect.anything())
      })
    })
  })
})
