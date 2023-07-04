// import modules
const jwt = require('jsonwebtoken')
const bcryptjs = require('bcryptjs')

// import models
const User = require('../models/user')
const Team = require('../models/team')

// constants
const LOGIN_PERIOD_SEC = 36000

exports.getUser = async (req, res, next) => {
  if (!req.user) {
    return res.status(400).json({
      status: 'error',
      msg: 'user not set',
    })
  }
  User.findById(req.user.id)
    .then((user) => {
      if (!user) {
        return res.status(400).json({
          status: 'error',
          msg: 'User not found',
        })
      }
      // return user info with team data
      return Team.findOne({ 'teamOwner.userId': user._id.toString() }).then(
        (team) => {
          return res.status(200).json({
            status: 'ok',
            msg: 'User fetched successfully',
            user: {
              id: user._id,
              name: user.name,
              email: user.email,
              role: user.role,
              teamId: team ? team._id : null,
            },
          })
        }
      )
    })
    .catch((err) => {
      next(err)
    })
}

exports.postLogin = (req, res, next) => {
  const { email, password } = req.body

  // check if user exists
  User.findOne({ email: email })
    .lean()
    .then((user) => {
      if (!user) {
        return res.status(400).json({
          msg: 'Invalid credentials',
        })
      }
      // if user exists Match password
      return bcryptjs.compare(password, user.password).then((isMatch) => {
        if (!isMatch) {
          return res.status(400).json({
            msg: 'Incorrect password',
          })
        }

        // return jwt token
        const payload = {
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        }
        jwt.sign(
          payload,
          process.env.JWT_SECRET,
          { expiresIn: LOGIN_PERIOD_SEC },
          (err, token) => {
            if (err) {
              console.log('-----error-while-signing-jwt---', err)
              throw err
            }
            return res.status(200).json({
              status: 'ok',
              msg: 'authentication success',
              token: token,
            })
          }
        )
      })
    })
    .catch((err) => {
      next(err)
    })
}

exports.createUser = async (req, res, next) => {
  const { email, password, name, role, SUPER_USER_PASSWORD } = req.body
  if (!email || !password || !role) {
    return res.status(400).json({
      status: 'error',
      msg: 'Insufficient payload provided [required email & password & role]',
    })
  }

  if (SUPER_USER_PASSWORD !== process.env.SUPER_USER_PASSWORD) {
    return res.status(401).json({
      status: 'error',
      msg: 'Incorrect super-user-password',
    })
  }

  if (!['admin', 'owner', 'player', 'public'].includes(role)) {
    return res.status(400).json({
      status: 'error',
      msg: 'Invalid role provided',
    })
  }

  User.findOne({ email: email })
    .then((user) => {
      if (user)
        return res.status(409).json({
          status: 'error',
          msg: 'Email already exists',
        })
      // create a new user
      const newUser = new User({
        email: email,
        password: password,
        role: role,
        name: name,
      })
      return bcryptjs
        .hash(password, 12)
        .then((hashedPassword) => {
          newUser.password = hashedPassword
          return newUser.save()
        })
        .then((newUser) => {
          return res.status(201).json({
            status: 'ok',
            msg: 'user created',
            user: {
              email: newUser.email,
              role: newUser.role,
              name,
            },
          })
        })
    })
    .catch((err) => {
      next(err)
    })
}
