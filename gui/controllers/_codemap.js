module.exports = {
  // meta
  _ns: 'motley',

  'controllers[]': [
    require('./auth'),
    require('./dashboard'),
    require('./home'),
    require('./users'),
    require('./webhooks')
  ]
}