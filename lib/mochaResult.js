/**
 * This script is used to inject to the generated page,
 * expose `mochaResult` to `window` so that Selenium or WebDriver can get it.
 */
(function() {
  var failures = [];
  var passes = [];
  window._mochaResult = function(runner) {
    runner.on('fail', function(test, err) {
      failures.push({
        title: test.title,
        fullTitle: test.fullTitle(),
        err: {
          message: err.message,
          stack: err.stack
        }
      });
    });

    runner.on('pass', function(test) {
      passes.push({
        title: test.title,
        fullTitle: test.fullTitle(),
        duration: test.duration
      })
    });

    runner.on('end', function() {
      runner.stats.failures = failures;
      runner.stats.passes = passes;
      window.mochaResults = runner.stats;
    });
  }
})();