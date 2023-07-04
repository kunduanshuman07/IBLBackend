const path = require('path')
const csvtojson = require('csvtojson')

const createCsvWriter = require('csv-writer').createObjectCsvWriter
const Fixture = require('../models/fixture')
const Team = require('../models/team')

exports.getAllFixtures = (req, res, next) => {
  const { location } = req.query || ''

  Fixture.find({ location })
    .populate('teamAData teamBData')
    .then((fixtures) => {
      return res.status(200).json({
        status: 'ok',
        msg: 'fixtures retrieved',
        fixtures: fixtures,
      })
    })
    .catch((err) => next(err))
}

exports.getFixturesCsv = (req, res, next) => {
  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename="playersData.csv"')

  const { location } = req.query

  const filePath = path.join(__dirname, '../', 'fixtureData.csv')
  Fixture.find({ location })
    .populate('teamA teamB result')
    .lean()
    .then((fixtures) => {
      const header = [
        { id: 'round', title: 'round' },
        { id: 'match', title: 'match' },
        { id: 'ground', title: 'ground' },
        { id: 'date', title: 'date' },
        { id: 'time', title: 'time' },
        { id: 'teamA', title: 'teamA' },
        { id: 'teamB', title: 'teamB' },
        { id: 'result', title: 'result' },
      ]
      const data = fixtures.map((fixture) => {
        return {
          round: fixture.round ? fixture.round : '',
          match: fixture.match ? fixture.match : '',
          ground: fixture.ground ? fixture.ground : '',
          date: fixture.date ? fixture.date : '',
          time: fixture.time ? fixture.time : '',
          teamA: fixture.teamA ? fixture.teamA : '',
          teamB: fixture.teamB ? fixture.teamB : '',
          result: fixture.result ? fixture.result : '',
        }
      })

      const csvWriter = createCsvWriter({
        path: filePath,
        header: header,
      })
      return csvWriter.writeRecords(data)
    })
    .then(() => {
      res.download(filePath)
    })
    .catch((err) => {
      next(err)
    })
}

exports.postFixturesFromCsv = async (req, res, next) => {
  if (!req.files || !req.files.csv || req.files.csv.length <= 0) {
    return res.status(400).json({
      status: 'error',
      msg: 'csv file not provided',
    })
  }
  try {
    const { location } = req.body
    const filePath = req.files?.csv[0].path
    const data = await csvtojson().fromFile(filePath)
    await Fixture.deleteMany({ location })
    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      let { match, round, ground, teamA, teamB, date, time, result } = row
      match = parseInt(match)
      const teamAData = await Team.findOne({
        name: { $regex: `^${teamA}$`, $options: 'i' },
      })
      const teamBData = await Team.findOne({
        name: { $regex: `^${teamB}$`, $options: 'i' },
      })
      await Fixture.collection.insertOne({
        index: i,
        match,
        round,
        ground,
        date,
        time,
        teamA,
        teamB,
        result,
        teamAData: teamAData?._id,
        teamBData: teamBData?._id,
        location,
      })
    }
    return res.status(200).json({
      status: 'ok',
      msg: `fixtures updated for ${location} location`,
    })
  } catch (err) {
    console.log('err', err)
    return res.status(500).json({
      status: 'error',
      msg: err.message,
    })
  }
}
