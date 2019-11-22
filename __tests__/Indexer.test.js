import config from 'config'
import mockConsole from 'jest-mock-console'
import Indexer from '../src/Indexer'
import Logger from '../src/Logger'

// Mocks to avoid hitting ElasticSearch
import ClientErrorFake from '../__mocks__/ClientErrorFake'
import ClientFailureFake from '../__mocks__/ClientFailureFake'
import ClientSuccessFake from '../__mocks__/ClientSuccessFake'

// Outermost-scope variable to support mocking/restoring the `console` object
let restoreConsole

describe('Indexer', () => {
  const resourceObjectTypes = ['http://www.w3.org/ns/ldp#RDFSource', 'http://www.w3.org/ns/ldp#Resource']
  const containerObjectTypes = ['http://www.w3.org/ns/ldp#BasicContainer','http://www.w3.org/ns/ldp#Container','http://www.w3.org/ns/ldp#RDFSource','http://www.w3.org/ns/ldp#Resource']
  const resourceTemplateObjectTypes = ['http://www.w3.org/ns/ldp#NonRDFSource', 'http://www.w3.org/ns/ldp#Resource']
  const objectUri = 'http://foo.bar/12345'

  const indexer = new Indexer()

  describe('constructor()', () => {
    it('creates a logger', () => {
      expect(indexer.logger).toBeInstanceOf(Logger)
    })

    it('sets known index results', () => {
      expect(indexer.knownIndexResults).toEqual(['created', 'updated'])
    })

    it('sets known delete results', () => {
      expect(indexer.knownDeleteResults).toEqual(['deleted'])
    })
  })

  describe('index()', () => {
    const resourceJson = {
      '@graph': [{
        '@id': '',
        '@type': 'http://id.loc.gov/ontologies/bibframe/AbbreviatedTitle',
        'foo': 'bar',
        'mainTitle': { '@value': 'Hamlet' },
        'subtitle': { '@value': 'A Tragic Tale about a Prince of Denmark' },
        'someText': { '@value': 'There is nothing either good or bad, but thinking makes it so.' },
        'hasResourceTemplate': 'ld4p:RT:bf2:Title:AbbrTitle',
        'issuance': 'http://id.loc.gov/vocabulary/issuance/mono',
      },
      {
        '@id': 'http://id.loc.gov/vocabulary/issuance/mono',
        'label': 'single unit'
      },
      {
        '@id': '_:b1',
        '@type': 'http://id.loc.gov/ontologies/bibframe/AccessPolicy',
        'label': {
          '@language': 'en',
          '@value': 'Open access'
        }
      },
      {
        '@id': '_:b0',
        '@type': ['as:Update', 'prov:Activity'],
        'atTime': '2019-10-18T16:11:33.772Z',
        'wasAssociatedWith': 'https://cognito-idp.us-west-2.amazonaws.com/us-west-2_CGd9Wq136/449f003b-19d1-48b5-aecb-b4f47fbb7dc8'
      }, {
        '@id': '_:b1',
        '@type': ['as:Create', 'prov:Activity'],
        'atTime': '2019-10-18T16:08:43.300Z',
        'wasAssociatedWith': 'https://cognito-idp.us-west-2.amazonaws.com/us-west-2_CGd9Wq136/449f003b-19d1-48b5-aecb-b4f47fbb7dc8'
      }, {
        '@id': objectUri,
        'wasGeneratedBy': ['_:b1', '_:b0']
      }],
    }

    const clientMock = new ClientSuccessFake()
    const indexSpy = jest.spyOn(clientMock, 'index')

    beforeAll(() => {
      indexer.client = clientMock
      // Eat console output
      restoreConsole = mockConsole(['error', 'debug'])
    })

    afterAll(() => {
      restoreConsole()
    })

    describe('when indexing a valid resource', () => {
      it('calls index() on the client and returns true', () => {
        indexer.index(resourceJson, objectUri, resourceObjectTypes).then(result => {
          expect(result).toEqual(true)
        })
        expect(indexSpy).toHaveBeenCalledWith({
          index: 'sinopia_resources',
          type: config.get('indexType'),
          id: '12345',
          body: {
            label: 'Hamlet: A Tragic Tale about a Prince of Denmark',
            text: [
              'Hamlet',
              'A Tragic Tale about a Prince of Denmark',
              'There is nothing either good or bad, but thinking makes it so.',
              'Open access',
              'single unit',
            ],
            subtitle: ['A Tragic Tale about a Prince of Denmark'],
            title: ['Hamlet'],
            type: ['http://id.loc.gov/ontologies/bibframe/AbbreviatedTitle'],
            uri: 'http://foo.bar/12345',
            created: '2019-10-18T16:08:43.300Z',
            modified: '2019-10-18T16:11:33.772Z'
          }
        })
      })
    })

    describe('when indexing a resource without a title', () => {
      const json = {
        '@graph': [{
          '@id': '',
          '@type': 'http://id.loc.gov/ontologies/bibframe/Note',
          'someText': { '@value': 'There is nothing either good or bad, but thinking makes it so.' },
          'hasResourceTemplate': 'ld4p:RT:bf2:Note'
        }, {
          '@id': '_:b0',
          '@type': ['as:Update', 'prov:Activity'],
          'atTime': '2019-10-18T16:11:33.772Z',
          'wasAssociatedWith': 'https://cognito-idp.us-west-2.amazonaws.com/us-west-2_CGd9Wq136/449f003b-19d1-48b5-aecb-b4f47fbb7dc8'
        }, {
          '@id': '_:b1',
          '@type': ['as:Create', 'prov:Activity'],
          'atTime': '2019-10-18T16:08:43.300Z',
          'wasAssociatedWith': 'https://cognito-idp.us-west-2.amazonaws.com/us-west-2_CGd9Wq136/449f003b-19d1-48b5-aecb-b4f47fbb7dc8'
        }, {
          '@id': objectUri,
          'wasGeneratedBy': ['_:b1', '_:b0']
        }],
      }
      it('uses the URI as the label', () => {
        indexer.index(json, objectUri, resourceObjectTypes).then(result => {
          expect(result).toEqual(true)
        })
        expect(indexSpy).toHaveBeenCalledWith({
          index: 'sinopia_resources',
          type: config.get('indexType'),
          id: '12345',
          body: {
            label: 'http://foo.bar/12345',
            text: [
              'There is nothing either good or bad, but thinking makes it so.'
            ],
            type: ['http://id.loc.gov/ontologies/bibframe/Note'],
            uri: 'http://foo.bar/12345',
            created: '2019-10-18T16:08:43.300Z',
            modified: '2019-10-18T16:11:33.772Z'
          }
        })
      })
    })

    describe('when indexing an RDA resource', () => {
      // Truncated
      const rdaJson = {
        '@graph': [{
          '@id': '',
          '@type': 'http://rdaregistry.info/Elements/c/C10006',
          'adminMetadata': '_:b0',
          'P20315': {
            '@language': 'en',
            '@value': 'What factors influence the quality of hazard mitigation plans in Washington State?'
          },
          'hasResourceTemplate': 'WAU:RT:RDA:Expression:etd'
        }, {
          '@id': '_:b0',
          '@type': 'http://id.loc.gov/ontologies/bibframe/AdminMetadata',
          'catalogerID': {
            '@language': 'en',
            '@value': 'cec23'
          },
          'encodingLevel': 'https://id.loc.gov/vocabulary/menclvl/f',
          'creationDate': {
            '@language': 'en',
            '@value': '2019-10-23'
          },
          'descriptionConventions': 'https://id.loc.gov/vocabulary/descriptionConventions/rda',
          'descriptionLanguage': 'https://id.loc.gov/vocabulary/languages/eng',
          'source': 'https://id.loc.gov/vocabulary/organizations/wau',
          'status': '_:b2'
        }, {
          '@id': '_:b1',
          '@type': ['prov:Activity', 'as:Create'],
          'atTime': '2019-10-23T15:40:51.049Z',
          'wasAssociatedWith': 'https://cognito-idp.us-west-2.amazonaws.com/us-west-2_CGd9Wq136/31b4687f-3832-4ce6-b9cf-4ac72fe0ab44'
        }, {
          '@id': '_:b2',
          '@type': 'http://id.loc.gov/ontologies/bibframe/Status',
          'code': {
            '@language': 'en',
            '@value': 'n'
          }
        }, {
          '@id': 'https://trellis.development.sinopia.io/repository/washington/a6934df9-7158-46d3-a50f-993135ace180',
          'wasGeneratedBy': '_:b1'
        }]
      }

      it('calls index() on the client and returns true', () => {
        indexer.index(rdaJson, objectUri, resourceObjectTypes).then(result => {
          expect(result).toEqual(true)
        })
        expect(indexSpy).toHaveBeenCalledWith({
          index: 'sinopia_resources',
          type: config.get('indexType'),
          id: '12345',
          body: {
            label: 'What factors influence the quality of hazard mitigation plans in Washington State?',
            text: [
              'What factors influence the quality of hazard mitigation plans in Washington State?',
              'cec23',
              '2019-10-23',
              'n'
            ],
            title: ['What factors influence the quality of hazard mitigation plans in Washington State?'],
            type: ['http://rdaregistry.info/Elements/c/C10006'],
            uri: 'http://foo.bar/12345',
            created: '2019-10-23T15:40:51.049Z',
            modified: '2019-10-23T15:40:51.049Z'
          }
        })
      })
    })

    describe('when indexing a resource template', () => {
      const resourceTemplateJson = {
        'propertyTemplates': [{
          'mandatory': 'false',
          'repeatable': 'true',
          'type': 'literal',
          'propertyURI': 'http://id.loc.gov/ontologies/bibframe/title',
          'propertyLabel': 'Title referenced'
        }],
        'id': 'ld4p:RT:bf2:ReferenceInstance',
        'resourceLabel': 'Instance Referenced',
        'resourceURI': 'http://id.loc.gov/ontologies/bibframe/Instance',
        'remark': 'used in rare materials profile',
        'author': 'LD4P',
        'date': '2019-08-19',
        'schema': 'https://ld4p.github.io/sinopia/schemas/0.2.0/resource-template.json'
      }

      it('does not index and returns true', () => {
        indexer.index(resourceTemplateJson, 'http://foo.bar/ld4p:RT:bf2:ReferenceInstance', resourceTemplateObjectTypes).then(result => {
          expect(result).toEqual(true)
        })
        expect(indexSpy).toHaveBeenCalledWith({
          index: 'sinopia_templates',
          type: config.get('indexType'),
          id: 'ld4p:RT:bf2:ReferenceInstance',
          body: {
            id: 'ld4p:RT:bf2:ReferenceInstance',
            resourceLabel: 'Instance Referenced',
            remark: 'used in rare materials profile',
            resourceURI: 'http://id.loc.gov/ontologies/bibframe/Instance',
            author: 'LD4P',
            date: '2019-08-19'
          }
        })
      })
    })

    describe('when indexing a container', () => {
      const containerJson = {
        '@graph': [{
          '@id': '_:b0',
          '@type': ['prov:Activity', 'as:Create'],
          'atTime': '2019-10-28T18:30:09.939Z',
          'wasAssociatedWith': 'http://www.trellisldp.org/ns/trellis#AnonymousAgent'
        }, {
          '@id': 'http://platform:8080/repository/cornell',
          'label': 'Sinopia Cornell University Group Container',
          'contains': 'http://platform:8080/repository/cornell/52671e22-4612-4dca-8b00-87b2cbc3fa6e',
          'wasGeneratedBy': '_:b0'
        }],
        '@context': {
          'wasAssociatedWith': {
            '@id': 'http://www.w3.org/ns/prov#wasAssociatedWith',
            '@type': '@id'
          },
          'atTime': {
            '@id': 'http://www.w3.org/ns/prov#atTime',
            '@type': 'http://www.w3.org/2001/XMLSchema#dateTime'
          },
          'contains': {
            '@id': 'http://www.w3.org/ns/ldp#contains',
            '@type': '@id'
          },
          'wasGeneratedBy': {
            '@id': 'http://www.w3.org/ns/prov#wasGeneratedBy',
            '@type': '@id'
          },
          'label': {
            '@id': 'http://www.w3.org/2000/01/rdf-schema#label'
          },
        }
      }
      it('does not index and returns true', () => {
        indexer.index(containerJson, objectUri, containerObjectTypes).then(result => {
          expect(result).toEqual(true)
        })
        expect(indexSpy).not.toHaveBeenCalled()
      })
    })

    describe('when indexing fails', () => {
      const clientMock = new ClientFailureFake()
      const logSpy = jest.spyOn(indexer.logger, 'error')

      beforeEach(() => {
        indexer.client = clientMock
      })

      it('throws and logs an error', () => {
        return indexer.index(resourceJson, objectUri, resourceObjectTypes)
          .then(() => {
            expect(logSpy).toHaveBeenCalledWith('error indexing: {"body":{}}', expect.anything())
          })
      })
    })

    describe('when indexing raises an exception', () => {
      const clientMock = new ClientErrorFake()
      const logSpy = jest.spyOn(indexer.logger, 'error')

      beforeEach(() => {
        indexer.client = clientMock
      })

      it('logs the error', async () => {
        expect.assertions(1)
        await indexer.index(resourceJson, objectUri, resourceObjectTypes)
        expect(logSpy).toHaveBeenCalledWith('error indexing: what a useful error message this is', expect.anything())
      })
    })

    describe('when resource has multiple types', () => {
      it('type has multiple URIs', () => {
        const clientMock2 = new ClientSuccessFake()
        indexer.client = clientMock2
        const indexSpy2 = jest.spyOn(clientMock2, 'index')
        const multipleTypesJSON = {...resourceJson}
        multipleTypesJSON['@graph'][0]['@type'] = [
          multipleTypesJSON['@graph'][0]['@type'],
          'http://id.loc.gov/ontologies/bibframe/WorkTitle'
        ]

        indexer.index(multipleTypesJSON, objectUri, resourceObjectTypes)
        expect(indexSpy2).toHaveBeenCalledWith({
          index: 'sinopia_resources',
          type: config.get('indexType'),
          id: '12345',
          body: {
            label: 'Hamlet: A Tragic Tale about a Prince of Denmark',
            text: [
              'Hamlet',
              'A Tragic Tale about a Prince of Denmark',
              'There is nothing either good or bad, but thinking makes it so.',
              'Open access',
              'single unit'
            ],
            subtitle: ['A Tragic Tale about a Prince of Denmark'],
            title: ['Hamlet'],
            type:[
              [ 'http://id.loc.gov/ontologies/bibframe/AbbreviatedTitle',
                'http://id.loc.gov/ontologies/bibframe/WorkTitle'
              ],
            ],
            uri: 'http://foo.bar/12345',
            created: '2019-10-18T16:08:43.300Z',
            modified: '2019-10-18T16:11:33.772Z'
          }
        })
      })
    })
  })

  describe('delete()', () => {
    const clientMock = new ClientSuccessFake()
    const deleteSpy = jest.spyOn(clientMock, 'delete')

    beforeEach(() => {
      indexer.client = clientMock
    })

    beforeAll(() => {
      // Eat console output
      restoreConsole = mockConsole(['error', 'debug'])
    })

    afterAll(() => {
      restoreConsole()
    })

    it('calls delete() on the client and returns true', () => {
      indexer.delete(objectUri, resourceObjectTypes)
        .then(result => {
          expect(result).toEqual(true)
        })
      expect(deleteSpy).toHaveBeenCalledWith({
        index: 'sinopia_resources',
        type: config.get('indexType'),
        id: '12345'
      })
    })

    describe('when deleting a non-resource (e.g., container)', () => {
      it('does not call delete() on the client and returns true', () => {
        indexer.delete(objectUri, containerObjectTypes)
          .then(result => {
            expect(result).toEqual(true)
          })
        expect(deleteSpy).not.toHaveBeenCalled()
      })
    })

    describe('when delete fails', () => {
      const clientMock = new ClientFailureFake()
      const logSpy = jest.spyOn(indexer.logger, 'error')

      beforeEach(() => {
        indexer.client = clientMock
      })

      it('throws and logs an error', () => {
        return indexer.delete(objectUri, resourceObjectTypes)
          .then(() => {
            expect(logSpy).toHaveBeenCalledWith('error deleting: {}', expect.anything())
          })
      })
    })

    describe('when delete raises an exception', () => {
      const clientMock = new ClientErrorFake()
      const logSpy = jest.spyOn(indexer.logger, 'error')

      beforeEach(() => {
        indexer.client = clientMock
      })

      it('logs the error', async () => {
        expect.assertions(1)
        await indexer.delete(objectUri, resourceObjectTypes)
        expect(logSpy).toHaveBeenCalledWith('error deleting: what a useful error message this is', expect.anything())
      })
    })
  })

  describe('recreateIndices()', () => {
    const logSpy = jest.spyOn(indexer.logger, 'error')

    describe('when successful', () => {
      const clientMock = new ClientSuccessFake()
      const deleteSpy = jest.spyOn(clientMock.indices, 'delete')
      const createSpy = jest.spyOn(clientMock.indices, 'create')

      beforeEach(() => {
        indexer.client = clientMock
      })

      it('does not log an error', async () => {
        await indexer.recreateIndices()
        expect(createSpy).toHaveBeenCalledTimes(2)
        expect(deleteSpy).toHaveBeenCalledTimes(1)
        expect(logSpy).not.toHaveBeenCalled()
      })
    })

    describe('when erroring', () => {
      const clientMock = new ClientErrorFake()
      const deleteSpy = jest.spyOn(clientMock.indices, 'delete')

      beforeEach(() => {
        indexer.client = clientMock
      })

      beforeAll(() => {
        // Eat console output
        restoreConsole = mockConsole(['error', 'debug'])
      })

      afterAll(() => {
        restoreConsole()
      })

      it('logs an error', async () => {
        await indexer.recreateIndices()
        expect(deleteSpy).toHaveBeenCalledTimes(1)
        expect(logSpy).toHaveBeenCalledWith('error recreating indices: could not delete indices', expect.anything())
      })
    })
  })

  describe('setupIndices()', () => {
    const logSpy = jest.spyOn(indexer.logger, 'error')

    describe('when indexes already exist', () => {
      const clientMock = new ClientSuccessFake(true)
      const createSpy = jest.spyOn(clientMock.indices, 'create')

      beforeEach(() => {
        indexer.client = clientMock
      })

      it('skips creating them', async () => {
        await indexer.setupIndices()
        expect(createSpy).not.toHaveBeenCalled()
        expect(logSpy).not.toHaveBeenCalled()
      })
    })

    describe('when successful', () => {
      const clientMock = new ClientSuccessFake()
      const createSpy = jest.spyOn(clientMock.indices, 'create')
      const mappingSpy = jest.spyOn(clientMock.indices, 'putMapping')

      beforeEach(() => {
        indexer.client = clientMock
      })

      it('does not log an error', async () => {
        await indexer.setupIndices()
        expect(createSpy).toHaveBeenCalledTimes(2)
        expect(mappingSpy).toHaveBeenCalledTimes(2)
        expect(logSpy).not.toHaveBeenCalled()
      })
    })

    describe('when erroring', () => {
      const clientMock = new ClientErrorFake()
      const createSpy = jest.spyOn(clientMock.indices, 'create')

      beforeEach(() => {
        indexer.client = clientMock
      })

      beforeAll(() => {
        // Eat console output
        restoreConsole = mockConsole(['error', 'debug'])
      })

      afterAll(() => {
        restoreConsole()
      })

      it('logs an error', async () => {
        await indexer.setupIndices()
        expect(createSpy).toHaveBeenCalledTimes(1)
        expect(logSpy).toHaveBeenCalledWith('error setting up indices: could not create indices', expect.anything())
      })
    })
  })

  describe('identifierFrom()', () => {
    beforeAll(() => {
      // Eat console output
      restoreConsole = mockConsole(['error', 'debug'])
    })

    afterAll(() => {
      restoreConsole()
    })

    it('removes URI scheme/host/port', () => {
      expect(indexer.identifierFrom('https://localhost:8080/one-two-three')).toBe('one-two-three')
    })

    describe('with a pathless URI', () => {
      it('returns pre-configured value', () => {
        expect(indexer.identifierFrom('https://localhost:8080/')).toBe(config.get('rootNodeIdentifier'))
      })
    })
  })

  describe('indexFrom()', () => {
    it('returns the resource index name by default', () => {
      expect(indexer.indexFrom([])).toBe('sinopia_resources')
    })
    it('returns the resource index name for a resource', () => {
      expect(indexer.indexFrom(resourceObjectTypes)).toBe('sinopia_resources')
    })
    it('returns the non RDF index name when types includes LDP-NRS', () => {
      expect(indexer.indexFrom(['http://www.w3.org/ns/ldp#NonRDFSource'])).toBe('sinopia_templates')
    })
    it('returns undefined for a container', () => {
      expect(indexer.indexFrom(containerObjectTypes)).toBe(undefined)
    })
  })
})
