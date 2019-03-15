import Config from '../src/config'

const OLD_ENV = process.env

describe('Config', () => {
  describe('with default values', () => {
    test('platformUrl has default value', () => {
      expect(Config.platformUrl).toEqual('http://platform:8080')
    })
    test('rootNodeIdentifier has default value', () => {
      expect(Config.rootNodeIdentifier).toEqual('__root_node__')
    })
    test('brokerHost has default value', () => {
      expect(Config.brokerHost).toEqual('localhost')
    })
    test('brokerPort has default value', () => {
      expect(Config.brokerPort).toEqual(61613)
    })
    test('queueName has default value', () => {
      expect(Config.queueName).toEqual('/queue/trellis')
    })
    test('defaultMimeType has default value', () => {
      expect(Config.defaultMimeType).toEqual('application/ld+json')
    })
    test('indexName has default value', () => {
      expect(Config.indexName).toEqual('sinopia_index')
    })
    test('indexType has default value', () => {
      expect(Config.indexType).toEqual('sinopia_resource')
    })
    test('indexHost has default value', () => {
      expect(Config.indexHost).toEqual('localhost')
    })
    test('indexPort has default value', () => {
      expect(Config.indexPort).toEqual(9200)
    })
    test('debug has default value', () => {
      expect(Config.debug).toEqual(true)
    })
  })
  describe('with environment variable overrides', () => {
    // Strategy for stubbing `process.env`: https://stackoverflow.com/a/48042799
    beforeEach(() => {
      process.env = {
        TRELLIS_BASE_URL: 'https://ldp.example.edu',
        ROOT_NODE_IDENTIFIER: 'super_cool',
        BROKER_HOST: 'myhost',
        BROKER_PORT: 61616,
        QUEUE_NAME: '/topic/foobar',
        DEFAULT_MIME_TYPE: 'text/plain',
        INDEX_NAME: 'test',
        INDEX_TYPE: 'other',
        INDEX_HOST: 'otherhost',
        INDEX_PORT: 9300,
        DEBUG: false
      }
    })
    afterEach(() => {
      process.env = OLD_ENV
    })
    test('platformUrl has overridden value', () => {
      expect(Config.platformUrl).toEqual('https://ldp.example.edu')
    })
    test('rootNodeIdentifier has overridden value', () => {
      expect(Config.rootNodeIdentifier).toEqual('super_cool')
    })
    test('brokerHost has overridden value', () => {
      expect(Config.brokerHost).toEqual('myhost')
    })
    test('brokerPort has default value', () => {
      expect(Config.brokerPort).toEqual(61616)
    })
    test('queueName has default value', () => {
      expect(Config.queueName).toEqual('/topic/foobar')
    })
    test('defaultMimeType has default value', () => {
      expect(Config.defaultMimeType).toEqual('text/plain')
    })
    test('indexName has default value', () => {
      expect(Config.indexName).toEqual('test')
    })
    test('indexType has default value', () => {
      expect(Config.indexType).toEqual('other')
    })
    test('indexHost has default value', () => {
      expect(Config.indexHost).toEqual('otherhost')
    })
    test('indexPort has default value', () => {
      expect(Config.indexPort).toEqual(9300)
    })
    test('debug has default value', () => {
      expect(Config.debug).toEqual(false)
    })
  })
})
