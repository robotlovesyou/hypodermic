/* jshint -W097 */
/* global require: true */
'use strict';
var gulp = require('gulp');
var source = require('vinyl-source-stream');
var browserify = require('browserify');
var webserver = require('gulp-webserver');
var mochaPhantomjs = require('gulp-mocha-phantomjs');
var mocha = require('gulp-mocha');

/**
 * Pipe errors to the console but do not stop gulp
 * @param {object} error [the error]
 */
function swallowError (error) {

  //If you want details of the error in the console
  console.log(error.toString());

  this.emit('end');
}

gulp.task('default', ['copy-test-harness', 'webserver', 'watch']);

/**
 * Compile for the browser using browserify
 */

gulp.task('browserify-hypodermic', function () {

  return browserify('./src/hypodermic.js')
    .bundle()
    .pipe(source('hypodermic.js'))
    .pipe(gulp.dest('./dist/'));
});

/**
 * Compile test script using browserify
 */

gulp.task('browserify-tests', function () {
  return browserify('./test/index.js', {debug: true})
    .bundle()
    .pipe(source('testBundle.js'))
    .pipe(gulp.dest('./dist/'));
});


/**
 * Watch for changes to the source. Run tests
 */

gulp.task('watch', ['browser-test'], function () {
  gulp.watch('src/**/*.js', ['browser-test']);
  gulp.watch('test/**/*.js', ['browser-test']);
});

/**
 * Run a local web server for the browser tests
 */

gulp.task('webserver', function() {
  gulp.src(['dist', 'node_modules/mocha'])
  .pipe(webserver());
});

/**
 * run tests in a browser
 */
gulp.task('browser-test', ['mocha-test'], function () {
  var stream = mochaPhantomjs();
  stream.write({path: 'http://localhost:8000/index.html'});
  stream.end();
  return stream;
});

/**
 * run tests directly in mocha
 */
gulp.task('mocha-test', ['browserify-hypodermic', 'browserify-tests'], function () {
  return gulp.src('./test/index.js')
    .pipe(mocha());
})

/**
 * copy a file from/to
 */
function copy(from, to) {
  return gulp.src(from)
    .pipe(gulp.dest(to));
}

/**
 * Copy the test index.html
 */
gulp.task('copy-test-harness', function () {
  return copy('./test/index.html', './dist/index.html');
})
