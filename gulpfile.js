/* jshint -W097 */
'use strict';
var gulp = require('gulp');
var source = require('vinyl-source-stream');
var browserify = require('browserify');
var babel = require('gulp-babel');
var webserver = require('gulp-webserver');
var mochaPhantomjs = require('gulp-mocha-phantomjs');
var mocha = require('gulp-mocha');
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');

gulp.task('default', ['copy-test-harness', 'webserver', 'watch']);

/**
 * Compile using babel
 */

gulp.task('babel-hypodermic', function () {

  return gulp.src('src/hypodermic.js')
    .pipe(babel({optional: ["selfContained"]}))
    .pipe(gulp.dest('./dist/'));
});

/**
 * Compile test script using browserify
 */

gulp.task('browserify-tests', ['babel-hypodermic'], function () {
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
gulp.task('mocha-test', ['lint', 'browserify-tests'], function () {
  return gulp.src('./test/index.js')
    .pipe(mocha());
});

/**
 * lint js source files
 */
 gulp.task('lint', function() {
   return gulp.src(['src/**/*.js', 'test/**/*.js', '!test/testBundle.js'])
   .pipe(jshint())
   .pipe(jshint.reporter(stylish));
 });

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
});
