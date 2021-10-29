import { datasetFromJsonld } from "utilities"
import ResourceIndexer from "ResourceIndexer"

describe("ResourceIndexer", () => {
  describe("Resource with a label on the subject", () => {
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
              "@value": "Brain Matter",
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
      _id: "617c3e06efce030013d91fc3",
      uri: "https://api.development.sinopia.io/resource/860e40cb-8c63-4014-90f4-4682d25780a8",
      editGroups: ["stanford"],
    }

    it("indexes", async () => {
      const dataset = await datasetFromJsonld(doc.data)
      expect(await new ResourceIndexer(doc, dataset).index()).toEqual({
        mongoId: "617c3e06efce030013d91fc3",
        uri: "https://api.development.sinopia.io/resource/860e40cb-8c63-4014-90f4-4682d25780a8",
        label: "Brain Matter",
        text: ["resourceTemplate:bf2:Title:Note", "Brain Matter"],
        modified: "2020-08-21T22:20:56.893Z",
        type: ["http://id.loc.gov/ontologies/bibframe/Note"],
        group: "cornell",
        editGroups: ["stanford"],
      })
    })
  })

  describe("Resource with a label on nodes other than the subject", () => {
    const doc = {
      data: [
        {
          "@id": "http://website.com",
          "http://www.w3.org/2000/01/rdf-schema#label": [
            {
              "@value": "xyz123",
              "@language": "eng",
            },
          ],
        },
        {
          "@id":
            "https://api.development.sinopia.io/resource/860e40cb-8c63-4014-90f4-4682d25780a8",
          "http://sinopia.io/vocabulary/hasResourceTemplate": [
            {
              "@value": "test:resource:noRT",
            },
          ],
          "@type": ["http://id.loc.gov/ontologies/bibframe/Work"],
          "http://id.loc.gov/ontologies/bibframe/genreForm": [
            {
              "@id": "http://website.com",
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
      _id: "617c3e06efce030013d91fc3",
      uri: "https://api.development.sinopia.io/resource/860e40cb-8c63-4014-90f4-4682d25780a8",
      editGroups: ["stanford"],
    }

    it("indexes", async () => {
      const dataset = await datasetFromJsonld(doc.data)
      expect(await new ResourceIndexer(doc, dataset).index()).toEqual({
        mongoId: "617c3e06efce030013d91fc3",
        uri: "https://api.development.sinopia.io/resource/860e40cb-8c63-4014-90f4-4682d25780a8",
        label:
          "https://api.development.sinopia.io/resource/860e40cb-8c63-4014-90f4-4682d25780a8",
        text: ["xyz123", "test:resource:noRT"],
        modified: "2020-08-21T22:20:56.893Z",
        type: ["http://id.loc.gov/ontologies/bibframe/Work"],
        group: "cornell",
        editGroups: ["stanford"],
      })
    })
  })

  describe("Resource without a label", () => {
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
      _id: "617c3e06efce030013d91fc3",
      uri: "https://api.development.sinopia.io/resource/860e40cb-8c63-4014-90f4-4682d25780a8",
      editGroups: ["stanford"],
    }

    it("indexes", async () => {
      const dataset = await datasetFromJsonld(doc.data)
      expect(await new ResourceIndexer(doc, dataset).index()).toEqual({
        mongoId: "617c3e06efce030013d91fc3",
        uri: "https://api.development.sinopia.io/resource/860e40cb-8c63-4014-90f4-4682d25780a8",
        label:
          "https://api.development.sinopia.io/resource/860e40cb-8c63-4014-90f4-4682d25780a8",
        text: ["resourceTemplate:bf2:Title:Note"],
        modified: "2020-08-21T22:20:56.893Z",
        type: ["http://id.loc.gov/ontologies/bibframe/Note"],
        group: "cornell",
        editGroups: ["stanford"],
      })
    })
  })
})
