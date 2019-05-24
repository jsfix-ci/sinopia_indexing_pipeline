import Config from '../src/Config'

const OLD_ENV = process.env

describe('Config', () => {
  describe('with default values', () => {
    test('platformUrl has default value', () => {
      expect(Config.platformUrl).toEqual('http://localhost:8080')
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
    test('brokerUsername has default value', () => {
      expect(Config.brokerUsername).toEqual(undefined)
    })
    test('brokerPassword has default value', () => {
      expect(Config.brokerPassword).toEqual(undefined)
    })
    test('brokerTlsEnabled has default value', () => {
      expect(Config.brokerTlsEnabled).toEqual(false)
    })
    test('queueName has default value', () => {
      expect(Config.queueName).toEqual('/queue/trellis')
    })
    test('defaultMimeType has default value', () => {
      expect(Config.defaultMimeType).toEqual('application/ld+json')
    })
    test('resourceIndexName has default value', () => {
      expect(Config.resourceIndexName).toEqual('sinopia_resources')
    })
    test('nonRdfIndexName has default value', () => {
      expect(Config.nonRdfIndexName).toEqual('sinopia_templates')
    })
    test('indexType has default value', () => {
      expect(Config.indexType).toEqual('sinopia')
    })
    test('indexUrl has default value', () => {
      expect(Config.indexUrl).toEqual('http://localhost:9200')
    })
    test('nonRdfTypeURI has default value', () => {
      expect(Config.nonRdfTypeURI).toEqual('http://www.w3.org/ns/ldp#NonRDFSource')
    })
    test('nonRdfMimeType has default value', () => {
      expect(Config.nonRdfMimeType).toEqual('application/json')
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
        BROKER_USERNAME: 'sinopia',
        BROKER_PASSWORD: 'bestever',
        BROKER_TLS_ENABLED: 'true',
        QUEUE_NAME: '/topic/foobar',
        DEFAULT_MIME_TYPE: 'text/plain',
        RESOURCE_INDEX_NAME: 'test',
        INDEX_TYPE: 'other',
        NON_RDF_INDEX_NAME: 'test2',
        INDEX_URL: 'https://otherhost:9300',
        NON_RDF_TYPE_URI: 'http://foo.example.org/bar',
        NON_RDF_MIME_TYPE: 'text/plain',
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
    test('brokerPort has overridden value', () => {
      expect(Config.brokerPort).toEqual(61616)
    })
    test('brokerUsername has overridden value', () => {
      expect(Config.brokerUsername).toEqual('sinopia')
    })
    test('brokerPassword has overridden value', () => {
      expect(Config.brokerPassword).toEqual('bestever')
    })
    test('brokerTlsEnabled has overridden value', () => {
      expect(Config.brokerTlsEnabled).toEqual(true)
    })
    test('queueName has overridden value', () => {
      expect(Config.queueName).toEqual('/topic/foobar')
    })
    test('defaultMimeType has overridden value', () => {
      expect(Config.defaultMimeType).toEqual('text/plain')
    })
    test('resourceIndexName has overridden value', () => {
      expect(Config.resourceIndexName).toEqual('test')
    })
    test('nonRdfIndexName has overridden value', () => {
      expect(Config.nonRdfIndexName).toEqual('test2')
    })
    test('indexType has overridden value', () => {
      expect(Config.indexType).toEqual('other')
    })
    test('indexUrl has overridden value', () => {
      expect(Config.indexUrl).toEqual('https://otherhost:9300')
    })
    test('nonRdfTypeURI has overridden value', () => {
      expect(Config.nonRdfTypeURI).toEqual('http://foo.example.org/bar')
    })
    test('nonRdfMimeType has overridden value', () => {
      expect(Config.nonRdfMimeType).toEqual('text/plain')
    })
    test('debug has overridden value', () => {
      expect(Config.debug).toEqual(false)
    })
  })
  describe('with variables that have a different value inside containerland', () => {
    // Strategy for stubbing `process.env`: https://stackoverflow.com/a/48042799
    beforeEach(() => {
      process.env = {
        INSIDE_CONTAINER: true
      }
    })
    afterEach(() => {
      process.env = OLD_ENV
    })
    test('platformUrl has overridden value', () => {
      expect(Config.platformUrl).toEqual('http://platform:8080')
    })
  })
})
