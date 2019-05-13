export default class CrawlerFake {
  constructor(resources) {
    this.resources = resources
  }

  crawl(onResource) {
    this.resources.forEach(resource => {
      onResource(resource.body, resource.uri, resource.types)
    })
  }
}
