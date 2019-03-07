export default class AgentFailureFake {
  constructor(errorMessage) {
    return new Promise((_resolve, reject) => {
      return reject({ message: errorMessage })
    })
  }
}
