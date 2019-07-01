import config from 'config'
import Logger from '../src/Logger'

describe('Logger', () => {
  const testMessage = 'this is a test'
  const logger = new Logger()

  describe('debug', () => {
    const consoleSpy = jest.spyOn(console, 'debug')

    beforeEach(() => {
      consoleSpy.mockReset()
    })
    describe('with debug set to true', () => {
      beforeAll(() => {
        config.debug = true
      })
      test('console.debug is called', () => {
        logger.debug(testMessage)
        expect(consoleSpy).toHaveBeenCalledWith(testMessage)
      })
    })
    describe('with debug set to false', () => {
      beforeAll(() => {
        config.debug = false
      })
      test('console.debug is not called', () => {
        logger.debug(testMessage)
        expect(consoleSpy).not.toHaveBeenCalled()
      })
    })
  })
  describe('error', () => {
    const consoleSpy = jest.spyOn(console, 'error')

    beforeEach(() => {
      consoleSpy.mockReset()
    })
    test('console.error is called', () => {
      logger.error(testMessage)
      expect(consoleSpy).toHaveBeenCalledWith(testMessage)
    })
  })
})
