import { datasetFromJsonld } from 'utilities'
import TemplateIndexer from 'TemplateIndexer'

describe('TemplateIndexer', () => {
  describe('Indexing a base template', () => {
    const doc = {
      'id': 'sinopia:template:property:literal',
      'uri': 'https://api.development.sinopia.io/resource/sinopia:template:property:literal',
      'user': 'justinlittman',
      'group': 'ld4p',
      'editGroups': ['stanford'],
      'timestamp': '2020-08-27T01:08:54.992Z',
      'templateId': 'sinopia:template:resource',
      'data': [
        {
          '@id': '_:b2',
          '@type': [
            'http://sinopia.io/vocabulary/PropertyTemplate'
          ],
          'http://www.w3.org/2000/01/rdf-schema#label': [
            {
              '@value': 'Defaults'
            }
          ]
        },
        {
          '@id': 'https://api.development.sinopia.io/resource/sinopia:template:property:literal',
          '@type': [
            'http://sinopia.io/vocabulary/ResourceTemplate'
          ],
          'http://sinopia.io/vocabulary/hasResourceId': [
            {
              '@id': 'sinopia:template:property:literal'
            }
          ],
          'http://sinopia.io/vocabulary/hasPropertyTemplate': [
            {
              '@list': [
                {
                  '@id': '_:b2'
                }
              ]
            }
          ]
        }
      ]
    }
    it('does not index', async () => {
      const dataset = await datasetFromJsonld(doc.data)
      expect(new TemplateIndexer(doc, dataset).index()).toBeNull()
    })
  })

  describe('Template', () =>{
    const doc = {
      'data': [
        {
          '@id': '_:b8335',
          '@type': [
            'http://sinopia.io/vocabulary/PropertyTemplate'
          ],
          'http://www.w3.org/2000/01/rdf-schema#label': [
            {
              '@value': 'Note text'
            }
          ],
          'http://sinopia.io/vocabulary/hasPropertyUri': [
            {
              '@id': 'http://www.w3.org/2000/01/rdf-schema#label'
            }
          ],
          'http://sinopia.io/vocabulary/hasPropertyAttribute': [
            {
              '@id': 'http://sinopia.io/vocabulary/propertyAttribute/repeatable'
            }
          ],
          'http://sinopia.io/vocabulary/hasPropertyType': [
            {
              '@id': 'http://sinopia.io/vocabulary/propertyType/literal'
            }
          ]
        },
        {
          '@id': 'https://api.development.sinopia.io/resource/ld4p:RT:bf2:Identifiers:Note',
          'http://sinopia.io/vocabulary/hasResourceTemplate': [
            {
              '@value': 'sinopia:template:resource'
            }
          ],
          '@type': [
            'http://sinopia.io/vocabulary/ResourceTemplate'
          ],
          'http://sinopia.io/vocabulary/hasResourceId': [
            {
              '@value': 'ld4p:RT:bf2:Identifiers:Note'
            }
          ],
          'http://sinopia.io/vocabulary/hasClass': [
            {
              '@id': 'http://id.loc.gov/ontologies/bibframe/Note'
            }
          ],
          'http://www.w3.org/2000/01/rdf-schema#label': [
            {
              '@value': 'Note'
            }
          ],
          'http://sinopia.io/vocabulary/hasAuthor': [
            {
              '@value': 'LD4P'
            }
          ],
          'http://sinopia.io/vocabulary/hasDate': [
            {
              '@value': '2019-08-19'
            }
          ],
          'http://sinopia.io/vocabulary/hasPropertyTemplate': [
            {
              '@list': [
                {
                  '@id': '_:b8335'
                }
              ]
            }
          ]
        }
      ],
      'group': 'ld4p',
      'editGroups': ['stanford'],
      'types': [
        'http://sinopia.io/vocabulary/ResourceTemplate'
      ],
      'user': 'NancyL',
      'timestamp': '2020-02-12T23:53:20.905Z',
      'templateId': 'sinopia:template:resource',
      'id': 'ld4p:RT:bf2:Identifiers:Note',
      'uri': 'https://api.development.sinopia.io/resource/ld4p:RT:bf2:Identifiers:Note'
    }

    it('indexes', async () => {
      const dataset = await datasetFromJsonld(doc.data)
      expect(new TemplateIndexer(doc, dataset).index()).toEqual({
        'author': 'LD4P', 
        'date': '2019-08-19', 
        'id': 'ld4p:RT:bf2:Identifiers:Note', 
        'remark': undefined, 
        'resourceLabel': 'Note', 
        'resourceURI': 'http://id.loc.gov/ontologies/bibframe/Note', 
        'uri': 'https://api.development.sinopia.io/resource/ld4p:RT:bf2:Identifiers:Note',
        'group': 'ld4p',
        'editGroups': ['stanford']
      })
    })
  })

  describe('Template with no date', () =>{
    const doc = {
      'data': [
        {
          '@id': '_:b8335',
          '@type': [
            'http://sinopia.io/vocabulary/PropertyTemplate'
          ],
          'http://www.w3.org/2000/01/rdf-schema#label': [
            {
              '@value': 'Note text'
            }
          ],
          'http://sinopia.io/vocabulary/hasPropertyUri': [
            {
              '@id': 'http://www.w3.org/2000/01/rdf-schema#label'
            }
          ],
          'http://sinopia.io/vocabulary/hasPropertyAttribute': [
            {
              '@id': 'http://sinopia.io/vocabulary/propertyAttribute/repeatable'
            }
          ],
          'http://sinopia.io/vocabulary/hasPropertyType': [
            {
              '@id': 'http://sinopia.io/vocabulary/propertyType/literal'
            }
          ]
        },
        {
          '@id': 'https://api.development.sinopia.io/resource/ld4p:RT:bf2:Identifiers:Note',
          'http://sinopia.io/vocabulary/hasResourceTemplate': [
            {
              '@value': 'sinopia:template:resource'
            }
          ],
          '@type': [
            'http://sinopia.io/vocabulary/ResourceTemplate'
          ],
          'http://sinopia.io/vocabulary/hasResourceId': [
            {
              '@value': 'ld4p:RT:bf2:Identifiers:Note'
            }
          ],
          'http://sinopia.io/vocabulary/hasClass': [
            {
              '@id': 'http://id.loc.gov/ontologies/bibframe/Note'
            }
          ],
          'http://www.w3.org/2000/01/rdf-schema#label': [
            {
              '@value': 'Note'
            }
          ],
          'http://sinopia.io/vocabulary/hasAuthor': [
            {
              '@value': 'LD4P'
            }
          ],
          'http://sinopia.io/vocabulary/hasPropertyTemplate': [
            {
              '@list': [
                {
                  '@id': '_:b8335'
                }
              ]
            }
          ]
        }
      ],
      'group': 'ld4p',
      'editGroups': ['stanford'],
      'types': [
        'http://sinopia.io/vocabulary/ResourceTemplate'
      ],
      'user': 'NancyL',
      'timestamp': '2020-02-12T23:53:20.905Z',
      'templateId': 'sinopia:template:resource',
      'id': 'ld4p:RT:bf2:Identifiers:Note',
      'uri': 'https://api.development.sinopia.io/resource/ld4p:RT:bf2:Identifiers:Note'
    }

    it('indexes', async () => {
      const dataset = await datasetFromJsonld(doc.data)
      expect(new TemplateIndexer(doc, dataset).index()).toEqual({
        'author': 'LD4P', 
        'date': undefined, 
        'id': 'ld4p:RT:bf2:Identifiers:Note', 
        'remark': undefined, 
        'resourceLabel': 'Note', 
        'resourceURI': 'http://id.loc.gov/ontologies/bibframe/Note', 
        'uri': 'https://api.development.sinopia.io/resource/ld4p:RT:bf2:Identifiers:Note',
        'group': 'ld4p',
        'editGroups': ['stanford']
      })
    })
  })

  describe('Template with a bad date', () =>{
    const doc = {
      'data': [
        {
          '@id': '_:b8335',
          '@type': [
            'http://sinopia.io/vocabulary/PropertyTemplate'
          ],
          'http://www.w3.org/2000/01/rdf-schema#label': [
            {
              '@value': 'Note text'
            }
          ],
          'http://sinopia.io/vocabulary/hasPropertyUri': [
            {
              '@id': 'http://www.w3.org/2000/01/rdf-schema#label'
            }
          ],
          'http://sinopia.io/vocabulary/hasPropertyAttribute': [
            {
              '@id': 'http://sinopia.io/vocabulary/propertyAttribute/repeatable'
            }
          ],
          'http://sinopia.io/vocabulary/hasPropertyType': [
            {
              '@id': 'http://sinopia.io/vocabulary/propertyType/literal'
            }
          ]
        },
        {
          '@id': 'https://api.development.sinopia.io/resource/ld4p:RT:bf2:Identifiers:Note',
          'http://sinopia.io/vocabulary/hasResourceTemplate': [
            {
              '@value': 'sinopia:template:resource'
            }
          ],
          '@type': [
            'http://sinopia.io/vocabulary/ResourceTemplate'
          ],
          'http://sinopia.io/vocabulary/hasResourceId': [
            {
              '@value': 'ld4p:RT:bf2:Identifiers:Note'
            }
          ],
          'http://sinopia.io/vocabulary/hasClass': [
            {
              '@id': 'http://id.loc.gov/ontologies/bibframe/Note'
            }
          ],
          'http://www.w3.org/2000/01/rdf-schema#label': [
            {
              '@value': 'Note'
            }
          ],
          'http://sinopia.io/vocabulary/hasAuthor': [
            {
              '@value': 'LD4P'
            }
          ],
          'http://sinopia.io/vocabulary/hasDate': [
            {
              '@value': 'Aug 19, 2019'
            }
          ],
          'http://sinopia.io/vocabulary/hasPropertyTemplate': [
            {
              '@list': [
                {
                  '@id': '_:b8335'
                }
              ]
            }
          ]
        }
      ],
      'group': 'ld4p',
      'editGroups': ['stanford'],
      'types': [
        'http://sinopia.io/vocabulary/ResourceTemplate'
      ],
      'user': 'NancyL',
      'timestamp': '2020-02-12T23:53:20.905Z',
      'templateId': 'sinopia:template:resource',
      'id': 'ld4p:RT:bf2:Identifiers:Note',
      'uri': 'https://api.development.sinopia.io/resource/ld4p:RT:bf2:Identifiers:Note'
    }

    it('indexes, ignoring bad date', async () => {
      const dataset = await datasetFromJsonld(doc.data)
      expect(new TemplateIndexer(doc, dataset).index()).toEqual({
        'author': 'LD4P', 
        'date': undefined, 
        'id': 'ld4p:RT:bf2:Identifiers:Note', 
        'remark': undefined, 
        'resourceLabel': 'Note', 
        'resourceURI': 'http://id.loc.gov/ontologies/bibframe/Note', 
        'uri': 'https://api.development.sinopia.io/resource/ld4p:RT:bf2:Identifiers:Note',
        'group': 'ld4p',
        'editGroups': ['stanford']
      })
    })
  })
})
