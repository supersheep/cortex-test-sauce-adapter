var Cloud = require('mocha-cloud');
var http = require('http');
var express = require('express');
var cheerio = require('cheerio');
var fs = require('fs');
var path = require('path');
var async = require('async');
var request = require('request');
var util = require('util');
var events = require('events');
util.inherits(Runner, events.EventEmitter);

function die(message){
  console.error(message);
  console.log('syntax: cortex test '
      +'--mode sauce --sauce_user=<username> '
      +'--sauce_secret <access_key> '
      +'--browser [<os>.]<long_name>@<short_version|short_version>[,<another browser>,...]')
  process.exit(1);
}

function Runner(config) {
  this.config = config;
}

Runner.prototype.run = function(){
  var self = this;
  self.emit('log','fetching available browsers...')
  request("http://saucelabs.com/rest/v1/info/browsers",function(error, response, body){
    self.available_browsers = JSON.parse(body);
    self.runUrl(self.config.url);
  });
  return this;
}

Runner.prototype.matchBrowser = function(browser){
  var splited = browser.split("@");
  var platform = splited[0];
  var version = splited[1];
  var platform_detail = platform.split(".");
  var result = [];
  var long_name,os;
  if(platform_detail.length == 2){
    os = platform_detail[0];
    long_name = platform_detail[1];
  }else{
    long_name = platform_detail[0];
  }

  if(!this.available_browsers){return result;}
  var result = this.available_browsers.filter(function(browser){
      return (browser.short_version == version || browser.long_version == version)
        && browser.long_name.toLowerCase().match(long_name)
        && (os ? browser.os.toLowerCase().match(os.toLowserCase()) : true)
    });
  if(!result.length){
    die("no browser found for " + browser);
  }
  return result[0];
}

Runner.prototype.runUrl = function(url, browsers) {
  var self = this;
  var config = this.config;
  var logs = [];

  if(!config.sauce_user){
    die('missing param <sauce_user>');
  }

  if(!config.sauce_secret){
    die('missing param <sauce_secret>');
  }

  if(!config.browser){
    die('missing param <browser>. see all browsers: http://saucelabs.com/rest/v1/info/browsers');
  }
  var cloud = new Cloud(config.app, config.sauce_user, config.sauce_secret);

  config.browser.split(",").forEach(function(browser){
    browser = self.matchBrowser(browser);
    cloud.browser(browser.long_name, browser.long_version, browser.os);    
  });

  cloud.url(url);

  cloud.on('init', function(browser) {
    self.emit('log',util.format('init %s %s', browser.browserName, browser.version));
  });

  cloud.on('start', function(browser) {
    self.emit('log',util.format('start %s %s', browser.browserName, browser.version));
  });

  cloud.on('end', function(browser, res) {
    var result = {
      browser: {
        name: browser.browserName,
        os: browser.platform,
        version: browser.version
      },
      data: {
        logs: logs,
        passes: res.passes,
        failures: res.failures
      }
    };
    self.emit("done", result);
  });

  cloud.start(function() {
    self.emit("complete");
  });
};

module.exports = Runner;