module.exports = {
  // meta
  _ns: 'motley',

  // named middleware
  'middleware.flash': require('./flash'),
  'middleware.raw_body': require('./raw_body'),
  'middleware.redirect': require('./redirect'),
  'middleware.vars': require('./vars'),

  // special weight for raw body
  'middleware[-20]': [
    '#middleware.raw_body',
  ],

  // register handlers with weights
  'middleware[]': [
    '#middleware.flash',
    '#middleware.redirect',
    '#middleware.vars'
  ]
}