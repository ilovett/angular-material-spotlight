'use strict';

const browserify = require('browserify');
const buffer = require('vinyl-buffer');
const gulp = require('gulp');
const gutil = require('gulp-util');
const notify = require('gulp-notify');
const rename = require('gulp-rename');
const sass = require('gulp-sass');
const size = require('gulp-check-filesize');
const source = require('vinyl-source-stream');
const sourcemaps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify');

/**
 * Compile all sass styles into a single bundle.
 */
gulp.task('styles', function() {

  return gulp.src('./src/md-spotlight.scss')
    .pipe(rename({ extname: '.css' }))
    .pipe(sourcemaps.init())
      .pipe(sass({
        outputStyle: 'compressed'
      })
      .on('error', sass.logError))
    .pipe(sourcemaps.write('./'))
    .pipe(size({ enableGzip: true }))
    .pipe(gulp.dest('dist'))
    .pipe(notify({ message: 'md-spotlight.scss compile finished', onLast: true }));

});

/**
 * Compile all component lib javascript code (including templates) into a single bundle.
 */
gulp.task('scripts', function() {

  const bundleName = 'md-spotlight.js';

  const bundler = browserify({
    entries: ['./src/md-spotlight.js'],
    debug: true,
    cache: {},
    packageCache: {},
    plugin: ['watchify'],
  });

  bundler.transform('babelify', {
    presets: ['es2015']
  });

  // listen for an update and run rebundle
  bundler.on('update', function() {
    rebundle();
    gutil.log('watchify bundle triggered');
  });

  function rebundle() {
    return bundler.bundle()
      .on('error', function(err) {
        gutil.log(gutil.colors.red('Browserify Error:\n'), err);

        notify.onError({
          title: 'Browserify Error',
          sound: 'Basso',
          message: `Unable to compile ${bundleName}`
        }).apply(this, arguments);

        this.emit('end');
      })
      .pipe(source(bundleName))
      .pipe(buffer())
      .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(sourcemaps.write('./')) // write to map file instead of baking in
      .pipe(size({ enableGzip: true }))
      .pipe(gulp.dest('dist'))
      .pipe(notify({
        title: 'Browserify',
        message: `${bundleName} compile finished`,
        sound: 'Hero',
        onLast: true
      }));
  }

  return rebundle();

});

/**
 * Build library and watch for changes.
 */
gulp.task('build', ['scripts', 'styles'], function() {

  gulp.watch('src/**/*.scss', ['styles']).on('change', function() {
    gutil.log(gutil.colors.green('Templates Rebundled'));
  });

});
