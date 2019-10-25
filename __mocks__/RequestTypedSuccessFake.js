export default class RequestTypedSuccessFake {
  response() {
    return new Promise((resolve, _reject) => {
      return resolve({
        body: {
          '@graph': [
            {
              '@id': '_:b0',
              '@type': [
                'prov:Activity',
                'as:Create'
              ],
              'atTime': '2019-10-23T23:40:48.529Z',
              'wasAssociatedWith': 'http://www.trellisldp.org/ns/trellis#AnonymousAgent'
            },
            {
              '@id': 'http://platform.test:8080/repository',
              'label': 'Sinopia Repository Container',
              // TODO: change this when ready to test recursive Crawler.request() function
              'contains': [],
              'wasGeneratedBy': '_:b0'
            }
          ]
        }
      })
    })
  }
}
