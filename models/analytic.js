const mongoose = require('mongoose')
const Schema = mongoose.Schema

const AnalyticSchema = Schema({
  date: {
    type: Date,
    required: true,
  },
  mobileVisitors: {
    type: Number,
    required: true,
  },
  desktopVisitors: {
    type: Number,
    required: true,
  },
  views: {
    type: Number,
    required: true,
  },
})

module.exports = mongoose.model('Analytic', AnalyticSchema)
