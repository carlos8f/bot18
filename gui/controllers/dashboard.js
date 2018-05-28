module.exports = function container (get, set) {
  return get('controller')()
    .get('/dashboard', function (req, res, next) {
      res.vars.is_dashboard = true
      res.render('dashboard/index')
    })
}