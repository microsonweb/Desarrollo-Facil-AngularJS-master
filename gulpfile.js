'use strict';
//@IMPORTS
  //Necesarios
  var gulp = require('gulp'),
        notify = require('gulp-notify'),
        connect = require('gulp-connect'),
        historyApiFallback = require('connect-history-api-fallback');

  ///Errores
  var jshint = require('gulp-jshint'),
        stylish = require('jshint-stylish'),
        plumber = require('gulp-plumber');

  //Estilos
  var sass = require('gulp-sass');

  //Inyeccion de Archivos, plantillas y cache
  var inject = require('gulp-inject'),
        wiredep = require('wiredep').stream,
        templateCache = require('gulp-angular-templatecache');

  //Minificacion de Archivos
  var gulpif = require('gulp-if'),
       minifyCss = require('gulp-minify-css'),
       useref = require('gulp-useref'),
       uglify = require('gulp-uglify');


//@ENDIMPORT

// Servidor web
  //Desarrollo
gulp.task('server', function() {
  connect.server({
    root: './app',
    hostname: '0.0.0.0',
    port: 8080,
    livereload: true,
    middleware: function(connect, opt) {
      return [ historyApiFallback ];
    }
  });
});

//Produccion
gulp.task('server-dist', function() {
  connect.server({
    root: './dist',
    hostname: '0.0.0.0',
    port: 8080,
    livereload: true,
    middleware: function(connect, opt) {
      return [ historyApiFallback ];
    }
  });
});

// Preprocesar los archivos SASS a CSS
gulp.task('styles', function() {
  gulp.src('./app/sass/*.scss')
        .pipe(plumber({
          errorHandler: notify.onError('Error: <%= error.message %>' )
        }))
        .pipe(sass())
        .pipe(gulp.dest('./app/css'))
        .pipe(notify({ message: 'Styles task complete' }));
});

//Buscar Errores en el JS Y mostrarlos por pantalla
gulp.task('jshint',function() {
  return gulp.src('./app/scripts/*.js')
  .pipe(jshint('.jshintrc'))
  .pipe(jshint.reporter('jshint-stylish'))
  .pipe(jshint.reporter('fail'));
});

gulp.task('inject', function() {
  var target = gulp.src('./app/index.html');
  var sources = gulp.src(['./app/scripts/*.js', './app/css/*.css']);
  return target
    .pipe(inject(sources,{
            read: false,
            ignorePath: 'app/',
            cwd: './app'
          }))
    .pipe(gulp.dest('./app'))
    .pipe(notify({ message: 'Content Injected' }));
});

//Inyecta las librerias instaladas con Bower
gulp.task('wiredep',function() {
  gulp.src('./app/index.html')
      .pipe(wiredep({
        directory:'./app/lib'
      }))
      .pipe(gulp.dest('./app'));
});


// Recarga automaticamente hay cambios en el HTML
gulp.task('reload', function() {
  gulp.src('./app/**/*.html')
      .pipe(connect.reload());
});


//Cacheo de plantillas Angular
gulp.task('templates', function() {
  gulp.src('./app/views/**/*.tpl.html')
        .pipe(templateCache({
          root: 'views/',
          module: 'blog.templates',
          standalone: true
        }))
        .pipe(plumber({
          errorHandler: notify.onError('Error: <%= error.message %>' )
        }))
        .pipe(gulp.dest('./app/scripts'))
        .pipe(notify({ message: 'Templates Caheadas' }));
});

//Minificacion y compresion de archivos
gulp.task('compress', function(){
  gulp.src('./app/index.html')
        .pipe(useref.assets())
        .pipe(gulpif('*.js', uglify({mangle:false})))
        .pipe(gulpif('*.css', minifyCss()))
        .pipe(gulp.dest('./dist'))
        .pipe(notify({message: 'Version de Distribucion Completa'}));
  });

gulp.task('copy', function(){
  gulp.src('./app/index.html')
        .pipe(useref())
        .pipe(gulp.dest('./dist'));
  gulp.src('./app/lib/fontawesome/fonts/**')
        .pipe(gulp.dest('./dist/fonts'));
  });


// Vigila Los Cambios hechos en el Codigo
gulp.task('watch', function() {
  gulp.watch(['./app/**/*.html'], ['reload']);
  gulp.watch(['./app/**/*.scss'], ['styles', 'inject']);
  gulp.watch(['./app/**/**/*.js'], ['jshint', 'inject']);
  gulp.watch(['./bower.json'], ['wiredep']);
});

//Tareas Completas
gulp.task('build', ['templates', 'compress', 'copy']);

gulp.task('default', ['server', 'inject', 'wiredep', 'watch']);
