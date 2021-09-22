import { datasetFromJsonld } from "utilities"
import ResourceIndexer from "ResourceIndexer"

describe("ResourceIndexer", () => {
  describe("Resource", () => {
    const doc = {
      data: [
        {
          "@id":
            "https://api.development.sinopia.io/resource/860e40cb-8c63-4014-90f4-4682d25780a8",
          "@type": ["http://id.loc.gov/ontologies/bibframe/Note"],
          "http://sinopia.io/vocabulary/hasResourceTemplate": [
            {
              "@value": "resourceTemplate:bf2:Title:Note",
            },
          ],
          "http://www.w3.org/2000/01/rdf-schema#label": [
            {
              "@value": "foo",
              "@language": "eng",
            },
          ],
        },
      ],
      bfAdminMetadataRefs: [],
      bfInstanceRefs: [],
      bfItemRefs: [],
      bfWorkRefs: [],
      group: "cornell",
      types: ["http://id.loc.gov/ontologies/bibframe/Note"],
      user: "sinopia-devs_client-tester",
      timestamp: "2020-08-21T22:20:56.893Z",
      templateId: "resourceTemplate:bf2:Title:Note",
      id: "860e40cb-8c63-4014-90f4-4682d25780a8",
      uri: "https://api.development.sinopia.io/resource/860e40cb-8c63-4014-90f4-4682d25780a8",
      editGroups: ["stanford"],
    }

    it("indexes", async () => {
      const dataset = await datasetFromJsonld(doc.data)
      expect(new ResourceIndexer(doc, dataset).index()).toEqual({
        uri: "https://api.development.sinopia.io/resource/860e40cb-8c63-4014-90f4-4682d25780a8",
        label:
          "https://api.development.sinopia.io/resource/860e40cb-8c63-4014-90f4-4682d25780a8",
        text: ["resourceTemplate:bf2:Title:Note", "foo"],
        modified: "2020-08-21T22:20:56.893Z",
        type: ["http://id.loc.gov/ontologies/bibframe/Note"],
        group: "cornell",
        editGroups: ["stanford"],
      })
    })
  })
})
