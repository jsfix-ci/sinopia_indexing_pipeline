import mockConsole from 'jest-mock-console'
import superagent from 'superagent'
import Config from '../src/config'
import Logger from '../src/logger'
import Request from '../src/request'

// Mocks to avoid making real HTTP requests
import AgentSuccessFake from '../__mocks__/agent-success-fake'
import AgentFailureFake from '../__mocks__/agent-failure-fake'

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
    test('sets this.mimeType to config value', () => {
      expect(request.mimeType).toEqual(Config.defaultMimeType)
    })
    test('sets this.agent', () => {
      expect(request.agent).toBeInstanceOf(superagent.Request)
    })
    describe('with mimeType param', () => {
      test('overrides default this.mimeType', () => {
        const override = 'text/plain'

        expect(new Request(uri, override).mimeType).toEqual(override)
      })
    })
  })
  describe('body()', () => {
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
      test('returns the response body', () => {
        // the `return` statement is required here: https://jestjs.io/docs/en/asynchronous#promises
        return request.body()
          .then(response => {
            expect(response).toEqual(expectedBody)
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
        return request.body(errorMessage)
          .then(response => {
            expect(response).toEqual(null)
            expect(logSpy).toHaveBeenCalledWith(`error resolving ${uri}: ${errorMessage}`)
          })
      })
    })
  })
})
