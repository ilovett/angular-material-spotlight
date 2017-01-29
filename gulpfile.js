'use strict';

var gulp = require('gulp');

// import all tasks in `gulp` folder
require('require-dir')('./gulp', { recurse: true });

gulp.task('default', ['build']);
