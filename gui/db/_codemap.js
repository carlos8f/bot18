module.exports = {
  // meta
  _ns: 'motley',
  _folder: 'db',

  // named collections
  'users': require('./users'),
  'webhooks': require('./webhooks'),

  // collection registration
  'collections[]': [
    '#db.users',
    '#db.webhooks'
    // add more collections here.
  ]
}