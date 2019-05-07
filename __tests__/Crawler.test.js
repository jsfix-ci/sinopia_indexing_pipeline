import mockConsole from 'jest-mock-console'
import Config from '../src/Config'
import Crawler from '../src/Crawler'
import Logger from '../src/Logger'

// Mocks to avoid making real HTTP requests
import RequestTypedErrorFake from '../__mocks__/RequestTypedErrorFake'
import RequestTypedSuccessFake from '../__mocks__/RequestTypedSuccessFake'
import RequestUntypedErrorFake from '../__mocks__/RequestUntypedErrorFake'
import RequestUntypedSuccessFake from '../__mocks__/RequestUntypedSuccessFake'

// Outermost-scope variable to support mocking/restoring the `console` object
let restoreConsole

describe('Crawler', () => {
  describe('constructor()', () => {
    const crawler = new Crawler()

    it('sets this.logger', () => {
      expect(crawler.logger).toBeInstanceOf(Logger)
    })
  })

  describe('crawl()', () => {
    const crawler = new Crawler()
    const logSpy = jest.spyOn(crawler.logger, 'debug')
    const requestSpy = jest.fn()
    const callback = jest.fn()

    beforeAll(() => {
      // Replace the implementation of request() within crawl(); we will test
      // the implementation details of request() in a separate describe() block
      // below. For crawl()'s purpose, it's good enough to ensure request() is
      // invoked.
      crawler.request = requestSpy

      // Eat console output
      restoreConsole = mockConsole(['error', 'debug'])
    })
    afterAll(() => {
      restoreConsole()
    })
    it('logs a debug message', async () => {
      await crawler.crawl()
      expect(logSpy).toHaveBeenCalledWith(`connecting to Trellis at ${Config.platformUrl}`)
    })
    it('invokes this.request with platform URL and callback', async () => {
      await crawler.crawl(callback)
      expect(requestSpy.mock.calls.length).toEqual(1)
      expect(requestSpy.mock.calls[0][0]).toEqual(Config.platformUrl)
      expect(requestSpy.mock.calls[0][1]).toBe(callback)
    })
  })

  describe('toArray()', () => {
    const crawler = new Crawler()

    it('returns array untouched when given an array', () => {
      expect(crawler.toArray([1, 2, 3])).toEqual([1, 2, 3])
    })

    it('returns array when given a string', () => {
      expect(crawler.toArray('foo')).toEqual(['foo'])
    })

    it('returns array when given undefined', () => {
      expect(crawler.toArray(undefined)).toEqual([undefined])
    })
  })

  describe('ldpTypesFrom()', () => {
    const crawler = new Crawler()

    beforeAll(() => {
      // Eat console output
      restoreConsole = mockConsole(['error', 'debug'])
    })

    afterAll(() => {
      restoreConsole()
    })

    it('returns an empty list if no links present', async () => {
      // Stub out the request ldpTypesFrom() uses, returning a promise that
      // resolves to injected link headers
      crawler.typeRevealingRequest = () => new RequestUntypedSuccessFake({ 'link': 'foo' })

      expect(await crawler.ldpTypesFrom('http://foo')).toEqual([])
    })

    it('filters out non-links with rel="type"', async () => {
      // Stub out the request ldpTypesFrom() uses, returning a promise that
      // resolves to injected link headers
      crawler.typeRevealingRequest = () => new RequestUntypedSuccessFake({ 'link': '<foo>; rel="type", <bar>; rel="baz"' })

      expect(await crawler.ldpTypesFrom('http://bar')).toEqual(['foo'])
    })

    it('returns multiple type links if present', async () => {
      // Stub out the request ldpTypesFrom() uses, returning a promise that
      // resolves to injected link headers
      crawler.typeRevealingRequest = () => new RequestUntypedSuccessFake({ 'link': '<foo>; rel="type", <bar>; rel="type", whatever, <baz>; rel="type"' })

      expect(await crawler.ldpTypesFrom('http://baz')).toEqual(['foo', 'bar', 'baz'])
    })

    it('logs an error if request throws', async () => {
      // Stub out the request ldpTypesFrom() uses, returning a promise that
      // rejects (throws an error)
      crawler.typeRevealingRequest = () => new RequestUntypedErrorFake()
      const logSpy = jest.spyOn(crawler.logger, 'error')

      await crawler.ldpTypesFrom('http://quux')

      expect(logSpy).toHaveBeenCalledWith('during crawl, error making type-revealing request to http://quux: foobarbaz')
    })
  })

  describe('request()', () => {
    const crawler = new Crawler()
    const uri = 'http://foo.bar.edu'
    const callback = jest.fn()

    beforeAll(() => {
      // Eat console output
      restoreConsole = mockConsole(['error', 'debug'])
    })

    afterAll(() => {
      restoreConsole()
    })

    it('invokes ldpTypesFrom()', async () => {
      crawler.typeSpecificRequest = () => new RequestTypedSuccessFake()
      const typesSpy = jest.spyOn(crawler, 'ldpTypesFrom')

      await crawler.request(uri, callback)

      expect(typesSpy).toHaveBeenCalledWith(uri)
    })
    describe('when type-specific request succeeds', () => {
      beforeAll(() => {
        crawler.typeSpecificRequest = () => new RequestTypedSuccessFake()
        crawler.ldpTypesFrom = () => ['type1', 'type2']
      })

      it('executes the callback', async () => {
        await crawler.request(uri, callback)

        expect(callback).toHaveBeenCalledWith({ contains: [] }, uri, ['type1', 'type2'])
      })
      // TODO: Come up with a strategy for better testing this recursive function
      it.todo('makes one request per contained resource ("child")')
    })
    describe('when type-specific request fails', () => {
      beforeAll(() => {
        crawler.typeSpecificRequest = () => new RequestTypedErrorFake()
        crawler.ldpTypesFrom = jest.fn()
      })

      it('logs an error', async () => {
        const logSpy = jest.spyOn(crawler.logger, 'error')

        await crawler.request(uri, callback)

        expect(logSpy).toHaveBeenCalledWith('during crawl, error making mime type-specific request to http://foo.bar.edu: quuxquuux')
      })
    })
  })
})
