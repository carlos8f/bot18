module.exports = function container (get, set) {
  return function handler (req, res, next) {
    res.flash = function (message, type) {
      if (!req.session.messages) {
        req.session.messages = []
      }
      req.session.messages.push({
        text: message,
        type: type || 'success'
      })
      if (type === 'error') {
        req.inputError = true
      }
    }
    req.error = function (text) {
      res.flash(text, 'error')
    }
    req.success = function (text) {
      res.flash(text, 'success')
    }
    var _render = res.render
    res.render = function () {
      res.vars.messages = req.session.messages
      delete req.session.messages
      _render.apply(res, [].slice.call(arguments))
    }
    next()
  }
}