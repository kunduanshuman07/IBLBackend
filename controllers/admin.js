// import modules
const fs = require("fs");
const path = require("path");
const bcryptjs = require("bcryptjs");
const csvtojson = require("csvtojson");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

const fileUtils = require("../utils/file");
const Player = require("../models/player");
const Account = require("../models/account");
const Team = require("../models/team");
const User = require("../models/user");
const Bid = require("../models/bid");
const { rmSync } = require("fs");

exports.addPlayer = (req, res, next) => {
  const {
    name,
    accountId,
    employeeId,
    email,
    skill,
    level,
    phoneNumber,
    gender,
    rating,
    isCaptain,
  } = req.body;
  // check validity of name
  if (!name) {
    return res.status(400).json({
      status: "error",
      msg: "Name is undefined",
    });
  }
  // check validity of accountId
  if (!accountId) {
    return res.status(400).json({
      status: "error",
      msg: "AccountId is undefined",
    });
  }
  // set imageurl if image is uploaded
  let imageUrl;
  if (req.files?.image) {
    imageUrl = req.files.image[0].path;
  }
  // create player object
  const player = new Player({
    name,
    accountId,
    employeeId,
    email,
    // skill,
    level,
    phoneNumber,
    imageUrl,
    gender,
    rating,
    isCaptain: isCaptain === "true" ? true : false,
  });

  player
    .save()
    .then((player) => {
      return res.status(200).json({
        status: "ok",
        msg: "player saved",
        player: player,
      });
      // return Account.findById(accountId)
      //   .then((account) => {
      //     account.participantsCount = account.participantsCount + 1
      //     return account.save()
      //   })
      //   .then((account) => {
      //     return res.status(200).json({
      //       status: 'ok',
      //       msg: 'player saved',
      //       player: player,
      //     })
      //   })
    })
    .catch((err) => {
      next(err);
    });
};

exports.editPlayer = (req, res, next) => {
  const {
    playerId,
    name,
    accountId,
    employeeId,
    email,
    // skill,
    level,
    phoneNumber,
    gender,
    rating,
    teamId,
    isCaptain,
    auctionStatus,
  } = req.body;
  Player.findById(playerId)
    .then((player) => {
      player.name = name;
      player.employeeId = employeeId;
      player.accountId = accountId;
      player.email = email;
      // player.skill = skill
      player.level = level;
      player.phoneNumber = phoneNumber;
      player.gender = gender;
      player.rating = rating;
      player.isCaptain = isCaptain === "true" ? true : false;
      // setting auction data only if not empty
      player.teamId = teamId ? teamId : null;
      player.auctionStatus = auctionStatus ? auctionStatus : null;
      // set image if provided
      if (req.files?.image) {
        player.imageUrl = req.files.image[0].path;
      }
      return player.save();
    })
    .then((player) => {
      return res.status(200).json({
        status: "ok",
        msg: "player edited",
        player: player,
      });
    })
    .catch((err) => {
      next(err);
    });
};

exports.deletePlayer = (req, res, next) => {
  const { playerId } = req.params;
  Player.findByIdAndDelete(playerId)
    .then((player) => {
      if (!player) {
        return res.status(400).json({
          status: "error",
          msg: "Player not found",
        });
      }
      // if player is team owner then unlink him from team
      if (player.auctionStatus === "OWNER" && player.teamId) {
        return Team.findById(player.teamId).then((team) => {
          const userId = team.teamOwner.userId;
          team.teamOwner = null;
          return Promise.all([
            User.findByIdAndDelete(userId),
            team.save(),
          ]).then(([user, team]) => {
            return res.json({
              status: "ok",
              msg: "player deleted and teamowner reset",
              player: player,
              team: team,
              user: user,
            });
          });
        });
      }

      return res.status(200).json({
        status: "ok",
        msg: "Deleted",
        player: player,
      });
    })
    .catch((err) => {
      next(err);
    });
};

