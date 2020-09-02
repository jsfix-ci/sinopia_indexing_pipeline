import _ from 'lodash'
const Readable = require('stream').Readable
const ParserJsonld = require('@rdfjs/parser-jsonld')
import rdf from 'rdf-ext'

export const replaceInKeys = (obj, from, to) => {
  return _.cloneDeepWith(obj, function (cloneObj) {
    if (!_.isPlainObject(cloneObj)) return
    const newObj = {}
    _.keys(cloneObj).forEach((key) => {
      const newKey = key.replace(new RegExp(`\\${from}`, 'g'), to)
      newObj[newKey] = replaceInKeys(cloneObj[key], from, to)
    })
    return newObj
  })
}

export const datasetFromJsonld = (jsonld) => {
  const parserJsonld = new ParserJsonld()

  const input = new Readable({
    read: () => {
      input.push(JSON.stringify(jsonld))
      input.push(null)
    }
  })

  const output = parserJsonld.import(input)
  const dataset = rdf.dataset()

  output.on('data', quad => {
    dataset.add(quad)
  })

  return new Promise((resolve, reject) => {
    output.on('end', resolve)
    output.on('error', reject)
  })
    .then(() => {
      return dataset
    })
}
