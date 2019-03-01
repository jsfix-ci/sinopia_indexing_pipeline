import Config from '../src/config'
import Logger from '../src/logger'

// This allows us to set the value of `Config.debug` in our tests
jest.mock('../src/config.js')

describe('Logger', () => {
  const testMessage = 'this is a test'
  const logger = new Logger()

  describe('debug', () => {
    let consoleSpy = jest.spyOn(console, 'debug')

    beforeEach(() => {
      consoleSpy.mockReset()
    })
    describe('with debug set to true', () => {
      beforeAll(() => {
        Config.debug = true
      })
      test('console.debug is called', () => {
        logger.debug(testMessage)
        expect(consoleSpy).toHaveBeenCalledWith(testMessage)
      })
    })
    describe('with debug set to false', () => {
      beforeAll(() => {
        Config.debug =  false
      })
      test('console.debug is not called', () => {
        logger.debug(testMessage)
        expect(consoleSpy).not.toHaveBeenCalled()
      })
    })
  })
  describe('error', () => {
    let consoleSpy = jest.spyOn(console, 'error')

    beforeEach(() => {
      consoleSpy.mockReset()
    })
    test('console.error is called', () => {
      logger.error(testMessage)
      expect(consoleSpy).toHaveBeenCalledWith(testMessage)
    })
  })
})
