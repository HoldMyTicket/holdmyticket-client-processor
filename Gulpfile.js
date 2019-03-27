const gulp = require('gulp');
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');

// finding the type flag assuming that the arg after --type is the actual type (dev, production)
const typeFlag =
  process.argv[process.argv.findIndex(arg => arg === '--type') + 1];

const validTypes = ['publish'];

function compileJs() {
  return gulp.src(['src/*.js'], { since: gulp.lastRun(compileJs) })
    .pipe(concat('hmtclientprocessor.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('./dist'));
}

function defaultTask(cb) {
  if (validTypes.includes(typeFlag)) {
    const compile = gulp.series('compileJs');
    compile(cb);
  } else {
    console.log('\x1b[31m%s\x1b[0m', '\nInvalid pipeline!\nOptions: publish');
  }
}

//EXPOSE THE TASKS TO GULP
gulp.task(compileJs);
gulp.task('default', defaultTask);
