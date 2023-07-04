const mongoose = require('mongoose')
const Schema = mongoose.Schema

const BidSchema = Schema({
  playerId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Player',
  },
  teamId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Team',
  },
  amount: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
  },
})

module.exports = mongoose.model('Bid', BidSchema)
