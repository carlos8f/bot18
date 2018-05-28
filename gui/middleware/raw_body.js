module.exports = function container (get, set) {
  // 2mb
  var raw_body_limit = 1000 * 1000 * 2
  return function handler (req, res, next) {
    var buf = []
    var total_length = 0
    req.on('data', function (d) {
      total_length += d.length
      if (total_length < raw_body_limit) {
        buf.push(d)
      }
    })
    req.on('end', function () {
      req.raw_body = Buffer.concat(buf)
      req.raw_body_str = req.raw_body.toString('utf8')
    })
    next()
  }
}