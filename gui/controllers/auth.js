var bcryptjs = require('bcryptjs')
var uuid = require('../lib/uuid')
var isEmail = require('isemail').validate
var pwTester = require('owasp-password-strength-test')

module.exports = function container (get, set) {
  return get('controller')()
    .post('/login', function (req, res, next) {
      if (req.user) return res.redirect('/')
      if (!req.body.email) {
        req.error('E-mail is required.')
      }
      else if (!isEmail(req.body.email)) {
        req.error('E-mail is invalid.')
      }
      if (!req.body.password) {
        req.error('Password is required.')
      }
      if (req.inputError) {
        return next()
      }
      get('db.users').select({query: {email: req.body.email.toLowerCase()}}, function (err, users) {
        if (err) {
          req.error('Unexpected server error while processing your request (error code: LLAMA). Please try again.')
          return next()
        }
        var user = users.pop()
        if (!user) {
          req.error('E-mail not found.')
          return next()
        }
        else {
          bcryptjs.compare(req.body.password, user.password, function (err, passwordOk) {
            if (err) {
              req.error('Unexpected server error while processing your request (error code: PIGGY). Please try again.')
              return next()
            }
            if (passwordOk) {
              req.success('Welcome back, ' + user.username + '!')
              req.login(user)
              return res.redirect('/dashboard')
            }
            else {
              req.error('Bad password.')
            }
            return next()
          })
        }
      })
    })
    .add('/login', function (req, res, next) {
      if (req.user) return res.redirect('/dashboard')
      res.vars.is_login = true
      res.vars.title = 'Log In - ' + res.vars.title
      res.render('auth/login')
    })
    .post('/register', function (req, res, next) {
      var user = {
        id: uuid(),
        email: (req.body.email || '').trim().toLowerCase(),
        username: (req.body.username || '').trim(),
        username_lc: (req.body.username || '').trim().toLowerCase(),
        time_registered: new Date().getTime(),
        remote_ip: req.addr,
        last_access: new Date().getTime(),
        last_access_url: req.url,
        last_access_agent: req.headers['user-agent'],
        last_access_method: req.method,
        last_access_ip: req.addr
      }
      if (!req.body.email) {
        req.error('E-mail required.')
      }
      else if (!isEmail(req.body.email)) {
        req.error('E-mail not valid.')
      }
      if (!req.body.username) {
        req.error('Username required.')
      }
      else if (!req.body.username.match(/^[A-Za-z]{1}[A-Za-z0-9_-]{2,}$/)) {
        req.error('Username must consist of: A-Z, a-z, 0-9, dashes, underscores, at least 3 characters, starting with a letter.')
      }
      else if (req.body.username.length > 29) {
        req.error('Username needs to be shorter, < 30 chars.')
      }
      if (!req.body.password) {
        req.error('Password required.')
      }
      else if (req.body.password !== req.body.password2) {
        req.error('Password confirmed incorrectly.')
      }
      else {
        var password_info = pwTester.test(req.body.password)
        if (password_info.requiredTestErrors.length) {
          password_info.requiredTestErrors.forEach(function (text) {
            req.error(text)
          })
        }
      }
      if (req.inputError) {
        return next()
      }
      get('db.users').select({query: {email: user.email}}, function (err, already_registered) {
        if (err) {
          req.error('Unexpected server error while processing your request  (error code: PONY). Please try again.')
          return next()
        }
        if (already_registered[0]) {
          req.error('E-mail already registered.')
          return next()
        }
        get('db.users').select({query: {username_lc: user.username_lc}}, function (err, already_registered) {
          if (err) {
            req.error('Unexpected server error while processing your request (error code: KIWI). Please try again.')
            return next()
          }
          if (already_registered[0]) {
            req.error('Username already registered.')
            return next()
          }
          bcryptjs.hash(req.body.password, get('conf.auth.strength'), function (err, hash) {
            if (err) return next(err)
            user.password = hash
            get('db.users').save(user, function (err, user) {
              if (err) {
                req.error('Unexpected server error while processing your request (error code: APE). Please try again.')
                return next()
              }
              req.login(user)
              req.success('Your account was created! Congrats!')
              res.redirect('/dashboard')
            })
          })
        })
      })
    })
    .add('/register', function (req, res, next) {
      if (req.user) return res.redirect('/dashboard')
      res.vars.is_register = true
      res.vars.title = 'Register - ' + res.vars.title
      res.render('auth/register')
    })
    .get('/logout', function (req, res, next) {
      // @todo: check csrf token
      req.logout()
      res.redirect('/')
    })
}