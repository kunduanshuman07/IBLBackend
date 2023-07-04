const Datastore = require('nedb')
const db = new Datastore({ filename: './localstore.db' })
db.loadDatabase((err) => {
  // Callback is optional
  // Now commands will be executed
  if (err) {
    console.log('Error while loading database')
  }
})

const initializeStore = (store) => {
  return new Promise((resolve, reject) => {
    db.update({}, store, { upsert: true }, (err) => {
      if (err) {
        reject(err)
      }
      resolve(store)
    })
  })
}

const getStore = (props) => {
  return new Promise((resolve, reject) => {
    db.findOne({}, (err, doc) => {
      if (err) reject(err)
      else resolve(doc)
    })
  })
}

const updateStore = (props) => {
  return new Promise((resolve, reject) => {
    db.update(
      {},
      { $set: props },
      { returnUpdatedDocs: true },
      (err, _, affected) => {
        if (err) {
          reject(err)
        }
        resolve(affected)
      }
    )
  })
}

module.exports = { db, initializeStore, getStore, updateStore }
