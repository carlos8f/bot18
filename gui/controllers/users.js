var moment = require('moment')
var async = require('async')

module.exports = function container (get, set) {
  return get('controller')()
    .get('/users', function (req, res, next) {
      res.vars.users = []
      get('db.users').select({query: {}, sort: {time_registered: -1}}, function (err, users) {
        if (err) {
          req.error('Unexpected server error while processing your request (error code: UGH). Please try again.')
          return next()
        }
        // preserve sort order and async load stats
        var user_map = {}
        var tasks = users.map(function (user) {
          return function (cb) {
            user.signup_date = moment(user.time_registered).format('ll')
            user_map[user.id] = user
            cb()
          }
        })
        async.parallel(tasks, function (err) {
          if (err) {
            req.error('Unexpected server error while processing your request (error code: SATOSHI). Please try again.')
            return next()
          }
          res.vars.users = users.map(function (user) {
            return user_map[user.id]
          })
          res.vars.is_users = true
          res.render('users/list')
        })
      })
    })
}