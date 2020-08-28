import MongoClient  from 'mongodb'
import fs from 'fs'
import config from 'config'

const connect = () => {
  const url = `mongodb://${config.get('dbUsername')}:${config.get('dbPassword')}@${config.get('dbHost')}:${config.get('dbPort')}/${config.get('dbName')}`
  if (config.get('isAws')) {
    const ca = [fs.readFileSync('rds-combined-ca-bundle.pem')]

    return MongoClient.connect(`${url}?ssl=true&replicaSet=rs0&readPreference=secondaryPreferred`,
      {
        sslValidate: true,
        sslCA: ca,
        useNewUrlParser: true
      })
  } else {
    return MongoClient.connect(url, { useUnifiedTopology: true })
  }
}

export default connect
