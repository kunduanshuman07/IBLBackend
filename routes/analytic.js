const router = require('express').Router()
const authMiddleware = require('../middlewares/auth')
const analyticController = require('../controllers/analytic')

// GET update analytic snapshot and set cookies
router.get('/set', analyticController.updateSnapshot)

router.get('/get/all', analyticController.getAllData)

// GET current data statistics
router.get('/get/statistic', analyticController.getStatistics)

router.get('/get/clientcount', analyticController.getClientsCount)

// GET month dataset
router.get('/get/month', analyticController.getMonthDataset)

// GET day dataset
router.get('/get/day', analyticController.getDayDataset)

module.exports = router
