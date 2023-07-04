const Account = require('../models/account')

exports.getAllAccounts = (req, res, next) => {
  const { location } = req.query
  const accountOptions = location ? { location: location } : {}
  Account.aggregate([
    {
      $lookup: {
        from: 'players',
        localField: '_id',
        foreignField: 'accountId',
        as: 'players',
      },
    },
    {
      $match: accountOptions,
    },
    {
      $sort: {
        name: 1,
      },
    },
  ]).then((accounts) => {
    accounts = accounts.map((account) => ({
      ...account,
      participantsCount: account.players.length,
      players: undefined,
    }))
    return res.status(200).json({
      status: 'ok',
      msg: 'accounts fetched',
      accounts: accounts,
    })
  })
}

// ## participant count is not sent as it is not required in usecase
exports.getAccountById = (req, res, next) => {
  const { accountId } = req.params
  if (accountId) {
    Account.findById(accountId)
      .lean()
      .then((account) => {
        return res.json({
          status: 'ok',
          msg: 'account fetched',
          account: account,
        })
      })
  }
}

exports.getLocations = (req, res, next) => {
  Account.find()
    .lean()
    .then((accounts) => {
      const locations = new Set()
      accounts.forEach((account) => locations.add(account.location))
      return res.status(200).json({
        status: 'ok',
        msg: 'locations fetched',
        locations: Array.from(locations),
      })
    })
    .catch((err) => next(err))
}