exports.postImportPlayersFromCsv = async (req, res, next) => {
  if (!req.files || !req.files.csv || req.files.csv.length <= 0) {
    return res.status(400).json({
      status: "error",
      msg: "csv file not provided",
    });
  }
  try {
    const { location } = req.body;
    const accounts = (await Account.find({ location: location }).lean()).map(
      (account) => account._id.toString()
    );

    if (accounts.length == 0) {
      return res.status(400).json({
        status: "error",
        msg: "No account with given location",
      });
    }

    // extracting zip
    if (req.files?.zip?.length > 0) {
      const zipPath = req.files.zip[0].path;
      // console.log("zipPath", zipPath);
      const extractedPath = path.join(
        __dirname,
        "..",
        "static",
        "extracted-images"
      );
      const destinationPath = path.join(__dirname, "..", "static", "images");
      // console.log(__dirname);
      await fileUtils.extractZipAndCompressImages(
        zipPath,
        extractedPath,
        destinationPath
      );
      // removing zip for saving space
      fs.rmSync(zipPath, { recursive: true, force: true });
    }
    

    // parsing csv
    const csvPath = req.files?.csv[0].path;
    const data = await csvtojson().fromFile(csvPath);
    await Player.deleteMany({ accountId: { $in: accounts } });
    const errors = [];

    // adding player from csv data
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      let {
        name,
        email,
        account,
        // skill,
        level,
        rating,
        gender,
        phoneNumber,
        imageUrl,
      } = row;

      try {
        rating = parseInt(rating);
      } catch {
        errors.push({ msg: "rating is not integer", row: row });
        continue;
      }

      if (!account) {
        errors.push({ msg: "account not provided", row });
        continue;
      }

      if (!name) {
        errors.push({ msg: "name not provided", row });
        continue;
      }

      if (!["Man", "Woman"].includes(gender)) {
        errors.push({ msg: "gender is invalid (should be Male/Female)", row });
      }

      // if (!['Bowler', 'Batsman', 'All Rounder'].includes(skill)) {
      //   errors.push({
      //     msg: 'skill is invalid (should be Bowler/Batsman/All Rounder)',
      //     row,
      //   })
      // }

      const accountData = await Account.findOne({
        name: account,
        _id: { $in: accounts },
      });

      // if (!accountData) {
      //   errors.push({ msg: 'account does not exist for given location', row })
      //   continue
      // }

      // let imageUrl;
      const splits = imageUrl ? imageUrl.split("/") : [];
      // console.log(splits);
      const filename = splits.length > 0 ? splits[splits.length - 1] : null;
      // console.log(filename);
      if (filename) {
        imageUrl = "../static/images/" + decodeURI(filename);
      }
      // console.log(imageUrl)
      try {
        const player = new Player({
          name,
          email,
          // accountId:id,
          gender,
          // skill,
          level,
          rating,
          phoneNumber,
          imageUrl,
          auctionStatus: null,
        });
        // console.log(player);
        await player.save();
      } catch (err) {
        console.log(err.message);
        errors.push({ msg: "error while adding to database", row });
      }
    }

    if (errors?.length > 0) {
      return res.status(400).json({
        status: "error",
        msg: "there are errors while adding some players",
        errors,
      });
    } else {
      return res.status(200).json({
        status: "ok",
        msg: "all players imported",
      });
    }
  } catch (err) {
    console.log("err", err);
    return res.status(500).json({
      status: "error",
      msg: err.message,
    });
  }
};

exports.exportPlayersInCsv = async (req, res, next) => {
  const filePath = path.join(__dirname, "../", "static", "players.csv");

  const { location } = req.query;
  Account.find({ location })
    .lean()
    .then((accounts) => {
      const accountIds = accounts.map((account) => account._id.toString());
      Player.find({ accountId: { $in: accountIds } })
        .populate("teamId accountId")
        .lean()
        .then((players) => {
          const header = [
            { id: "email", title: "email" },
            { id: "name", title: "name" },
            { id: "account", title: "account" },
            // { id: 'skill', title: 'skill' },
            { id: "level", title: "level" },
            { id: "rating", title: "rating" },
            { id: "gender", title: "gender" },
            { id: "phoneNumber", title: "phoneNumber" },
            { id: "team", title: "team" },
            { id: "isCaptain", title: "isCaptain" },
            { id: "auctionStatus", title: "auctionStatus" },
            { id: "image", title: "image" },
          ];
          const data = players.map((player) => {
            return {
              name: player.name ? player.name : "",
              email: player.email ? player.email : "",
              gender: player.gender ? player.gender : "",
              phoneNumber: player.phoneNumber ? player.phoneNumber : "",
              account: player.accountId ? player.accountId.name : "",
              team: player.teamId ? player.teamId.name : "",
              isCaptain: player.isCaptain ? "YES" : "",
              auctionStatus: player.auctionStatus ? player.auctionStatus : "",
              // skill: player.skill ? player.skill : '',
              level: player.level ? player.level : "",
              rating: player.rating ? player.rating : "",
              image: player.imageUrl ? player.imageUrl : "",
            };
          });

          const csvWriter = createCsvWriter({
            path: filePath,
            header: header,
          });
          return csvWriter.writeRecords(data);
        })
        .then(() => {
          res.setHeader("Content-Type", "text/csv");
          res.setHeader(
            "Content-Disposition",
            'attachment; filename="players.csv"'
          );
          res.download(filePath);
        })
        .catch((err) => {
          next(err);
        });
    });
};

