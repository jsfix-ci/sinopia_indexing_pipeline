import mockConsole from 'jest-mock-console'
import superagent from 'superagent'
import Logger from '../src/Logger'
import Request from '../src/Request'

// Mocks to avoid making real HTTP requests
import AgentFailureFake from '../__mocks__/AgentFailureFake'
import AgentSuccessFake from '../__mocks__/AgentSuccessFake'

// Outermost-scope variable to support mocking/restoring the `console` object
let restoreConsole = null

describe('Request', () => {
  const uri = 'http://example.edu/foo'
  const request = new Request(uri)

  describe('constructor', () => {
    test('sets this.uri', () => {
      expect(request.uri).toEqual(uri)
    })
    test('sets this.logger', () => {
      expect(request.logger).toBeInstanceOf(Logger)
    })
    test('sets this.agent', () => {
      expect(request.agent).toBeInstanceOf(superagent.Request)
    })
    describe('with optional typeURIs param', () => {
      test('overrides default this.mimeType', () => {
        const typeURIs = ['http://foo.bar', 'http://www.w3.org/ns/ldp#NonRDFSource']

        expect(new Request(uri, typeURIs).agent.header.Accept).toEqual('application/json')
      })
    })
  })
  describe('mimeTypeFrom()', () => {
    test('returns the default mime type by default', () => {
      expect(request.mimeTypeFrom([])).toBe('application/ld+json')
    })
    test('returns the non RDF mime type when types includes LDP-NRS', () => {
      expect(request.mimeTypeFrom(['http://www.w3.org/ns/ldp#NonRDFSource'])).toBe('application/json')
    })
  })
  describe('response()', () => {
    beforeAll(() => {
      // Eat console output
      restoreConsole = mockConsole(['error', 'debug'])
    })
    afterAll(() => {
      restoreConsole()
    })
    describe('when successful', () => {
      const expectedBody = '{"it": "worked"}'

      beforeAll(() => {
        request.agent = new AgentSuccessFake(expectedBody)
      })
      test('returns the response', () => {
        // the `return` statement is required here: https://jestjs.io/docs/en/asynchronous#promises
        return request.response()
          .then(response => {
            expect(response.body).toEqual(expectedBody)
          })
      })
    })
    describe('when failure', () => {
      const errorMessage = 'http error what what'
      const logSpy = jest.spyOn(request.logger, 'error')

      beforeAll(() => {
        request.agent = new AgentFailureFake(errorMessage)
      })
      test('logs the error and returns null', () => {
        // the `return` statement is required here: https://jestjs.io/docs/en/asynchronous#promises
        return request.response(errorMessage)
          .then(response => {
            expect(response).toEqual(null)
            expect(logSpy).toHaveBeenCalledWith(`error resolving ${uri}: ${errorMessage}`)
          })
      })
    })
  })
})
