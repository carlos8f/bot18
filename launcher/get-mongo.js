var bot18 = global.BOT18

/*
  lib.getMongo(cb)

  - If conf.mongo.enabled=true, attaches a connected MongoDB client to bot18.mongo_client
  - Attaches a ref to the MongoDB db to bot18.db
*/

module.exports = function getMongo (cb) {
  var mongo_conf = bot18.conf.mongo
  if (mongo_conf && mongo_conf.enabled) {
    var auth_str = '', auth_mechanism
    if (mongo_conf.username) {
      auth_str = encodeURIComponent(mongo_conf.username)
      if (mongo_conf.password) auth_str += ':' + encodeURIComponent(mongo_conf.password)
      auth_str += '@'
      auth_mechanism = mongo_conf.auth_mechanism || 'DEFAULT'
    }
    var connection_str
    if (mongo_conf.connection_str) {
      connectionString = mongo_conf.connectionString
    }
    else {
      connection_str = 'mongodb://' + auth_str + mongo_conf.host + ':' + mongo_conf.port + '/?' +
        (mongo_conf.replica_set ? '&replicaSet=' + mongo_conf.replica_set : '' ) +
        (auth_mechanism ? '&authMechanism=' + auth_mechanism : '' )
    }
    require('mongodb').MongoClient.connect(connection_str, function (err, client) {
      if (err) {
        console.error(('Failed to connect to MongoDB. Check your bot18.config.js and try again.').red)
      }
      bot18.mongo_client = client
      bot18.db = client.db(mongo_conf.db)
      cb()
    })
  }
  else {
    cb()
  }
}