require('dotenv').config()
// import modules
const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const mongoose = require('mongoose')
const multer = require('multer')
const fs = require('fs')
const path = require('path')
const cors = require('cors')
const nodeCron = require('node-cron')

// import files
const entityRoutes = require('./routes/entities')
const analyticRoutes = require('./routes/analytic')
const auctionRoutes = require('./routes/auction')
const adminRoutes = require('./routes/admin')
const authRoutes = require('./routes/auth')
const authMiddleware = require('./middlewares/auth')

// import analytic model and helper functions
const Analytic = require('./models/analytic')
const {
  snapshot,
  loadLastSnapshot,
  addDatapoint,
  clearAnalytics,
} = require('./database/analytic-db')
const { updateStatistics } = require('./utils/analytic')

// initialize objects
const FRONTEND_BUILD_PATH = path.join(__dirname, 'frontend', 'build')

const app = express()
const multerStorage = multer.diskStorage({
  filename: (req, file, cb) => {
    switch (file.fieldname) {
      case 'image':
        cb(
          null,
          new Date().getTime() +
            '-' +
            file.originalname.replace(/[^a-z0-9.]/gi, '_').toLowerCase()
        )
        break
      case 'zip':
        cb(null, 'images.zip')
        break
      default:
        cb(null, file.originalname)
    }
  },
  destination: (req, file, cb) => {
    switch (file.fieldname) {
      case 'image':
        fs.mkdirSync('static/images', { recursive: true })
        cb(null, './static/images')
        break
      case 'csv':
        fs.mkdirSync('static/csv', { recursive: true })
        cb(null, './static/csv')
        break
      case 'zip':
        fs.mkdirSync('static/zip', { recursive: true })
        cb(null, './static/zip')
        break
      default:
        fs.mkdirSync('static/others', { recursive: true })
        cb(null, './static/others')
        break
    }
  },
})
const multerMiddleware = multer({
  storage: multerStorage,
  // limits: {
  //   fileSize: (process.env.MAX_IMAGE_SIZE_IN_MB || 150) * 1024 * 1024,
  // },
}).fields([
  { name: 'image', maxCount: 1 },
  { name: 'csv', maxCount: 1 },
  { name: 'zip', maxCount: 1 },
])

// handling cors policy
app.use(cors())
// app.use('/', (req, res, next) => {
//   res.header('Access-Control-Allow-Origin', '*')
//   res.header('Access-Control-Allow-Headers', '*')
//   res.header('Access-Control-Allow-Methods', '*')
//   next()
// })

// middlewares
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cookieParser())
app.use(authMiddleware.setAuth)

app.use((req, res, next) => {
  multerMiddleware(req, res, (err) => {
    if (err) {
      console.log('Error while storing files using multer storage!\n', err)
      req.multerError = err
      return res.json({
        status: 'error',
        msg: 'Error while storing file using multer',
        err: err,
      })
    }
    next()
  })
})

// serve static files
app.use(express.static(FRONTEND_BUILD_PATH))
app.use('/static', express.static(path.join(__dirname, 'static')))

// serve routes
app.use('/api/v1/analytic', analyticRoutes)
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/admin', authMiddleware.isAdmin, adminRoutes)
app.use('/api/v1/auction', auctionRoutes)
app.use('/api/v1', entityRoutes)

// serving frontend
app.get('/*', (req, res) => {
  return res.status(200).sendFile(path.join(FRONTEND_BUILD_PATH, 'index.html'))
})

// handling errors
app.use((err, req, res, next) => {
  console.log('__err__', err)
  return res.status(500).json({
    status: 'error',
    msg: err.message,
  })
})

const PORT = process.env.PORT || 8000;
// connect mongoose client then listen to PORT
mongoose.set('strictQuery', true)
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((result) => {
    console.log('mongoose client Connected!')
    // updating global configurations
    return require('./config')
      .updateConfigurations()
      .catch((err) => {
        console.log('__error_in_updating_configurations__\n', err)
      })
  })
  .then((configurations) => {
    const server = app.listen(PORT, () => {
      console.log(`server listening to port: ${PORT}`)
    })
    // initialize socket connection and check connection
    const io = require('./socket').init(server)
    io.on('connection', () => {
      console.log('Client connected!')
    })

    //loading last snapshot
    loadLastSnapshot().catch((err) => {
      console.log('__error_while_loading_last_snapshot__\n', err)
    })
    // schedule cron jobs for analytics
    // clearing current snapshot and current day dataset at start of each day
    nodeCron.schedule('0 0 * * *', () => {
      clearAnalytics()
    })
    // updating user and view counts each hour at last min
    nodeCron.schedule('59 * * * *', updateStatistics)
    // adding datapoint each 5 min
    nodeCron.schedule('*/5 * * * *', () => {
      addDatapoint()
    })
  })
  .catch((err) => {
    console.log('client_not_connected', err)
  })
