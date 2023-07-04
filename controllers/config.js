const Config = require('../models/config')
const updateConfigurations = require('../config').updateConfigurations

exports.getConfigurations = (req, res, next) => {
  Config.find()
    .lean()
    .then((docs) => {
      const configurations = {}
      docs.forEach((doc) => {
        configurations[doc.key] = doc.value
      })
      return res.status(200).json({
        status: 'ok',
        msg: 'configurations fetched successfully',
        configurations,
      })
    })
}

exports.updateConfigurations = (req, res, next) => {
  const bulkOperations = Object.entries(req.body).map(([key, value]) => ({
    updateOne: {
      filter: { key: key },
      update: { $set: { value: value } },
      upsert: true,
    },
  }))
  Config.collection
    .bulkWrite(bulkOperations)
    .then((result) => {
      return updateConfigurations().then((configurations) => {
        return res.status(200).json({
          status: 'ok',
          msg: 'configurations updated',
          configurations: configurations,
        })
      })
    })
    .catch((err) => {
      next(err)
    })
}
