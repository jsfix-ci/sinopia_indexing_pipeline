import { datasetFromJsonld } from 'utilities'
import TemplateIndexer from 'TemplateIndexer'

describe('Indexer', () => {
  describe('Indexing a base template', () => {
    const doc = {
      'id': 'sinopia:template:property:literal',
      'uri': 'https://api.development.sinopia.io/resource/sinopia:template:property:literal',
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
})
