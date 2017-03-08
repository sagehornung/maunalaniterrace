var gulp = require('gulp');
var sass = require('gulp-sass');
var browserSync = require('browser-sync').create();
var useref = require('gulp-useref');
var uglify = require('gulp-uglify');
var gulpIf = require('gulp-if');
var cssnano = require('gulp-cssnano');
var imagemin = require('gulp-imagemin');
var cache = require('gulp-cache');
var del = require('del');
var runSequence = require('run-sequence');
var nodemon = require('gulp-nodemon');
var jshint = require('gulp-jshint');
var nunjucksRender = require('gulp-nunjucks-render');



gulp.task('nunjucks', function() {
    // Gets .html and .nunjucks files in pages
    return gulp.src('app/pages/**/*.+(html|nunjucks)')
    // Renders template with nunjucks
        .pipe(nunjucksRender({
            path: ['app/templates']
        }))
        // output files in app folder
        .pipe(gulp.dest('app'))
        .pipe(browserSync.reload({
            stream: true
        }))
});

gulp.task('sass', function(){
    return gulp.src('app/scss/**/*.scss')
        .pipe(sass()) // Converts Sass to CSS with gulp-sass
        .pipe(gulp.dest('app/css'))
        .pipe(browserSync.reload({
            stream: true
        }))
});

gulp.task('watch', ['browserSync', 'sass'], function (){
    gulp.watch('app/scss/**/*.scss', ['sass']);
    gulp.watch('app/**/*nunjucks', ['nunjucks'])
    gulp.watch('app/*.html', browserSync.reload);
});

gulp.task('browserSync', function() {
    browserSync.init({
        server: {
            baseDir: 'app'
        },
    })
});

gulp.task('useref', function(){
    return gulp.src('app/*.html')
        .pipe(useref())
        .pipe(gulpIf('*.js', uglify()))
        .pipe(gulpIf('*.css', cssnano()))
        .pipe(gulp.dest('dist'))
});

gulp.task('images', function(){
    return gulp.src('app/images/**/*.+(png|jpg|jpeg|gif|svg)')
    // Caching images that ran through imagemin
        .pipe(cache(imagemin({
            interlaced: true
        })))
        .pipe(gulp.dest('dist/images'))
});

gulp.task('fonts', function() {
    return gulp.src('app/fonts/**/*')
        .pipe(gulp.dest('dist/fonts'))
});

gulp.task('clean:dist', function() {
    return del.sync('dist');
});

gulp.task('cache:clear', function (callback) {
    return cache.clearAll(callback)
});

gulp.task('build', function (callback) {
    runSequence('clean:dist',
        ['sass', 'useref', 'images', 'fonts'],
        callback
    )
});

gulp.task('default', function (callback) {
    runSequence('develop', ['sass','nunjucks', 'browserSync', 'watch'],
        callback
    )
});

gulp.task('lint', function () {
    gulp.src('./**/*.js')
        .pipe(jshint())
});



gulp.task('develop', function () {
    var stream = nodemon({ script: 'server.js'
        , ext: 'html js'
        , ignore: ['ignored.js']
        , tasks: ['lint'] })

    stream
        .on('restart', function () {
            console.log('restarted!')
            browserSync.reload();
        })
        .on('crash', function() {
            console.error('Application has crashed!\n')
            stream.emit('restart', 10)  // restart the server in 10 seconds
        })
});
