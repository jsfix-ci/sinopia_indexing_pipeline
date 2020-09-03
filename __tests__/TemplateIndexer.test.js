import { datasetFromJsonld } from 'utilities'
import TemplateIndexer from 'TemplateIndexer'

describe('Indexer', () => {
  describe('Indexing a base template', () => {
    const doc = {
      'id': 'sinopia:template:property:literal',
      'uri': 'https://api.development.sinopia.io/repository/sinopia:template:property:literal',
      'user': 'justinlittman',
      'group': 'ld4p',
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
          '@id': 'https://api.development.sinopia.io/repository/sinopia:template:property:literal',
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

  describe('Indexing a resource template', () => {
    const doc = {
      'user': 'jpnelson',
      'timestamp': '2020-01-23T03:20:45.237Z',
      'templateId': 'sinopia:template:resource',
      'id': 'sinopia:resourceTemplate:schema:Thing',
      'uri': 'https://api.development.sinopia.io/repository/sinopia:resourceTemplate:schema:Thing',
      'group': 'ld4p',
      'types': [
        'http://sinopia.io/vocabulary/ResourceTemplate'
      ],
      'data': [
        {
          '@id': 'https://api.development.sinopia.io/repository/sinopia:resourceTemplate:schema:Thing',
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
              '@id': 'sinopia:resourceTemplate:schema:Thing'
            }
          ],
          'http://sinopia.io/vocabulary/hasClass': [
            {
              '@id': 'http://schema.org/Thing'
            }
          ],
          'http://www.w3.org/2000/01/rdf-schema#label': [
            {
              '@value': 'The most generic type of item'
            }
          ],
          'http://sinopia.io/vocabulary/hasAuthor': [
            {
              '@value': 'Shelia Authority'
            }
          ],
          'http://sinopia.io/vocabulary/hasPropertyTemplate': [
            {
              '@list': [
                {
                  '@id': '_:b12415'
                },
                {
                  '@id': '_:b12417'
                }
              ]
            }
          ]
        },
        {
          '@id': '_:b12415',
          '@type': [
            'http://sinopia.io/vocabulary/PropertyTemplate'
          ],
          'http://www.w3.org/2000/01/rdf-schema#label': [
            {
              '@value': 'Additional Type'
            }
          ],
          'http://sinopia.io/vocabulary/hasPropertyUri': [
            {
              '@id': 'http://schema.org/additionalType'
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
          '@id': '_:b12417',
          '@type': [
            'http://sinopia.io/vocabulary/PropertyTemplate'
          ],
          'http://www.w3.org/2000/01/rdf-schema#label': [
            {
              '@value': 'Alternative Name'
            }
          ],
          'http://sinopia.io/vocabulary/hasPropertyUri': [
            {
              '@id': 'http://schema.org/alternateName'
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
        }
      ]
    }
    it('indexes a resource template', async () => {
      const dataset = await datasetFromJsonld(doc.data)
      const templateIndexer = new TemplateIndexer(doc, dataset)
      const indexObject = templateIndexer.index()
      expect(indexObject.id).toBe('sinopia:resourceTemplate:schema:Thing')
      expect(indexObject.author).toBe('Shelia Authority')
      expect(indexObject.date).toBeUndefined()
      expect(indexObject.resourceLabel).toBe('The most generic type of item')
      expect(indexObject.resourceURI).toBe('http://schema.org/Thing')
    })

  })

})
