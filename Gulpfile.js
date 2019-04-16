const gulp = require('gulp');
const uglify = require('gulp-uglify');
const util = require('gulp-util');
const concat = require('gulp-concat');
const childProcess = require('child_process');
const babel = require("gulp-babel");

// finding the type flag assuming that the arg after --type is the actual type (dev, production)
const typeFlag = process.argv[process.argv.findIndex(arg => arg === '--type') + 1];

const validTypes = ['publish','dev'];

function compileJs() {
  
  util.log(util.colors.green('Compiling to distr file.'));
  
  return gulp.src(['src/*.js'], { since: gulp.lastRun(compileJs) })
    .pipe(concat('hmtclientprocessor.min.js'))
    .pipe(babel())
    .pipe(uglify())
    .pipe(gulp.dest('./dist'));
    
}

function startDevServer(){
  
  util.log(util.colors.green('Opening browser on port: http://localhost:8383.'));

  childProcess.exec('php -S localhost:8383 -t src', function(stdout, stderror) {
    
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
        console.log('\x1b[32m%s\x1b[0m', 'If not errors occured then you can now run the command "yarn publish" to publish a new version to the npm registry.');
      }, 2000);
    
  } else {
    console.log('\x1b[31m%s\x1b[0m', '\nInvalid pipeline!\nOptions: publish');
  }
  
  gulp.watch(['src/*.js'], gulp.series(gulp.parallel('compileJs')));
    
}

//EXPOSE THE TASKS TO GULP
gulp.task(compileJs);
gulp.task('default', defaultTask);
