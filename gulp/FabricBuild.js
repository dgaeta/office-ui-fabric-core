var gulp = require('gulp');

// Fabric Helper Modules
var Banners = require('./modules/Banners');
var Config = require('./modules/Config');
var BuildConfig = require('./modules/BuildConfig');
var ConsoleHelper = require('./modules/ConsoleHelper');
var ErrorHandling = require('./modules/ErrorHandling');
var Plugins = require('./modules/Plugins');
var pkg = require('../package.json');

var versionParts = pkg.version.split('.');

var version = {
    major: versionParts[0],
    minor: versionParts[1],
    patch: versionParts[2]
}

var versionCommaDelim = pkg.version.split('.').join(',');

//
// Clean/Delete Tasks
// ----------------------------------------------------------------------------

// Clean out the distribution folder.
gulp.task('Fabric-nuke', function () {
    return Plugins.del.sync([Config.paths.distCSS, Config.paths.distSass, Config.paths.temp]);
});


//
// Copying Files Tasks
// ----------------------------------------------------------------------------

// Copy all Sass files to distribution folder.
gulp.task('Fabric-copyAssets', function () {            
     var moveSass =  gulp.src([Config.paths.srcSass + '/**/*', !Config.paths.srcSass + '/Fabric.Scoped.scss'])
            .pipe(Plugins.plumber(ErrorHandling.onErrorInPipe))
            .pipe(Plugins.changed(Config.paths.distSass))
            .pipe(Plugins.replace('<%= fabricVersion %>', versionCommaDelim))
            .pipe(Plugins.gulpif(Config.debugMode, Plugins.debug({
                    title: "Moving Sass files over to Dist"
            })))
            .pipe(gulp.dest(Config.paths.distSass));
     return moveSass;
});

//
// Sass tasks
// ----------------------------------------------------------------------------

// Set the ISassTaskConfig
Plugins.gulpCoreBuildSass.sass.setConfig({
  useCSSModules: true
});

// do we set the build config here?
Plugins.gulpCoreBuildSass.BuildConfig = {
  rootPath: Config.paths.rootPath,
  libFolder: Config.paths.libFolder
};

var postCSSPlugins = [
  Plugins.autoprefixer({ 
    cascade: false,
    browsers: ['> 1%', 'last 2 versions', 'ie >= 10'] 
  })
];
var modulePostCssPlugins = postCSSPlugins.slice(0);

modulePostCssPlugins.push(Plugins.cssModules({
  getJSON: generateModuleStub,
  generateScopedName: generateScopedName
}));

var completeCallback = (result) => { console.log(result); };

