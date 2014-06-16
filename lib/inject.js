var cheerio = require('cheerio');
var fs = require('fs');
var path = require('path');

module.exports = function(content, callback){
  fs.readFile(path.join(__dirname, 'mochaResult.js'), 'utf8', function(err, inject) {
    if (err) {
      return callback(err);
    }
    
    var $ = cheerio.load(content);
    $('head').append('<script>' + inject + '</script>');
    var html = $.html();
    html = html.replace("mocha.run()", "_mochaResult(mocha.run())");
    callback(null, html);
  });
};