var browserSync = require('browser-sync').create({proxy:"http://localhost:3000?instancename=Ibis4Teacher&version=12345"}),
    concat = require('gulp-concat'),
    cssnano = require('gulp-cssnano'),
    del = require('del'),
    gulp = require('gulp'),
    gulpIf = require('gulp-if'),
    imagemin = require('gulp-imagemin'),
    jshint = require('gulp-jshint'),
    ngAnnotate = require('gulp-ng-annotate'),
    prefixer = require('gulp-autoprefixer'),
    runSequence = require('run-sequence'),
    sass = require('gulp-sass'),
    sourcemaps = require('gulp-sourcemaps'),
    stylish = require('jshint-stylish'),
    uglify = require('gulp-uglify'),
    useref = require('gulp-useref'),
    stripDebug = require('gulp-strip-debug'),
    strip = require('gulp-strip-comments');


gulp.task('default',function()
{

});

/**********  BUILD TASKS **********/

gulp.task('build',function(callback)
{
    runSequence('concatAndStash','removeDirs',['uglifyJs','handleAngular','uglifyCodemirror','copy_html','copy_images','copy_fonts'],'browser_Sync_build');
});


gulp.task('concatAndStash',['clean'], function ()
{
    return gulp.src('app/index.html')
        .pipe(useref())
        .pipe(gulpIf('*.css' , cssnano()))
        .pipe(gulp.dest('webapp'));
});

gulp.task('removeDirs', function()
{
    return del(['webapp/scripts']);
});

gulp.task('minifyCss', function()
{
    return gulp.src('webapp/styles/main.css')
    .pipe(cssnano());
});

gulp.task('uglifyJs', function()
{
    return gulp.src(['app/scripts/application.js',
    'app/scripts/controllers.js',
    'app/scripts/directives.js',
    'app/scripts/moderatorcontroller.js',
    'app/scripts/moderatorservices.js',
    'app/scripts/services.js',
    'app/scripts/treecontroller.js',
    'app/scripts/xmlTag.js',
    'app/scripts/userservice.js',
    'app/scripts/usercontroller.js',
    'app/scripts/zipservice.js'])
        .pipe(concat('scripts.min.js'))
        // .pipe(strip())
        // .pipe(stripDebug())
        .pipe(sourcemaps.init())
        .pipe(ngAnnotate())
        .pipe(uglify())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('webapp/scripts'));
});

gulp.task('filesaver', function()
{
    return gulp.src(['app/bower_components/file-saver/src/FileSaver.js'])
        .pipe(concat('scripts.min.js'))
        .pipe(sourcemaps.init())
        .pipe(uglify())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('fonts'));
});



gulp.task('handleAngular', function()
{
    return gulp.src(["app/bower_components/jquery/dist/jquery.min.js",
    "app/bower_components/angular/angular.min.js",
    "app/bower_components/angular-ui-router/release/angular-ui-router.min.js",
    "app/bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js",
    "app/bower_components/angular-cookies/angular-cookies.min.js",
    "app/bower_components/angularLocalStorage/dist/angularLocalStorage.min.js",
    "app/bower_components/angular-ui-tree/dist/angular-ui-tree.min.js",
    "app/bower_components/jszip/dist/jszip.min.js",
    "app/bower_components/underscore/underscore-min.js",
    "app/bower_components/angular-animate/angular-animate.min.js",
    "app/bower_components/file-saver/FileSaver.min.js",
    "app/bower_components/angular-sanitize/angular-sanitize.min.js",
    "app/bower_components/angular-ui-select/dist/select.min.js",
    "app/bower_components/malihu-custom-scrollbar-plugin/jquery.mCustomScrollbar.concat.min.js"])
    .pipe(gulp.dest('webapp/scripts'));
});

gulp.task('uglifyCodemirror', function()
{
    return gulp.src(["app/codemirror/ui-codemirror.js","app/codemirror/codemirror.js","app/codemirror/searchcursor.js","app/codemirror/search.js","app/codemirror/foldgutter.js","app/codemirror/xml-fold.js","app/codemirror/foldcode.js","app/codemirror/matchtags.js","app/codemirror/xml-hint.js","app/codemirror/show-hint.js","app/codemirror/xml.js","app/codemirror/beautify-html.js","app/codemirror/beautify-css.js","app/codemirror/beautify.js","app/codemirror/dialog.js" ])
        .pipe(concat('codemirror.min.js'))
        .pipe(strip())
        .pipe(sourcemaps.init())
        .pipe(uglify())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('webapp/scripts'));
});

gulp.task('copy_html', function()
{
    return gulp.src(['app/views/*.html'])
        .pipe(gulp.dest('webapp/views'));
});

gulp.task('copy_fonts', function()
{
    return gulp.src(['app/fonts/glyphicons-halflings-regular.woff2','app/fonts/glyphicons-halflings-regular.woff','app/fonts/fontawesome-webfont.woff','app/fonts/fontawesome-webfont.woff2','app/fonts/glyphicons-halflings-regular.ttf'])
        .pipe(gulp.dest('webapp/fonts'));
});



gulp.task('copy_images', function()
{
    return gulp.src('app/media/**/*.+(png|jpg|gif|svg)')
        .pipe(imagemin())
        .pipe(gulp.dest('webapp/media'));
});

gulp.task('clean', function()
{
    return del(['tmp','webapp']);
});   

gulp.task('browser_Sync_build',function()
{
    browserSync.init(
    {
        server:{baseDir:'webapp'}
    });
    browserSync.reload();
});


/**********  WATCH TASKS **********/

gulp.task('watch',['browser_Sync', 'compile_sass','checkJs'], function()
{
    gulp.watch('app/scss/**/*.scss', ['compile_sass']);
    gulp.watch('app/**/*.html', browserSync.reload);
    gulp.watch('app/scripts/*.js', ['checkJs']);
});

gulp.task('checkJs',function()
{
    return gulp.src('app/scripts/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter(stylish))
        .pipe(browserSync.stream());
});

gulp.task('compile_sass',function()
{
return gulp.src('app/scss/**/*.scss')
    .pipe(sass().on('error',sass.logError))
    .pipe(prefixer({browsers:['last 2 versions', 'ios_saf >=5', 'safari >=7']}))
    .pipe(gulp.dest('app/css/'))
    .pipe(browserSync.stream());
});

gulp.task('copy_css',['compile_sass'], function()
{
 return gulp.src('app/*.html')
     .pipe(useref())
     .pipe(gulpIf('*.css' , cssnano()))
     .pipe(gulp.dest('build'));
});

gulp.task('browser_Sync',function()
{
    browserSync.init(
    {
        server:{baseDir:'app', cors:true}
    });
});

