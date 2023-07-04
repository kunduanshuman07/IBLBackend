// this db store the statistics for current day
const Datastore = require('nedb')
const db = new Datastore({ filename: './analytic.db' })
const snapshot = {
  mobileVisitors: 0,
  desktopVisitors: 0,
  views: 0,
}

db.loadDatabase((err) => {
  if (err) {
    console.log('Error while loading database')
  }
})

const addDatapoint = () => {
  return new Promise((resolve, reject) => {
    db.insert({ date: new Date(), ...snapshot }, (err, doc) => {
      if (err) {
        reject(err)
      }
      resolve(doc)
    })
  })
}

const getDataSet = () => {
  return new Promise((resolve, reject) => {
    db.find({})
      .sort({ date: 1 })
      .exec((err, docs) => {
        if (err) {
          reject(err)
        }
        resolve(docs)
      })
  })
}

const loadLastSnapshot = () => {
  return new Promise((resolve, reject) => {
    db.find({})
      .sort({ date: -1 })
      .limit(1)
      .exec((err, docs) => {
        if (err) reject(err)
        if (docs.length > 0) {
          const doc = docs[0]
          snapshot.mobileVisitors = doc.mobileVisitors
          snapshot.desktopVisitors = doc.desktopVisitors
          snapshot.views = doc.views
        }
        resolve(snapshot)
      })
  })
}

const clearAnalytics = () => {
  return new Promise((resolve, reject) => {
    db.remove({}, { multi: true }, function (err, numRemoved) {
      if (err) reject(err)
      snapshot.mobileVisitors = 0
      snapshot.desktopVisitors = 0
      snapshot.views = 0
      db.loadDatabase(function (err) {
        if (err) reject(err)
        resolve()
        // done
      })
    })
  })
}

module.exports = {
  db,
  snapshot,
  loadLastSnapshot,
  addDatapoint,
  getDataSet,
  clearAnalytics,
}
