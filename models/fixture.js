const mongoose = require('mongoose')
const Schema = mongoose.Schema

const FixtureSchema = Schema({
  index: {
    type: Number,
    required: true,
  },
  round: {
    type: String,
  },
  match: {
    type: Number,
  },
  ground: {
    type: String,
  },
  date: {
    type: String,
  },
  time: {
    type: String,
  },
  teamA: {
    type: String,
  },
  teamB: {
    type: String,
  },
  result: {
    type: String,
  },
  teamAData: {
    type: Schema.Types.ObjectId,
    ref: 'Team',
  },
  teamBData: {
    type: Schema.Types.ObjectId,
    ref: 'Team',
  },
  location: {
    type: String,
    required: true,
  },
})

module.exports = mongoose.model('Fixture', FixtureSchema)
