module.exports = {
  // Placeholder to prevent https://github.com/lorenwest/node-config/wiki/Strict-Mode#node_env-value-of-node_env-did-not-match-any-deployment-config-file-names
  indexFieldMappings: {
    title: {
      type: "text",
      path: "$..mainTitle",
      autosuggest: true,
    },
    subtitle: {
      type: "text",
      path: "$..subtitle",
      autosuggest: true,
    },
    author: {
      type: "text",
      path: "$..author",
      autosuggest: false,
    },
    subject: {
      type: "text",
      path: "$..subject",
    },
  },
}
