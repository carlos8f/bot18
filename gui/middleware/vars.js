var requestIp = require('request-ip')

module.exports = function container (get, set) {
  return function handler (req, res, next) {
    res.vars.title = get('conf.site.title')
    res.vars.post = req.body
    res.vars.user = req.user
    res.vars.messages = []
    res.vars.user = req.user
    res.vars.user_email = req.user ? req.user.email : ''
    if (req.user) {
      var set = {
        last_access: new Date().getTime(),
        last_access_url: req.url,
        last_access_method: req.method,
        last_access_ip: requestIp.getClientIp(req)
      }
      if (req.headers['user-agent']) {
        set.last_access_agent = req.headers['user-agent']
      }
      get('db.mongo.db').collection('users').updateOne({_id: req.user.id}, {$set: set})
    }
    next()
  }
}