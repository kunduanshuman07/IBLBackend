const Config = require('./models/config')

const configurations = {
  DEFAULT_BID_AMOUNT: parseInt(process.env.DEFAULT_BID_AMOUNT) || 5000,
  BID_INCREASE: parseInt(process.env.BID_INCREASE) || 500,
  AUCTION_INTERVAL_IN_SEC: parseInt(process.env.AUCTION_INTERVAL_IN_SEC) || 30,
}

const updateConfigurations = async () => {
  return await Config.find()
    .lean()
    .then((docs) => {
      docs.forEach((doc) => {
        try {
          switch (doc.key) {
            case 'DEFAULT_BID_AMOUNT':
              configurations.DEFAULT_BID_AMOUNT = parseInt(doc.value)
              break
            case 'BID_INCREASE':
              configurations.BID_INCREASE = parseInt(doc.value)
              break
            case 'AUCTION_INTERVAL_IN_SEC':
              configurations.AUCTION_INTERVAL_IN_SEC = parseInt(doc.value)
          }
        } catch (err) {
          console.log(`__error_in_updating_config__${doc.key}__`)
        }
      })
      return docs
    })
}

module.exports = {
  configurations,
  updateConfigurations,
}
