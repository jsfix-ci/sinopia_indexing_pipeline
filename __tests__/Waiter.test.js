import mockConsole from 'jest-mock-console'
import waitOn from 'wait-on'
import Logger from '../src/Logger'
import Waiter from '../src/Waiter'

// Don't actually wait
jest.mock('wait-on')

// Outermost-scope variable to support mocking/restoring the `console` object
let restoreConsole = null

describe('Waiter', () => {
  describe('constructor()', () => {
    const waiter = new Waiter()

    it('sets options', () => {
      expect(waiter.options).toEqual(expect.objectContaining(
        {
          resources: expect.any(Array),
          log: expect.any(Boolean),
          interval: expect.any(Number),
          timeout: expect.any(Number),
          tcpTimeout: expect.any(Number)
        }
      ))
    })
    it('sets logger', () => {
      expect(waiter.logger).toBeInstanceOf(Logger)
    })
  })
  describe('wait()', () => {
    const waiter = new Waiter()
    const logSpy = jest.spyOn(waiter.logger, 'error')

    beforeAll(() => {
      // Eat console output
      restoreConsole = mockConsole(['error', 'debug'])
    })
    afterAll(() => {
      restoreConsole()
    })
    describe('when it succeeds', () => {
      beforeAll(() => {
        waitOn.mockImplementation(() => {
          return new Promise((resolve, _reject) => { return resolve() })
        })
      })
      it('does not log an error', async () => {
        await waiter.wait()
        expect(logSpy).not.toHaveBeenCalled()
      })
    })

    describe('when it fails', () => {
      beforeAll(() => {
        waitOn.mockImplementation(() => {
          return new Promise((_resolve, reject) => { return reject('foobar') })
        })
      })
      it('logs an error', async () => {
        await waiter.wait()
        expect(logSpy).toHaveBeenCalledWith('dependencies did not start up in time: foobar')
      })
    })
  })
})
