const Team = require('../models/team')

exports.getAllTeams = (req, res, next) => {
  const { location } = req.query
  Team.find()
    .populate('accountId teamOwner.playerId')
    .sort({ name: 'asc' })
    .lean()
    .then((teams) => {
      if (location)
        teams = teams.filter((team) => team?.accountId?.location === location)
      return res.json({
        status: 'ok',
        msg: 'teams fetched successfully',
        teams: teams,
      })
    })
    .catch((err) => {
      next(err)
    })
}

exports.getTeamInfo = (req, res, next) => {
  const { teamId } = req.params
  Team.findById(teamId)
    .populate('accountId')
    .lean()
    .then((team) => {
      return res.json({
        status: 'ok',
        msg: 'team info fetched successfully',
        team: team,
      })
    })
    .catch((err) => {
      next(err)
    })
}

exports.getAllOwners = (req, res, next) => {
  Team.find()
    .populate('teamOwner.playerId')
    .populate('teamOwner.userId')
    .then((teams) => {
      const teamOwners = teams.map((team) => ({
        ...team.teamOwner.playerId,
        email: team.teamOwner.userId.email,
        teamName: team.name,
      }))
      return res.json({
        status: 'ok',
        msg: 'team owners fetched successfully',
        teamOwners: teamOwners,
      })
    })
    .catch((err) => {
      next(err)
    })
}

exports.getOwnerById = (req, res, next) => {
  const { ownerId } = req.params
  Team.find({ 'teamOwner.playerId': ownerId })
    .populate('teamOwner.playerId')
    .populate('teamOwner.userId')
    .then((team) => {
      const teamOwner = {
        ...team.teamOwner.playerId,
        email: team.teamOwner.userId.email,
        teamName: team.name,
      }
      return res.json({
        status: 'ok',
        msg: 'team owner fetched successfully',
        teamOwner: teamOwner,
      })
    })
    .catch((err) => {
      next(err)
    })
}
