const gulp = require('gulp');
const concat = require('gulp-concat');
const childProcess = require('child_process');
const babel = require("gulp-babel");
const webpack = require('webpack-stream');
const path = require('path');
const log = require('fancy-log');
const colors = require('ansi-colors');

// finding the type flag assuming that the arg after --type is the actual type (dev, production)
const typeFlag = process.argv[process.argv.findIndex(arg => arg === '--type') + 1];

const validTypes = ['publish','dev'];

function compileJs() {

  log(colors.green('Compiling to dist file.'));

  const babelPlugins = ["@babel/transform-runtime"];

  if (typeFlag == 'publish') {
    babelPlugins.push(["transform-remove-console", { "exclude": [ "error", "warn"] }]);
  }

  return gulp.src(['node_modules/babel-polyfill','src/*.js'], { since: gulp.lastRun(compileJs) })

    .pipe(concat('hmtclientprocessor.min.js'))

    .pipe(babel({
      "presets": ["@babel/preset-env"],
			"plugins": babelPlugins
		}))

    .pipe(gulp.dest('./build'))

    .pipe(webpack({

      mode: (typeFlag == 'publish' ? 'production' : 'development'),

      // entry: './build/hmtclientprocessor.min.js',
      externals: {
        qs: {
          commonjs: 'qs',
          commonjs2: 'qs',
          amd: 'qs',
          root: 'Qs'
        }
      },
      output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'hmtclientprocessor.min.js',
        library: 'hmt_client_processor',
        libraryExport: 'default',
        libraryTarget: 'umd',
      }

    }))

    .pipe(gulp.dest('./dist'));

}

function startDevServer(){

  log(colors.green('Opening browser on port: http://localhost:8383.'));

  childProcess.exec('php -S localhost:8383 -t dist', function(stdout, stderror) {

  })

}

function defaultTask(done) {

  if (validTypes.includes(typeFlag)) {

    const compile = gulp.series(compileJs);

    compile(done);

    if(typeFlag == 'dev')
      startDevServer()

    if(typeFlag == 'publish')
      setTimeout(function() {
        console.log('\x1b[32m%s\x1b[0m', 'If no errors occured then you can now run the command "yarn publish" to publish a new version to the npm registry.');
      }, 2000);

  } else {
    console.log('\x1b[31m%s\x1b[0m', '\nInvalid pipeline!\nOptions: dev | publish');
  }

  gulp.watch(['src/*.js'], gulp.series(gulp.parallel('compileJs')));
}

//EXPOSE THE TASKS TO GULP
gulp.task(compileJs);
gulp.task('default', defaultTask);