exports.addAccount = (req, res, next) => {
  const { name, totalCount, location } = req.body;
  if (!name || !location)
    return res.status(400).json({
      status: "error",
      msg: "Insufficient data",
    });

  let imageUrl;
  if (req.files?.image) {
    imageUrl = req.files.image[0].path;
  }

  const account = new Account({
    name,
    totalCount,
    location,
    imageUrl,
  });
  account
    .save()
    .then((account) => {
      return res.status(200).json({
        status: "ok",
        msg: "account added",
        account: account,
      });
    })
    .catch((err) => {
      next(err);
    });
};

exports.editAccount = (req, res, next) => {
  const { accountId, name, totalCount, location } = req.body;
  if (!name || !location) {
    return res.status(400).json({
      status: "error",
      msg: "Insufficient data",
    });
  }
  Account.findById(accountId)
    .then((account) => {
      account.name = name;
      account.totalCount = totalCount;
      account.location = location;
      if (req.files?.image) {
        account.imageUrl = req.files.image[0].path;
      }
      return account.save();
    })
    .then((account) => {
      return res.status(200).json({
        status: "ok",
        msg: "account edited",
        account: account,
      });
    })
    .catch((err) => {
      next(err);
    });
};

exports.deleteAccount = (req, res, next) => {
  const { accountId } = req.params;
  Account.findByIdAndDelete(accountId)
    .then((account) => {
      if (!account) {
        return res.status(400).json({
          status: "error",
          msg: "account not found",
        });
      }
      return Promise.all([
        Player.deleteMany({ accountId: account._id }),
        Team.deleteMany({ accountId: account._id }),
      ]).then(() => {
        return res.status(200).json({
          status: "ok",
          msg: "account deleted",
          account: account,
        });
      });
    })
    .catch((err) => {
      next(err);
    });
};

exports.addTeam = (req, res, next) => {
  const { name, accountId } = req.body;
  if (!name)
    return res.status(400).json({ status: "error", msg: "Insufficient data" });

  // else add the team
  let imageUrl;
  if (req.files?.image) {
    imageUrl = req.files.image[0].path;
  }
  const team = new Team({
    name,
    accountId,
    imageUrl,
  });

  team
    .save()
    .then((team) => {
      return res.status(200).json({
        status: "ok",
        msg: "team added",
        team: team,
      });
    })
    .catch((err) => {
      next(err);
    });
};

exports.editTeam = (req, res, next) => {
  const { teamId, name, accountId } = req.body;
  Team.findById(teamId)
    .then((team) => {
      team.name = name;
      team.accountId = accountId;
      if (req.files?.image) {
        team.imageUrl = req.files.image[0].path;
      }
      return team.save();
    })
    .then((team) => {
      return res.status(200).json({
        status: "ok",
        msg: "team edited",
        team: team,
      });
    })
    .catch((err) => {
      next(err);
    });
};

exports.deleteTeam = (req, res, next) => {
  const { teamId } = req.params;
  Team.findByIdAndDelete(teamId)
    .then((team) => {
      if (!team) {
        return res.status(400).json({
          status: "error",
          msg: "team not found",
        });
      }
      if (team.teamOwner) {
        const playerId = team.teamOwner.playerId;
        const userId = team.teamOwner.userId;
        return Promise.all([
          Player.findByIdAndUpdate(playerId, {
            auctionStatus: null,
            teamId: null,
          }),
          User.findByIdAndDelete(userId),
        ]).then(([player, user]) => {
          return res.status(200).json({
            status: "ok",
            msg: "user and team deleted",
            team: team,
            player: player,
            user: user,
          });
        });
      } else {
        return res.status(200).json({
          status: "ok",
          msg: "team deleted",
          team: team,
        });
      }
    })
    .catch((err) => {
      next(err);
    });
};

