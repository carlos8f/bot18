module.exports = function container (get, set) {
  return function handler (req, res, next) {
    res.vars.title = get('conf.site.title')
    res.vars.post = req.body
    res.vars.user = req.user
    res.vars.messages = []
    res.vars.user = req.user
    res.vars.user_email = req.user ? req.user.email : ''
    next()
  }
}