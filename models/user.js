const mongoose = require('mongoose')
const Schema = mongoose.Schema

const UserSchema = Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
  },
  role: {
    type: String,
    required: true,
    enum: ['admin', 'owner', 'player', 'public'],
  },
})

module.exports = mongoose.model('User', UserSchema)
