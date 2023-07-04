const mongoose = require('mongoose')
const Schema = mongoose.Schema

const TeamSchema = Schema({
  accountId: {
    type: Schema.Types.ObjectId,
    ref: 'Account',
  },
  name: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
  },
  teamOwner: {
    type: {
      playerId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Player',
      },
      userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User',
      },
      budget: {
        type: Number,
        required: true,
      },
      isPlaying: {
        type: Boolean,
        default: false,
      },
    },
    _id: false,
  },
})

module.exports = mongoose.model('Team', TeamSchema)
