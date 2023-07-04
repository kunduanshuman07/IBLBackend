const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ConfigSchema = Schema({
  key: {
    type: String,
    required: true,
  },
  value: {
    type: String,
    required: true,
  },
})

module.exports = mongoose.model('Config', ConfigSchema)
