const mongoose = require('mongoose')
const Schema = mongoose.Schema

const AccountSchema = Schema({
  name: {
    type: String,
    required: true,
  },
  totalCount: {
    type: Number,
  },
  isAuctioned: {
    type: Boolean,
    default: false,
  },
  location: {
    type: String,
    default: 'default',
  },
  imageUrl: {
    type: String,
  },
})

module.exports = mongoose.model('Account', AccountSchema)
