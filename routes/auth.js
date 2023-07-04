const router = require('express').Router()
const authController = require('../controllers/auth')

// GET USER
router.get('/user', authController.getUser)

// POST LOGIN
router.post('/login', authController.postLogin)

// POST CREATE ACCOUNT
router.post('/user/add', authController.createUser)

module.exports = router
