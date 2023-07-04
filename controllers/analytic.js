const Analytic = require('../models/analytic')
const { snapshot, getDataSet } = require('../database/analytic-db')
const { getClientsCount } = require('../socket')

exports.updateSnapshot = (req, res, next) => {
  const { hadVisited } = req.cookies
  if (!hadVisited) {
    const userAgent = req.headers['user-agent']
    const isMobile = userAgent && /Mobile/i.test(userAgent)
    isMobile ? (snapshot.mobileVisitors += 1) : (snapshot.desktopVisitors += 1)
  }
  snapshot.views += 1
  const maxDuration = 1000 * 24 * 3600 * 1000 //1000 days as max-duration for cookies to be stored (in milli seconds)
  res.cookie('hadVisited', true, {
    maxAge: maxDuration,
    httpOnly: true,
  })
  return res.status(200).json({ msg: 'analytic updated', hadVisited, snapshot })
}

exports.getAllData = async (req, res, next) => {
  try {
    const monthDataset = await Analytic.find({}).sort('-date').limit(30).lean()
    const dayDataset = await getDataSet()
    const clientsCount = getClientsCount()
    const statistic =
      monthDataset.length > 0
        ? monthDataset[0]
        : { mobileVisitors: 0, desktopVisitors: 0, views: 0 }
    return res.status(200).json({
      msg: 'all data fetched',
      monthDataset,
      dayDataset,
      clientsCount,
      statistic,
    })
  } catch (err) {
    return res.status(500).json({
      msg: err.message,
    })
  }
}

exports.getStatistics = (req, res, next) => {
  Analytic.findOne({})
    .sort('-date')
    .lean()
    .then((statistic) => {
      if (!statistic) {
        return res.status(200).json({
          msg: 'snapshot fetched since no stored data',
          statistic: snapshot,
        })
      }
      return res.status(200).json({
        msg: 'data fetched',
        statistic,
      })
    })
}

exports.getDayDataset = (req, res, next) => {
  getDataSet().then((dataset) => {
    return res.status(200).json({
      msg: 'dataset fetched',
      dataset,
    })
  })
}

exports.getMonthDataset = (req, res, next) => {
  Analytic.find({})
    .sort('-date')
    .limit(30)
    .lean()
    .then((dataset) => {
      return res.status(200).json({
        msg: 'dataset fetched',
        dataset,
      })
    })
}

exports.getClientsCount = (req, res, next) => {
  try {
    const count = getClientsCount()
    return res.status(200).json({
      msg: 'clients count fetched',
      count: count,
    })
  } catch (err) {
    res.status(500).json({
      msg: err?.message,
    })
  }
}
