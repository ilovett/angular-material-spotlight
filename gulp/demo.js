'use strict';

var gulp = require('gulp');
var webserver = require('gulp-webserver');

gulp.task('webserver', function() {
  return gulp.src(['demo', 'bower_components', 'dist'])
    .pipe(webserver({
      host: 'localhost',
      port: 9000,
      fallback: 'index.html'
    }));
});
