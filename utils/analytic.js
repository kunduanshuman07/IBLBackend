const Analytic = require('../models/analytic')
const { snapshot } = require('../database/analytic-db')

exports.updateStatistics = async () => {
  const currentDate = new Date().toDateString()
  let lastAnalytic = await Analytic.findOne({}).sort('-date')
  try {
    let currentAnalytic
    // no data stored in database then store current snapshot
    if (!lastAnalytic) {
      currentAnalytic = new Analytic({
        date: currentDate,
        mobileVisitors: snapshot.mobileVisitors,
        desktopVisitors: snapshot.desktopVisitors,
        views: snapshot.views,
      })
    }
    // no data stored for current day then add current snapshot to last analytic
    else if (lastAnalytic.date.toDateString() !== currentDate) {
      currentAnalytic = new Analytic({
        date: currentDate,
        mobileVisitors: lastAnalytic.mobileVisitors + snapshot.mobileVisitors,
        desktopVisitors:
          lastAnalytic.desktopVisitors + snapshot.desktopVisitors,
        views: lastAnalytic.views + snapshot.views,
      })
    }
    // if data stored for current day then add current snapshot to second last analytic
    else {
      currentAnalytic = lastAnalytic
      const secondLastAnalytic = await Analytic.findOne({})
        .sort('-date')
        .skip(1)
      if (secondLastAnalytic) {
        currentAnalytic.mobileVisitors =
          secondLastAnalytic.mobileVisitors + snapshot.mobileVisitors
        currentAnalytic.desktopVisitors =
          secondLastAnalytic.desktopVisitors + snapshot.desktopVisitors
        currentAnalytic.views = secondLastAnalytic.views + snapshot.views
      } else {
        currentAnalytic.mobileVisitors = snapshot.mobileVisitors
        currentAnalytic.desktopVisitors = snapshot.desktopVisitors
        currentAnalytic.views = snapshot.views
      }
    }
    await currentAnalytic.save()
  } catch (err) {
    console.log('__error_while_updating_statistics__\n', err)
  }
}
// 
