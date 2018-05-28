var http = require('http')

module.exports = function container (get, set) {
  return function handler (req, res, next) {
    res.redirect = (function (toUrl) {
      var req = this.req
        , head = 'HEAD' == req.method
        , status = 302
        , body;

      // allow status / toUrl
      if (2 == arguments.length) {
        if ('number' == typeof toUrl) {
          status = toUrl;
          toUrl = arguments[1];
        } else {
          status = arguments[1];
        }
      }

      // Support text/{plain,html} by default
      this.format({
        'text/plain': function(){
          body = http.STATUS_CODES[status] + '. Redirecting to ' + toUrl;
        },

        'text/html': function(){
          var u = encodeURIComponent(toUrl);
          body = '<p>' + http.STATUS_CODES[status] + '. Redirecting to <a href="' + u + '">' + u + '</a></p>';
        },

        default: function(){
          body = '';
        }
      });

      // Respond
      this.status(status);
      this.set('Location', toUrl);
      this.set('Content-Length', Buffer.byteLength(body));
      this.end(head ? null : body);
    }).bind(res)
    next()
  }
}