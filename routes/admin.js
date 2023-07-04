const router = require('express').Router()

const adminController = require('../controllers/admin')
const configController = require('../controllers/config')
const fixtureController = require('../controllers/fixture')

// POST add player
router.post('/player/add', adminController.addPlayer)

// POST edit player
router.post('/player/edit', adminController.editPlayer)

// DELETE player
router.delete('/player/:playerId', adminController.deletePlayer)

// POST import players from csv
router.post('/player/import', adminController.postImportPlayersFromCsv)

// get export players data in csv
router.get('/player/export', adminController.exportPlayersInCsv)

// POST add team
router.post('/team/add', adminController.addTeam)

// POST edit team
router.post('/team/edit', adminController.editTeam)

// DELETE team
router.delete('/team/:teamId', adminController.deleteTeam)

// POST add account
router.post('/account/add', adminController.addAccount)

// POST edit account
router.post('/account/edit', adminController.editAccount)

// DELETE ACCOUNT
router.delete('/account/:accountId', adminController.deleteAccount)

// POST set team-owner
router.post('/teamowner/patch', adminController.setTeamOwner)

// POST  add user
router.post('/user/add', adminController.addUser)

// PATCH reset auction data
router.patch('/auction/reset', adminController.resetAuctionData)

// POST update configurations
router.post('/config/update', configController.updateConfigurations)

// post fixtures
router.post('/fixture/upload', fixtureController.postFixturesFromCsv)

module.exports = router
