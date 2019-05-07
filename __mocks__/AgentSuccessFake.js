export default class AgentSuccessFake {
  constructor(bodyString) {
    return new Promise((resolve, _reject) => {
      return resolve({ body: bodyString })
    })
  }
}
