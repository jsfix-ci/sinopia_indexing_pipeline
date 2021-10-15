import fetch from "node-fetch"
import config from "config"

export default class GroupCache {
  constructor() {
    this.cache = {}
  }

  async getLabel(group) {
    // This is a cheap way of refreshing groups.
    if (this.cache[group]) {
      return Promise.resolve(group)
    } else {
      await this.fetchGroups()
      return Promise.resolve(this.cache[group])
    }
  }

  async fetchGroups() {
    const uri = `${config.sinopiaApi}/groups`
    try {
      const resp = await fetch(uri, { Accept: "application/json" })
      const json = await resp.json()
      json.data.forEach((group) => (this.cache[group.id] = group.label))
    } catch (err) {
      throw new Error(`Error parsing resource: ${err.message || err}`)
    }
  }
}