exports.setTeamOwner = async (req, res, next) => {
  try {
    const { teamId, playerId, email, password, budget, isPlaying } = req.body;
    if (!teamId) {
      return res.status(400).json({
        status: "error",
        msg: "TeamId not provided",
      });
    }
    if (playerId && (!email || !password || !budget)) {
      return res.status(400).json({
        status: "error",
        msg: "Insufficient data",
      });
    }

    // fetch team
    const team = await Team.findById(teamId);
    if (!team)
      return res.status(400).json({
        status: "error",
        msg: "Team not present",
      });

    // if playerId is empty then unassign teamOwner, delete user and update player
    if (!playerId) {
      const userId = team.teamOwner?.userId;
      const playerId = team.teamOwner?.playerId;
      const user = await User.findByIdAndDelete(userId);
      const player = await Player.findByIdAndUpdate(playerId, {
        auctionStatus: null,
        teamId: null,
      });
      team.teamOwner = null;
      await team.save();
      return res.status(200).json({
        status: "ok",
        msg: "Team owner removed and corresponding user deleted",
        deletedUser: user,
        updatedPlayer: player,
      });
    }

    // fetch player
    const player = await Player.findById(playerId);
    if (!player)
      return res.status(400).json({
        status: "error",
        msg: "Player not present",
      });

    // create hashed password
    const hashedPassword = await bcryptjs.hash(password, 12);

    let updatedUser;
    // if team-owner is present then delink the player as owner and update the existing user account
    if (team.teamOwner) {
      const userId = team.teamOwner.userId;
      const prevPlayerId = team.teamOwner.playerId;
      if (prevPlayerId) {
        await Player.findByIdAndUpdate(prevPlayerId, {
          auctionStatus: null,
          teamId: null,
        });
      }
      if (userId) {
        updatedUser = await User.findByIdAndUpdate(userId, {
          email: email,
          password: hashedPassword,
          role: "owner",
        });
      }
    }
    // if team-owner is not present then create a new user
    else {
      updatedUser = new User({
        email: email,
        password: hashedPassword,
        role: "owner",
      });
      await updatedUser.save();
    }

    // set the teamowner of team
    team.teamOwner = {
      userId: updatedUser ? updatedUser._id : null,
      playerId: playerId,
      budget: budget,
      isPlaying: isPlaying && isPlaying === "true" ? true : false,
    };
    await team.save();

    // link the player as team owner and assign team to him
    player.teamId = teamId;
    player.auctionStatus = "OWNER";
    await player.save();

    // return the response
    return res.status(200).json({
      status: "ok",
      msg: "team owner updated",
      team: team,
      player: player,
      user: updatedUser,
    });
  } catch (err) {
    next(err);
  }
};

exports.addUser = (req, res, next) => {
  const { email, password, role, name } = req.body;
  // check if user exists
  User.findOne({ email })
    .then((user) => {
      if (user) {
        return res.status(400).json({
          status: "error",
          msg: "User exists",
          existingUser: {
            email: user.email,
            name: user.name,
            role: user.role,
          },
        });
      }
      // create new user
      const newUser = new User({
        name: name,
        email: email,
        role: role,
      });
      return bcryptjs.hash(password, 12).then((hashedPassword) => {
        newUser.password = hashedPassword;
        return newUser.save();
      });
    })
    .then((user) => {
      res.status(200).json({
        status: "ok",
        msg: "User created",
        user: user,
      });
    })
    .catch((err) => {
      next(err);
    });
};

exports.resetAuctionData = async (req, res, next) => {
  try {
    const { accountId } = req.body;
    if (!accountId) {
      return res.status(400).json({
        status: "error",
        msg: "accountId not provided",
      });
    }
    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(400).json({
        status: "error",
        msg: "account does not exist",
      });
    }
    account.isAuctioned = false;
    await account.save();
    await Player.updateMany(
      { accountId, auctionStatus: { $ne: "OWNER" } },
      { teamId: null, lastBid: null, auctionStatus: null }
    );
    const teams = await Team.find({ accountId }).lean();
    const teamIds = teams.map((team) => team._id.toString());
    await Bid.deleteMany({ teamId: { $in: teamIds } });
    return res.status(200).json({
      status: "ok",
      msg: `auction data reset for ${account.name} completed`,
    });
  } catch (err) {
    next(err);
  }
};