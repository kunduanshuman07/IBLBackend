const mongoose = require('mongoose')
const Schema = mongoose.Schema

const PlayerSchema = Schema({
  accountId: {
    type: Schema.Types.ObjectId,
    // required: true,
    default: "1001",
    ref: 'Account',
  },
  name: {
    type: String,
    required: true,
  },
  employeeId: {
    type: Number,
  },
  email: {
    type: String,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
  },
  // skill: {
  //   type: String,
  //   enum: ['Bowler', 'Spinner', 'All Rounder', 'Batsman', 'Keeper', 'Offensive', 'Defensive'],
  // },
  level: {
    type: String,
  },
  rating: {
    type: Number,
  },
  phoneNumber: {
    type: String,
  },
  isCaptain: {
    type: Boolean,
    default: false,
  },
  imageUrl: {
    type: String,
  },
  // initialized after auction
  teamId: {
    type: Schema.Types.ObjectId,
    ref: 'Team',
  },
  lastBid: {
    type: Schema.Types.ObjectId,
    ref: 'Bid',
  },
  auctionStatus: {
    type: String,
    enum: [null, 'SOLD', 'UNSOLD', 'OWNER'],
  },
})

module.exports = mongoose.model('Player', PlayerSchema)
