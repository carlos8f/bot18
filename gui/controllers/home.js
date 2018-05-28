module.exports = function container (get, set) {
  return get('controller')()
    .get('/', function (req, res, next) {
      res.vars.is_home = true
      res.render('home')
    })
}