import superagent from 'superagent'
import Config from '../src/config'
import Logger from '../src/logger'
import Request from '../src/request'

// Mocks to avoid making real HTTP requests
import RequestSuccessFake from '../__mocks__/request-success-fake'
import RequestFailureFake from '../__mocks__/request-failure-fake'

describe('Request', () => {
  let uri = 'http://example.edu/foo'
  let request = new Request(uri)

  describe('constructor', () => {
    test('sets this.uri', () => {
      expect(request.uri).toEqual(uri)
    })
    test('sets this.logger', () => {
      expect(request.logger).toBeInstanceOf(Logger)
    })
    test('sets this.mimeType to config value', () => {
      expect(request.mimeType).toEqual(Config.defaultMimeType)
    })
    test('sets this.agent', () => {
      expect(request.agent).toBeInstanceOf(superagent.Request)
    })
    describe('with mimeType param', () => {
      test('overrides default this.mimeType', () => {
        let override = 'text/plain'

        expect(new Request(uri, override).mimeType).toEqual(override)
      })
    })
  })
  describe('body()', () => {
    describe('when successful', () => {
      let expectedBody = '{"it": "worked"}'

      beforeAll(() => {
        request.agent = new RequestSuccessFake(expectedBody)
      })
      test('returns the response body', () => {
        // the `return` statement is required here: https://jestjs.io/docs/en/asynchronous#promises
        return request.body()
          .then(response => {
            expect(response).toEqual(expectedBody)
          })
      })
    })
    describe('when failure', () => {
      let errorMessage = 'http error what what'
      let logSpy = jest.spyOn(request.logger, 'error')

      beforeAll(() => {
        request.agent = new RequestFailureFake(errorMessage)
      })
      test('logs the error and returns null', () => {
        // the `return` statement is required here: https://jestjs.io/docs/en/asynchronous#promises
        return request.body(errorMessage)
          .then(response => {
            expect(response).toEqual(null)
            expect(logSpy).toHaveBeenCalledWith(`error resolving ${uri}: ${errorMessage}`)
          })
      })
    })
  })
})
