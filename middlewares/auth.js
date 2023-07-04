// import modules
const jwt = require('jsonwebtoken')

// import models
const User = require('../models/user')

module.exports.setAuth = async (req, res, next) => {
  // const token = req.get('x-auth-token')
  const authHeader = req.headers['authorization']
  const token = authHeader ? authHeader.split(' ')[1] : null
  // check if jwt token is present then verify token and extract user-info
  if (token) {
    try {
      const verifiedToken = jwt.verify(token, process.env.JWT_SECRET)
      const userId = verifiedToken.user.id
      const user = await User.findById(userId).lean()
      if (user) {
        req.user = {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      }
    } catch (err) {
      return res.status(500).json({
        status: 'error',
        msg: 'error while verifying jwt token',
      })
    }
  }
  next()
}

module.exports.isAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      msg: 'not logged in',
    })
  } else return next()
}

module.exports.isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      msg: 'not logged in',
    })
  } else if (req.user.role !== 'admin') {
    return res.status(401).json({
      status: 'error',
      msg: 'not authorized as admin',
    })
  } else {
    next()
  }
}

module.exports.isTeamOwner = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      msg: 'not logged in',
    })
  } else if (req.user.role !== 'owner') {
    return res.status(401).json({
      status: 'error',
      msg: 'not authorized as team owner',
    })
  } else {
    next()
  }
}

module.exports.isPlayer = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      msg: 'not logged in',
    })
  } else if (req.user.role !== 'player') {
    return res.status(401).json({
      status: 'error',
      msg: 'not authorized as player',
    })
  } else {
    next()
  }
}