gulp.task('Fabric-buildStyles', function () {
    var fabric = gulp.src(BuildConfig.srcPath + '/' + 'Fabric.' + BuildConfig.fileExtension)
            .pipe(Plugins.plumber(ErrorHandling.onErrorInPipe))
            .pipe(Plugins.gulpif(Config.debugMode, Plugins.debug({
              title: "Building Core Fabric " + BuildConfig.fileExtension + " File"
            })))
            .pipe(Plugins.header(Banners.getBannerTemplate(), Banners.getBannerData()))
            .pipe(Plugins.header(Banners.getCSSCopyRight(), Banners.getBannerData()))
            .pipe(BuildConfig.processorPlugin().on('error', BuildConfig.compileErrorHandler))
            .pipe(Plugins.rename('fabric.css'))
            .pipe(Plugins.changed(Config.paths.distCSS, {extension: '.css'}))
            .pipe(Plugins.autoprefixer({
              browsers: ['last 2 versions', 'ie >= 9'],
              cascade: false
            }))
            .pipe(Plugins.cssbeautify())
            .pipe(Plugins.csscomb())
            .pipe(gulp.dest(Config.paths.distCSS))
            .pipe(Plugins.rename('fabric.min.css'))
            .pipe(Plugins.cssMinify({
                safe: true
            }))
            .pipe(Plugins.header(Banners.getBannerTemplate(), Banners.getBannerData()))
            .pipe(Plugins.header(Banners.getCSSCopyRight(), Banners.getBannerData()))
            .pipe(gulp.dest(Config.paths.distCSS));    
    
    var fabricScoped_1 = gulp.src(BuildConfig.srcPath + '/' + 'Fabric.Scoped.' + BuildConfig.fileExtension)
            .pipe(Plugins.gulpif(Config.debugMode, Plugins.debug({
              title: "Building Core Fabric Scoped " + BuildConfig.fileExtension + " File"
            })))
            .pipe(Plugins.header(Banners.getBannerTemplate(), Banners.getBannerData()))
            .pipe(Plugins.header(Banners.getCSSCopyRight(), Banners.getBannerData()))
            .pipe(Plugins.replace('<%= fabricVersion %>', versionCommaDelim))
            .pipe(BuildConfig.processorPlugin().on('error', BuildConfig.compileErrorHandler))
            .pipe(Plugins.rename('fabric-' + version.major + '.' + version.minor + '.' + version.patch + '.scoped.css'));

    var fabricScoped_2 = gulp.src(BuildConfig.srcPath + '/' + 'Fabric.Scoped.' + BuildConfig.fileExtension)
            .pipe(getProcessedFiles());

var fabricScoped = Plugins.mergeStream(fabricScoped_1, fabricScoped_2)
            .pipe(Plugins.cssbeautify())
            .pipe(Plugins.csscomb())
            .pipe(gulp.dest(Config.paths.distCSS))
            .pipe(Plugins.rename('fabric-' + version.major + '.' + version.minor + '.' + version.patch + '.scoped.min.css'))
            .pipe(Plugins.cssMinify({
                safe: true
            }))
            .pipe(Plugins.header(Banners.getBannerTemplate(), Banners.getBannerData()))
            .pipe(Plugins.header(Banners.getCSSCopyRight(), Banners.getBannerData()))
            .pipe(gulp.dest(Config.paths.distCSS));

    // Build full and minified Fabric RTL CSS.
    var fabricRtl = gulp.src(BuildConfig.srcPath + '/' + 'Fabric.Rtl.' + BuildConfig.fileExtension)
            .pipe(Plugins.plumber(ErrorHandling.onErrorInPipe))
            .pipe(Plugins.gulpif(Config.debugMode, Plugins.debug({
              title: "Building RTL Fabric " + BuildConfig.processorName + " " + BuildConfig.fileExtension + " File"
            })))
            .pipe(Plugins.header(Banners.getBannerTemplate(), Banners.getBannerData()))
            .pipe(BuildConfig.processorPlugin().on('error', BuildConfig.compileErrorHandler))
            .pipe(Plugins.flipper())
            .pipe(Plugins.rename('fabric.rtl.css'))
            .pipe(Plugins.changed(Config.paths.distCSS, {extension: '.css'}))
            .pipe(Plugins.autoprefixer({
              browsers: ['last 2 versions', 'ie >= 9'],
              cascade: false
            }))
            .pipe(Plugins.cssbeautify())
            .pipe(Plugins.csscomb())
            .pipe(Plugins.header(Banners.getCSSCopyRight(), Banners.getBannerData()))
            .pipe(gulp.dest(Config.paths.distCSS))
            .pipe(Plugins.rename('fabric.rtl.min.css'))
            .pipe(Plugins.cssMinify({
              safe: true
            }))
            .pipe(Plugins.header(Banners.getBannerTemplate(), Banners.getBannerData()))
            .pipe(Plugins.header(Banners.getCSSCopyRight(), Banners.getBannerData()))
            .pipe(gulp.dest(Config.paths.distCSS));

    // Merge all current streams into one.
    return Plugins.mergeStream(fabric, fabricScoped, fabricRtl);
});

//
// Rolled up Build tasks
// ----------------------------------------------------------------------------

gulp.task('Fabric', ['Fabric-copyAssets', 'Fabric-buildStyles']);
BuildConfig.buildTasks.push('Fabric');
BuildConfig.nukeTasks.push('Fabric-nuke');

var _classMaps = {};

function getProcessedFiles() {
  var sassMatch = [ 'src/**/*.scss' ];
  return Plugins.gulpCoreBuildSass.sass.processFiles(gulp, sassMatch, completeCallback, modulePostCssPlugins);
}

function generateModuleStub(cssFileName, json) {
  cssFileName = cssFileName.replace('.css', '.scss.ts');
  _classMaps[cssFileName] = json;
}

function generateScopedName(name, fileName, css) {
  /* tslint:disable:typedef */
  const crypto = require('crypto');
  /* tslint:enable:typedef */

  return name + '_' + crypto.createHmac('sha1', fileName).update(css).digest('hex').substring(0, 8);
}