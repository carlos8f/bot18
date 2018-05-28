var uuid = require('../lib/uuid')

module.exports = function container (get, set) {
  return get('controller')()
    .post('/webhooks/test', function (req, res, next) {
      var webhook = req.body
      if (webhook.id) {
        webhook.posted_id = webhook.id
      }
      webhook.is_verified = false
      webhook.id = uuid()
      webhook.time = new Date().getTime()
      webhook.type = 'test'
      webhook.signature = '__test__'
      webhook.status = 'test:testing'
      saveWebhook()

      function saveWebhook () {
        get('db.webhooks').save(webhook, function (err, saved) {
          if (err) return res.renderStatus(500)
          return res.renderStatus(200)
        })
      }
    })
}