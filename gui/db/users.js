module.exports = function container (get, set) {
  get('db.mongo.db').collection('users').createIndexes([
    {
      key: {
        email: 1
      },
      name: 'email',
      unique: true
    }
  ])
  return get('db.createCollection')('users', {
    load: function (obj, opts, cb) {
      // respond after the obj is loaded
      cb(null, obj);
    },
    save: function (obj, opts, cb) {
      // respond before the obj is saved
      cb(null, obj);
    },
    afterSave: function (obj, opts, cb) {
      // respond after the obj is saved
      cb(null, obj);
    },
    destroy: function (obj, opts, cb) {
      // respond after the obj is destroyed
      cb(null, obj)
    }
  })
}