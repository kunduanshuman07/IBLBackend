const router = require('express').Router()
const authMiddleware = require('../middlewares/auth')
const auctionController = require('../controllers/auction')

// GET auction data
router.get('/data', auctionController.getData)

// POST bid on player
router.post('/bid', authMiddleware.isTeamOwner, auctionController.postBid)

// POST  start auction
router.post('/initialize', authMiddleware.isAdmin, auctionController.initializeAuction)

// POST next player auction
router.post('/start', authMiddleware.isAdmin, auctionController.triggerPlayerAuction)

// POST pause auction
router.post('/pause', authMiddleware.isAdmin, auctionController.pauseAuction)

// POST end auction
router.post('/end', authMiddleware.isAdmin, auctionController.endAuction)

// POST clear auction
router.post('/clear', authMiddleware.isAdmin, auctionController.clearAuction)

module.exports = router
